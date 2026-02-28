from fastapi import APIRouter, Depends
from app.schemas.timeline import TimelineRequest
from app.services.gemini_service import generate_financial_timeline
from app.services.rag_service import fetch_sources
from app.dependencies import validate_session

router = APIRouter()

# Cache timelines so re-renders don't re-call the AI
_timelines: dict = {}


@router.post("/{session_id}")
async def create_timeline(
    session_id: str,
    req: TimelineRequest,
    session: dict = Depends(validate_session),   # Pillar 3: ownership validated
):
    """
    Phase 1: AI fetches real-world data, builds InteractiveVariable formula.
    The frontend uses the returned JSON to do Phase 2 (instant JS recalculation).
    """

    # Return cached if already generated
    cache_key = f"{session_id}:{req.starting_capital}"
    if cache_key in _timelines:
        return _timelines[cache_key]

    # Fetch real-time sources (same RAG service used by synthesis)
    try:
        context_block, sources = await fetch_sources(
            business_category=session.get("business_category", ""),
            business_description=session.get("business_description", ""),
            country=session.get("country", "Malaysia"),
        )
    except Exception:
        context_block, sources = "", []

    starting_capital = req.starting_capital or session.get("cash_reserve", 50000) or 50000

    timeline_data = await generate_financial_timeline(
        session=session,
        starting_capital=starting_capital,
        sources_context=context_block,
    )

    result = {"session_id": session_id, "rag_sources": sources, **timeline_data}
    _timelines[cache_key] = result
    return result


@router.delete("/{session_id}/cache")
async def clear_timeline_cache(session_id: str):
    """Force regeneration by clearing the cache for this session."""
    keys_to_delete = [k for k in _timelines if k.startswith(f"{session_id}:")]
    for k in keys_to_delete:
        del _timelines[k]
    return {"cleared": len(keys_to_delete)}
