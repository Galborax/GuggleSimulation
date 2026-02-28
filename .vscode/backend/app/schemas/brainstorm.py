from pydantic import BaseModel
from typing import Optional, List, Any


class BrainstormChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    history: List[Any] = []
    country: str = "Singapore"
    founder_context: str = ""


class GenerateIdeasRequest(BaseModel):
    session_id: Optional[str] = None
    skills: str
    interests: str
    capital_bracket: str
    country: str = "Singapore"


class SelectIdeaRequest(BaseModel):
    session_id: str
    idea_index: int
