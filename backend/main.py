from database import create_db_and_tables, seed_questions
from routers import users, sentiment, gpt_chat, questions
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
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

@app.get("/")
def read_root():
    return {"msg": "DSA-GPT backend is running"}

# Routers will be included here (gpt_chat)
# from routers import gpt_chat
# app.include_router(gpt_chat.router)

# Routers will be included here (sentiment)
# from routers import sentiment
# app.include_router(sentiment.router) 