"""Application configuration settings."""

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Global application settings loaded from environment variables."""

    app_name: str = "Course Atlas API"
    environment: str = "development"
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    database_url: str = Field(
        default="sqlite:///./course_atlas.db",
        alias="DATABASE_URL",
    )
    auth_domain: str = Field(default="", alias="AUTH_DOMAIN")
    auth_audience: str = Field(default="", alias="AUTH_AUDIENCE")
    auth_jwks_url: str = Field(default="", alias="AUTH_JWKS_URL")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""

    return Settings()


settings = get_settings()
