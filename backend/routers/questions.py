from fastapi import APIRouter, Query, HTTPException, Depends, Body
from sqlmodel import Session, select
from models import Question, UserQuestionProgress
from database import get_session
from typing import List, Optional, Dict
from auth import get_current_user
from fastapi import status
import json

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("/", response_model=List[Question])
def get_questions(
    difficulty: Optional[str] = Query(
        None, description="Difficulty level: basic, intermediate, advanced"
    ),
    language: Optional[str] = Query(
        None, description="Programming language: Python, C++, JavaScript"
    ),
    session: Session = Depends(get_session),
):
    query = select(Question)
    if difficulty:
        query = query.where(Question.difficulty == difficulty)
    if language:
        query = query.where(Question.language == language)
    results = session.exec(query).all()
    # Limit to 10 questions per request
    return results[:10]


@router.get("/progress", response_model=Dict[int, dict])
def get_user_progress(
    session: Session = Depends(get_session), user=Depends(get_current_user)
):
    progress = session.exec(
        select(UserQuestionProgress).where(UserQuestionProgress.user_id == user.id)
    ).all()
    return {
        p.question_id: {
            "attempted": p.attempted,
            "solved": p.solved,
            "last_answer": p.last_answer,
        }
        for p in progress
    }


@router.post("/{question_id}/progress", status_code=status.HTTP_204_NO_CONTENT)
def update_user_progress(
    question_id: int,
    attempted: bool = Body(...),
    solved: bool = Body(...),
    last_answer: str = Body(None),
    session: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    progress = session.exec(
        select(UserQuestionProgress).where(
            (UserQuestionProgress.user_id == user.id)
            & (UserQuestionProgress.question_id == question_id)
        )
    ).first()
    if not progress:
        progress = UserQuestionProgress(user_id=user.id, question_id=question_id)
        session.add(progress)
    progress.attempted = attempted
    progress.solved = solved
    progress.last_answer = last_answer
    from datetime import datetime

    progress.updated_at = datetime.utcnow()
    session.commit()
    return


@router.get("/{question_id}", response_model=Question)
def get_question(question_id: int, session: Session = Depends(get_session)):
    question = session.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.post("/{question_id}/submit")
def submit_answer(
    question_id: int,
    answer: str = Body(..., embed=True),
    session: Session = Depends(get_session),
):
    question = session.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    # Simple string match for now (case-insensitive, strip)
    correct = False
    if question.solution:
        correct = question.solution.strip().lower() == answer.strip().lower()
    return {"correct": correct, "solution": question.solution if not correct else None}


@router.get("/{question_id}/summary")
def get_question_summary(question_id: int, session: Session = Depends(get_session)):
    question = session.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    examples = []
    if question.examples:
        try:
            examples = json.loads(question.examples)
        except Exception:
            examples = []
    return {
        "id": question.id,
        "title": question.title,
        "description": question.description,
        "difficulty": question.difficulty,
        "language": question.language,
        "examples": examples,
        "solution": question.solution,
    }
