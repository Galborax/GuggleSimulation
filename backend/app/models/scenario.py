from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class Debate(Base):
    __tablename__ = "debates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, nullable=True)
    topic = Column(String)
    business_context = Column(String, nullable=True)
    rounds = Column(JSON, default=list)
    judge_summary = Column(JSON, nullable=True)
    status = Column(String, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, nullable=True)
    monthly_revenue = Column(Float)
    monthly_burn = Column(Float)
    cash_reserve = Column(Float)
    team_size = Column(Integer, default=1)
    runway_months = Column(Float, nullable=True)
    timeline = Column(JSON, default=list)
    chaos_events = Column(JSON, default=list)
    whatif_results = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
