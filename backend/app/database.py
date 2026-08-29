"""Database engine, session factory, and FastAPI dependency.

``DATABASE_URL`` is sourced exclusively from environment variables (via
``app.config.settings``, itself backed by ``pydantic-settings``) — no
credentials are hardcoded here, per project rules (CLAUDE.md).
"""
from __future__ import annotations

import logging
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.models.base import Base

logger = logging.getLogger(__name__)

engine: Engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a request-scoped SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
