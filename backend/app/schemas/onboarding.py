from pydantic import BaseModel
from typing import Optional, List, Any


class StartOnboardingRequest(BaseModel):
    path: str = "A"
    business_category: Optional[str] = None
    business_name: Optional[str] = None
    business_description: Optional[str] = None
    country: str = "Singapore"


class AnswerRequest(BaseModel):
    session_id: str
    question_index: int
    answer: str


class FinancialsRequest(BaseModel):
    session_id: str
    monthly_revenue: float
    monthly_burn: float
    cash_reserve: float
    team_size: int = 1


class SimilarBusinessesRequest(BaseModel):
    business_category: str
    business_name: str
    business_description: str
    country: str = "Singapore"


class UpdateProfileRequest(BaseModel):
    business_name: Optional[str] = None
    business_category: Optional[str] = None
    business_description: Optional[str] = None
    country: Optional[str] = None
    monthly_revenue: Optional[float] = None
    monthly_burn: Optional[float] = None
    cash_reserve: Optional[float] = None
    team_size: Optional[int] = None


class OnboardingResponse(BaseModel):
    session_id: str
    path: str
    questions: Optional[List[str]] = None
    analysis: Optional[Any] = None
    status: str
