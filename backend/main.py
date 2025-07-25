from dotenv import load_dotenv
import os
load_dotenv()
from database import create_db_and_tables, seed_questions
from routers import users, sentiment, gpt_chat, questions
from routers import ai, analytics, personalization, research
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Get allowed origins from environment variable
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
if allowed_origins == ["*"]:
    allowed_origins = ["*"]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    seed_questions()

app.include_router(users.router)
app.include_router(sentiment.router)
app.include_router(gpt_chat.router)
app.include_router(questions.router)
app.include_router(ai.router)
app.include_router(analytics.router)
app.include_router(personalization.router)
app.include_router(research.router)

@app.get("/")
def read_root():
    return {"msg": "DSA-GPT backend is running"} 