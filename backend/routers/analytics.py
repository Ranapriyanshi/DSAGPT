from fastapi import APIRouter, HTTPException, Depends, Request
from sqlmodel import Session, select, desc
from models import User, UserSession, ChatMessage, Quiz, EmotionalTrend
from database import get_session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/analytics", tags=["analytics"])


class LearningAnalytics(BaseModel):
    total_sessions: int
    total_messages: int
    average_sentiment: float
    quiz_accuracy: float
    topics_covered: List[str]
    confusion_topics: List[str]
    emotional_trends: List[dict]
    session_duration_avg: float


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


@router.get("/learning-summary")
async def get_learning_summary(
    current_user: User = Depends(get_current_user),
    db_session: Session = Depends(get_session),
):
    """Get comprehensive learning analytics for the user"""

    # Get all user sessions
    sessions = db_session.exec(
        select(UserSession).where(UserSession.user_id == current_user.id)
    ).all()

    # Get all messages
    messages = db_session.exec(
        select(ChatMessage).where(ChatMessage.user_id == current_user.id)
    ).all()

    # Get all quizzes
    quizzes = db_session.exec(select(Quiz).where(Quiz.user_id == current_user.id)).all()

    # Calculate statistics
    total_sessions = len(sessions)
    total_messages = len(messages)

    # Average sentiment
    if messages:
        average_sentiment = sum(msg.sentiment_score for msg in messages) / len(messages)
    else:
        average_sentiment = 0.0

    # Quiz accuracy
    if quizzes:
        correct_quizzes = len([q for q in quizzes if q.is_correct])
        quiz_accuracy = (correct_quizzes / len(quizzes)) * 100
    else:
        quiz_accuracy = 0.0

    # Topics covered
    topics_covered = list(set([msg.topic for msg in messages if msg.topic]))

    # Confusion topics (topics with negative sentiment)
    confusion_topics = list(
        set([msg.topic for msg in messages if msg.topic and msg.sentiment_score < -0.3])
    )

    # Emotional trends (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_trends = db_session.exec(
        select(EmotionalTrend)
        .where(
            EmotionalTrend.user_id == current_user.id,
            EmotionalTrend.timestamp >= thirty_days_ago,
        )
        .order_by(desc(EmotionalTrend.timestamp))
    ).all()

    emotional_trends = [
        {
            "timestamp": trend.timestamp.isoformat(),
            "sentiment": trend.sentiment_score,
            "emotion": trend.emotion_category,
            "topic": trend.topic,
        }
        for trend in recent_trends
    ]

    # Average session duration
    completed_sessions = [
        s for s in sessions if s.session_end is not None and s.session_start is not None
    ]
    if completed_sessions:
        total_duration = sum(
            (s.session_end - s.session_start).total_seconds()
            for s in completed_sessions
            if s.session_end is not None and s.session_start is not None
        )
        session_duration_avg = (
            total_duration / len(completed_sessions) / 60
        )  # in minutes
    else:
        session_duration_avg = 0.0

    return LearningAnalytics(
        total_sessions=total_sessions,
        total_messages=total_messages,
        average_sentiment=average_sentiment,
        quiz_accuracy=quiz_accuracy,
        topics_covered=topics_covered,
        confusion_topics=confusion_topics,
        emotional_trends=emotional_trends,
        session_duration_avg=session_duration_avg,
    )


@router.get("/emotional-trends")
async def get_emotional_trends(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db_session: Session = Depends(get_session),
):
    """Get emotional trends over specified number of days"""

    start_date = datetime.utcnow() - timedelta(days=days)

    trends = db_session.exec(
        select(EmotionalTrend)
        .where(
            EmotionalTrend.user_id == current_user.id,
            EmotionalTrend.timestamp >= start_date,
        )
        .order_by(desc(EmotionalTrend.timestamp))
    ).all()

    return {
        "trends": [
            {
                "timestamp": trend.timestamp.isoformat(),
                "sentiment": trend.sentiment_score,
                "emotion": trend.emotion_category,
                "topic": trend.topic,
            }
            for trend in trends
        ],
        "summary": {
            "total_entries": len(trends),
            "average_sentiment": (
                sum(t.sentiment_score for t in trends) / len(trends) if trends else 0
            ),
            "positive_count": len(
                [t for t in trends if t.emotion_category == "positive"]
            ),
            "negative_count": len(
                [t for t in trends if t.emotion_category == "negative"]
            ),
            "neutral_count": len(
                [t for t in trends if t.emotion_category == "neutral"]
            ),
        },
    }


@router.get("/topic-performance")
async def get_topic_performance(
    current_user: User = Depends(get_current_user),
    db_session: Session = Depends(get_session),
):
    """Get performance analytics by topic"""

    # Get all messages grouped by topic
    messages = db_session.exec(
        select(ChatMessage).where(ChatMessage.user_id == current_user.id)
    ).all()

    # Get all quizzes grouped by topic
    quizzes = db_session.exec(select(Quiz).where(Quiz.user_id == current_user.id)).all()

    topic_stats = {}

    # Process messages by topic
    for msg in messages:
        if msg.topic:
            if msg.topic not in topic_stats:
                topic_stats[msg.topic] = {
                    "message_count": 0,
                    "total_sentiment": 0.0,
                    "quiz_count": 0,
                    "correct_quizzes": 0,
                }
            topic_stats[msg.topic]["message_count"] += 1
            topic_stats[msg.topic]["total_sentiment"] += msg.sentiment_score

    # Process quizzes by topic
    for quiz in quizzes:
        if quiz.topic not in topic_stats:
            topic_stats[quiz.topic] = {
                "message_count": 0,
                "total_sentiment": 0.0,
                "quiz_count": 0,
                "correct_quizzes": 0,
            }
        topic_stats[quiz.topic]["quiz_count"] += 1
        if quiz.is_correct:
            topic_stats[quiz.topic]["correct_quizzes"] += 1

    # Calculate averages and percentages
    result = []
    for topic, stats in topic_stats.items():
        avg_sentiment = (
            stats["total_sentiment"] / stats["message_count"]
            if stats["message_count"] > 0
            else 0
        )
        quiz_accuracy = (
            (stats["correct_quizzes"] / stats["quiz_count"] * 100)
            if stats["quiz_count"] > 0
            else 0
        )

        result.append(
            {
                "topic": topic,
                "message_count": stats["message_count"],
                "average_sentiment": avg_sentiment,
                "quiz_count": stats["quiz_count"],
                "quiz_accuracy": quiz_accuracy,
                "difficulty_level": (
                    "Beginner"
                    if avg_sentiment > 0.1
                    else "Intermediate" if avg_sentiment > -0.1 else "Advanced"
                ),
            }
        )

    return {"topics": result}


@router.get("/recommendations")
async def get_learning_recommendations(
    current_user: User = Depends(get_current_user),
    db_session: Session = Depends(get_session),
):
    """Get personalized learning recommendations based on analytics"""

    # Get recent emotional trends
    recent_trends = db_session.exec(
        select(EmotionalTrend)
        .where(EmotionalTrend.user_id == current_user.id)
        .order_by(desc(EmotionalTrend.timestamp))
        .limit(10)
    ).all()

    # Get confusion topics
    messages = db_session.exec(
        select(ChatMessage).where(
            ChatMessage.user_id == current_user.id, ChatMessage.sentiment_score < -0.3
        )
    ).all()

    confusion_topics = list(set([msg.topic for msg in messages if msg.topic]))

    # Get quiz performance
    quizzes = db_session.exec(select(Quiz).where(Quiz.user_id == current_user.id)).all()

    failed_quizzes = [q for q in quizzes if not q.is_correct]
    weak_topics = list(set([q.topic for q in failed_quizzes if q.topic]))

    # Generate recommendations
    recommendations = []

    # If user is consistently frustrated, recommend easier topics
    if recent_trends and all(t.sentiment_score < -0.2 for t in recent_trends[-3:]):
        recommendations.append(
            {
                "type": "difficulty_adjustment",
                "message": "You seem to be struggling with the current difficulty level. Consider reviewing basic concepts first.",
                "priority": "high",
            }
        )

    # Recommend revisiting confusing topics
    if confusion_topics:
        recommendations.append(
            {
                "type": "review_topic",
                "message": f"Consider reviewing these topics: {', '.join(confusion_topics[:3])}",
                "topics": confusion_topics[:3],
                "priority": "medium",
            }
        )

    # Recommend practice for weak topics
    if weak_topics:
        recommendations.append(
            {
                "type": "practice_topic",
                "message": f"Focus on practicing these topics: {', '.join(weak_topics[:3])}",
                "topics": weak_topics[:3],
                "priority": "high",
            }
        )

    # If user is doing well, suggest advanced topics
    if recent_trends and all(t.sentiment_score > 0.2 for t in recent_trends[-3:]):
        recommendations.append(
            {
                "type": "advance_topic",
                "message": "You're doing great! Consider exploring more advanced concepts.",
                "priority": "low",
            }
        )

    return {
        "recommendations": recommendations,
        "current_mood": (
            "positive"
            if recent_trends and recent_trends[-1].sentiment_score > 0
            else (
                "neutral"
                if recent_trends and recent_trends[-1].sentiment_score > -0.2
                else "negative"
            )
        ),
        "learning_pace": (
            "fast"
            if len(recent_trends) > 5
            else "moderate" if len(recent_trends) > 2 else "slow"
        ),
    }
