from pydantic import BaseModel
from typing import Optional, List, Any


class RunwayRequest(BaseModel):
    session_id: Optional[str] = None
    monthly_revenue: float
    monthly_burn: float
    cash_reserve: float
    team_size: int = 1


class ChaosRequest(BaseModel):
    session_id: Optional[str] = None
    monthly_revenue: float
    monthly_burn: float
    cash_reserve: float
    business_context: Optional[str] = None


class WhatIfRequest(BaseModel):
    session_id: Optional[str] = None
    monthly_revenue: float
    monthly_burn: float
    cash_reserve: float
    inflation_shock: float = 0.0
    revenue_shock: float = 0.0
    cost_shock: float = 0.0
    competitor_entry: bool = False
    regulatory_change: bool = False


class HiringRequest(BaseModel):
    session_id: Optional[str] = None
    current_team_size: int
    target_team_size: int
    monthly_budget: float
    business_context: Optional[str] = None
    country: str = "Singapore"


class RunwayResponse(BaseModel):
    runway_months: float
    timeline: List[Any]
    alerts: List[str]
    recommendation: str


class FounderScenarioRequest(BaseModel):
    session_id: Optional[str] = None
    monthly_revenue: float
    monthly_burn: float
    cash_reserve: float
    scenario_type: str  # supply_chain_shock | price_war | viral_spike | key_player_churn | policy_shift


class FounderScenarioTactic(BaseModel):
    label: str
    advice: str


class FounderScenarioResponse(BaseModel):
    scenario_type: str
    scenario_title: str
    use_case: str
    severity: str  # critical | warning | moderate
    baseline_runway: float
    stressed_runway: float
    runway_delta: float
    new_monthly_revenue: float
    new_monthly_burn: float
    baseline_timeline: List[Any]
    stressed_timeline: List[Any]
    action_plan: List[FounderScenarioTactic]
