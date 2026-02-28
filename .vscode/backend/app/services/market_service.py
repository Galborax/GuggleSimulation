SECTORS = {
    "fintech": {"symbol": "FXI", "description": "Financial Technology"},
    "ecommerce": {"symbol": "BABA", "description": "E-Commerce"},
    "healthtech": {"symbol": "JNJ", "description": "Health Technology"},
    "edtech": {"symbol": "EDU", "description": "Education Technology"},
    "agritech": {"symbol": "MOO", "description": "Agriculture Technology"},
    "logistics": {"symbol": "UPS", "description": "Logistics & Supply Chain"},
    "saas": {"symbol": "SaaS", "description": "Software as a Service"},
}

MOCK_DATA = {
    "fintech": [
        {"date": "2024-01", "value": 100}, {"date": "2024-02", "value": 108},
        {"date": "2024-03", "value": 105}, {"date": "2024-04", "value": 115},
        {"date": "2024-05", "value": 112}, {"date": "2024-06", "value": 120},
    ],
    "ecommerce": [
        {"date": "2024-01", "value": 90}, {"date": "2024-02", "value": 95},
        {"date": "2024-03", "value": 102}, {"date": "2024-04", "value": 98},
        {"date": "2024-05", "value": 110}, {"date": "2024-06", "value": 118},
    ],
}


async def get_sector_data(sector: str) -> dict:
    return {
        "sector": sector,
        "description": SECTORS.get(sector, {}).get("description", sector),
        "data": MOCK_DATA.get(sector, MOCK_DATA["fintech"]),
        "trend": "upward",
        "insight": f"The {sector} sector in SEA shows strong growth momentum driven by digital adoption.",
    }
