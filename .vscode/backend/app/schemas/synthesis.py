from pydantic import BaseModel
from typing import Optional, Any


class SynthesisRequest(BaseModel):
    session_id: str


class SynthesisResponse(BaseModel):
    session_id: str
    executive_summary: str
    swot: Any
    financial_outlook: str
    asean_opportunities: str
    risks: str
    recommendation: str
    confidence_score: float
    investor_pitch: str
