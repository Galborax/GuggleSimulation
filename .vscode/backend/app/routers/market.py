from fastapi import APIRouter
from app.services.market_service import get_sector_data

router = APIRouter()


@router.get("/sector/{sector}")
async def sector_insight(sector: str):
    data = await get_sector_data(sector)
    return data


@router.get("/competitors/{sector}")
async def competitor_landscape(sector: str):
    competitors = {
        "fintech": [
            {"name": "GrabFinance", "score": 85, "market_share": 0.22, "growth": 0.35, "country": "SG"},
            {"name": "SeaMoney", "score": 78, "market_share": 0.18, "growth": 0.28, "country": "SG"},
            {"name": "OVO", "score": 72, "market_share": 0.15, "growth": 0.20, "country": "ID"},
            {"name": "GoPay", "score": 75, "market_share": 0.17, "growth": 0.25, "country": "ID"},
            {"name": "TrueMoney", "score": 65, "market_share": 0.10, "growth": 0.15, "country": "TH"},
        ],
        "ecommerce": [
            {"name": "Shopee", "score": 90, "market_share": 0.35, "growth": 0.20, "country": "SG"},
            {"name": "Lazada", "score": 82, "market_share": 0.25, "growth": 0.12, "country": "SG"},
            {"name": "Tokopedia", "score": 78, "market_share": 0.20, "growth": 0.18, "country": "ID"},
            {"name": "Tiki", "score": 65, "market_share": 0.10, "growth": 0.22, "country": "VN"},
        ],
    }
    data = competitors.get(sector.lower(), [
        {"name": "Incumbent A", "score": 70, "market_share": 0.30, "growth": 0.15, "country": "SG"},
        {"name": "Incumbent B", "score": 65, "market_share": 0.20, "growth": 0.10, "country": "MY"},
        {"name": "Startup X", "score": 55, "market_share": 0.05, "growth": 0.45, "country": "ID"},
    ])
    return {"sector": sector, "competitors": data}
