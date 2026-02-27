from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GOOGLE_AI_API_KEY: str = ""
    GEMINI_MODEL_NAME: str = "Gemini 2.5 Flash Lite"
    DATABASE_URL: str = "postgresql+asyncpg://guggle:guggle_secret@localhost:5432/guggle_db"
    REDIS_URL: str = "redis://localhost:6379"
    CORS_ORIGINS: str = "*"
    SECRET_KEY: str = "change_this_to_a_long_random_string"
    ENVIRONMENT: str = "development"

    # Market & financial data
    ALPHA_VANTAGE_API_KEY: str = ""
    POLYGON_IO_API_KEY: str = ""
    EXCHANGE_RATE_API_KEY: str = ""

    # Web search & news
    SERPAPI_API_KEY: str = ""
    NEWSAPI_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
