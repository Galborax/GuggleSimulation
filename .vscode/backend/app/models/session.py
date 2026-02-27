from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True)
    path = Column(String, default="A")
    business_category = Column(String, nullable=True)
    business_name = Column(String, nullable=True)
    business_description = Column(String, nullable=True)
    target_market = Column(String, nullable=True)
    stage = Column(String, default="onboarding")
    monthly_revenue = Column(Float, nullable=True)
    monthly_burn = Column(Float, nullable=True)
    cash_reserve = Column(Float, nullable=True)
    team_size = Column(Integer, nullable=True)
    country = Column(String, default="Singapore")
    generated_ideas = Column(JSON, nullable=True)
    selected_idea = Column(JSON, nullable=True)
    onboarding_answers = Column(JSON, default=list)
    analysis_result = Column(JSON, nullable=True)
    reality_dashboard = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
