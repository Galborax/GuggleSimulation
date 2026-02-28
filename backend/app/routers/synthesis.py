from fastapi import APIRouter
from app.services.gemini_service import generate_synthesis
from app.services.rag_service import safe_fetch_sources
from app.routers.onboarding import _sessions
from app.routers.debate import _debates

router = APIRouter()


@router.post("/{session_id}")
async def create_synthesis(session_id: str):
    session = _sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}
    debate_data = None
    for d in _debates.values():
        if d.get("session_id") == session_id and d.get("judge_summary"):
            debate_data = d
            break

    # Fetch real-time sources for RAG
    context_block, sources = await safe_fetch_sources(
        business_category=session.get("business_category", ""),
        business_description=session.get("business_description", ""),
        country=session.get("country", "Singapore"),
    )

    result = await generate_synthesis(session, debate_data, sources_context=context_block)
    return {"session_id": session_id, "sources": sources, **result}
