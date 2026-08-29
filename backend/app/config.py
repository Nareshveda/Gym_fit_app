"""Application configuration, sourced from environment variables / .env file.

No secrets are hardcoded here per project rules (CLAUDE.md) — every sensitive
value (DATABASE_URL, SECRET_KEY, ...) must be supplied via the environment.
"""
from __future__ import annotations

import logging
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Centralized, typed application settings.

    Values are read from environment variables first, falling back to a local
    `.env` file (managed by DEVOPS-AGENT / not committed) when present.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "HSP - Gym Management"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # Database (see DATABASE-AGENT: backend/app/database.py, backend/app/models/)
    DATABASE_URL: str

    # Auth (JWT, email/password only — no OAuth for HSP)
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Frontend / CORS
    VITE_API_URL: str = "http://localhost:8000"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        """Parse ALLOWED_ORIGINS into a list of origin strings for CORSMiddleware."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()
