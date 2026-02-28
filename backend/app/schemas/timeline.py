from pydantic import BaseModel, Field
from typing import List, Optional


class TimelineSourceCitation(BaseModel):
    id: int = Field(description="Unique reference number shown as [N] in UI")
    source_name: str = Field(description="Publisher name e.g. 'DOSM Malaysia', 'JobStreet'")
    url: str = Field(description="Direct link to the data source")
    snippet: str = Field(description="One-sentence quote from the source justifying the value")


class InteractiveVariable(BaseModel):
    id: str = Field(description="Unique snake_case key e.g. 'monthly_rent'")
    name: str = Field(description="Human label e.g. 'Monthly Commercial Rent'")
    unit: str = Field(description="Display unit e.g. 'RM/month', 'RM one-time'")
    default_value: float = Field(description="AI-researched realistic estimate")
    min_value: float = Field(description="Lowest realistic boundary from market data")
    max_value: float = Field(description="Highest realistic boundary from market data")
    citation_id: int = Field(description="Reference ID linking to a TimelineSourceCitation")
    impact_type: str = Field(
        description="'monthly_cost' | 'one_time_cost' | 'revenue_driver' | 'unit_revenue'"
    )
    warning_threshold: Optional[float] = Field(
        default=None,
        description="Value at which a guardrail warning appears (for costs: above this; for revenue: below this)",
    )
    warning_message: Optional[str] = Field(
        default=None,
        description="Human-readable warning text shown when threshold is crossed. Include [N] citation.",
    )
    emoji: Optional[str] = Field(default="📊", description="Emoji for the block icon")


class AdjustableTimeline(BaseModel):
    business_name: str
    starting_capital: float = Field(description="User's initial budget in RM")
    months: int = Field(default=24, description="Number of months to simulate")
    core_variables: List[InteractiveVariable] = Field(
        description="Continuous sliders: recurring monthly costs and revenue drivers"
    )
    action_blocks: List[InteractiveVariable] = Field(
        description="Drag-and-drop one-time or recurring events that can be placed on a specific month"
    )
    references: List[TimelineSourceCitation] = Field(
        description="Master citation list referenced by citation_id fields"
    )


class TimelineRequest(BaseModel):
    session_id: str
    starting_capital: Optional[float] = Field(
        default=50000.0, description="Override starting capital in RM"
    )
