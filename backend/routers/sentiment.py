from fastapi import APIRouter
from pydantic import BaseModel
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import json

router = APIRouter(prefix="/sentiment", tags=["sentiment"])

# Initialize VADER sentiment analyzer
analyzer = SentimentIntensityAnalyzer()


class SentimentRequest(BaseModel):
    message: str


class SentimentResponse(BaseModel):
    sentiment: float
    compound: float
    positive: float
    negative: float
    neutral: float
    emotion_category: str


@router.post("")
def analyze_sentiment(req: SentimentRequest):
    """
    Analyze sentiment using VADER as described in the research paper.
    Returns compound score between -1.0 and +1.0
    """
    # Get sentiment scores
    scores = analyzer.polarity_scores(req.message)

    # Determine emotion category based on compound score
    compound = scores["compound"]
    if compound >= 0.3:
        emotion_category = "positive"
    elif compound <= -0.3:
        emotion_category = "negative"
    else:
        emotion_category = "neutral"

    return SentimentResponse(
        sentiment=compound,  # Main sentiment score for backward compatibility
        compound=compound,
        positive=scores["pos"],
        negative=scores["neg"],
        neutral=scores["neu"],
        emotion_category=emotion_category,
    )


@router.post("/batch")
def analyze_sentiment_batch(messages: list[str]):
    """
    Analyze sentiment for multiple messages (for session analysis)
    """
    results = []
    for message in messages:
        scores = analyzer.polarity_scores(message)
        compound = scores["compound"]

        if compound >= 0.3:
            emotion_category = "positive"
        elif compound <= -0.3:
            emotion_category = "negative"
        else:
            emotion_category = "neutral"

        results.append(
            {
                "message": message,
                "sentiment": compound,
                "emotion_category": emotion_category,
            }
        )

    return {"results": results}
