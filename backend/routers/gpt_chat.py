from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
import os
import openai
import json
from typing import Optional, List
from datetime import datetime
from sqlmodel import Session, select, desc
from database import get_session
from models import User, UserSession, ChatMessage, Quiz, EmotionalTrend
from routers.sentiment import analyze_sentiment, SentimentRequest

router = APIRouter(prefix="/chat", tags=["chat"])

openai_api_key = os.getenv("OPENAI_API_KEY")
client = openai.OpenAI(api_key=openai_api_key)


class ChatRequest(BaseModel):
    message: str
    topic: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    sentiment_score: float
    emotion_category: str
    quiz: Optional[dict] = None
    should_generate_quiz: bool = False


class QuizAnswerRequest(BaseModel):
    quiz_id: int
    selected_option: int


def get_adaptive_prompt(user_level: str, sentiment_score: float, recent_topics: List[str], confusion_flags: List[str]) -> str:
    """
    Generate adaptive prompts based on user's emotional state and learning history
    as described in the research paper
    """
    base_prompt = f"""You are DSA-GPT, an emotionally aware coding tutor helping users learn DSA.
Tailor your explanations to the user's level ({user_level}).
Please keep your explanations short, interactive, and friendly."""

    # Adapt based on sentiment
    if sentiment_score < -0.3:
        base_prompt += """
IMPORTANT: The user seems frustrated or confused. Please:
- Use simpler language and shorter explanations
- Offer encouragement and positive reinforcement
- Ask if they'd like to try a different example or approach
- Be extra patient and supportive"""
    elif sentiment_score > 0.3:
        base_prompt += """
IMPORTANT: The user seems confident and engaged. You can:
- Provide more challenging examples
- Introduce related advanced concepts
- Encourage deeper exploration of the topic"""

    # Adapt based on confusion history
    if confusion_flags:
        base_prompt += f"""
Note: The user previously struggled with: {', '.join(confusion_flags)}.
When explaining related concepts, provide extra scaffolding and review these topics briefly."""

    # Adapt based on recent topics
    if recent_topics:
        base_prompt += f"""
Recent topics covered: {', '.join(recent_topics[-3:])}.
Build on this foundation and make connections to previous learning."""

    return base_prompt


def generate_quiz_prompt(topic: str, user_level: str) -> str:
    """Generate a quiz question based on the current topic"""
    return f"""Generate a multiple choice quiz question about {topic} suitable for {user_level} level.
Return ONLY a JSON object with this exact format:
{{
    "question": "What is the time complexity of...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Brief explanation of why this is correct"
}}"""


def get_current_user(request: Request, session: Session = Depends(get_session)) -> User:
    """Get current user from token"""
    auth: str = request.headers.get("authorization", "")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = auth.split()[1]
    from auth import decode_access_token
    payload = decode_access_token(token)
    if not payload or "user_id" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = session.get(User, payload["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/message")
async def chat_message(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Main chat endpoint with emotion-aware responses"""
    if not openai_api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not set")

    try:
        # Analyze sentiment of user message
        sentiment_result = analyze_sentiment(SentimentRequest(message=req.message))

        # Get or create active session
        active_session = session.exec(
            select(UserSession).where(
                UserSession.user_id == current_user.id,
                UserSession.session_end is None
            )
        ).first()

        if not active_session:
            active_session = UserSession(
                user_id=current_user.id or 0,
                session_start=datetime.utcnow()
            )
            session.add(active_session)
            session.commit()
            session.refresh(active_session)

        # Store user message
        user_message = ChatMessage(
            session_id=active_session.id,
            user_id=current_user.id,
            message=req.message,
            sender="user",
            sentiment_score=sentiment_result.sentiment,
            emotion_category=sentiment_result.emotion_category,
            topic=req.topic
        )
        session.add(user_message)

        # Get user's learning history for context
        recent_messages = session.exec(
            select(ChatMessage).where(
                ChatMessage.user_id == current_user.id
            ).order_by(desc(ChatMessage.timestamp)).limit(10)
        ).all()

        recent_topics = list(set([msg.topic for msg in recent_messages if msg.topic]))
        confusion_flags = []

        # Identify confusing topics based on negative sentiment
        for msg in recent_messages:
            if msg.sentiment_score < -0.3 and msg.topic:
                confusion_flags.append(msg.topic)

        confusion_flags = list(set(confusion_flags))

        # Generate adaptive prompt
        system_prompt = get_adaptive_prompt(
            current_user.dsa_level,
            sentiment_result.sentiment,
            recent_topics,
            confusion_flags
        )

        # Prepare conversation context
        conversation_history = []
        for msg in recent_messages[-5:]:  # Last 5 messages for context
            role = "user" if msg.sender == "user" else "assistant"
            conversation_history.append({"role": role, "content": msg.message})

        # Add current message
        conversation_history.append({"role": "user", "content": req.message})

        # Generate response with emotion awareness
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                *conversation_history
            ],
            max_tokens=300,
            temperature=0.7,
        )

        bot_response = response.choices[0].message.content

        # Store bot message
        bot_message = ChatMessage(
            session_id=active_session.id,
            user_id=current_user.id,
            message=bot_response or "",
            sender="bot",
            sentiment_score=0.0,  # Bot messages are neutral
            emotion_category="neutral",
            topic=req.topic or ""
        )
        session.add(bot_message)

        # Decide if we should generate a quiz
        should_generate_quiz = (
            sentiment_result.sentiment > 0.3 and
            len(recent_messages) % 3 == 0 and
            req.topic is not None
        )

        quiz_data = None
        if should_generate_quiz:
            try:
                quiz_response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a DSA quiz generator. Generate only valid JSON."},
                        {"role": "user", "content": generate_quiz_prompt(req.topic or "DSA", current_user.dsa_level)}
                    ],
                    max_tokens=200,
                    temperature=0.3,
                )
                quiz_content = quiz_response.choices[0].message.content
                if quiz_content:
                    quiz_data = json.loads(quiz_content)
                    
                    # Store quiz in database
                    quiz = Quiz(
                        session_id=active_session.id,
                        user_id=current_user.id,
                        question=quiz_data["question"],
                        options=json.dumps(quiz_data["options"]),
                        correct_answer=quiz_data["correct_answer"],
                        topic=req.topic or "DSA",
                        difficulty=current_user.dsa_level
                    )
                    session.add(quiz)
                else:
                    should_generate_quiz = False
            except Exception as e:
                print(f"Quiz generation failed: {e}")
                should_generate_quiz = False

        # Store emotional trend
        emotional_trend = EmotionalTrend(
            session_id=active_session.id,
            user_id=current_user.id,
            sentiment_score=sentiment_result.sentiment,
            emotion_category=sentiment_result.emotion_category,
            timestamp=datetime.utcnow()
        )
        session.add(emotional_trend)

        session.commit()

        return ChatResponse(
            response=bot_response or "I'm sorry, I couldn't generate a response.",
            sentiment_score=sentiment_result.sentiment,
            emotion_category=sentiment_result.emotion_category,
            quiz=quiz_data,
            should_generate_quiz=should_generate_quiz
        )

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.post("/quiz/answer")
async def answer_quiz(
    req: QuizAnswerRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Handle quiz answer submission"""
    try:
        # Get the quiz
        quiz = session.get(Quiz, req.quiz_id)
        if not quiz or quiz.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Quiz not found")

        # Check if answer is correct
        is_correct = req.selected_option == quiz.correct_answer

        # Update quiz with user's answer
        quiz.user_answer = req.selected_option
        quiz.is_correct = is_correct
        quiz.answered_at = datetime.utcnow()

        session.commit()

        return {
            "correct": is_correct,
            "explanation": "Keep practicing!",
            "correct_answer": quiz.correct_answer
        }

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Quiz error: {str(e)}")


@router.get("/session/{session_id}/summary")
async def get_session_summary(
    session_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get session summary with learning analytics"""
    try:
        # Get session
        user_session = session.get(UserSession, session_id)
        if not user_session or user_session.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Session not found")

        # Get session messages
        messages = session.exec(
            select(ChatMessage).where(ChatMessage.session_id == session_id)
        ).all()

        # Get emotional trends
        emotional_trends = session.exec(
            select(EmotionalTrend).where(EmotionalTrend.session_id == session_id)
        ).all()

        # Get quizzes
        quizzes = session.exec(
            select(Quiz).where(Quiz.session_id == session_id)
        ).all()

        # Calculate metrics
        total_messages = len(messages)
        user_messages = [m for m in messages if m.sender == "user"]
        bot_messages = [m for m in messages if m.sender == "bot"]

        # Sentiment analysis
        avg_sentiment = sum([m.sentiment_score for m in user_messages]) / len(user_messages) if user_messages else 0
        positive_messages = len([m for m in user_messages if m.sentiment_score > 0.3])
        negative_messages = len([m for m in user_messages if m.sentiment_score < -0.3])

        # Quiz performance
        answered_quizzes = [q for q in quizzes if q.user_answer is not None]
        correct_answers = len([q for q in answered_quizzes if q.is_correct is True])
        quiz_accuracy = correct_answers / len(answered_quizzes) if answered_quizzes else 0

        # Topics covered
        topics = list(set([m.topic for m in messages if m.topic]))

        return {
            "session_id": session_id,
            "duration_minutes": (user_session.session_end - user_session.session_start).total_seconds() / 60 if user_session.session_end else 0,
            "total_messages": total_messages,
            "user_messages": len(user_messages),
            "bot_messages": len(bot_messages),
            "avg_sentiment": avg_sentiment,
            "positive_messages": positive_messages,
            "negative_messages": negative_messages,
            "quiz_accuracy": quiz_accuracy,
            "topics_covered": topics,
            "emotional_trends": [
                {
                    "timestamp": et.timestamp.isoformat(),
                    "sentiment": et.sentiment_score,
                    "emotion": et.emotion_category
                }
                for et in emotional_trends
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary error: {str(e)}") 