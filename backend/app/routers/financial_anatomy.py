import time
from fastapi import APIRouter, HTTPException
from app.schemas.financial_anatomy import FinancialAnatomyResponse
from app.services.gemini_service import generate_financial_anatomy
from app.services.rag_service import safe_fetch_sources

router = APIRouter()

_anatomy_cache: dict[str, tuple[float, dict]] = {}
CACHE_TTL = 6 * 3600  # 6 hours


@router.post("", response_model=FinancialAnatomyResponse)
async def get_financial_anatomy(session_data: dict):
    """
    Generate a three-pillar (CapEx / OpEx / COGS) financial model for the
    business described in session_data.

    Accepts the same session payload used by other engine endpoints:
      {
        "session_id": "...",
        "business_name": "...",
        "business_category": "fnb|retail|tech|...",
        "business_description": "...",
        "country": "Malaysia"
      }

    Results are cached per (business_category + country) for 6 hours.
    """
    session_id = session_data.get("session_id", "unknown")
    category   = session_data.get("business_category", "retail").lower()
    country    = session_data.get("country", "Malaysia").lower()

    cache_key = f"{category}:{country}"
    now = time.time()

    if cache_key in _anatomy_cache:
        ts, cached_data = _anatomy_cache[cache_key]
        if now - ts < CACHE_TTL:
            return {**cached_data, "session_id": session_id, "cached": True}

    # Pull RAG context for hyper-local citations
    description = session_data.get("business_description", "")
    context_block, _ = await safe_fetch_sources(category, description, country)

    try:
        data = await generate_financial_anatomy(session_data, context_block)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Financial Anatomy Engine error: {exc}")

    result = {
        **data,
        "session_id": session_id,
        "cached": False,
    }

    _anatomy_cache[cache_key] = (now, result)
    return result


@router.delete("/cache")
async def clear_anatomy_cache():
    """Dev utility: clear the in-memory financial anatomy cache."""
    _anatomy_cache.clear()
    return {"cleared": True}
