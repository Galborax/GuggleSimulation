from fastapi import APIRouter
from app.schemas.scenario import RunwayRequest, ChaosRequest, WhatIfRequest, HiringRequest, FounderScenarioRequest
from app.services.scenario_service import calculate_runway, simulate_chaos, run_whatif, run_founder_scenario
from app.services.gemini_service import generate_hiring_roadmap

router = APIRouter()


@router.post("/runway")
async def preview_runway(req: RunwayRequest):
    result = calculate_runway(req.monthly_revenue, req.monthly_burn, req.cash_reserve, req.team_size)
    return result


@router.post("/chaos")
async def trigger_chaos(req: ChaosRequest):
    result = await simulate_chaos(req.monthly_revenue, req.monthly_burn, req.cash_reserve, req.business_context)
    return result


@router.post("/whatif")
async def whatif_scenario(req: WhatIfRequest):
    result = await run_whatif(req)
    return result


@router.post("/founder-scenario")
async def founder_scenario(req: FounderScenarioRequest):
    result = await run_founder_scenario(req)
    return result


@router.post("/hiring")
async def hiring_roadmap(req: HiringRequest):
    result = await generate_hiring_roadmap(
        req.current_team_size,
        req.target_team_size,
        req.monthly_budget,
        req.business_context or "",
        req.country,
    )
    return result
