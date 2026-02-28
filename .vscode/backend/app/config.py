from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GOOGLE_AI_API_KEY: str = ""
    DATABASE_URL: str = "postgresql+asyncpg://guggle:guggle_secret@localhost:5432/guggle_db"
    REDIS_URL: str = "redis://localhost:6379"
    CORS_ORIGINS: str = "*"
    SECRET_KEY: str = "change_this_to_a_long_random_string"
    ENVIRONMENT: str = "development"
    ALPHA_VANTAGE_API_KEY: str = ""
    SERPAPI_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
