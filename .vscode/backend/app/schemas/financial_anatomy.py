"""
Pydantic schemas for the Financial Anatomy Engine.

Three-pillar accounting model:
  CapEx  – one-time Day-1 setup costs
  OpEx   – fixed monthly operating costs
  COGS   – variable per-transaction costs
"""

from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel


class CostLineItem(BaseModel):
    id: int
    category: str                       # "CapEx" | "OpEx" | "COGS"
    item: str                           # e.g. "Commercial Renovation"
    amount: float                       # Primary amount (MYR / % / per-unit)
    unit: str                           # e.g. "one-time", "per month", "% of sale"
    citation_id: Optional[int] = None   # Reference to sources[]
    notes: Optional[str] = None         # Short clarification / statutory note
    is_hidden_cost: bool = False        # True → surfaces in "Hidden Costs" drawer
    # Lease alternative (populated only for CapEx items that have a lease option)
    lease_amount: Optional[float] = None     # Monthly cost if leased
    lease_unit: Optional[str] = None         # e.g. "per month (lease)"


class BreakEvenBar(BaseModel):
    """One bar in the break-even waterfall chart."""
    label: str       # e.g. "Fixed OpEx", "COGS @ avg ticket", "Gross Profit needed"
    value: float     # Positive = cost / negative = profit buffer
    color: str       # hex or tailwind color hint  e.g. "#f59e0b"
    is_target: bool = False   # True for the 'break-even line' bar


class BreakEvenAnalysis(BaseModel):
    avg_ticket_price: float            # RM per sale
    units_to_break_even: int           # Transactions / month
    monthly_opex_total: float
    monthly_cogs_per_unit: float
    contribution_margin: float         # avg_ticket - cogs_per_unit
    bars: List[BreakEvenBar]
    insight: str                       # 1-sentence plain-English summary


class FinancialAnatomySource(BaseModel):
    id: int
    title: str
    source_name: str
    url: Optional[str] = None
    snippet: Optional[str] = None
    verified: bool = False


class FinancialAnatomyResponse(BaseModel):
    session_id: str
    business_name: str
    country: str

    # ── Three pillars ────────────────────────────────────────────────────────
    capex: List[CostLineItem]           # One-time startup costs
    opex: List[CostLineItem]            # Fixed monthly costs (incl. statutory)
    cogs: List[CostLineItem]            # Variable per-transaction costs

    # ── Derived totals ───────────────────────────────────────────────────────
    total_capex: float
    total_capex_lease_mode: float       # Total Day-1 CapEx if all leaseable items are leased
    total_monthly_opex: float
    total_monthly_opex_lease_mode: float  # Higher OpEx when items are leased

    # ── Hidden costs ─────────────────────────────────────────────────────────
    hidden_costs: List[CostLineItem]    # Subset of all items where is_hidden_cost=True

    # ── Break-even ───────────────────────────────────────────────────────────
    break_even: BreakEvenAnalysis

    # ── Sources ──────────────────────────────────────────────────────────────
    sources: List[FinancialAnatomySource]
    cached: bool = False
