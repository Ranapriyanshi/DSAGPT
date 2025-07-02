from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/sentiment", tags=["sentiment"])

class SentimentRequest(BaseModel):
    message: str

@router.post("")
def analyze_sentiment(req: SentimentRequest):
    # Placeholder: always return neutral
    return {"sentiment": 0.0} 