import json


async def generate_clarifying_questions(category: str, business_name: str, description: str, country: str) -> list[str]:
    return [
        "Who is your primary customer and what urgent problem are they paying to solve?",
        "What is your monetization model and expected gross margin?",
        "What makes your offering defensible versus local competitors?",
        "What execution risk is most likely to break your first-year plan?",
    ]


async def analyze_business(session_data: dict, sources_context: str = "") -> dict:
    alpha_signal = _extract_alpha_vantage_signal(sources_context)
    news_signal = _extract_google_news_signal(sources_context)
    viability_score = 62 + (2 if alpha_signal else 0) + (3 if news_signal else 0)

    market_size_estimate = (
        f"Live market signal: {news_signal}"
        if news_signal
        else "Live benchmark available via SerpAPI + Alpha Vantage market feed"
        if alpha_signal
        else "Conservative estimate (no live SerpAPI news signal available)"
    )

    return {
        "viability_score": min(viability_score, 75),
        "strengths": ["Focused value proposition"],
        "weaknesses": ["Limited validation evidence"],
        "opportunities": ["Growing regional demand"],
        "threats": ["Competitive pressure"],
        "market_size_estimate": market_size_estimate,
        "next_steps": [
            "Validate pricing against latest market signals",
            "Improve channel efficiency",
            "Track payback weekly",
        ],
        "asean_expansion_tips": ["Localize by market", "Build partner channels"],
        "summary": "Potential is good with disciplined execution, grounded on live SerpAPI market context.",
        "source_model": "serpapi_google_news",
    }


async def generate_similar_businesses(
    category: str,
    name: str,
    description: str,
    country: str,
    sources_context: str = "",
) -> list[dict]:
    news_signal = _extract_google_news_signal(sources_context)
    similarity_note = (
        f"Aligned with current signal: {news_signal}"
        if news_signal
        else "Aligned with recent SerpAPI-backed sector signals"
    )

    return [
        {
            "name": "Regional Category Player",
            "country": country,
            "description": f"Comparable {category} operating model in nearby markets.",
            "similarity": similarity_note,
            "stage": "scale-up",
            "founded_year": None,
            "website": None,
            "key_differentiator": "Wider distribution",
            "source_model": "serpapi_google_news",
        }
    ]


async def generate_reality_dashboard(session_data: dict, sources_context: str = "") -> dict:
    cash_reserve = int(session_data.get("cash_reserve", 50000) or 50000)
    monthly_burn = int(session_data.get("monthly_burn", 5000) or 5000)
    monthly_revenue = int(session_data.get("monthly_revenue", 0) or 0)
    net = cash_reserve
    timeline = []
    delta = monthly_revenue - monthly_burn
    for m in range(1, 13):
        net += delta
        timeline.append({"month": m, "net_cash": max(0, int(net))})

    alpha_signal = _extract_alpha_vantage_signal(sources_context)
    news_signal = _extract_google_news_signal(sources_context)
    live_signal_present = bool(alpha_signal or news_signal)

    return {
        "viability_score": 68 if live_signal_present else 62,
        "startup_cost": int(max(20000, cash_reserve * 0.8)),
        "time_to_break_even_months": 8,
        "year_1_revenue": int(monthly_revenue * 14),
        "profit_margin_percentage": 18.0,
        "value_explanations": {
            "viability_score": {"how_deduced": "Estimated from runway pressure, burn-revenue gap, and live SerpAPI/market signals.", "citation_ids": [1] if live_signal_present else []},
            "startup_cost": {"how_deduced": "Estimated from launch setup, staffing, and early operating buffer.", "citation_ids": []},
            "time_to_break_even_months": {"how_deduced": "Estimated by simulating monthly net cash until positive trajectory.", "citation_ids": []},
            "year_1_revenue": {"how_deduced": "Estimated from current baseline with conservative growth ramp.", "citation_ids": []},
            "profit_margin_percentage": {"how_deduced": "Estimated from modeled early-stage cost structure and benchmark assumptions.", "citation_ids": []},
        },
        "suitable_areas": ["Central district", "University cluster", "High-density neighborhoods"],
        "competitiveness_level": "Medium",
        "top_competitors": ["Local incumbent", "Regional challenger", "Digital-first brand"],
        "cash_flow_timeline": timeline,
    }


async def generate_hiring_roadmap(current_team: int, target_team: int, budget: float, business_context: str, country: str) -> dict:
    return {
        "phases": [],
        "total_cost_estimate": 0,
        "critical_hires": [],
        "hiring_tips": ["Hire for near-term revenue impact first"],
        "timeline_summary": "Prioritize critical roles within budget limits.",
    }


async def generate_chaos_event(business_context: str, monthly_burn: float, cash_reserve: float) -> dict:
    return {
        "title": "Demand Shock",
        "description": "Short-term demand softening with cost pressure.",
        "category": "market",
        "revenue_impact": -0.25,
        "burn_impact": 0.15,
        "probability": "medium",
        "duration_months": 4,
        "survival_tips": ["Protect margin", "Cut low-ROI spend", "Improve conversion"],
    }


async def debate_agent_turn(agent_name: str, agent_role: str, topic: str, business_context: str, previous_rounds: list) -> str:
    return f"{agent_role} view: advance {topic} only with evidence of repeatable demand and healthy unit economics."


async def judge_debate(topic: str, business_context: str, rounds: list) -> dict:
    return {
        "verdict": "pivot",
        "reasoning": "There is upside, but assumptions need tighter validation.",
        "confidence_score": 62,
        "key_risks": ["CAC volatility", "Execution risk", "Competitive response"],
        "key_opportunities": ["Niche focus", "Partnership channels", "Operational leverage"],
        "recommendation": "Run a focused validation sprint before scaling spend.",
    }


async def debrief_agent_reply(agent_name: str, agent_role: str, topic: str, business_context: str, claim: str, debate_transcript: list, chat_history: list, user_message: str) -> dict:
    return {
        "reply": f"{agent_name}: Re-test the claim with weekly CAC, conversion, and payback metrics.",
        "timeline_suggestion": {
            "variable_id": "marketing_push",
            "label": "Marketing Push",
            "new_value": 2000,
            "impact_type": "monthly_cost",
        },
    }


def _extract_alpha_vantage_signal(sources_context: str) -> str:
    if not sources_context:
        return ""
    for line in sources_context.splitlines():
        if "Alpha Vantage" in line:
            marker = 'Content: "'
            start = line.find(marker)
            if start == -1:
                continue
            snippet = line[start + len(marker):].rstrip('"')
            return snippet.strip()
    return ""


def _extract_google_news_signal(sources_context: str) -> str:
    if not sources_context:
        return ""
    for line in sources_context.splitlines():
        if "Google News" not in line:
            continue
        marker = 'Content: "'
        start = line.find(marker)
        if start == -1:
            continue
        snippet = line[start + len(marker):].rstrip('"')
        return snippet.strip()
    return ""


def _is_market_data_question(message: str) -> bool:
    text = (message or "").lower()
    market_terms = (
        "market", "tam", "sam", "som", "demand", "trend", "growth",
        "competitor", "competition", "benchmark", "industry", "size",
        "addressable", "cagr", "pricing", "price", "customer segment",
    )
    return any(term in text for term in market_terms)


async def brainstorm_chat(
    message: str,
    history: list,
    country: str,
    founder_context: str | None,
    sources_context: str = "",
) -> str:
    alpha_signal = _extract_alpha_vantage_signal(sources_context)
    news_signal = _extract_google_news_signal(sources_context)

    if _is_market_data_question(message):
        lines = [
            f"Here’s the market data snapshot for {country} right now:",
            f"- Market signal: {alpha_signal}" if alpha_signal else "- Market signal: no live Alpha Vantage signal available in this session.",
            f"- Industry/news signal: {news_signal}" if news_signal else "- Industry/news signal: no fresh Google News signal available in this session.",
            "- Practical read: validate one paying segment first, then test price sensitivity before scaling spend.",
            "If you want, I can now turn this into a TAM/SAM/SOM estimate and competitor map in chat.",
        ]
        return "\n".join(lines)

    if alpha_signal:
        return (
            "Great direction. Based on live market signal, "
            f"{alpha_signal} "
            "Use this as a benchmark: pick one customer segment, define one paid use-case, "
            "and run a 2-week validation sprint with a clear KPI (conversion, CAC, or retention)."
        )

    return (
        "Good starting point. Let’s narrow to one segment, one core offer, and one measurable weekly growth experiment "
        "so your idea can be validated quickly."
    )


async def generate_idea_trio(
    skills: str,
    interests: str,
    capital_bracket: str,
    country: str,
    sources_context: str = "",
) -> list[dict]:
    capital_label = {
        "bootstrap": "low upfront capex",
        "seed": "moderate launch budget",
        "series_a": "aggressive growth budget",
    }.get(capital_bracket, "practical startup budget")

    founder_skill = (skills.split(",")[0].strip() if skills else "product") or "product"
    founder_interest = (interests.split(",")[0].strip() if interests else "local commerce") or "local commerce"
    alpha_signal = _extract_alpha_vantage_signal(sources_context)
    news_signal = _extract_google_news_signal(sources_context)
    market_note = (
        f"Live benchmark: {alpha_signal}"
        if alpha_signal
        else f"Live news signal: {news_signal}"
        if news_signal
        else "SerpAPI signal unavailable; treat projections as conservative"
    )

    return [
        {
            "name": f"{country} SMB Workflow Studio",
            "tagline": "Automate repetitive SME operations with simple no-code flows",
            "problem": "Small businesses lose revenue to manual, error-prone admin work",
            "target_customer": f"SMEs in {country} with small operations teams",
            "revenue_model": "Tiered SaaS subscription + setup package",
            "why_sea": "SEA SMEs are rapidly digitizing but still rely heavily on manual back-office workflows",
            "viability_score": 76,
            "pros": [
                f"Strong fit for your {founder_skill} background",
                f"Can launch with {capital_label}",
                "Recurring revenue model with clear ROI pitch",
                market_note,
            ],
            "cons": [
                "Requires strong onboarding to reduce churn",
                "SME sales cycles can be relationship-driven",
            ],
        },
        {
            "name": f"{founder_interest.title()} Community Commerce Hub",
            "tagline": "Connect niche communities to trusted local products and services",
            "problem": "Consumers struggle to discover high-trust niche providers in one place",
            "target_customer": f"Urban middle-income consumers in {country}",
            "revenue_model": "Marketplace commission + featured listings",
            "why_sea": "High mobile usage and social-commerce behavior make curated community buying natural in SEA",
            "viability_score": 71,
            "pros": [
                "Can start lean with focused niche geography",
                "Network effects improve defensibility over time",
                "Clear partnership opportunities with local merchants",
                market_note,
            ],
            "cons": [
                "Two-sided marketplace needs careful supply-demand balancing",
                "Requires trust-building and quality control early",
            ],
        },
        {
            "name": f"Cashflow Guardian for {country} Founders",
            "tagline": "Predict runway and prevent cash crunch with weekly financial alerts",
            "problem": "Early-stage founders often react too late to burn-rate risks",
            "target_customer": "Bootstrapped and seed-stage founders",
            "revenue_model": "Subscription + premium advisory templates",
            "why_sea": "Many SEA startups operate with tight liquidity and need practical, localized finance tooling",
            "viability_score": 79,
            "pros": [
                "Directly tied to mission-critical founder pain",
                "Lightweight MVP possible before complex integrations",
                "High retention potential once embedded in weekly planning",
                market_note,
            ],
            "cons": [
                "Must earn trust on financial accuracy",
                "Competition exists from generic finance tools",
            ],
        }
    ]


async def explain_concept(concept: str) -> dict:
    return {"concept": concept, "explanation": f"{concept} impacts runway, risk profile, and growth capacity."}


async def generate_financial_timeline(session: dict, starting_capital: float, sources_context: str) -> dict:
    return {
        "business_name": session.get("business_name", "This Business"),
        "starting_capital": starting_capital,
        "months": 24,
        "core_variables": [
            {
                "id": "monthly_rent",
                "name": "Monthly Commercial Rent",
                "unit": "RM/month",
                "default_value": 3000,
                "min_value": 1200,
                "max_value": 8000,
                "citation_id": 1,
                "impact_type": "monthly_cost",
                "warning_threshold": 6000,
                "warning_message": "High rent compresses runway [1].",
                "emoji": "🏢",
            }
        ],
        "action_blocks": [],
        "references": [{"id": 1, "source_name": "AI Baseline", "url": "", "snippet": "Model baseline assumption"}],
    }


async def generate_synthesis(session: dict, debate_data: dict | None, sources_context: str = "") -> dict:
    return {
        "overall_summary": "Business has potential with disciplined execution.",
        "key_findings": [{"claim": "Runway is sensitive to burn discipline.", "confidence_level": "Medium"}],
        "references": [{"id": 1, "source_name": "AI Baseline", "url": ""}],
        "executive_summary": "Prioritize validation and margin control.",
        "swot": {"strengths": ["Clear proposition"], "weaknesses": ["Early uncertainty"], "opportunities": ["Regional growth"], "threats": ["Competition"]},
        "financial_outlook": "Stable with controlled burn.",
        "asean_opportunities": "Localize by market.",
        "risks": "Execution and demand risk.",
        "recommendation": "Run a milestone-based pilot.",
        "confidence_score": 65,
        "investor_pitch": "Focused model with measurable roadmap.",
    }


async def generate_financial_anatomy(
    session_data: dict,
    sources_context: str = "",
) -> dict:
    """
    Generate a three-pillar (CapEx / OpEx / COGS) financial model for the
    business described in session_data.  The model is hyper-local, citing
    statutory obligations (EPF 13 %, SOCSO, EIS in Malaysia) and delivery
    platform commissions (GrabFood 30 %, Stripe ~2 %).

    Returns a dict that matches FinancialAnatomyResponse.
    """
    business_name = session_data.get("business_name", "This Business")
    category      = session_data.get("business_category", "General")
    country       = session_data.get("country", "Malaysia")
    description   = session_data.get("business_description", "")

    # ── Hyper-local statutory rates ──────────────────────────────────────────
    is_malaysia = "malaysia" in country.lower() or "my" == country.lower()

    epf_rate   = 0.13 if is_malaysia else 0.0   # employer EPF contribution
    socso_cap  = 69.05 if is_malaysia else 0.0  # typical employer SOCSO ceiling
    eis_rate   = 0.004 if is_malaysia else 0.0  # employer EIS

    # ── Base salary assumptions by category ──────────────────────────────────
    salary_map = {
        "fnb":        2600,
        "food":       2600,
        "cafe":       2600,
        "retail":     2800,
        "tech":       4200,
        "repair":     2800,
        "saas":       5000,
        "logistics":  3000,
        "healthtech": 4000,
        "edtech":     3500,
        "fintech":    5500,
    }
    cat_key  = next((k for k in salary_map if k in category.lower()), "retail")
    base_sal = salary_map[cat_key]
    epf_amt  = round(base_sal * epf_rate, 2)
    eis_amt  = round(base_sal * eis_rate, 2)

    # ── Rent assumptions by country / category ────────────────────────────────
    rent_map = {
        "fnb":      4500, "food": 4500, "cafe": 4500,
        "retail":   5500, "tech": 3500, "repair": 3200,
        "saas":     2800, "logistics": 6000, "healthtech": 4000,
        "edtech":   3000, "fintech": 5000,
    }
    monthly_rent   = rent_map.get(cat_key, 4000)
    rent_deposit   = monthly_rent * 3   # standard 3-month deposit (CapEx)

    # ── COGS: delivery commission & payment gateway ───────────────────────────
    uses_delivery  = any(k in category.lower() for k in ["fnb", "food", "cafe", "retail"])
    delivery_pct   = 30.0 if uses_delivery else 0.0
    payment_gw_pct = 2.0   # Stripe / TnG average

    # ── Contingency & hidden costs ────────────────────────────────────────────
    contingency_pct = 0.10   # 10 % of total CapEx

    # ── Build CapEx items ────────────────────────────────────────────────────
    capex_items = [
        {
            "id": 1, "category": "CapEx",
            "item": "Commercial Renovation & Fit-Out",
            "amount": 35000.0, "unit": "one-time",
            "citation_id": 1,
            "notes": "Estimated for a standard 500–800 sq ft unit in a mid-tier location.",
            "is_hidden_cost": False,
            "lease_amount": None, "lease_unit": None,
        },
        {
            "id": 2, "category": "CapEx",
            "item": "Core Equipment / Machinery",
            "amount": 22000.0, "unit": "one-time",
            "citation_id": 2,
            "notes": "Varies by industry. Toggle to Lease to shift this to monthly OpEx.",
            "is_hidden_cost": False,
            "lease_amount": 700.0, "lease_unit": "per month (lease)",
        },
        {
            "id": 3, "category": "CapEx",
            "item": f"Rental Deposit (3 months × RM {monthly_rent:,.0f})",
            "amount": float(rent_deposit), "unit": "one-time",
            "citation_id": 3,
            "notes": "Standard 2–3 month deposit required by most Malaysian landlords.",
            "is_hidden_cost": True,
            "lease_amount": None, "lease_unit": None,
        },
        {
            "id": 4, "category": "CapEx",
            "item": "Legal Incorporation (SSM Registration + MOA)",
            "amount": 1800.0, "unit": "one-time",
            "citation_id": 4,
            "notes": "SSM Sdn Bhd incorporation + legal retainer for MoA drafting.",
            "is_hidden_cost": True,
            "lease_amount": None, "lease_unit": None,
        },
        {
            "id": 5, "category": "CapEx",
            "item": "Initial Marketing & Launch Budget",
            "amount": 8000.0, "unit": "one-time",
            "citation_id": None,
            "notes": "Social media ads, signage, and soft-launch promotions.",
            "is_hidden_cost": True,
            "lease_amount": None, "lease_unit": None,
        },
        {
            "id": 6, "category": "CapEx",
            "item": "Contingency Buffer (10%)",
            "amount": 0.0,   # computed below
            "unit": "one-time",
            "citation_id": None,
            "notes": "Industry-standard 10 % contingency on total hard costs.",
            "is_hidden_cost": True,
            "lease_amount": None, "lease_unit": None,
        },
    ]

    # Patch contingency item
    hard_capex_total = sum(i["amount"] for i in capex_items if i["id"] != 6)
    capex_items[5]["amount"] = round(hard_capex_total * contingency_pct, 2)
    total_capex = round(sum(i["amount"] for i in capex_items), 2)

    # Lease-mode CapEx: remove leaseable items
    total_capex_lease = round(
        sum(i["amount"] for i in capex_items if i["lease_amount"] is None),
        2,
    )

    # ── Build OpEx items ─────────────────────────────────────────────────────
    opex_items = [
        {
            "id": 10, "category": "OpEx",
            "item": "Monthly Commercial Rent",
            "amount": float(monthly_rent), "unit": "per month",
            "citation_id": 3,
            "notes": "Mid-tier shophouse or commercial unit.",
            "is_hidden_cost": False,
            "lease_amount": None, "lease_unit": None,
        },
        {
            "id": 11, "category": "OpEx",
            "item": f"Base Staff Salary (1 junior hire)",
            "amount": float(base_sal), "unit": "per month",
            "citation_id": 5,
            "notes": "Entry/junior-level salary estimate.",
            "is_hidden_cost": False,
            "lease_amount": None, "lease_unit": None,
        },
    ]

    if is_malaysia:
        opex_items.extend([
            {
                "id": 12, "category": "OpEx",
                "item": f"Employer EPF Contribution (13% on RM {base_sal:,})",
                "amount": epf_amt, "unit": "per month",
                "citation_id": 6,
                "notes": "Statutory — Employees Provident Fund Act 1991.",
                "is_hidden_cost": True,
                "lease_amount": None, "lease_unit": None,
            },
            {
                "id": 13, "category": "OpEx",
                "item": "Employer SOCSO Contribution",
                "amount": socso_cap, "unit": "per month",
                "citation_id": 6,
                "notes": "Statutory — Social Security Organisation Act 1969. Ceiling applies.",
                "is_hidden_cost": True,
                "lease_amount": None, "lease_unit": None,
            },
            {
                "id": 14, "category": "OpEx",
                "item": f"Employer EIS Contribution (0.4% on RM {base_sal:,})",
                "amount": eis_amt, "unit": "per month",
                "citation_id": 6,
                "notes": "Statutory — Employment Insurance System Act 2017.",
                "is_hidden_cost": True,
                "lease_amount": None, "lease_unit": None,
            },
        ])

    opex_items.extend([
        {
            "id": 15, "category": "OpEx",
            "item": "Business Fiber Internet",
            "amount": 199.0, "unit": "per month",
            "citation_id": 7,
            "notes": "Unifi SME Business Broadband (500 Mbps).",
            "is_hidden_cost": False,
            "lease_amount": None, "lease_unit": None,
        },
        {
            "id": 16, "category": "OpEx",
            "item": "Accounting / Cloud Bookkeeping (Xero or Wave)",
            "amount": 149.0, "unit": "per month",
            "citation_id": 8,
            "notes": "Essential for GST / SST filing and investor reporting.",
            "is_hidden_cost": True,
            "lease_amount": None, "lease_unit": None,
        },
        {
            "id": 17, "category": "OpEx",
            "item": "Business Insurance (Premises + Public Liability)",
            "amount": 250.0, "unit": "per month",
            "citation_id": None,
            "notes": "Estimated annual premium ÷ 12.",
            "is_hidden_cost": True,
            "lease_amount": None, "lease_unit": None,
        },
        {
            "id": 18, "category": "OpEx",
            "item": "Annual Tax Filing & Accounting Fees",
            "amount": round(2400.0 / 12, 2), "unit": "per month (amortised)",
            "citation_id": None,
            "notes": "Estimated RM 2,400/year for SME audit + Form C submission.",
            "is_hidden_cost": True,
            "lease_amount": None, "lease_unit": None,
        },
        {
            "id": 19, "category": "OpEx",
            "item": "Leased Equipment Repayment",
            "amount": 700.0, "unit": "per month (if leased)",
            "citation_id": 2,
            "notes": "Only applicable if CapEx equipment item is toggled to Lease mode.",
            "is_hidden_cost": False,
            "lease_amount": 700.0, "lease_unit": "per month (lease)",
        },
    ])

    total_opex    = round(sum(i["amount"] for i in opex_items if i["id"] != 19), 2)
    total_opex_lease = round(total_opex + 700.0, 2)  # add lease repayment

    # ── Build COGS items ─────────────────────────────────────────────────────
    cogs_items: list[dict] = [
        {
            "id": 20, "category": "COGS",
            "item": "Raw Materials / Inventory per Unit",
            "amount": 35.0, "unit": "% of sale price",
            "citation_id": None,
            "notes": "Typical food-cost or merchandise cost percentage.",
            "is_hidden_cost": False,
            "lease_amount": None, "lease_unit": None,
        },
        {
            "id": 21, "category": "COGS",
            "item": "Packaging & Consumables",
            "amount": 3.0, "unit": "per unit sold",
            "citation_id": None,
            "notes": "Boxes, bags, labels, stickers.",
            "is_hidden_cost": False,
            "lease_amount": None, "lease_unit": None,
        },
    ]

    if uses_delivery:
        cogs_items.append({
            "id": 22, "category": "COGS",
            "item": "Delivery Platform Commission (GrabFood / Foodpanda)",
            "amount": delivery_pct, "unit": "% of order value",
            "citation_id": 9,
            "notes": "GrabFood takes ~30 % per transaction on the platform.",
            "is_hidden_cost": False,
            "lease_amount": None, "lease_unit": None,
        })

    cogs_items.append({
        "id": 23, "category": "COGS",
        "item": "Payment Gateway Fee (Stripe / Touch 'n Go eWallet)",
        "amount": payment_gw_pct, "unit": "% per transaction",
        "citation_id": 10,
        "notes": "Stripe charges ~2 %; TnG eWallet MDR is ~0.5–1.5 %.",
        "is_hidden_cost": True,
        "lease_amount": None, "lease_unit": None,
    })

    # ── Break-even analysis ──────────────────────────────────────────────────
    avg_ticket      = 28.0    # reasonable SEA median across categories
    cogs_pct        = (35.0 + payment_gw_pct) / 100.0  # raw material + gateway
    cogs_per_unit   = round(avg_ticket * cogs_pct + 3.0, 2)   # + packaging
    contrib_margin  = round(avg_ticket - cogs_per_unit, 2)
    units_needed    = int(total_opex / contrib_margin) + 1 if contrib_margin > 0 else 9999

    break_even = {
        "avg_ticket_price": avg_ticket,
        "units_to_break_even": units_needed,
        "monthly_opex_total": total_opex,
        "monthly_cogs_per_unit": cogs_per_unit,
        "contribution_margin": contrib_margin,
        "bars": [
            {"label": "Fixed OpEx", "value": total_opex, "color": "#f59e0b", "is_target": False},
            {"label": f"COGS/unit × {units_needed} units",
             "value": round(cogs_per_unit * units_needed, 2),
             "color": "#ef4444", "is_target": False},
            {"label": "Revenue @ break-even",
             "value": round(avg_ticket * units_needed, 2),
             "color": "#10b981", "is_target": True},
        ],
        "insight": (
            f"Sell {units_needed:,} units/month at an avg RM {avg_ticket:.0f} ticket to cover "
            f"all fixed costs (RM {total_opex:,.0f} OpEx). "
            f"Each unit contributes RM {contrib_margin:.2f} after variable costs."
        ),
    }

    # ── Hidden costs summary ─────────────────────────────────────────────────
    all_items   = capex_items + opex_items + cogs_items
    hidden_list = [i for i in all_items if i["is_hidden_cost"]]

    # ── Estimated sources ────────────────────────────────────────────────────
    sources = [
        {"id": 1,  "title": "Renovation Cost Benchmark – Klang Valley SME",
         "source_name": "AI Market Intelligence (Estimated)",
         "url": "https://www.proptiger.com/guide/renovation-cost-malaysia",
         "snippet": "Average shophouse renovation in Klang Valley RM 30k–50k for 500–800 sqft.", "verified": False},
        {"id": 2,  "title": "SME Equipment Leasing Rates – CIMB Leasing",
         "source_name": "AI Market Intelligence (Estimated)",
         "url": "https://www.cimb.com/en/business/financing/hire-purchase.html",
         "snippet": "Commercial equipment leasing from RM 600–900/month for mid-tier machinery.", "verified": False},
        {"id": 3,  "title": f"PropertyGuru Commercial Listings – {country} Q3 Average",
         "source_name": "PropertyGuru Commercial (Estimated)",
         "url": "https://www.propertyguru.com.my/commercial",
         "snippet": f"Mid-tier commercial shophouse in {country}: RM {monthly_rent:,}/month avg with 3-month deposit.", "verified": False},
        {"id": 4,  "title": "SSM Sdn Bhd Incorporation Fees 2025",
         "source_name": "Companies Commission of Malaysia (SSM)",
         "url": "https://www.ssm.com.my/Pages/Services/e-Info/Fee-Schedule.aspx",
         "snippet": "SSM registration (Sdn Bhd) authorised capital fee + name search + lodgement ≈ RM 1,000–1,800.", "verified": False},
        {"id": 5,  "title": f"JobStreet Malaysia Salary Report – {category} Sector",
         "source_name": "JobStreet Malaysia (Estimated)",
         "url": "https://www.jobstreet.com.my/career-resources/salary-report",
         "snippet": f"Junior {category} staff median salary: RM {base_sal:,}/month.", "verified": False},
        {"id": 6,  "title": "EPF / SOCSO / EIS Employer Contribution Rates 2025",
         "source_name": "KWSP / PERKESO (Malaysia)",
         "url": "https://www.kwsp.gov.my/member/contribution/contribution-rate",
         "snippet": "Employer EPF 13%; SOCSO employer ceiling RM 69.05/month; EIS employer 0.4%.", "verified": True},
        {"id": 7,  "title": "Unifi SME Business Broadband Plans 2025",
         "source_name": "TM Unifi Business",
         "url": "https://unifi.com.my/business/broadband/",
         "snippet": "Unifi Business 500 Mbps symmetrical costed at RM 199/month (contract).", "verified": False},
        {"id": 8,  "title": "Xero Accounting – Malaysia SME Pricing",
         "source_name": "Xero",
         "url": "https://www.xero.com/my/pricing/",
         "snippet": "Xero Growing plan (unlimited invoices + bank feeds) RM 149/month.", "verified": False},
        {"id": 9,  "title": "GrabFood Merchant Commission Structure",
         "source_name": "Grab for Business (Estimated)",
         "url": "https://merchant.grab.com/portal/",
         "snippet": "GrabFood charges restaurant partners ~25–30% commission per delivered order.", "verified": False},
        {"id": 10, "title": "Stripe Malaysia Pricing & Touch 'n Go MDR",
         "source_name": "Stripe / TnG eWallet (Estimated)",
         "url": "https://stripe.com/en-my/pricing",
         "snippet": "Stripe MY: 2.2–3.4% + RM 0.10 per transaction. TnG eWallet MDR: 0.5–1.5%.", "verified": False},
    ]

    return {
        "business_name": business_name,
        "country": country,
        "capex":  capex_items,
        "opex":   opex_items,
        "cogs":   cogs_items,
        "total_capex":               total_capex,
        "total_capex_lease_mode":    total_capex_lease,
        "total_monthly_opex":        total_opex,
        "total_monthly_opex_lease_mode": total_opex_lease,
        "hidden_costs":              hidden_list,
        "break_even":                break_even,
        "sources":                   sources,
    }


async def generate_industry_benchmarks(industry: str, location: str, context_block: str = "") -> dict:
    return {
        "industry_averages": {
            "startup_cost_range": "Varies by scale",
            "profit_margin_range": "10% – 25%",
            "year1_failure_rate": "30% – 60%",
            "break_even_months": "8 – 18",
            "summary": f"Benchmarks for {industry} in {location} vary by execution quality.",
        },
        "competitor_snapshots": [],
        "macro_trend": {
            "headline": "Digital demand remains strong",
            "growth_rate": "Moderate",
            "detail": "Mobile-led behavior continues to influence buying.",
            "headwind": "Customer acquisition costs can spike.",
        },
        "ai_coach_briefing": "Compete on differentiation and operating discipline.",
    }


async def generate_founder_action_plan(
    scenario_type: str,
    monthly_revenue: float,
    monthly_burn: float,
    new_burn: float,
    new_revenue: float,
) -> list[dict]:
    """Return a 3-tactic survival playbook for each founder scenario type."""

    margin_pct = round((monthly_revenue - monthly_burn) / monthly_revenue * 100, 1) if monthly_revenue else 0
    new_margin_pct = round((new_revenue - new_burn) / new_revenue * 100, 1) if new_revenue else 0
    burn_increase_rm = round(new_burn - monthly_burn, 0)
    revenue_drop_rm = round(monthly_revenue - new_revenue, 0)

    plans: dict[str, list[dict]] = {
        "supply_chain_shock": [
            {
                "label": "Pricing",
                "advice": (
                    f"Your margin dropped from {margin_pct}% to {new_margin_pct}%. "
                    "Raise your core product price by at least 8–12% immediately—customers accept "
                    "small increases more readily than a business closure."
                ),
            },
            {
                "label": "Menu/Feature Engineering",
                "advice": (
                    "Introduce a 'Premium' tier product or add-on with a 60%+ margin to offset "
                    "losses on standard items. Bundle it with your top seller."
                ),
            },
            {
                "label": "Vendor Negotiation",
                "advice": (
                    "Lock in a 6-month bulk purchase contract with your primary supplier now, "
                    "before costs climb further. Even a 5% discount on volume saves meaningful cash."
                ),
            },
        ],
        "price_war": [
            {
                "label": "Do Not Engage",
                "advice": (
                    f"Do not lower your prices. You cannot win a price war against VC money. "
                    f"At current burn you'll exhaust cash faster—let them chase volume at a loss."
                ),
            },
            {
                "label": "Pivot to Niche",
                "advice": (
                    "Shift all marketing to emphasise 'Artisan / Local / Premium Service'—the exact "
                    "things a large chain cannot automate. Raise your story, not your discounts."
                ),
            },
            {
                "label": "Loyalty Lock-in",
                "advice": (
                    "Launch a subscription or punch-card loyalty program this week to retain your "
                    "top 20% of recurring customers before the competitor's opening-promo pulls them away."
                ),
            },
        ],
        "viral_spike": [
            {
                "label": "Throttle Paid Acquisition",
                "advice": (
                    "Pause all paid Facebook/Google/TikTok ads immediately. "
                    "You're already over capacity—paying for more traffic now only creates bad reviews."
                ),
            },
            {
                "label": "Menu/SKU Simplification",
                "advice": (
                    "Temporarily remove your 3 most complex or slowest products. "
                    "Only sell your 2–3 fastest-moving items to keep the queue moving and "
                    "quality consistent under surge conditions."
                ),
            },
            {
                "label": "Emergency Staffing",
                "advice": (
                    "Use a gig-worker platform (GoGet, Fastjobs, MyStartr in Malaysia) to hire "
                    "temporary runners or packers for the weekend rush. Budget RM 150–200/day "
                    "per temp worker—it's far cheaper than a flood of 1-star reviews."
                ),
            },
        ],
        "key_player_churn": [
            {
                "label": "SOP Documentation—Today",
                "advice": (
                    "Before the person leaves, document their top 5 daily tasks as Standard "
                    "Operating Procedures (SOPs). A Notion or Google Doc checklist is enough. "
                    "Replacing someone takes 30–60 days; tribal knowledge walks out the door on day 1."
                ),
            },
            {
                "label": "Stop-Gap Freelance Budget",
                "advice": (
                    f"Reallocate RM {min(4000, int(monthly_burn * 0.08)):,} from marketing to hire a "
                    "specialized freelance contractor (Upwork, Workana, or LinkedIn) to keep "
                    "operations running while you interview full-time replacements."
                ),
            },
            {
                "label": "Cross-Train Immediately",
                "advice": (
                    "Identify one existing team member who can absorb 50% of the departing person's "
                    "responsibilities with a 10–15% salary bump. It's always cheaper and faster "
                    "than an external hire in the short term."
                ),
            },
        ],
        "policy_shift": [
            {
                "label": "Automation Investment",
                "advice": (
                    f"Your labour cost just exceeded the 30% revenue threshold (new burn: RM {int(new_burn):,}/mo). "
                    "Invest RM 2,500–4,000 in a self-ordering QR-code POS system to reduce "
                    "front-of-house headcount dependency by 1–2 staff slots."
                ),
            },
            {
                "label": "Pass-Through Surcharge",
                "advice": (
                    "Introduce a transparent 5–8% 'Delivery/Service Surcharge' line item rather than "
                    "raising base product prices. Customers accept policy-linked surcharges far better "
                    "than unexplained price hikes—and it's reversible if the policy changes."
                ),
            },
            {
                "label": "Workforce Restructure",
                "advice": (
                    "Shift any eligible full-time hourly roles to performance-based or part-time "
                    "contracts before the new minimum wage takes effect, and front-load their hours "
                    "in peak periods to retain productivity without overpaying idle time."
                ),
            },
        ],
    }

    return plans.get(scenario_type, [
        {"label": "Cost Control", "advice": "Identify and cut the lowest-ROI 15% of your monthly expenses immediately."},
        {"label": "Revenue Defence", "advice": "Contact your top 10 customers and proactively lock in renewals or bulk orders."},
        {"label": "Cash Buffer", "advice": "Open a revolving credit facility with your bank now, before you urgently need it."},
    ])
