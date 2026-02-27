from app.services.gemini_service import generate_chaos_event, generate_founder_action_plan
from app.schemas.scenario import WhatIfRequest, FounderScenarioRequest


def calculate_runway(
    monthly_revenue: float,
    monthly_burn: float,
    cash_reserve: float,
    team_size: int = 1,
) -> dict:
    net_burn = monthly_burn - monthly_revenue
    timeline = []
    cash = cash_reserve
    alerts = []
    month = 0

    if net_burn <= 0:
        return {
            "runway_months": 999,
            "timeline": [{"month": 0, "cash": cash, "note": "Profitable - no runway risk"}],
            "alerts": ["Business is profitable!"],
            "recommendation": "Focus on growth and maintaining profitability.",
        }

    while cash > 0 and month < 60:
        timeline.append({
            "month": month,
            "cash": round(cash, 2),
            "monthly_revenue": round(monthly_revenue, 2),
            "monthly_burn": round(monthly_burn, 2),
            "net_burn": round(net_burn, 2),
        })
        cash -= net_burn
        month += 1

    runway = month
    if runway <= 3:
        alerts.append("CRITICAL: Less than 3 months runway. Raise immediately.")
    elif runway <= 6:
        alerts.append("WARNING: Less than 6 months runway. Start fundraising now.")
    elif runway <= 12:
        alerts.append("CAUTION: Less than 12 months runway. Plan next round.")

    if monthly_revenue == 0:
        alerts.append("No revenue yet — burn rate is pure cash depletion.")

    rec_map = {
        (0, 3): "Emergency mode: cut all non-essential costs, seek bridge funding immediately.",
        (3, 6): "Urgent: begin fundraising process, explore revenue acceleration.",
        (6, 12): "Healthy but act now: initiate pre-seed/seed conversations.",
        (12, 24): "Good runway: focus on growth milestones to command better valuation.",
        (24, 999): "Excellent runway: execute aggressively on product and market expansion.",
    }
    recommendation = "Maintain current trajectory."
    for (lo, hi), rec in rec_map.items():
        if lo <= runway < hi:
            recommendation = rec
            break

    return {
        "runway_months": runway,
        "timeline": timeline[:24],
        "alerts": alerts,
        "recommendation": recommendation,
    }


async def simulate_chaos(
    monthly_revenue: float,
    monthly_burn: float,
    cash_reserve: float,
    business_context: str | None = None,
) -> dict:
    event = await generate_chaos_event(business_context or "", monthly_burn, cash_reserve)
    new_revenue = monthly_revenue * (1 + event.get("revenue_impact", -0.3))
    new_burn = monthly_burn * (1 + event.get("burn_impact", 0.15))
    baseline = calculate_runway(monthly_revenue, monthly_burn, cash_reserve)
    post_chaos = calculate_runway(new_revenue, new_burn, cash_reserve)
    return {
        "event": event,
        "baseline_runway": baseline["runway_months"],
        "post_chaos_runway": post_chaos["runway_months"],
        "runway_impact": post_chaos["runway_months"] - baseline["runway_months"],
        "new_monthly_revenue": round(new_revenue, 2),
        "new_monthly_burn": round(new_burn, 2),
        "post_chaos_timeline": post_chaos["timeline"][:12],
    }


async def run_whatif(req: WhatIfRequest) -> dict:
    scenarios = {}

    base = calculate_runway(req.monthly_revenue, req.monthly_burn, req.cash_reserve)
    scenarios["baseline"] = {
        "label": "Baseline",
        "runway_months": base["runway_months"],
        "monthly_revenue": req.monthly_revenue,
        "monthly_burn": req.monthly_burn,
    }

    rev = req.monthly_revenue * (1 + req.revenue_shock)
    burn = req.monthly_burn * (1 + req.cost_shock + req.inflation_shock)
    if req.competitor_entry:
        rev *= 0.85
    if req.regulatory_change:
        burn *= 1.1

    stressed = calculate_runway(rev, burn, req.cash_reserve)
    scenarios["stressed"] = {
        "label": "What-If Scenario",
        "runway_months": stressed["runway_months"],
        "monthly_revenue": round(rev, 2),
        "monthly_burn": round(burn, 2),
        "revenue_shock_pct": req.revenue_shock * 100,
        "cost_shock_pct": (req.cost_shock + req.inflation_shock) * 100,
    }

    scenarios["delta_months"] = stressed["runway_months"] - base["runway_months"]
    scenarios["stressed_timeline"] = stressed["timeline"][:24]
    scenarios["alerts"] = stressed["alerts"]

    return scenarios


# ---------------------------------------------------------------------------
# Founder Focus: 5 "What Keeps You Awake" Scenarios
# ---------------------------------------------------------------------------

_SCENARIO_DEFINITIONS: dict[str, dict] = {
    "supply_chain_shock": {
        "title": "The Supply Chain Shock",
        "use_case": (
            "Your core input cost (coffee beans, cloud hosting, packaging) jumps 20%. "
            "Tests whether your pricing model can absorb it—or collapses."
        ),
        "revenue_multiplier": 1.0,
        "burn_multiplier": 1.10,  # 20% COGS hike on ~50% COGS ratio
    },
    "price_war": {
        "title": "The Goliath Enters",
        "use_case": (
            "A well-funded competitor undercuts your prices by 30%. "
            "Tests your customer moat and whether you can survive without a ruinous price war."
        ),
        "revenue_multiplier": 0.70,
        "burn_multiplier": 1.0,
    },
    "viral_spike": {
        "title": "The TikTok Viral Moment",
        "use_case": (
            "An influencer reviews your business and demand spikes 4x overnight. "
            "Tests operational capacity—too much demand kills businesses through bad reviews and burnout."
        ),
        "revenue_multiplier": 4.0,
        "burn_multiplier": 3.5,
    },
    "key_player_churn": {
        "title": "The Key Player Churn",
        "use_case": (
            "Your lead developer, head chef, or top salesperson suddenly quits. "
            "Tests key-person risk. If one departure breaks your business, you don't own a business."
        ),
        "revenue_multiplier": 0.75,
        "burn_multiplier": 1.15,
    },
    "policy_shift": {
        "title": "The Policy Shift",
        "use_case": (
            "Government announces a minimum wage hike or fuel subsidy cut, raising your "
            "labour and delivery costs by 20%. Tests regulatory resilience."
        ),
        "revenue_multiplier": 1.0,
        "burn_multiplier": 1.20,
    },
    "talent_drought": {
        "title": "The Talent Drought",
        "use_case": (
            "You can't hire to fill critical roles—your existing team is stretched thin and "
            "burning out. Output slows, quality drops, and recruiting costs balloon. "
            "Tests whether your operations can survive a people crunch."
        ),
        "revenue_multiplier": 0.80,
        "burn_multiplier": 1.18,
    },
    "co_founder_split": {
        "title": "The Co-Founder Split",
        "use_case": (
            "Your co-founder exits in a dispute and takes 30% equity with them. Legal costs "
            "mount and the team loses morale. Tests whether your business can survive a "
            "leadership implosion at the worst possible time."
        ),
        "revenue_multiplier": 0.70,
        "burn_multiplier": 1.25,
    },
    "platform_algorithm": {
        "title": "The Algorithm Kills Your Reach",
        "use_case": (
            "Instagram, TikTok, or Google changes its algorithm and your organic reach "
            "collapses by 80% overnight. CAC triples as you're forced onto paid ads. "
            "Tests whether you own your audience or just rent it."
        ),
        "revenue_multiplier": 0.60,
        "burn_multiplier": 1.30,
    },
    "currency_crisis": {
        "title": "The Currency Crisis",
        "use_case": (
            "The local currency devalues 25% against the USD. Imported inputs get more "
            "expensive, SaaS subscriptions cost more, and foreign customers look elsewhere. "
            "Tests how exposed your cost structure is to FX volatility."
        ),
        "revenue_multiplier": 0.85,
        "burn_multiplier": 1.25,
    },
    "recession_hit": {
        "title": "The Recession Hits",
        "use_case": (
            "Consumer confidence craters and discretionary spending drops 25%. "
            "B2B customers freeze budgets, contract renewals stall, and churn accelerates. "
            "Tests if your product is a vitamin or a painkiller."
        ),
        "revenue_multiplier": 0.75,
        "burn_multiplier": 1.0,
    },
}


async def run_founder_scenario(req: FounderScenarioRequest) -> dict:
    defn = _SCENARIO_DEFINITIONS.get(req.scenario_type)
    if defn is None:
        raise ValueError(f"Unknown scenario_type: {req.scenario_type}")

    new_revenue = req.monthly_revenue * defn["revenue_multiplier"]
    new_burn = req.monthly_burn * defn["burn_multiplier"]

    baseline = calculate_runway(req.monthly_revenue, req.monthly_burn, req.cash_reserve)
    stressed = calculate_runway(new_revenue, new_burn, req.cash_reserve)

    runway_delta = stressed["runway_months"] - baseline["runway_months"]

    if stressed["runway_months"] <= 3:
        severity = "critical"
    elif stressed["runway_months"] <= 6:
        severity = "warning"
    else:
        severity = "moderate"

    action_plan = await generate_founder_action_plan(
        scenario_type=req.scenario_type,
        monthly_revenue=req.monthly_revenue,
        monthly_burn=req.monthly_burn,
        new_burn=new_burn,
        new_revenue=new_revenue,
    )

    return {
        "scenario_type": req.scenario_type,
        "scenario_title": defn["title"],
        "use_case": defn["use_case"],
        "severity": severity,
        "baseline_runway": baseline["runway_months"],
        "stressed_runway": stressed["runway_months"],
        "runway_delta": round(runway_delta, 1),
        "new_monthly_revenue": round(new_revenue, 2),
        "new_monthly_burn": round(new_burn, 2),
        "baseline_timeline": baseline["timeline"][:24],
        "stressed_timeline": stressed["timeline"][:24],
        "action_plan": action_plan,
    }
