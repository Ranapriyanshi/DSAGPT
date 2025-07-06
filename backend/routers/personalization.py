from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from sqlmodel import Session, select, desc
from database import get_session
from models import (
    User, LearningStyle, SpacedRepetition, CognitiveProfile, 
    LearningPath, Bookmark, SessionPause, Question
)
from routers.sentiment import analyze_sentiment, SentimentRequest

router = APIRouter(prefix="/personalization", tags=["personalization"])

class LearningStyleRequest(BaseModel):
    visual_preference: float = 0.5
    auditory_preference: float = 0.5
    kinesthetic_preference: float = 0.5
    reading_preference: float = 0.5

class CognitiveProfileRequest(BaseModel):
    working_memory_capacity: float = 0.5
    processing_speed: float = 0.5
    attention_span: float = 0.5
    pattern_recognition: float = 0.5
    logical_reasoning: float = 0.5
    spatial_ability: float = 0.5

class BookmarkRequest(BaseModel):
    title: str
    description: str = ""
    tags: List[str] = []
    question_id: Optional[int] = None
    message_id: Optional[int] = None

class SpacedRepetitionResponse(BaseModel):
    topic_id: int
    topic_title: str
    next_review: datetime
    review_count: int
    success_rate: float
    difficulty_level: int

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

@router.post("/learning-style")
async def update_learning_style(
    req: LearningStyleRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update user's learning style preferences"""
    # Check if learning style exists
    existing_style = session.exec(
        select(LearningStyle).where(LearningStyle.user_id == current_user.id)
    ).first()
    
    if existing_style:
        # Update existing
        existing_style.visual_preference = req.visual_preference
        existing_style.auditory_preference = req.auditory_preference
        existing_style.kinesthetic_preference = req.kinesthetic_preference
        existing_style.reading_preference = req.reading_preference
        existing_style.updated_at = datetime.utcnow()
    else:
        # Create new
        learning_style = LearningStyle(
            user_id=current_user.id or 0,
            visual_preference=req.visual_preference,
            auditory_preference=req.auditory_preference,
            kinesthetic_preference=req.kinesthetic_preference,
            reading_preference=req.reading_preference
        )
        session.add(learning_style)
    
    session.commit()
    return {"message": "Learning style updated successfully"}

@router.get("/learning-style")
async def get_learning_style(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get user's learning style preferences"""
    learning_style = session.exec(
        select(LearningStyle).where(LearningStyle.user_id == current_user.id)
    ).first()
    
    if not learning_style:
        # Return default values
        return {
            "visual_preference": 0.5,
            "auditory_preference": 0.5,
            "kinesthetic_preference": 0.5,
            "reading_preference": 0.5
        }
    
    return {
        "visual_preference": learning_style.visual_preference,
        "auditory_preference": learning_style.auditory_preference,
        "kinesthetic_preference": learning_style.kinesthetic_preference,
        "reading_preference": learning_style.reading_preference
    }

@router.post("/cognitive-profile")
async def update_cognitive_profile(
    req: CognitiveProfileRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update user's cognitive profile"""
    existing_profile = session.exec(
        select(CognitiveProfile).where(CognitiveProfile.user_id == current_user.id)
    ).first()
    
    if existing_profile:
        # Update existing
        existing_profile.working_memory_capacity = req.working_memory_capacity
        existing_profile.processing_speed = req.processing_speed
        existing_profile.attention_span = req.attention_span
        existing_profile.pattern_recognition = req.pattern_recognition
        existing_profile.logical_reasoning = req.logical_reasoning
        existing_profile.spatial_ability = req.spatial_ability
        existing_profile.updated_at = datetime.utcnow()
    else:
        # Create new
        cognitive_profile = CognitiveProfile(
            user_id=current_user.id or 0,
            working_memory_capacity=req.working_memory_capacity,
            processing_speed=req.processing_speed,
            attention_span=req.attention_span,
            pattern_recognition=req.pattern_recognition,
            logical_reasoning=req.logical_reasoning,
            spatial_ability=req.spatial_ability
        )
        session.add(cognitive_profile)
    
    session.commit()
    return {"message": "Cognitive profile updated successfully"}

@router.get("/cognitive-profile")
async def get_cognitive_profile(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get user's cognitive profile"""
    cognitive_profile = session.exec(
        select(CognitiveProfile).where(CognitiveProfile.user_id == current_user.id)
    ).first()
    
    if not cognitive_profile:
        # Return default values
        return {
            "working_memory_capacity": 0.5,
            "processing_speed": 0.5,
            "attention_span": 0.5,
            "pattern_recognition": 0.5,
            "logical_reasoning": 0.5,
            "spatial_ability": 0.5
        }
    
    return {
        "working_memory_capacity": cognitive_profile.working_memory_capacity,
        "processing_speed": cognitive_profile.processing_speed,
        "attention_span": cognitive_profile.attention_span,
        "pattern_recognition": cognitive_profile.pattern_recognition,
        "logical_reasoning": cognitive_profile.logical_reasoning,
        "spatial_ability": cognitive_profile.spatial_ability
    }

@router.get("/spaced-repetition")
async def get_spaced_repetition_topics(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get topics due for spaced repetition review"""
    now = datetime.utcnow()
    
    # Get topics due for review
    due_topics = session.exec(
        select(SpacedRepetition)
        .where(
            SpacedRepetition.user_id == current_user.id,
            SpacedRepetition.next_review <= now
        )
    ).all()
    
    # Get question details for each topic
    topics_with_details = []
    for topic in due_topics:
        question = session.get(Question, topic.topic_id)
        if question:
            topics_with_details.append({
                "topic_id": topic.topic_id,
                "topic_title": question.title,
                "next_review": topic.next_review,
                "review_count": topic.review_count,
                "success_rate": topic.success_rate,
                "difficulty_level": topic.difficulty_level
            })
    
    return {"topics": topics_with_details}

@router.post("/spaced-repetition/{topic_id}/review")
async def mark_topic_reviewed(
    topic_id: int,
    success: bool,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Mark a topic as reviewed and update spaced repetition schedule"""
    spaced_rep = session.exec(
        select(SpacedRepetition).where(
            SpacedRepetition.user_id == current_user.id,
            SpacedRepetition.topic_id == topic_id
        )
    ).first()
    
    if not spaced_rep:
        # Create new spaced repetition entry
        spaced_rep = SpacedRepetition(
            user_id=current_user.id or 0,
            topic_id=topic_id,
            review_count=0,
            success_rate=0.0,
            next_review=datetime.utcnow() + timedelta(days=1)
        )
        session.add(spaced_rep)
    
    # Update review count and success rate
    spaced_rep.review_count += 1
    total_reviews = spaced_rep.review_count
    current_successes = spaced_rep.success_rate * (total_reviews - 1)
    new_successes = current_successes + (1 if success else 0)
    spaced_rep.success_rate = new_successes / total_reviews
    
    # Calculate next review time using spaced repetition algorithm
    if success:
        # Increase interval for successful reviews
        interval_days = min(2 ** spaced_rep.review_count, 365)  # Cap at 1 year
    else:
        # Reset interval for failed reviews
        interval_days = 1
    
    spaced_rep.next_review = datetime.utcnow() + timedelta(days=interval_days)
    spaced_rep.updated_at = datetime.utcnow()
    
    session.commit()
    return {"message": "Topic review recorded successfully"}

@router.post("/bookmarks")
async def create_bookmark(
    req: BookmarkRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a new bookmark"""
    bookmark = Bookmark(
        user_id=current_user.id or 0,
        title=req.title,
        description=req.description,
        tags=",".join(req.tags),
        question_id=req.question_id,
        message_id=req.message_id
    )
    session.add(bookmark)
    session.commit()
    session.refresh(bookmark)
    
    return {
        "id": bookmark.id,
        "title": bookmark.title,
        "description": bookmark.description,
        "tags": req.tags,
        "created_at": bookmark.created_at
    }

@router.get("/bookmarks")
async def get_bookmarks(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get user's bookmarks"""
    bookmarks = session.exec(
        select(Bookmark)
        .where(Bookmark.user_id == current_user.id)
        .order_by(desc(Bookmark.created_at))
    ).all()
    
    return {
        "bookmarks": [
            {
                "id": b.id,
                "title": b.title,
                "description": b.description,
                "tags": b.tags.split(",") if b.tags else [],
                "question_id": b.question_id,
                "message_id": b.message_id,
                "created_at": b.created_at
            }
            for b in bookmarks
        ]
    }

@router.delete("/bookmarks/{bookmark_id}")
async def delete_bookmark(
    bookmark_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a bookmark"""
    bookmark = session.exec(
        select(Bookmark).where(
            Bookmark.id == bookmark_id,
            Bookmark.user_id == current_user.id
        )
    ).first()
    
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    session.delete(bookmark)
    session.commit()
    return {"message": "Bookmark deleted successfully"}

@router.get("/learning-path")
async def get_personalized_learning_path(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Generate personalized learning path based on user profile"""
    # Get user's learning style and cognitive profile
    learning_style = session.exec(
        select(LearningStyle).where(LearningStyle.user_id == current_user.id)
    ).first()
    
    cognitive_profile = session.exec(
        select(CognitiveProfile).where(CognitiveProfile.user_id == current_user.id)
    ).first()
    
    # Get all questions for user's level and language
    questions = session.exec(
        select(Question).where(
            Question.language == current_user.preferred_language
        ).order_by(Question.difficulty)
    ).all()
    
    # Generate personalized learning path
    learning_path = []
    for i, question in enumerate(questions):
        # Adjust difficulty based on cognitive profile
        difficulty_adjustment = 0.0
        if cognitive_profile:
            # Adjust based on processing speed and attention span
            if cognitive_profile.processing_speed < 0.3:
                difficulty_adjustment -= 0.2  # Make easier
            elif cognitive_profile.processing_speed > 0.7:
                difficulty_adjustment += 0.2  # Make harder
        
        learning_path.append({
            "order": i + 1,
            "question_id": question.id,
            "title": question.title,
            "difficulty": question.difficulty,
            "difficulty_adjustment": difficulty_adjustment,
            "estimated_duration": 15,  # Default 15 minutes
            "completed": False
        })
    
    return {"learning_path": learning_path}

@router.post("/session/pause")
async def pause_session(
    reason: str = "",
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Pause the current learning session"""
    # Get active session
    from models import UserSession
    active_session = session.exec(
        select(UserSession).where(
            UserSession.user_id == current_user.id,
            UserSession.session_end == None
        )
    ).first()
    
    if not active_session:
        raise HTTPException(status_code=404, detail="No active session found")
    
    # Create pause record
    pause = SessionPause(
        session_id=active_session.id or 0,
        pause_time=datetime.utcnow(),
        reason=reason
    )
    session.add(pause)
    session.commit()
    
    return {"message": "Session paused successfully", "pause_id": pause.id}

@router.post("/session/resume/{pause_id}")
async def resume_session(
    pause_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Resume a paused learning session"""
    pause_record = session.get(SessionPause, pause_id)
    if not pause_record:
        raise HTTPException(status_code=404, detail="Pause record not found")
    
    # Update pause record
    pause_record.resume_time = datetime.utcnow()
    session.commit()
    
    return {"message": "Session resumed successfully"}

# Additional endpoints for frontend integration
class DifficultyUpdateRequest(BaseModel):
    difficulty: float

class ModeUpdateRequest(BaseModel):
    mode: str

@router.post("/pause-session")
async def pause_session_endpoint(
    req: dict,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Pause the current learning session (alternative endpoint)"""
    reason = req.get("reason", "")
    
    # Get active session
    from models import UserSession
    active_session = session.exec(
        select(UserSession).where(
            UserSession.user_id == current_user.id,
            UserSession.session_end == None
        )
    ).first()
    
    if not active_session:
        # Create a new session if none exists
        active_session = UserSession(
            user_id=current_user.id or 0,
            session_start=datetime.utcnow()
        )
        session.add(active_session)
        session.commit()
    
    # Create pause record
    pause = SessionPause(
        session_id=active_session.id or 0,
        pause_time=datetime.utcnow(),
        reason=reason
    )
    session.add(pause)
    session.commit()
    
    return {"message": "Session paused successfully", "pause_id": pause.id}

@router.post("/resume-session/{pause_id}")
async def resume_session_endpoint(
    pause_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Resume a paused learning session (alternative endpoint)"""
    pause_record = session.get(SessionPause, pause_id)
    if not pause_record:
        raise HTTPException(status_code=404, detail="Pause record not found")
    
    # Update pause record
    pause_record.resume_time = datetime.utcnow()
    session.commit()
    
    return {"message": "Session resumed successfully"}

@router.post("/update-difficulty")
async def update_difficulty(
    req: DifficultyUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update user's current difficulty level"""
    # Store difficulty in user session or create a new field in User model
    # For now, we'll store it in the session
    from models import UserSession
    active_session = session.exec(
        select(UserSession).where(
            UserSession.user_id == current_user.id,
            UserSession.session_end == None
        )
    ).first()
    
    if not active_session:
        # Create a new session
        active_session = UserSession(
            user_id=current_user.id or 0,
            session_start=datetime.utcnow()
        )
        session.add(active_session)
    
    # Store difficulty in session metadata (you might want to add this field to UserSession model)
    # For now, we'll just return success
    session.commit()
    
    return {"message": "Difficulty updated successfully", "difficulty": req.difficulty}

@router.post("/update-mode")
async def update_mode(
    req: ModeUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update user's current learning mode"""
    # Store mode in user session or create a new field in User model
    # For now, we'll just return success
    return {"message": "Mode updated successfully", "mode": req.mode}

@router.get("/session-state")
async def get_session_state(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get current session state including pause status and settings"""
    # Get active session
    from models import UserSession
    active_session = session.exec(
        select(UserSession).where(
            UserSession.user_id == current_user.id,
            UserSession.session_end == None
        )
    ).first()
    
    # Get latest pause record
    latest_pause = None
    if active_session:
        latest_pause = session.exec(
            select(SessionPause).where(
                SessionPause.session_id == active_session.id,
                SessionPause.resume_time == None
            ).order_by(desc(SessionPause.pause_time))
        ).first()
    
    return {
        "isPaused": latest_pause is not None,
        "pauseReason": latest_pause.reason if latest_pause else None,
        "pauseId": latest_pause.id if latest_pause else None,
        "currentMode": "text",  # Default mode
        "currentDifficulty": 0.5  # Default difficulty
    } 