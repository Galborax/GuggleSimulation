from fastapi import APIRouter
from app.schemas.brainstorm import BrainstormChatRequest, GenerateIdeasRequest, SelectIdeaRequest
from app.services.gemini_service import brainstorm_chat, generate_idea_trio
from app.services.rag_service import fetch_sources
from app.routers.onboarding import _sessions
import uuid

router = APIRouter()


@router.post("/chat")
async def chat(req: BrainstormChatRequest):
    session_id = req.session_id or str(uuid.uuid4())
    if session_id not in _sessions:
        _sessions[session_id] = {
            "session_id": session_id,
            "path": "B",
            "brainstorm_history": [],
            "country": req.country,
            "business_category": req.business_category or "saas",
            "business_description": req.business_description or req.founder_context or "",
        }

    session = _sessions[session_id]
    if req.country:
        session["country"] = req.country
    if req.business_category:
        session["business_category"] = req.business_category
    if req.business_description:
        session["business_description"] = req.business_description
    elif req.founder_context and not session.get("business_description"):
        session["business_description"] = req.founder_context

    try:
        sources_context, _ = await fetch_sources(
            business_category=session.get("business_category", "saas"),
            business_description=session.get("business_description", ""),
            country=session.get("country", req.country or "Singapore"),
        )
    except Exception:
        sources_context = ""

    reply = await brainstorm_chat(
        req.message,
        req.history,
        req.country,
        req.founder_context,
        sources_context=sources_context,
    )
    return {"session_id": session_id, "reply": reply}


@router.post("/generate-ideas")
async def generate_ideas(req: GenerateIdeasRequest):
    session_id = req.session_id or str(uuid.uuid4())
    session = _sessions.get(session_id)
    if session:
        if req.country:
            session["country"] = req.country
        if req.business_category:
            session["business_category"] = req.business_category
        if req.business_description:
            session["business_description"] = req.business_description

    resolved_category = (
        req.business_category
        or (session.get("business_category") if session else None)
        or "saas"
    )
    resolved_description = (
        req.business_description
        or (session.get("business_description") if session else None)
        or f"{req.skills} {req.interests}"
    )
    resolved_country = req.country or (session.get("country") if session else "Singapore")

    try:
        sources_context, _ = await fetch_sources(
            business_category=resolved_category,
            business_description=resolved_description,
            country=resolved_country,
        )
    except Exception:
        sources_context = ""

    ideas = await generate_idea_trio(
        req.skills,
        req.interests,
        req.capital_bracket,
        resolved_country,
        sources_context=sources_context,
    )
    if session_id in _sessions:
        _sessions[session_id]["generated_ideas"] = ideas
    return {"session_id": session_id, "ideas": ideas}


@router.post("/select-idea")
async def select_idea(req: SelectIdeaRequest):
    session = _sessions.get(req.session_id)
    if not session:
        return {"error": "Session not found"}
    ideas = session.get("generated_ideas", [])
    if req.idea_index >= len(ideas):
        return {"error": "Invalid idea index"}
    selected = ideas[req.idea_index]
    selected_name = (req.custom_name or "").strip() or selected.get("name", "")
    selected_payload = {**selected, "name": selected_name}

    session["selected_idea"] = selected_payload
    session["business_name"] = selected_name
    session["business_description"] = selected.get("tagline", "")
    session["stage"] = "financials"
    return {"status": "selected", "idea": selected_payload, "session_id": req.session_id}
