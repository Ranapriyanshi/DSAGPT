from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str
    hashed_password: str
    preferred_language: str = "Python"
    dsa_level: str = "Beginner"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    difficulty: str  # 'basic', 'intermediate', 'advanced'
    language: str = "Python"  # 'Python', 'C++', 'JavaScript'
    solution: Optional[str] = None
    examples: Optional[str] = None  # JSON string: [{"input": ..., "output": ..., "explanation": ...}, ...]

class UserQuestionProgress(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    question_id: int = Field(foreign_key="question.id")
    attempted: bool = False
    solved: bool = False
    last_answer: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserSession(SQLModel, table=True):
    """Session memory for contextual tutoring as described in the research paper"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    session_start: datetime = Field(default_factory=datetime.utcnow)
    session_end: Optional[datetime] = None
    topics_covered: Optional[str] = None  # JSON string of topics
    confusion_flags: Optional[str] = None  # JSON string of topics user found confusing
    average_sentiment: float = 0.0
    total_messages: int = 0

class ChatMessage(SQLModel, table=True):
    """Store chat messages for session memory and sentiment analysis"""
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: Optional[int] = Field(foreign_key="usersession.id")
    user_id: Optional[int] = Field(foreign_key="user.id")
    message: str
    sender: str  # 'user' or 'bot'
    sentiment_score: float = 0.0
    emotion_category: str = "neutral"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    topic: Optional[str] = None
    quiz_generated: bool = False
    quiz_answered: bool = False
    quiz_correct: Optional[bool] = None

class Quiz(SQLModel, table=True):
    """Store generated quizzes for tracking and improvement"""
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: Optional[int] = Field(foreign_key="usersession.id")
    user_id: Optional[int] = Field(foreign_key="user.id")
    question: str
    options: str  # JSON string of options
    correct_answer: int
    user_answer: Optional[int] = None
    is_correct: Optional[bool] = None
    topic: str
    difficulty: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    answered_at: Optional[datetime] = None

class EmotionalTrend(SQLModel, table=True):
    """Track emotional trends over time for personalization"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(foreign_key="user.id")
    session_id: Optional[int] = Field(foreign_key="usersession.id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    sentiment_score: float
    emotion_category: str
    topic: Optional[str] = None
    message_count: int = 1 

class LearningStyle(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    visual_preference: float = Field(default=0.5)  # 0-1 scale
    auditory_preference: float = Field(default=0.5)
    kinesthetic_preference: float = Field(default=0.5)
    reading_preference: float = Field(default=0.5)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SpacedRepetition(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    topic_id: int = Field(foreign_key="question.id")
    difficulty_level: int = Field(default=1)  # 1-5 scale
    next_review: datetime = Field()
    review_count: int = Field(default=0)
    success_rate: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CognitiveProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    working_memory_capacity: float = Field(default=0.5)  # 0-1 scale
    processing_speed: float = Field(default=0.5)
    attention_span: float = Field(default=0.5)
    pattern_recognition: float = Field(default=0.5)
    logical_reasoning: float = Field(default=0.5)
    spatial_ability: float = Field(default=0.5)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LearningPath(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    topic_id: int = Field(foreign_key="question.id")
    order: int = Field()
    difficulty_adjustment: float = Field(default=0.0)  # -1 to +1
    estimated_duration: int = Field(default=15)  # minutes
    prerequisites: str = Field(default="")  # JSON string of prerequisite topics
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Bookmark(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    question_id: Optional[int] = Field(foreign_key="question.id", default=None)
    message_id: Optional[int] = Field(foreign_key="chatmessage.id", default=None)
    title: str = Field()
    description: str = Field(default="")
    tags: str = Field(default="")  # JSON string of tags
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SessionPause(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="usersession.id")
    pause_time: datetime = Field()
    resume_time: Optional[datetime] = Field(default=None)
    reason: str = Field(default="")  # User-provided reason for pause
    created_at: datetime = Field(default_factory=datetime.utcnow) 