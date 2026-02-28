import time
from fastapi import APIRouter
from app.schemas.benchmarks import IndustryBenchmarkResponse
from app.services.gemini_service import generate_industry_benchmarks
from app.services.rag_service import safe_fetch_sources

router = APIRouter()

_benchmark_cache: dict[str, tuple[float, dict]] = {}
CACHE_TTL = 6 * 3600  # 6 hours

INDUSTRY_DISPLAY: dict[str, str] = {
    "fnb": "F&B (Cafes & Restaurants)",
    "saas": "Tech & SaaS",
    "ecommerce": "E-Commerce & Retail",
    "healthtech": "Health & Wellness",
    "edtech": "Education & EdTech",
    "logistics": "Logistics & Delivery",
    "fintech": "Finance & Payments",
    "retail": "Retail & Consumer",
}


@router.get("", response_model=IndustryBenchmarkResponse)
async def get_benchmarks(industry: str = "fnb", location: str = "Malaysia"):
    """
    Return industry benchmark data for the given industry slug and location.

    Results are cached in-memory for 6 hours per (industry, location) pair
    to avoid hammering the AI or the RAG layer.
    """
    key = f"{industry.lower()}:{location.lower()}"
    now = time.time()

    if key in _benchmark_cache:
        ts, data = _benchmark_cache[key]
        if now - ts < CACHE_TTL:
            return {**data, "cached": True}

    description = INDUSTRY_DISPLAY.get(industry.lower(), f"{industry} startup")

    context_block, sources = await safe_fetch_sources(industry.lower(), description, location)

    data = await generate_industry_benchmarks(industry, location, context_block)

    result = {
        "industry": industry,
        "location": location,
        "sources": [s if isinstance(s, dict) else s.dict() for s in sources],
        "cached": False,
        **data,
    }
    _benchmark_cache[key] = (now, result)
    return result


@router.delete("/cache")
async def clear_benchmark_cache():
    """Dev utility: wipe the in-memory benchmark cache."""
    _benchmark_cache.clear()
    return {"cleared": True}
