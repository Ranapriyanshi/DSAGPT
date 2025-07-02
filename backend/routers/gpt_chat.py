from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/gpt-chat", tags=["gpt-chat"])

class ChatRequest(BaseModel):
    prompt: str

@router.post("")
def gpt_chat(req: ChatRequest):
    # Placeholder: always return a canned response
    return {"response": "This is a mock GPT-4 response about DSA."} 