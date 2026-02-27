export interface Category {
  name: string;
}

export interface GlossaryTerm {
  id: number;
  term: string;
  definition: string;
  category: string;
  source: "manual" | "chatbox" | "static";
}

export interface SimilarBusiness {
  name: string;
  country: string;
  description: string;
  similarity: string;
  stage: "startup" | "scale-up" | "enterprise";
  founded_year?: number | null;
  website?: string | null;
  key_differentiator: string;
}

export interface ProfileSummary {
  session_id: string;
  business_name: string;
  business_category?: string;
  business_description?: string;
  country?: string;
  stage?: string;
  monthly_revenue?: number;
  monthly_burn?: number;
  cash_reserve?: number;
  team_size?: number;
}

export interface OnboardingSession {
  session_id: string;
  path: string;
  business_category?: string;
  business_name?: string;
  business_description?: string;
  country?: string;
  questions?: string[];
  analysis?: Analysis;
  analysis_result?: Analysis | null;
  monthly_revenue?: number;
  monthly_burn?: number;
  cash_reserve?: number;
  team_size?: number;
  stage?: string;
  generated_ideas?: Idea[];
  selected_idea?: Idea;
}

export interface Analysis {
  viability_score: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  market_size_estimate: string;
  next_steps: string[];
  asean_expansion_tips: string[];
  summary: string;
}

export interface Idea {
  name: string;
  tagline: string;
  problem: string;
  target_customer: string;
  revenue_model: string;
  why_sea: string;
  viability_score: number;
  pros: string[];
  cons: string[];
}

export interface DebateRound {
  round: number;
  agent: string;
  role: string;
  emoji: string;
  content: string;
}

export interface JudgeSummary {
  verdict: "proceed" | "pivot" | "pause";
  reasoning: string;
  confidence_score: number;
  key_risks: string[];
  key_opportunities: string[];
  recommendation: string;
}

export interface RunwayData {
  runway_months: number;
  timeline: TimelinePoint[];
  alerts: string[];
  recommendation: string;
}

export interface TimelinePoint {
  month: number;
  cash: number;
  monthly_revenue: number;
  monthly_burn: number;
  net_burn: number;
}

export interface ChaosEvent {
  title: string;
  description: string;
  category: string;
  revenue_impact: number;
  burn_impact: number;
  probability: string;
  duration_months: number;
  survival_tips: string[];
}

export interface SourceDocument {
  id: number;
  title: string;
  source_name: string;
  url: string;
  fetched_at: string;
  snippet: string;
  verified: boolean;  // true = green "Verified Source", false = yellow "AI Estimated"
}

/** A single AI-cited reference (subset returned by Gemini in structured output) */
export interface SourceCitation {
  id: number;
  source_name: string;
  url: string;
}

/** One data-backed insight with an inline [ID] citation */
export interface CitedInsight {
  claim: string;           // e.g. "Profit margin is 21.5% [2]."
  confidence_level: "High" | "Medium";
}

export interface SynthesisReport {
  session_id: string;
  /** NEW — 2-3 sentence opening paragraph */
  overall_summary?: string;
  /** NEW — specific cited data points (the Perplexity-style findings list) */
  key_findings?: CitedInsight[];
  /** NEW — master list of sources the AI actually cited */
  references?: SourceCitation[];
  executive_summary: string;
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  financial_outlook: string;
  asean_opportunities: string;
  risks: string;
  recommendation: string;
  confidence_score: number;
  investor_pitch: string;
  sources?: SourceDocument[];
}

export interface MonthlyCashFlow {
  month: number;
  net_cash: number;
}

export interface BusinessRealityDashboard {
  viability_score: number;
  startup_cost: number;
  time_to_break_even_months: number;
  year_1_revenue: number;
  profit_margin_percentage: number;
  value_explanations?: {
    viability_score?: {
      how_deduced: string;
      citation_ids: number[];
    };
    startup_cost?: {
      how_deduced: string;
      citation_ids: number[];
    };
    time_to_break_even_months?: {
      how_deduced: string;
      citation_ids: number[];
    };
    year_1_revenue?: {
      how_deduced: string;
      citation_ids: number[];
    };
    profit_margin_percentage?: {
      how_deduced: string;
      citation_ids: number[];
    };
  };
  suitable_areas: string[];
  competitiveness_level: "Low" | "Medium" | "High" | "Saturated";
  top_competitors: string[];
  cash_flow_timeline: MonthlyCashFlow[];
  sources?: SourceDocument[];
}

// ── Interactive Financial Timeline ────────────────────────────────────────────

export type ImpactType = "monthly_cost" | "one_time_cost" | "revenue_driver" | "unit_revenue";

export interface TimelineCitation {
  id: number;
  source_name: string;
  url: string;
  snippet: string;
}

export interface InteractiveVariable {
  id: string;
  name: string;
  unit: string;
  default_value: number;
  min_value: number;
  max_value: number;
  citation_id: number;
  impact_type: ImpactType;
  warning_threshold: number | null;
  warning_message: string | null;
  emoji: string;
}

export interface AdjustableTimeline {
  business_name: string;
  starting_capital: number;
  months: number;
  core_variables: InteractiveVariable[];
  action_blocks: InteractiveVariable[];
  references: TimelineCitation[];
  rag_sources?: SourceDocument[];
}

export interface ComputedMonthPoint {
  month: number;
  label: string;
  cash: number;
  inflow: number;
  outflow: number;
  isCritical: boolean;
}

// ── Industry Reality Check ──────────────────────────────────────────────
export interface BenchmarkAverages {
  startup_cost_range: string;
  profit_margin_range: string;
  year1_failure_rate: string;
  break_even_months: string;
  summary: string;
}

export interface CompetitorSnapshot {
  name: string;
  model_type: string;
  description: string;
  key_stat: string;
}

export interface MacroTrend {
  headline: string;
  growth_rate: string;
  detail: string;
  headwind: string;
}

export interface IndustryBenchmarkData {
  industry: string;
  location: string;
  industry_averages: BenchmarkAverages;
  competitor_snapshots: CompetitorSnapshot[];
  macro_trend: MacroTrend;
  ai_coach_briefing: string;
  sources: SourceDocument[];
  cached: boolean;
}

// ── Financial Anatomy Engine ─────────────────────────────────────────────────

export interface CostLineItem {
  id: number;
  category: "CapEx" | "OpEx" | "COGS";
  item: string;
  amount: number;
  unit: string;
  citation_id: number | null;
  notes: string | null;
  is_hidden_cost: boolean;
  lease_amount: number | null;
  lease_unit: string | null;
}

export interface BreakEvenBar {
  label: string;
  value: number;
  color: string;
  is_target: boolean;
}

export interface BreakEvenAnalysis {
  avg_ticket_price: number;
  units_to_break_even: number;
  monthly_opex_total: number;
  monthly_cogs_per_unit: number;
  contribution_margin: number;
  bars: BreakEvenBar[];
  insight: string;
}

export interface FinancialAnatomySource {
  id: number;
  title: string;
  source_name: string;
  url: string | null;
  snippet: string | null;
  verified: boolean;
}

export interface FinancialAnatomyData {
  session_id: string;
  business_name: string;
  country: string;
  capex: CostLineItem[];
  opex: CostLineItem[];
  cogs: CostLineItem[];
  total_capex: number;
  total_capex_lease_mode: number;
  total_monthly_opex: number;
  total_monthly_opex_lease_mode: number;
  hidden_costs: CostLineItem[];
  break_even: BreakEvenAnalysis;
  sources: FinancialAnatomySource[];
  cached: boolean;
}

export interface FounderScenarioTactic {
  label: string;
  advice: string;
}

export type FounderScenarioType =
  | "supply_chain_shock"
  | "price_war"
  | "viral_spike"
  | "key_player_churn"
  | "policy_shift"
  | "talent_drought"
  | "co_founder_split"
  | "platform_algorithm"
  | "currency_crisis"
  | "recession_hit";

export interface FounderScenarioResult {
  scenario_type: FounderScenarioType;
  scenario_title: string;
  use_case: string;
  severity: "critical" | "warning" | "moderate";
  baseline_runway: number;
  stressed_runway: number;
  runway_delta: number;
  new_monthly_revenue: number;
  new_monthly_burn: number;
  baseline_timeline: { month: number; cash: number }[];
  stressed_timeline: { month: number; cash: number }[];
  action_plan: FounderScenarioTactic[];
}
