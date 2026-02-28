from pydantic import BaseModel
from typing import Optional, List


class BenchmarkAverages(BaseModel):
    startup_cost_range: str          # e.g. "RM 150,000 – RM 350,000"
    profit_margin_range: str         # e.g. "12% – 18%"
    year1_failure_rate: str          # e.g. "28%"
    break_even_months: str           # e.g. "8 – 14 months"
    summary: str                     # Cited paragraph


class CompetitorSnapshot(BaseModel):
    name: str                        # e.g. "Oriental Kopi"
    model_type: str                  # e.g. "Mall Kopitiam"
    description: str                 # Cited description
    key_stat: str                    # e.g. "Est. CapEx RM 400,000+ per outlet"


class MacroTrend(BaseModel):
    headline: str                    # One-liner title
    growth_rate: str                 # e.g. "CAGR 6.2%"
    detail: str                      # Cited paragraph
    headwind: str                    # Key challenge, cited


class SourceDocument(BaseModel):
    id: int
    title: str
    source_name: str
    url: Optional[str] = None
    snippet: Optional[str] = None
    verified: bool = False
    published_at: Optional[str] = None


class IndustryBenchmarkResponse(BaseModel):
    industry: str
    location: str
    industry_averages: BenchmarkAverages
    competitor_snapshots: List[CompetitorSnapshot]
    macro_trend: MacroTrend
    ai_coach_briefing: str           # Paragraph the AI uses to ground its first message
    sources: List[SourceDocument]
    cached: bool = False
