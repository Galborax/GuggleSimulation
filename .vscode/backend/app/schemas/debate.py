from pydantic import BaseModel
from typing import Optional, List, Any


class StartDebateRequest(BaseModel):
    topic: str
    business_context: Optional[str] = None
    session_id: Optional[str] = None


class NextRoundRequest(BaseModel):
    debate_id: int


class JudgeRequest(BaseModel):
    debate_id: int


class DebateResponse(BaseModel):
    debate_id: int
    topic: str
    rounds: List[Any]
    judge_summary: Optional[Any] = None
    status: str


class DebriefRequest(BaseModel):
    debate_id: int
    claim: str                      # The exact text the user clicked on (a risk/opportunity)
    agent_name: str                 # e.g. "Diana Lim"
    agent_role: str                 # e.g. "Skeptic Analyst"
    user_message: str               # What the founder typed or quick-clicked
    thread_key: Optional[str] = None  # client-generated key for chat thread isolation
