from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
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

class UserQuestionProgress(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    question_id: int = Field(foreign_key="question.id")
    attempted: bool = False
    solved: bool = False
    last_answer: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow) 