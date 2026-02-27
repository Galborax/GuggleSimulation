"""
Retrieval-Augmented Generation (RAG) service.

Fetches real-time data from SerpAPI Google News and Alpha Vantage, formats them into
numbered source documents, and returns both:
    - A context block to inject into Gemini 2.5 Flash Lite prompts
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

# ── Curated fallback sources per sector (used when live APIs are unavailable) ──
# Each entry is a list of (title, source_name, url, snippet) tuples.
_FALLBACK_SOURCES: dict[str, list[dict]] = {
    "fnb": [
        {
            "title": "Global Food & Beverage Market Overview",
            "source_name": "Statista – Food & Beverages",
            "url": "https://www.statista.com/markets/413/food-beverages/",
            "snippet": "Comprehensive statistics on the global F&B industry including startup costs, margins, and growth trends.",
        },
        {
            "title": "Restaurant Industry Facts & Statistics",
            "source_name": "National Restaurant Association",
            "url": "https://restaurant.org/research-and-media/research/research-reports/",
            "snippet": "Annual research reports covering restaurant startup costs, profit margins, and failure rates.",
        },
        {
            "title": "Asia Pacific Food & Beverage Trends",
            "source_name": "Food Navigator Asia",
            "url": "https://www.foodnavigator-asia.com/",
            "snippet": "Industry news, regulatory updates, and market analysis for food and beverage businesses across Asia Pacific.",
        },
    ],
    "saas": [
        {
            "title": "SaaS Industry Statistics & Market Data",
            "source_name": "Statista – SaaS",
            "url": "https://www.statista.com/topics/2771/saas/",
            "snippet": "Global SaaS market size, revenue forecasts, ARR growth benchmarks, and leading industry players.",
        },
        {
            "title": "The SaaS Fundraising & Valuation Report",
            "source_name": "OpenView Partners",
            "url": "https://openviewpartners.com/saas-benchmarks-report/",
            "snippet": "Benchmarks on SaaS expansion revenue, NRR, and go-to-market efficiency for B2B software startups.",
        },
        {
            "title": "BVP Atlas – Cloud & SaaS Benchmarks",
            "source_name": "Bessemer Venture Partners",
            "url": "https://www.bvp.com/atlas",
            "snippet": "Deep analysis of cloud software market growth, public SaaS multiples, and startup performance benchmarks.",
        },
    ],
    "ecommerce": [
        {
            "title": "Global E-Commerce Market Statistics",
            "source_name": "Statista – E-Commerce",
            "url": "https://www.statista.com/topics/871/online-shopping/",
            "snippet": "Worldwide e-commerce revenue, conversion rates, customer acquisition costs, and market share data.",
        },
        {
            "title": "Southeast Asia E-Commerce Report",
            "source_name": "Google-Temasek-Bain e-Conomy SEA",
            "url": "https://economysea.withgoogle.com/",
            "snippet": "Annual report on the digital economy in SEA including e-commerce GMV, CAC, and market growth projections.",
        },
        {
            "title": "Global Retail & E-Commerce Trends",
            "source_name": "CB Insights",
            "url": "https://www.cbinsights.com/research/report/retail-trends/",
            "snippet": "Consumer spending trends, D2C startup benchmarks, and omnichannel retail insights.",
        },
    ],
    "healthtech": [
        {
            "title": "Digital Health Market Landscape",
            "source_name": "Rock Health Digital Health Funding",
            "url": "https://rockhealth.com/insights/",
            "snippet": "Quarterly funding reports, market sizing, and startup benchmarks for digital health and healthtech.",
        },
        {
            "title": "Southeast Asia Healthcare Market Outlook",
            "source_name": "Deloitte Insights – Healthcare SEA",
            "url": "https://www2.deloitte.com/us/en/insights/industry/health-care.html",
            "snippet": "Healthcare sector growth rates, investment trends, and regulatory environment across ASEAN markets.",
        },
    ],
    "edtech": [
        {
            "title": "EdTech Global Market Data",
            "source_name": "HolonIQ",
            "url": "https://www.holoniq.com/",
            "snippet": "EdTech market intelligence, funding data, and growth forecasts for global and regional education technology.",
        },
    ],
    "fintech": [
        {
            "title": "Southeast Asia Fintech Report",
            "source_name": "UnaFinancial Fintech SEA",
            "url": "https://fintechnews.sg/category/analysis/",
            "snippet": "News and analysis on payment, lending, and insurtech startups across Singapore, Malaysia, Indonesia.",
        },
        {
            "title": "Global Fintech Market Size & Trends",
            "source_name": "CB Insights Fintech Report",
            "url": "https://www.cbinsights.com/research/report/fintech-trends/",
            "snippet": "Funding trends, valuations, and regulatory landscape for fintech startups globally.",
        },
    ],
    "logistics": [
        {
            "title": "SEA Logistics & Supply Chain Trends",
            "source_name": "Statista – Logistics",
            "url": "https://www.statista.com/topics/1079/logistics/",
            "snippet": "Logistics market revenue, last-mile delivery costs, and startup benchmarks across Southeast Asia.",
        },
        {
            "title": "Last-Mile Delivery Market Report",
            "source_name": "McKinsey & Company",
            "url": "https://www.mckinsey.com/industries/travel-logistics-and-infrastructure/our-insights",
            "snippet": "Supply chain disruption analysis, operating cost benchmarks, and growth projections for logistics startups.",
        },
    ],
    "retail": [
        {
            "title": "Southeast Asia Retail Market Overview",
            "source_name": "Retail Asia",
            "url": "https://retailasia.com/",
            "snippet": "Regional retail sector news, consumer trends, and startup cost benchmarks across ASEAN.",
        },
        {
            "title": "Global Retail Industry Statistics",
            "source_name": "Statista – Retail",
            "url": "https://www.statista.com/topics/996/retail/",
            "snippet": "Retail revenue, e-commerce penetration, profit margin benchmarks, and market growth forecasts.",
        },
    ],
    "agritech": [
        {
            "title": "AgTech Startup Funding & Market Trends",
            "source_name": "AgFunder News",
            "url": "https://agfundernews.com/",
            "snippet": "Global agri-food tech investment data, funding rounds, and startup benchmark metrics.",
        },
        {
            "title": "Southeast Asia Agriculture Market Report",
            "source_name": "Asian Development Bank – Agriculture",
            "url": "https://www.adb.org/sectors/agriculture-food/overview",
            "snippet": "Agricultural productivity, market development, and food security investment outlook for SEA.",
        },
    ],
    "others": [
        {
            "title": "ASEAN Startup Ecosystem Report",
            "source_name": "Startup Genome",
            "url": "https://startupgenome.com/reports/global-startup-ecosystem-report",
            "snippet": "Global and ASEAN startup ecosystem rankings, success factors, and benchmark financials by industry.",
        },
        {
            "title": "Southeast Asia Investment Report",
            "source_name": "Google-Temasek-Bain e-Conomy SEA",
            "url": "https://economysea.withgoogle.com/",
            "snippet": "Internet economy growth, digital sector investment, and market sizing across ASEAN countries.",
        },
    ],
}

def _get_fallback_sources(sector_key: str, fetched_at: str) -> list[dict]:
    """Return curated fallback sources for a given sector with sequential IDs."""
    entries = _FALLBACK_SOURCES.get(sector_key) or _FALLBACK_SOURCES["others"]
    return [
        {
            "id": i + 1,
            "title": e["title"],
            "source_name": e["source_name"],
            "url": e["url"],
            "fetched_at": fetched_at,
            "snippet": e["snippet"],
            "verified": False,  # curated, not live-fetched
        }
        for i, e in enumerate(entries)
    ]


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _hours_ago_label() -> str:
    return datetime.now(timezone.utc).strftime("Fetched %b %d, %Y at %H:%M UTC")


async def _fetch_newsapi(query: str, max_articles: int = 5) -> list[dict]:
    """Fallback news fetch from NewsAPI when SerpAPI is unavailable."""
    if not settings.NEWSAPI_KEY:
        return []
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://newsapi.org/v2/everything",
                params={
                    "q": query,
                    "sortBy": "relevancy",
                    "pageSize": max_articles,
                    "language": "en",
                    "apiKey": settings.NEWSAPI_KEY,
                },
            )
        if resp.status_code != 200:
            return []
        articles = resp.json().get("articles", [])
        results = []
        for a in articles:
            url = a.get("url", "")
            title = a.get("title", "")
            if not url or not title or url == "https://removed.com":
                continue
            results.append({
                "title": title,
                "source_name": (a.get("source") or {}).get("name", "NewsAPI"),
                "url": url,
                "published_at": a.get("publishedAt", _now_iso()),
                "snippet": (a.get("description") or title)[:400],
                "verified": True,
            })
        return results
    except Exception:
        return []


async def _fetch_news(query: str, country: str, max_articles: int = 5) -> list[dict]:
    """Fetch recent news articles — SerpAPI first, NewsAPI as fallback."""
    if not settings.SERPAPI_API_KEY:
        return await _fetch_newsapi(f"{query} {country}", max_articles)

    params = {
        "engine": "google",
        "q": f"{query} {country} startup business",
        "tbm": "nws",  # news tab — returns real article URLs, not Google redirect links
        "api_key": settings.SERPAPI_API_KEY,
        "num": max_articles,
    }

    def _run_search() -> dict:
        from serpapi import GoogleSearch

        search = GoogleSearch(params)
        return search.get_dict()

    try:
        data = await asyncio.to_thread(_run_search)
        # `tbm=nws` puts results under "news_results"; fall back to "organic_results"
        articles = data.get("news_results") or data.get("organic_results") or []
        results = []
        for a in articles[:max_articles]:
            # google tbm=nws: source is a plain string under "source"
            source_raw = a.get("source") or a.get("displayed_link") or "News"
            source_name = source_raw if isinstance(source_raw, str) else source_raw.get("name", "News")

            # Real article URL is in "link" for news results, "url" for organic
            url = a.get("link") or a.get("url") or ""
            title = a.get("title", "")
            if not title or not url:
                continue
            # Skip any remaining Google redirect URLs
            if "news.google.com" in url:
                continue

            results.append({
                "title": title,
                "source_name": source_name,
                "url": url,
                "published_at": a.get("date", _now_iso()),
                "snippet": (a.get("snippet") or title)[:400],
                "verified": True,
            })
        return results
    except Exception:
        return await _fetch_newsapi(f"{query} {country}", max_articles)


async def _fetch_polygon(symbol: str) -> dict | None:
    """Fetch latest market quote from Polygon.io (fallback to Alpha Vantage)."""
    if not settings.POLYGON_IO_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"https://api.polygon.io/v2/aggs/ticker/{symbol}/prev",
                params={"apiKey": settings.POLYGON_IO_API_KEY},
            )
        if resp.status_code != 200:
            return None
        results = resp.json().get("results", [])
        if not results:
            return None
        r = results[0]
        prev_close = r.get("c", 0)
        open_price = r.get("o", 0)
        change_pct = f"{((prev_close - open_price) / open_price * 100):+.2f}%" if open_price else "N/A"
        return {
            "symbol": symbol,
            "price": f"{prev_close:.2f}",
            "change_pct": change_pct,
            "latest_day": str(r.get("t", ""))[:10],
        }
    except Exception:
        return None


async def fetch_exchange_rates(base: str = "USD") -> dict | None:
    """Fetch live exchange rates for the Currency Crisis scenario and general context."""
    if not settings.EXCHANGE_RATE_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"https://v6.exchangerate-api.com/v6/{settings.EXCHANGE_RATE_API_KEY}/latest/{base}"
            )
        if resp.status_code != 200:
            return None
        data = resp.json()
        rates = data.get("conversion_rates", {})
        # Return only the most relevant currencies for SEA startup context
        relevant = ["MYR", "SGD", "IDR", "THB", "PHP", "VND", "USD", "EUR", "GBP", "JPY", "CNY", "AUD"]
        return {k: rates[k] for k in relevant if k in rates}
    except Exception:
        return None


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
        - context_block: formatted string to inject into Gemini 2.5 Flash Lite prompt
        - source_list: list of source dicts for the frontend, each with:
            id, title, source_name, url, fetched_at, snippet, verified
    """
    # Determine sector keyword
    cat_lower = business_category.lower()
    sector_key = next(
        (k for k in SECTOR_CONFIG if k in cat_lower or cat_lower in k),
        None,
    )
    sector_cfg = SECTOR_CONFIG[sector_key] if sector_key else SECTOR_CONFIG["saas"]
    sector_key = sector_key or "others"

    # Build news query from description + category
    desc_keywords = " ".join(business_description.split()[:8]) if business_description else ""
    news_query = f"{sector_cfg['keywords']} {country} {desc_keywords}"

    # Fetch in parallel — Polygon.io preferred for market data, Alpha Vantage as fallback
    news_task = _fetch_news(news_query, country)
    poly_task = _fetch_polygon(sector_cfg["symbol"])
    av_task = _fetch_alpha_vantage(sector_cfg["symbol"])
    news_articles, poly_quote, av_quote = await asyncio.gather(news_task, poly_task, av_task)
    market_quote = poly_quote or av_quote

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

    # When no live news is available, inject curated industry fallbacks
    if not news_articles:
        for fb in _get_fallback_sources(sector_key, fetched_at):
            fb["id"] = len(sources) + 1
            sources.append(fb)

    # Add market data as a source
    if market_quote:
        symbol = sector_cfg["symbol"]
        yahoo_url = f"https://finance.yahoo.com/quote/{symbol}/"
        data_source = "Polygon.io" if poly_quote else "Alpha Vantage"
        sources.append({
            "id": len(sources) + 1,
            "title": f"{symbol} Market Data — Sector Benchmark",
            "source_name": f"{data_source} (Live Market Data)",
            "url": yahoo_url,
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

    # Build the strict-RAG context block for injection into the Gemini 2.5 Flash Lite system prompt
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


async def safe_fetch_sources(
    business_category: str = "",
    business_description: str = "",
    country: str = "Singapore",
) -> tuple[str, list]:
    """fetch_sources wrapped in try/except — returns empty context on any error."""
    try:
        return await fetch_sources(business_category, business_description, country)
    except Exception:
        return "", []
