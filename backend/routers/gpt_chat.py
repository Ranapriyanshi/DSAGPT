from fastapi import APIRouter, HTTPException, Body, Depends, Request
from pydantic import BaseModel
import os
import openai
import json
from typing import Optional, List
from datetime import datetime, timedelta
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
                UserSession.session_end == None
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
            len(recent_messages) % 3 == 0 and  # Every 3rd interaction
            req.topic and  # Topic is specified
            req.topic != "General DSA" and  # Topic must be specific
            sentiment_result.sentiment > -0.2  # User is not too frustrated
        )

        # Debug logging
        print(f"Quiz generation check:")
        print(f"  - Recent messages count: {len(recent_messages)}")
        print(f"  - Is 3rd message: {len(recent_messages) % 3 == 0}")
        print(f"  - Topic specified: {req.topic}")
        print(f"  - Topic is specific: {req.topic != 'General DSA' if req.topic else False}")
        print(f"  - Sentiment score: {sentiment_result.sentiment}")
        print(f"  - Should generate quiz: {should_generate_quiz}")

        quiz_data = None
        if should_generate_quiz and req.topic:
            print(f"Generating quiz for topic: {req.topic}")
            try:
                # Generate quiz
                quiz_response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "user", "content": generate_quiz_prompt(req.topic, current_user.dsa_level)}
                    ],
                    max_tokens=200,
                    temperature=0.5,
                )
                
                quiz_data = json.loads(quiz_response.choices[0].message.content or "{}")
                print(f"Quiz generated successfully: {quiz_data.get('question', 'No question')[:50]}...")
                
                # Store quiz
                quiz = Quiz(
                    session_id=active_session.id,
                    user_id=current_user.id,
                    question=quiz_data["question"],
                    options=json.dumps(quiz_data["options"]),
                    correct_answer=quiz_data["correct_answer"],
                    topic=req.topic,
                    difficulty=current_user.dsa_level
                )
                session.add(quiz)
                session.commit()
                session.refresh(quiz)
                
                quiz_data["id"] = quiz.id
                quiz_data["explanation"] = quiz_data.get("explanation", "")
                
            except json.JSONDecodeError as e:
                print(f"Quiz generation failed - JSON decode error: {e}")
                should_generate_quiz = False
            except Exception as e:
                print(f"Quiz generation failed - General error: {e}")
                should_generate_quiz = False

        # Update session statistics
        active_session.total_messages += 1
        active_session.average_sentiment = (
            (active_session.average_sentiment * (active_session.total_messages - 1) + sentiment_result.sentiment) 
            / active_session.total_messages
        )
        
        # Store emotional trend
        emotional_trend = EmotionalTrend(
            user_id=current_user.id,
            session_id=active_session.id,
            sentiment_score=sentiment_result.sentiment,
            emotion_category=sentiment_result.emotion_category,
            topic=req.topic
        )
        session.add(emotional_trend)
        
        session.commit()

        return ChatResponse(
            response=bot_response or "",
            sentiment_score=sentiment_result.sentiment,
            emotion_category=sentiment_result.emotion_category,
            quiz=quiz_data,
            should_generate_quiz=bool(should_generate_quiz)
        )

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quiz/answer")
async def answer_quiz(
    req: QuizAnswerRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Handle quiz answers and provide feedback"""
    try:
        quiz = session.exec(
            select(Quiz).where(
                Quiz.id == req.quiz_id,
                Quiz.user_id == current_user.id
            )
        ).first()
        
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        if quiz.user_answer is not None:
            raise HTTPException(status_code=400, detail="Quiz already answered")
        
        # Check if answer is correct
        is_correct = req.selected_option == quiz.correct_answer
        
        # Update quiz
        quiz.user_answer = req.selected_option
        quiz.is_correct = is_correct
        quiz.answered_at = datetime.utcnow()
        
        # Update chat message
        chat_message = session.exec(
            select(ChatMessage).where(
                ChatMessage.session_id == quiz.session_id,
                ChatMessage.quiz_generated == True
            ).order_by(desc(ChatMessage.timestamp))
        ).first()
        
        if chat_message:
            chat_message.quiz_answered = True
            chat_message.quiz_correct = is_correct
        
        session.commit()
        
        # Generate feedback based on correctness
        options = json.loads(quiz.options)
        correct_answer_text = options[quiz.correct_answer]
        user_answer_text = options[req.selected_option]
        
        if is_correct:
            feedback = f"Great job! That's correct. {correct_answer_text}"
        else:
            feedback = f"Not quite right. The correct answer is: {correct_answer_text}. You selected: {user_answer_text}"
        
        return {
            "is_correct": is_correct,
            "feedback": feedback,
            "correct_answer": quiz.correct_answer,
            "explanation": "Keep practicing!"
        }
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{session_id}/summary")
async def get_session_summary(
    session_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get session summary with emotional trends and performance"""
    try:
        user_session = session.exec(
            select(UserSession).where(
                UserSession.id == session_id,
                UserSession.user_id == current_user.id
            )
        ).first()
        
        if not user_session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get session messages
        messages = session.exec(
            select(ChatMessage).where(
                ChatMessage.session_id == session_id
            ).order_by(desc(ChatMessage.timestamp))
        ).all()
        
        # Get quizzes
        quizzes = session.exec(
            select(Quiz).where(
                Quiz.session_id == session_id
            )
        ).all()
        
        # Calculate statistics
        total_quizzes = len(quizzes)
        correct_quizzes = len([q for q in quizzes if q.is_correct])
        quiz_accuracy = (correct_quizzes / total_quizzes * 100) if total_quizzes > 0 else 0
        
        # Emotional trends
        emotional_trends = session.exec(
            select(EmotionalTrend).where(
                EmotionalTrend.session_id == session_id
            ).order_by(desc(EmotionalTrend.timestamp))
        ).all()
        
        # Calculate duration
        end_time = user_session.session_end or datetime.utcnow()
        duration = end_time - user_session.session_start
        duration_minutes = duration.total_seconds() / 60
        
        return {
            "session_id": session_id,
            "duration_minutes": duration_minutes,
            "total_messages": user_session.total_messages,
            "average_sentiment": user_session.average_sentiment,
            "quiz_accuracy": quiz_accuracy,
            "total_quizzes": total_quizzes,
            "correct_quizzes": correct_quizzes,
            "emotional_trends": [
                {
                    "timestamp": trend.timestamp.isoformat(),
                    "sentiment": trend.sentiment_score,
                    "emotion": trend.emotion_category,
                    "topic": trend.topic
                }
                for trend in emotional_trends
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 