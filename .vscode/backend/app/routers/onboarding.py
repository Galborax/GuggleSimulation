import uuid
from fastapi import APIRouter, HTTPException
from app.schemas.onboarding import StartOnboardingRequest, AnswerRequest, FinancialsRequest, OnboardingResponse, UpdateProfileRequest, SimilarBusinessesRequest
from app.services.gemini_service import generate_clarifying_questions, analyze_business, generate_similar_businesses, generate_reality_dashboard
from app.services.rag_service import fetch_sources

router = APIRouter()

FALLBACK_CATEGORIES = [
    "Fintech & Payments", "E-Commerce & Retail", "Healthtech & Biotech",
    "Edtech & Upskilling", "Agritech & Food", "Logistics & Supply Chain",
    "SaaS & Productivity", "Travel & Tourism", "Media & Entertainment",
    "Clean Energy & Sustainability", "Property & Construction",
    "HR & Workforce Management", "Legal & Compliance", "Gaming & Esports",
    "Government & Civic Tech",
]

_sessions: dict[str, dict] = {}


@router.get("/categories")
async def get_categories():
    return {"categories": FALLBACK_CATEGORIES}


@router.post("/start", response_model=OnboardingResponse)
async def start_onboarding(req: StartOnboardingRequest):
    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "session_id": session_id,
        "path": req.path,
        "business_category": req.business_category,
        "business_name": req.business_name,
        "business_description": req.business_description,
        "country": req.country,
        "onboarding_answers": [],
        "stage": "clarify",
    }

    questions = []
    if req.path == "A" and req.business_name:
        questions = await generate_clarifying_questions(
            req.business_category or "General",
            req.business_name,
            req.business_description or "",
            req.country,
        )

    return OnboardingResponse(
        session_id=session_id,
        path=req.path,
        questions=questions,
        status="started",
    )


@router.post("/answer")
async def answer_question(req: AnswerRequest):
    session = _sessions.get(req.session_id)
    if not session:
        return {"error": "Session not found"}
    answers = session.get("onboarding_answers", [])
    answers.append({"index": req.question_index, "answer": req.answer})
    session["onboarding_answers"] = answers
    return {"status": "answered", "session_id": req.session_id}


@router.post("/financials")
async def submit_financials(req: FinancialsRequest):
    session = _sessions.get(req.session_id)
    if not session:
        return {"error": "Session not found"}
    session.update({
        "monthly_revenue": req.monthly_revenue,
        "monthly_burn": req.monthly_burn,
        "cash_reserve": req.cash_reserve,
        "team_size": req.team_size,
        "stage": "analyzing",
    })
    try:
        context_block, sources = await fetch_sources(
            business_category=session.get("business_category", ""),
            business_description=session.get("business_description", ""),
            country=session.get("country", "Singapore"),
        )
    except Exception:
        context_block, sources = "", []

    analysis = await analyze_business(session, sources_context=context_block)
    session["analysis_result"] = analysis
    session["stage"] = "complete"
    return {
        "status": "complete",
        "session_id": req.session_id,
        "analysis": analysis,
        "sources": sources,
    }


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    session = _sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}
    return session


# ── Similar Businesses ───────────────────────────────────────────────────────

@router.post("/similar-businesses")
async def similar_businesses(req: SimilarBusinessesRequest):
    """Return AI-generated list of similar businesses in the same country/region."""
    try:
        context_block, sources = await fetch_sources(
            business_category=req.business_category,
            business_description=req.business_description,
            country=req.country,
        )
    except Exception:
        context_block, sources = "", []

    businesses = await generate_similar_businesses(
        req.business_category,
        req.business_name,
        req.business_description,
        req.country,
        sources_context=context_block,
    )
    return {"businesses": businesses, "sources": sources}


# ── Business Profiles ─────────────────────────────────────────────────────────

@router.post("/reality-dashboard/{session_id}")
async def get_reality_dashboard(session_id: str):
    """Generate (or return cached) the Business Reality Dashboard for a session."""
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("reality_dashboard"):
        return session["reality_dashboard"]

    # Fetch real-time sources for RAG
    try:
        context_block, sources = await fetch_sources(
            business_category=session.get("business_category", ""),
            business_description=session.get("business_description", ""),
            country=session.get("country", "Singapore"),
        )
    except Exception:
        context_block, sources = "", []

    dashboard = await generate_reality_dashboard(session, sources_context=context_block)
    result = {"sources": sources, **dashboard}
    session["reality_dashboard"] = result
    return result


@router.get("/profiles")
async def list_profiles():
    """Return a lightweight summary of every stored business profile."""
    profiles = [
        {
            "session_id": s["session_id"],
            "business_name": s.get("business_name") or "Unnamed Business",
            "business_category": s.get("business_category"),
            "business_description": s.get("business_description"),
            "country": s.get("country"),
            "stage": s.get("stage"),
            "monthly_revenue": s.get("monthly_revenue"),
            "monthly_burn": s.get("monthly_burn"),
            "cash_reserve": s.get("cash_reserve"),
            "team_size": s.get("team_size"),
        }
        for s in _sessions.values()
    ]
    return {"profiles": profiles}


@router.put("/session/{session_id}")
async def update_profile(session_id: str, req: UpdateProfileRequest):
    """Customise an existing business profile."""
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Profile not found")
    updatable = req.model_dump(exclude_unset=True)
    session.update(updatable)
    return {"status": "updated", "session_id": session_id, "profile": session}


@router.delete("/session/{session_id}")
async def delete_profile(session_id: str):
    """Permanently remove a business profile."""
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Profile not found")
    del _sessions[session_id]
    return {"status": "deleted", "session_id": session_id}
