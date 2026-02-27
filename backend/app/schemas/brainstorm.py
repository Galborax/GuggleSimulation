from pydantic import BaseModel
from typing import Optional, List, Any


class BrainstormChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    history: List[Any] = []
    country: str = "Singapore"
    founder_context: str = ""
    business_category: Optional[str] = None
    business_description: Optional[str] = None


class GenerateIdeasRequest(BaseModel):
    session_id: Optional[str] = None
    skills: str
    interests: str
    capital_bracket: str
    country: str = "Singapore"
    business_category: Optional[str] = None
    business_description: Optional[str] = None


class SelectIdeaRequest(BaseModel):
    session_id: str
    idea_index: int
    custom_name: Optional[str] = None
