from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db
from app.routers import onboarding, market, debate, scenario, education, brainstorm, synthesis, timeline, benchmarks, export, financial_anatomy

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
    except Exception as e:
        print(f"[WARN] Database init skipped (running without DB): {e}")
    yield

app = FastAPI(
    title="GuggleSimulation API",
    description="AI-powered startup simulation for SEA founders",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(onboarding.router, prefix="/api/onboarding", tags=["Onboarding"])
app.include_router(brainstorm.router, prefix="/api/brainstorm", tags=["Brainstorm"])
app.include_router(market.router, prefix="/api/market", tags=["Market"])
app.include_router(debate.router, prefix="/api/debate", tags=["Debate"])
app.include_router(scenario.router, prefix="/api/scenario", tags=["Scenario"])
app.include_router(synthesis.router, prefix="/api/synthesis", tags=["Synthesis"])
app.include_router(education.router, prefix="/api/education", tags=["Education"])
app.include_router(timeline.router, prefix="/api/timeline", tags=["Timeline"])
app.include_router(benchmarks.router, prefix="/api/benchmarks", tags=["Benchmarks"])
app.include_router(export.router, prefix="/api/export", tags=["Export"])
app.include_router(financial_anatomy.router, prefix="/api/financial-anatomy", tags=["Financial Anatomy"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}
