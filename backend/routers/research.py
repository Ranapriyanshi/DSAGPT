from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlmodel import Session, select, desc, func
from database import get_session
from models import (
    User, UserSession, ChatMessage, Quiz, EmotionalTrend, 
    UserQuestionProgress, Question
)
from routers.sentiment import analyze_sentiment

router = APIRouter(prefix="/research", tags=["research"])

class UserStudyData(BaseModel):
    session_id: int
    user_id: int
    pre_confidence: float
    post_confidence: float
    external_tools_used: bool
    helpfulness_rating: int
    clarity_rating: int
    tone_rating: int
    responsiveness_rating: int
    suggestions: Optional[str] = None

class LearningOutcome(BaseModel):
    user_id: int
    topic: str
    pre_test_score: float
    post_test_score: float
    retention_score: Optional[float] = None
    time_to_complete: int  # minutes
    emotional_trend: List[float]

class ResearchMetrics(BaseModel):
    total_participants: int
    average_session_duration: float
    average_confidence_improvement: float
    average_quiz_accuracy: float
    emotional_improvement_rate: float
    external_tool_usage_rate: float
    satisfaction_ratings: Dict[str, float]

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

@router.post("/user-study-data")
async def submit_user_study_data(
    data: UserStudyData,
    session: Session = Depends(get_session)
):
    """Submit user study feedback data"""
    # Store in database (you might want to create a new model for this)
    # For now, we'll log it
    print(f"User Study Data: {data.dict()}")
    return {"message": "User study data submitted successfully"}

@router.post("/learning-outcome")
async def submit_learning_outcome(
    outcome: LearningOutcome,
    session: Session = Depends(get_session)
):
    """Submit learning outcome measurement"""
    # Store learning outcome data
    print(f"Learning Outcome: {outcome.dict()}")
    return {"message": "Learning outcome submitted successfully"}

@router.get("/metrics")
async def get_research_metrics(
    current_user: User = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """Get comprehensive research metrics for analysis"""
    
    # Calculate total participants
    total_users = db_session.exec(select(func.count())).first() or 0
    
    # Calculate average session duration
    sessions = db_session.exec(select(UserSession)).all()
    total_duration = 0
    completed_sessions = 0
    
    for session in sessions:
        if session.session_end:
            duration = (session.session_end - session.session_start).total_seconds() / 60
            total_duration += duration
            completed_sessions += 1
    
    avg_session_duration = total_duration / completed_sessions if completed_sessions > 0 else 0
    
    # Calculate average quiz accuracy
    quizzes = db_session.exec(select(Quiz)).all()
    correct_quizzes = sum(1 for quiz in quizzes if quiz.is_correct)
    avg_quiz_accuracy = correct_quizzes / len(quizzes) if quizzes else 0
    
    # Calculate emotional improvement rate
    emotional_trends = db_session.exec(select(EmotionalTrend)).all()
    positive_shifts = 0
    total_sessions = 0
    
    for trend in emotional_trends:
        if trend.sentiment_score > 0.3:  # Positive sentiment
            positive_shifts += 1
        total_sessions += 1
    
    emotional_improvement_rate = positive_shifts / total_sessions if total_sessions > 0 else 0
    
    # Calculate satisfaction ratings (mock data for now)
    satisfaction_ratings = {
        "helpfulness": 4.2,
        "clarity": 4.1,
        "tone": 4.3,
        "responsiveness": 4.0
    }
    
    metrics = ResearchMetrics(
        total_participants=total_users,
        average_session_duration=avg_session_duration,
        average_confidence_improvement=0.17,  # Mock data
        average_quiz_accuracy=avg_quiz_accuracy,
        emotional_improvement_rate=emotional_improvement_rate,
        external_tool_usage_rate=0.12,  # Mock data
        satisfaction_ratings=satisfaction_ratings
    )
    
    return metrics

@router.get("/emotional-trends/{user_id}")
async def get_user_emotional_trends(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get emotional trends for a specific user"""
    trends = session.exec(
        select(EmotionalTrend)
        .where(EmotionalTrend.user_id == user_id)
    ).all()
    
    return {
        "user_id": user_id,
        "trends": [
            {
                "timestamp": trend.timestamp.isoformat(),
                "sentiment_score": trend.sentiment_score,
                "emotion_category": trend.emotion_category,
                "topic": trend.topic
            }
            for trend in trends
        ]
    }

@router.get("/learning-progress/{user_id}")
async def get_user_learning_progress(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get detailed learning progress for a user"""
    
    # Get question progress
    progress = session.exec(
        select(UserQuestionProgress)
        .where(UserQuestionProgress.user_id == user_id)
    ).all()
    
    # Get quiz performance
    quizzes = session.exec(
        select(Quiz)
        .where(Quiz.user_id == user_id)
    ).all()
    
    # Get session data
    sessions = session.exec(
        select(UserSession)
        .where(UserSession.user_id == user_id)
        .order_by(desc(UserSession.session_start))
    ).all()
    
    return {
        "user_id": user_id,
        "question_progress": {
            "total_attempted": len([p for p in progress if p.attempted]),
            "total_solved": len([p for p in progress if p.solved]),
            "success_rate": len([p for p in progress if p.solved]) / len([p for p in progress if p.attempted]) if any(p.attempted for p in progress) else 0
        },
        "quiz_performance": {
            "total_quizzes": len(quizzes),
            "correct_answers": len([q for q in quizzes if q.is_correct]),
            "accuracy": len([q for q in quizzes if q.is_correct]) / len(quizzes) if quizzes else 0
        },
        "session_summary": {
            "total_sessions": len(sessions),
            "total_duration": sum(
                (s.session_end - s.session_start).total_seconds() / 60 
                for s in sessions if s.session_end
            ),
            "average_sentiment": sum(s.average_sentiment for s in sessions) / len(sessions) if sessions else 0
        }
    }

@router.get("/topic-performance")
async def get_topic_performance_analysis(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get performance analysis by topic"""
    
    # Get all questions grouped by difficulty
    questions = session.exec(select(Question)).all()
    
    topic_performance = {}
    
    for question in questions:
        topic = question.difficulty
        if topic not in topic_performance:
            topic_performance[topic] = {
                "total_questions": 0,
                "attempted": 0,
                "solved": 0,
                "success_rate": 0.0
            }
        
        topic_performance[topic]["total_questions"] += 1
        
        # Get progress for this question
        progress = session.exec(
            select(UserQuestionProgress)
            .where(UserQuestionProgress.question_id == question.id)
        ).all()
        
        for p in progress:
            if p.attempted:
                topic_performance[topic]["attempted"] += 1
            if p.solved:
                topic_performance[topic]["solved"] += 1
    
    # Calculate success rates
    for topic in topic_performance:
        if topic_performance[topic]["attempted"] > 0:
            topic_performance[topic]["success_rate"] = (
                topic_performance[topic]["solved"] / topic_performance[topic]["attempted"]
            )
    
    return topic_performance

@router.get("/export-data")
async def export_research_data(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Export all research data for analysis"""
    
    # Get all relevant data
    users = session.exec(select(User)).all()
    sessions = session.exec(select(UserSession)).all()
    messages = session.exec(select(ChatMessage)).all()
    quizzes = session.exec(select(Quiz)).all()
    emotional_trends = session.exec(select(EmotionalTrend)).all()
    progress = session.exec(select(UserQuestionProgress)).all()
    
    export_data = {
        "export_timestamp": datetime.utcnow().isoformat(),
        "users": [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "preferred_language": user.preferred_language,
                "dsa_level": user.dsa_level,
                "created_at": user.created_at.isoformat()
            }
            for user in users
        ],
        "sessions": [
            {
                "id": s.id,
                "user_id": s.user_id,
                "session_start": s.session_start.isoformat(),
                "session_end": s.session_end.isoformat() if s.session_end else None,
                "topics_covered": s.topics_covered,
                "confusion_flags": s.confusion_flags,
                "average_sentiment": s.average_sentiment,
                "total_messages": s.total_messages
            }
            for s in sessions
        ],
        "messages": [
            {
                "id": m.id,
                "session_id": m.session_id,
                "user_id": m.user_id,
                "message": m.message,
                "sender": m.sender,
                "sentiment_score": m.sentiment_score,
                "emotion_category": m.emotion_category,
                "timestamp": m.timestamp.isoformat(),
                "topic": m.topic
            }
            for m in messages
        ],
        "quizzes": [
            {
                "id": q.id,
                "session_id": q.session_id,
                "user_id": q.user_id,
                "question": q.question,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "user_answer": q.user_answer,
                "is_correct": q.is_correct,
                "topic": q.topic,
                "difficulty": q.difficulty,
                "generated_at": q.generated_at.isoformat(),
                "answered_at": q.answered_at.isoformat() if q.answered_at else None
            }
            for q in quizzes
        ],
        "emotional_trends": [
            {
                "id": t.id,
                "user_id": t.user_id,
                "session_id": t.session_id,
                "timestamp": t.timestamp.isoformat(),
                "sentiment_score": t.sentiment_score,
                "emotion_category": t.emotion_category,
                "topic": t.topic,
                "message_count": t.message_count
            }
            for t in emotional_trends
        ],
        "progress": [
            {
                "id": p.id,
                "user_id": p.user_id,
                "question_id": p.question_id,
                "attempted": p.attempted,
                "solved": p.solved,
                "last_answer": p.last_answer,
                "updated_at": p.updated_at.isoformat()
            }
            for p in progress
        ]
    }
    
    return export_data

@router.get("/ab-test-results")
async def get_ab_test_results(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get A/B testing results for different features"""
    
    # Mock A/B test results for demonstration
    ab_results = {
        "visual_aids": {
            "group_a": {
                "participants": 15,
                "engagement_rate": 0.87,
                "completion_rate": 0.92,
                "satisfaction_score": 4.3
            },
            "group_b": {
                "participants": 15,
                "engagement_rate": 0.78,
                "completion_rate": 0.85,
                "satisfaction_score": 4.1
            }
        },
        "difficulty_adaptation": {
            "group_a": {
                "participants": 12,
                "confidence_improvement": 0.19,
                "frustration_reduction": 0.23,
                "retention_rate": 0.89
            },
            "group_b": {
                "participants": 12,
                "confidence_improvement": 0.14,
                "frustration_reduction": 0.18,
                "retention_rate": 0.82
            }
        }
    }
    
    return ab_results 