"""Declarative base and shared mixins for all SQLAlchemy models.

SQLAlchemy 2.0 style (``Mapped`` / ``mapped_column``) is used throughout the
``app.models`` package per project conventions (CLAUDE.md: type hints
required everywhere).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Shared declarative base for every model in the application."""


class TimestampMixin:
    """Adds ``created_at`` / ``updated_at`` columns to a model.

    Use on models whose spec calls for both timestamps (User, Member,
    MembershipPlan, MemberSubscription, WorkoutRoutine). Models that only
    track a creation time (Payment, Attendance, Exercise) declare
    ``created_at`` directly instead of using this mixin.
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
