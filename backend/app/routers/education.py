from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.gemini_service import explain_concept
from typing import Optional

router = APIRouter()

# ── Static glossary (legacy endpoint) ─────────────────────────────────────────
_STATIC = [
    {"term": "Runway",              "short": "How long you can operate before running out of cash"},
    {"term": "Burn Rate",           "short": "How much cash you spend each month"},
    {"term": "CAC",                 "short": "Customer Acquisition Cost"},
    {"term": "LTV",                 "short": "Lifetime Value of a customer"},
    {"term": "MRR",                 "short": "Monthly Recurring Revenue"},
    {"term": "ARR",                 "short": "Annual Recurring Revenue"},
    {"term": "Churn",               "short": "Rate at which customers stop subscribing"},
    {"term": "PMF",                 "short": "Product-Market Fit"},
    {"term": "TAM",                 "short": "Total Addressable Market"},
    {"term": "SAM",                 "short": "Serviceable Addressable Market"},
    {"term": "SOM",                 "short": "Serviceable Obtainable Market"},
    {"term": "VC",                  "short": "Venture Capital"},
    {"term": "Term Sheet",          "short": "Summary of investment terms"},
    {"term": "Pre-money Valuation", "short": "Company value before investment"},
    {"term": "Dilution",            "short": "Reduction in ownership % when new shares issued"},
]


@router.get("/glossary")
async def get_glossary():
    return {"glossary": _STATIC}


# ── CRUD Glossary store (in-memory) ───────────────────────────────────────────
_glossary_store: list[dict] = [
    {"id": i + 1, "term": g["term"], "definition": g["short"],
     "category": "fundamentals", "source": "static"}
    for i, g in enumerate(_STATIC)
]
_next_id = len(_STATIC) + 1


class GlossaryTermCreate(BaseModel):
    term: str
    definition: str
    category: str = "general"
    source: str = "manual"


@router.get("/glossary/terms")
async def list_terms(search: Optional[str] = None, category: Optional[str] = None):
    results = _glossary_store
    if search:
        q = search.lower()
        results = [t for t in results if q in t["term"].lower() or q in t["definition"].lower()]
    if category:
        results = [t for t in results if t["category"] == category]
    return results


@router.get("/glossary/categories")
async def list_categories():
    cats = sorted({t["category"] for t in _glossary_store})
    return cats


@router.post("/glossary/terms", status_code=201)
async def create_term(body: GlossaryTermCreate):
    global _next_id
    term = {"id": _next_id, "term": body.term, "definition": body.definition,
            "category": body.category, "source": body.source}
    _glossary_store.append(term)
    _next_id += 1
    return term


@router.delete("/glossary/terms/{term_id}", status_code=204)
async def delete_term(term_id: int):
    global _glossary_store
    before = len(_glossary_store)
    _glossary_store = [t for t in _glossary_store if t["id"] != term_id]
    if len(_glossary_store) == before:
        raise HTTPException(status_code=404, detail="Term not found")


@router.get("/explain/{concept}")
async def explain(concept: str):
    result = await explain_concept(concept)
    return result
