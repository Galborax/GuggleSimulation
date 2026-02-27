"""
Retrieval-Augmented Generation (RAG) service.

Fetches real-time data from SerpAPI Google News and Alpha Vantage, formats them into
numbered source documents, and returns both:
  - A context block to inject into Gemini prompts
  - A structured source list to send to the frontend for inline citations
"""

import asyncio
import httpx
from datetime import datetime, timezone
from app.config import settings

# ── Sector → market search keyword + Alpha Vantage symbol ─────────────────────
SECTOR_CONFIG = {
    "fintech":    {"keywords": "fintech payments startup",     "symbol": "FXI"},
    "ecommerce":  {"keywords": "e-commerce retail startup",    "symbol": "BABA"},
    "healthtech": {"keywords": "healthtech medical startup",   "symbol": "JNJ"},
    "edtech":     {"keywords": "edtech education startup",     "symbol": "EDU"},
    "agritech":   {"keywords": "agritech agriculture food",    "symbol": "MOO"},
    "logistics":  {"keywords": "logistics supply chain startup","symbol": "UPS"},
    "saas":       {"keywords": "SaaS productivity software",   "symbol": "MSFT"},
    "fnb":        {"keywords": "food beverage cafe restaurant","symbol": "MCD"},
    "retail":     {"keywords": "retail consumer startup",      "symbol": "WMT"},
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _hours_ago_label() -> str:
    return datetime.now(timezone.utc).strftime("Fetched %b %d, %Y at %H:%M UTC")


async def _fetch_news(query: str, country: str, max_articles: int = 5) -> list[dict]:
    """Fetch recent news articles from SerpAPI Google News."""
    if not settings.SERPAPI_API_KEY:
        return []

    params = {
        "engine": "google_news",
        "q": f"{query} {country} startup business",
        "api_key": settings.SERPAPI_API_KEY,
        "num": max_articles,
    }

    def _run_search() -> dict:
        from serpapi import GoogleSearch

        search = GoogleSearch(params)
        return search.get_dict()

    try:
        data = await asyncio.to_thread(_run_search)
        articles = data.get("news_results", [])
        results = []
        for a in articles:
            source_info = a.get("source")
            if isinstance(source_info, dict):
                source_name = source_info.get("name", "Google News")
            else:
                source_name = str(source_info) if source_info else "Google News"

            url = a.get("link") or a.get("news_url") or ""
            if not a.get("title") or not url:
                continue

            results.append({
                "title": a.get("title", "Untitled"),
                "source_name": source_name,
                "url": url,
                "published_at": a.get("date", _now_iso()),
                "snippet": (a.get("snippet") or a.get("title") or "")[:400],
                "verified": True,
            })
        return results
    except Exception:
        return []


async def _fetch_alpha_vantage(symbol: str) -> dict | None:
    """Fetch latest market data for a symbol from Alpha Vantage."""
    if not settings.ALPHA_VANTAGE_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://www.alphavantage.co/query",
                params={
                    "function": "GLOBAL_QUOTE",
                    "symbol": symbol,
                    "apikey": settings.ALPHA_VANTAGE_API_KEY,
                },
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            quote = data.get("Global Quote", {})
            if not quote or not quote.get("05. price"):
                return None
            return {
                "symbol": symbol,
                "price": quote.get("05. price", "N/A"),
                "change_pct": quote.get("10. change percent", "N/A"),
                "latest_day": quote.get("07. latest trading day", "N/A"),
            }
    except Exception:
        return None


async def fetch_sources(
    business_category: str,
    business_description: str,
    country: str,
) -> tuple[str, list[dict]]:
    """
    Main RAG fetch function.

    Returns:
        (context_block, source_list)
        - context_block: formatted string to inject into Gemini prompt
        - source_list: list of source dicts for the frontend, each with:
            id, title, source_name, url, fetched_at, snippet, verified
    """
    # Determine sector keyword
    cat_lower = business_category.lower()
    sector_key = next(
        (k for k in SECTOR_CONFIG if k in cat_lower or cat_lower in k),
        "saas",
    )
    sector_cfg = SECTOR_CONFIG[sector_key]

    # Build news query from description + category
    desc_keywords = " ".join(business_description.split()[:8]) if business_description else ""
    news_query = f"{sector_cfg['keywords']} {country} {desc_keywords}"

    # Fetch in parallel
    news_task = _fetch_news(news_query, country)
    av_task = _fetch_alpha_vantage(sector_cfg["symbol"])
    news_articles, market_quote = await asyncio.gather(news_task, av_task)

    sources: list[dict] = []
    fetched_at = _hours_ago_label()

    # Add news articles first
    for article in news_articles:
        sources.append({
            "id": len(sources) + 1,
            "title": article["title"],
            "source_name": article["source_name"],
            "url": article["url"],
            "fetched_at": fetched_at,
            "snippet": article["snippet"],
            "verified": True,
        })

    # Add market data as a source
    if market_quote:
        sources.append({
            "id": len(sources) + 1,
            "title": f"{sector_cfg['symbol']} Market Data — Sector Benchmark",
            "source_name": "Alpha Vantage (Live Market Data)",
            "url": f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={sector_cfg['symbol']}",
            "fetched_at": fetched_at,
            "snippet": (
                f"Ticker: {market_quote['symbol']} | "
                f"Price: ${market_quote['price']} | "
                f"Change: {market_quote['change_pct']} | "
                f"As of: {market_quote['latest_day']}. "
                f"This index tracks the {business_category} sector performance."
            ),
            "verified": True,
        })

    # Build the strict-RAG context block for injection into the Gemini system prompt
    context_lines = []
    for s in sources:
        confidence = "VERIFIED (live API data)" if s["verified"] else "AI ESTIMATED (training data)"
        context_lines.append(
            f"[{s['id']}] Source: {s['source_name']} | Confidence: {confidence} | "
            f"Fetched: {s['fetched_at']} | "
            f"URL: {s['url']} | "
            f"Content: \"{s['snippet']}\""
        )

    context_block = "\n".join(context_lines)
    return context_block, sources
