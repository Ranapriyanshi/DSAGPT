from fastapi import APIRouter, HTTPException, Depends, Request
from sqlmodel import select, Session
from models import User
from database import get_session
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["users"])


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    preferred_language: str = "Python"
    dsa_level: str = "Beginner"


class UserLogin(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(user: UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == user.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password),
        preferred_language=user.preferred_language,
        dsa_level=user.dsa_level,
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return {"msg": "User registered successfully"}


@router.post("/login")
def login(user: UserLogin, session: Session = Depends(get_session)):
    db_user = session.exec(select(User).where(User.email == user.email)).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": db_user.email, "user_id": db_user.id})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
def get_me(request: Request, session: Session = Depends(get_session)):
    auth = request.headers.get("authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = auth.split()[1]
    payload = decode_access_token(token)
    if not payload or "user_id" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = session.get(User, payload["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "preferred_language": user.preferred_language,
        "dsa_level": user.dsa_level,
        "created_at": user.created_at,
    }
