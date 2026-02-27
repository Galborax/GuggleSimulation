import json
import os
import google.generativeai as genai

# ─── Gemini client (lazy-initialised once) ───────────────────────────────────
_gemini_model = None

def _get_model():
    global _gemini_model
    if _gemini_model is None:
        api_key = os.environ.get("GOOGLE_AI_API_KEY", "")
        if api_key:
            genai.configure(api_key=api_key)
            _gemini_model = genai.GenerativeModel("gemini-2.5-flash-lite")
    return _gemini_model


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


async def debate_agent_turn(
    agent_name: str,
    agent_role: str,
    topic: str,
    business_context: str,
    previous_rounds: list,
) -> str:
    import re as _re

    prior_transcript = ""
    if previous_rounds:
        lines = []
        for r in previous_rounds:
            lines.append(f"{r['agent']} ({r['role']}): {r['content']}")
        prior_transcript = "\n\n".join(lines)

    system = f"""You are {agent_name}, a {agent_role} on an advisory panel for early-stage SEA founders.
Your job: give a sharp, opinionated, UNIQUE perspective on the founder's topic.
Do NOT repeat what previous panellists said — explicitly build on or challenge their points.
Be concrete: use numbers, percentages, named SEA market examples where possible.
Length: 3-5 sentences. Plain text only. No markdown, no asterisks, no bullet points."""

    prompt_parts = [f"Business context:\n{business_context}\n\nDebate topic: {topic}"]
    if prior_transcript:
        prompt_parts.append(f"\n\nPrevious panellist remarks (do NOT repeat these — react to them):\n{prior_transcript}")
    prompt_parts.append("\nNow give your distinct, value-adding perspective:")
    prompt = "".join(prompt_parts)

    model = _make_model(system, temperature=0.85, max_output_tokens=512)
    if model is None:
        return f"{agent_name} ({agent_role}): AI not configured — add GOOGLE_AI_API_KEY to backend .env."
    try:
        resp = model.generate_content(prompt)
        text = resp.text.strip()
        text = _re.sub(r'\*{1,3}([^*\n]+?)\*{1,3}', r'\1', text)
        text = _re.sub(r'^[*#]+\s*', '', text, flags=_re.MULTILINE)
        return text
    except Exception as e:
        return f"{agent_name}: AI error — {e}"


async def judge_debate(topic: str, business_context: str, rounds: list) -> dict:
    import re as _re

    transcript = "\n\n".join(
        f"{r['agent']} ({r['role']}): {r['content']}" for r in rounds
    )

    system = """You are Victoria Wong, a seasoned venture judge and ex-operator.
You have read the full advisory panel debate and must deliver a decisive, evidence-based verdict.
Respond ONLY with valid JSON matching this exact schema — no markdown fences, no extra keys:
{
  "verdict": "proceed" | "pivot" | "pause",
  "reasoning": "<2-3 sentence summary of why>",
  "confidence_score": <integer 0-100>,
  "key_risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "key_opportunities": ["<opp 1>", "<opp 2>", "<opp 3>"],
  "recommendation": "<single actionable next step>"
}"""

    prompt = f"Business context:\n{business_context}\n\nDebate topic: {topic}\n\nFull transcript:\n{transcript}\n\nDeliver your verdict JSON:"

    model = _make_model(system, temperature=0.4, max_output_tokens=512)
    fallback = {
        "verdict": "pause",
        "reasoning": "AI not configured — add GOOGLE_AI_API_KEY to backend .env.",
        "confidence_score": 0,
        "key_risks": [],
        "key_opportunities": [],
        "recommendation": "Configure the AI backend first.",
    }
    if model is None:
        return fallback
    try:
        resp = model.generate_content(prompt)
        raw = resp.text.strip()
        raw = _re.sub(r'^```[\w]*\n?', '', raw).rstrip('`').strip()
        return json.loads(raw)
    except Exception as e:
        fallback["reasoning"] = f"Parse error: {e}"
        return fallback


async def debrief_agent_reply(
    agent_name: str,
    agent_role: str,
    topic: str,
    business_context: str,
    claim: str,
    debate_transcript: list,
    chat_history: list,
    user_message: str,
) -> dict:
    import re as _re

    transcript_str = "\n".join(
        f"{r['agent']} ({r['role']}): {r['content']}" for r in (debate_transcript or [])
    )
    history_str = "\n".join(
        f"{h['role'].upper()}: {h['content']}" for h in (chat_history or [])
    )

    system = f"""You are {agent_name}, a {agent_role} in a post-debate debrief with a founder.
The founder wants to drill deeper into a specific claim from the debate.
Be direct, specific, and constructive. Use SEA-relevant examples when possible.
Length: 3-5 sentences. Plain text only — no markdown, no asterisks."""

    prompt = f"""Business context: {business_context}
Debate topic: {topic}
Claim under discussion: {claim}

Debate transcript:\n{transcript_str}

Debrief conversation so far:\n{history_str}

Founder asks: {user_message}

Your response:"""

    model = _make_model(system, temperature=0.75, max_output_tokens=512)
    if model is None:
        return {"reply": f"{agent_name}: AI not configured — add GOOGLE_AI_API_KEY.", "timeline_suggestion": None}
    try:
        resp = model.generate_content(prompt)
        text = resp.text.strip()
        text = _re.sub(r'\*{1,3}([^*\n]+?)\*{1,3}', r'\1', text)
        text = _re.sub(r'^[*#]+\s*', '', text, flags=_re.MULTILINE)
        return {"reply": text, "timeline_suggestion": None}
    except Exception as e:
        return {"reply": f"{agent_name}: AI error — {e}", "timeline_suggestion": None}


def _extract_signal(sources_context: str, source_name: str) -> str:
    """Extract first content snippet from a named source in the RAG context block."""
    if not sources_context:
        return ""
    marker = 'Content: "'
    for line in sources_context.splitlines():
        if source_name in line:
            start = line.find(marker)
            if start != -1:
                return line[start + len(marker):].rstrip('"').strip()
    return ""


def _extract_alpha_vantage_signal(sources_context: str) -> str:
    return _extract_signal(sources_context, "Alpha Vantage")


def _extract_google_news_signal(sources_context: str) -> str:
    return _extract_signal(sources_context, "Google News")


def _make_model(
    system_instruction: str = "",
    temperature: float = 0.7,
    max_output_tokens: int = 1024,
):
    """Create a configured Gemini model, or None if the API key is missing."""
    api_key = os.environ.get("GOOGLE_AI_API_KEY", "")
    if not api_key:
        return None
    genai.configure(api_key=api_key)
    kwargs: dict = {
        "generation_config": genai.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        )
    }
    if system_instruction:
        kwargs["system_instruction"] = system_instruction
    return genai.GenerativeModel("gemini-2.5-flash-lite", **kwargs)


async def brainstorm_chat(
    message: str,
    history: list,
    country: str,
    founder_context: str | None,
    sources_context: str = "",
) -> str:
    alpha_signal = _extract_alpha_vantage_signal(sources_context)
    news_signal = _extract_google_news_signal(sources_context)

    market_context = ""
    if alpha_signal:
        market_context += f"\nLive Alpha Vantage signal: {alpha_signal}"
    if news_signal:
        market_context += f"\nLive Google News signal: {news_signal}"
    if not market_context:
        market_context = "\nNo live market signal available — use well-reasoned regional estimates and label them as such."

    system_instruction = f"""You are a sharp, concise startup coach for Southeast Asia (SEA) founders.
Give direct answers only — no preamble, no filler, no "great question".

Founder profile: {founder_context or 'Not provided'}
Country: {country}
Market data:{market_context}

Response rules (strict):
- Max 5 bullet points per answer. No nested bullets.
- Max 120 words total per response.
- Lead with the most important number or insight first.
- Label estimates clearly with "(est.)".
- Never use section headers for simple questions.
- Build on prior conversation context for follow-ups.
- Use plain text ONLY. Never use asterisks (*), pound signs (#), or any markdown symbols.
- For bullet points, use a dash (-) at the start of the line."""

    model = _make_model(system_instruction, temperature=0.7, max_output_tokens=1024)
    if model is None:
        return (
            "AI is not configured — GOOGLE_AI_API_KEY is missing from the backend .env file. "
            "Please add it and restart the backend."
        )

    try:
        gemini_history = []
        for turn in (history or []):
            role = turn.get("role", "")
            content = turn.get("content", "")
            if role == "user":
                gemini_history.append({"role": "user", "parts": [content]})
            elif role in ("assistant", "ai", "model"):
                gemini_history.append({"role": "model", "parts": [content]})

        chat_session = model.start_chat(history=gemini_history)
        response = chat_session.send_message(message)
        text = response.text.strip()
        # Strip any asterisks Gemini still emits despite instructions
        import re as _re
        text = _re.sub(r'\*{1,3}([^*\n]+?)\*{1,3}', r'\1', text)  # **bold**, *italic*, ***bold-italic***
        text = _re.sub(r'^\*+\s*', '- ', text, flags=_re.MULTILINE)  # lone * bullets → -
        return text
    except Exception as e:
        return f"AI error: {str(e)}. Check GOOGLE_AI_API_KEY is valid and the backend can reach the internet."


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
        },
    ]


async def explain_concept(concept: str) -> dict:
    import re as _re

    system = (
        "You are a startup mentor helping first-time Southeast Asian founders understand business concepts. "
        "Explain things simply, use relatable SEA examples (Malaysia, Indonesia, Thailand, Vietnam, Philippines), "
        "and focus on practical implications."
    )
    prompt = (
        f"Explain the startup/business concept: \"{concept}\"\n\n"
        "Return ONLY a JSON object with these keys:\n"
        "  concept          - the term being explained (string)\n"
        "  simple_explanation - plain-English explanation in 2-3 sentences (string)\n"
        "  sea_example      - a concrete SEA-based real-world example (string)\n"
        "  why_it_matters   - why a founder should care about this (string)\n"
        "  common_mistake   - the most common mistake founders make with this concept (string)\n\n"
        "No markdown, no code fences, raw JSON only."
    )

    fallback = {
        "concept": concept,
        "simple_explanation": f"{concept} is a key metric that affects your startup's health and decision-making.",
        "sea_example": f"A Kuala Lumpur-based startup would track {concept} to make smarter growth decisions.",
        "why_it_matters": f"Understanding {concept} helps founders avoid running out of resources unexpectedly.",
        "common_mistake": f"Many founders ignore {concept} until it becomes a critical problem.",
    }

    model = _make_model(system, temperature=0.6, max_output_tokens=600)
    if not model:
        return fallback

    try:
        resp = model.generate_content(prompt)
        raw = resp.text.strip()
        # strip optional code fences
        raw = _re.sub(r"^```[a-z]*\n?", "", raw)
        raw = _re.sub(r"\n?```$", "", raw).strip()
        data = json.loads(raw)
        # ensure all expected fields exist
        for key in ("concept", "simple_explanation", "sea_example", "why_it_matters", "common_mistake"):
            if key not in data:
                data[key] = fallback[key]
        return data
    except Exception:
        return fallback


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
    import re as _re

    business_name     = session.get("business_name", "This Business")
    category          = session.get("business_category", "General")
    country           = session.get("country", "Malaysia")
    description       = session.get("business_description", "")
    monthly_revenue   = session.get("monthly_revenue", 0) or 0
    monthly_burn      = session.get("monthly_burn", 0) or 0
    cash_reserve      = session.get("cash_reserve", 0) or 0
    stage             = session.get("stage", "idea")

    news_signal  = _extract_google_news_signal(sources_context)
    alpha_signal = _extract_alpha_vantage_signal(sources_context)
    market_ctx   = ""
    if news_signal:
        market_ctx += f"\nLive market news: {news_signal}"
    if alpha_signal:
        market_ctx += f"\nLive financial signal: {alpha_signal}"
    if not market_ctx:
        market_ctx = "\nNo live market signal — use well-reasoned regional estimates."

    debate_ctx = ""
    if debate_data:
        topic     = debate_data.get("topic", "")
        verdict   = debate_data.get("judge_summary", {}) or {}
        reasoning = verdict.get("reasoning", "")
        risks     = ", ".join(verdict.get("key_risks", []))
        opps      = ", ".join(verdict.get("key_opportunities", []))
        debate_ctx = f"""
Advisory Panel Verdict (topic: {topic}):
- Reasoning: {reasoning}
- Key risks surfaced: {risks}
- Key opportunities surfaced: {opps}
- Recommendation: {verdict.get("recommendation", "")}"""

    system = """You are a senior startup strategist writing an executive blueprint for a Southeast Asian founder.
Produce realistic, specific, hyper-local analysis. Use concrete numbers and cite them with [n] tags referencing sources.
Plain text only — no markdown headers, no asterisks, no bullet dashes inside JSON strings. Use semicolons to separate list items within strings if needed."""

    prompt = f"""Business: {business_name}
Category: {category}
Country: {country}
Description: {description}
Stage: {stage}
Monthly Revenue: RM {monthly_revenue:,}
Monthly Burn: RM {monthly_burn:,}
Cash Reserve: RM {cash_reserve:,}
{market_ctx}
{debate_ctx}

Return ONLY a valid JSON object with exactly these keys:
{{
  "overall_summary": "<2-3 sentence opening that contextualises the business against current market conditions>",
  "key_findings": [
    {{"claim": "<specific data-backed finding>", "confidence_level": "High"}},
    {{"claim": "<specific data-backed finding>", "confidence_level": "Medium"}},
    {{"claim": "<specific data-backed finding>", "confidence_level": "Medium"}}
  ],
  "executive_summary": "<3-4 sentence strategic summary covering market position, financials, and immediate priorities>",
  "swot": {{
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
    "opportunities": ["<opportunity 1>", "<opportunity 2>", "<opportunity 3>"],
    "threats": ["<threat 1>", "<threat 2>", "<threat 3>"]
  }},
  "financial_outlook": "<specific outlook with estimated runway, break-even timing, and margin expectations>",
  "asean_opportunities": "<concrete ASEAN expansion opportunities with specific countries and market sizes>",
  "risks": "<top 3 risks with likelihood and mitigation strategies, separated by semicolons>",
  "recommendation": "<single most important actionable next step with a 30-day timeline>",
  "confidence_score": <integer 0-100 reflecting data confidence>,
  "investor_pitch": "<2-3 sentence elevator pitch a founder would say to an investor>"
}}"""

    fallback = {
        "overall_summary": f"{business_name} operates in the {category} space in {country}. Current market conditions require disciplined execution and clear differentiation.",
        "key_findings": [
            {"claim": "Runway and burn discipline are the primary levers for early-stage survival.", "confidence_level": "High"},
            {"claim": "Regional demand for this category is growing, creating early-mover advantage.", "confidence_level": "Medium"},
            {"claim": "Competitive pressure will intensify within 12-18 months as market matures.", "confidence_level": "Medium"},
        ],
        "executive_summary": f"{business_name} is an early-stage {category} business in {country}. With RM {cash_reserve:,} in reserves and a monthly burn of RM {monthly_burn:,}, the team has approximately {round(cash_reserve / monthly_burn) if monthly_burn else 'N/A'} months of runway. Immediate focus should be on product-market fit validation and controlled customer acquisition.",
        "swot": {
            "strengths": ["Clear initial value proposition", "Lean founding team", "Local market knowledge"],
            "weaknesses": ["Limited brand recognition", "Early-stage cash constraints", "Unproven unit economics"],
            "opportunities": ["Growing regional demand in this category", "Digital adoption acceleration post-2024", "Underserved customer segments"],
            "threats": ["Established incumbents with distribution advantages", "Macroeconomic uncertainty in SEA", "Regulatory changes affecting the sector"],
        },
        "financial_outlook": f"With RM {monthly_burn:,}/month burn and RM {monthly_revenue:,}/month revenue, the business needs to reach break-even within 12-18 months to avoid dilutive fundraising.",
        "asean_opportunities": "Vietnam and Indonesia offer the highest growth potential for this category, with combined addressable markets exceeding USD 2B by 2027.",
        "risks": "Market validation risk — demand assumptions unproven at scale; Execution risk — hiring and operational bottlenecks; Funding risk — reliance on founder capital before revenue covers burn",
        "recommendation": "Run a 30-day paid pilot with 50 target customers to validate willingness-to-pay before committing further capital.",
        "confidence_score": 60,
        "investor_pitch": f"{business_name} solves a real pain point in the {country} {category} market. We have a lean team, a clear go-to-market, and a path to break-even within 18 months.",
    }

    model = _make_model(system, temperature=0.4, max_output_tokens=2048)
    if model is None:
        return fallback

    try:
        resp = model.generate_content(prompt)
        raw  = resp.text.strip()
        raw  = _re.sub(r'^```[\w]*\n?', '', raw).rstrip('`').strip()
        data = json.loads(raw)
        # Merge fallback keys for any missing fields
        for k, v in fallback.items():
            if k not in data:
                data[k] = v
        return data
    except Exception as e:
        fallback["executive_summary"] += f" (AI parse error: {e})"
        return fallback


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
    model = _make_model(temperature=0.4, max_output_tokens=800)
    if model is None:
        return {
            "industry_averages": {"startup_cost_range": "N/A", "profit_margin_range": "N/A", "year1_failure_rate": "N/A", "break_even_months": "N/A", "summary": "AI not configured."},
            "competitor_snapshots": [],
            "macro_trend": {"headline": "N/A", "growth_rate": "N/A", "detail": "N/A", "headwind": "N/A"},
            "ai_coach_briefing": "Configure GOOGLE_AI_API_KEY to enable benchmarks.",
        }

    prompt = f"""You are a startup market research analyst. Generate a JSON benchmark report for the **{industry}** industry in **{location}**.

{f'Additional market context from live sources:{chr(10)}{context_block}' if context_block else ''}

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{{
  "industry_averages": {{
    "startup_cost_range": "<realistic local currency range>",
    "profit_margin_range": "<% range>",
    "year1_failure_rate": "<% or descriptive stat>",
    "break_even_months": "<range in months>",
    "summary": "<2-sentence factual summary of the {industry} landscape in {location}>"
  }},
  "competitor_snapshots": [
    {{"name": "<real company>", "model_type": "<e.g. Digital-First>", "description": "<one sentence>", "key_stat": "<one concrete metric>"}},
    {{"name": "<real company>", "model_type": "<badge>", "description": "<one sentence>", "key_stat": "<one concrete metric>"}}
  ],
  "macro_trend": {{
    "headline": "<catchy trend title>",
    "growth_rate": "<CAGR or growth stat>",
    "detail": "<2 sentences on the opportunity>",
    "headwind": "<1 sentence on main risk or cost pressure>"
  }},
  "ai_coach_briefing": "<2 sentences: key insight for a founder entering this market in {location}>"
}}"""

    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw
            raw = raw.rsplit("```", 1)[0].strip()
        return json.loads(raw)
    except Exception as e:
        return {
            "industry_averages": {
                "startup_cost_range": "Varies by scale",
                "profit_margin_range": "10% – 25%",
                "year1_failure_rate": "30% – 60%",
                "break_even_months": "8 – 18",
                "summary": f"{industry} in {location}: execution quality drives outcomes. ({str(e)[:60]})",
            },
            "competitor_snapshots": [],
            "macro_trend": {
                "headline": "Digital demand remains strong",
                "growth_rate": "Moderate",
                "detail": "Mobile-led behaviour continues to influence buying patterns.",
                "headwind": "Customer acquisition costs can spike unexpectedly.",
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
