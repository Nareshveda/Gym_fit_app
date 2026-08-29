"""Shared pytest fixtures: an isolated in-memory SQLite DB per test, plus a
FastAPI TestClient wired to it via a `get_db` dependency override.

`DATABASE_URL` / `SECRET_KEY` are set before any `app.*` module is imported,
since `app.config.Settings` requires them at import time (no defaults, per
CLAUDE.md: never hardcode secrets / no hardcoded DB credentials).
"""
from __future__ import annotations

import os

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only")

from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.database import get_db
from app.main import app
from app.models.base import Base
from app.models.member import Member, MemberStatus
from app.models.membership_plan import DurationType, MembershipPlan
from app.models.user import User, UserRole

# Import every model module so its table is registered on Base.metadata
# before create_all runs (models are otherwise never imported directly).
from app.models import (  # noqa: F401
    attendance,
    exercise,
    member_subscription,
    payment,
    refresh_token,
    routine_exercise,
    workout_routine,
)


@pytest.fixture()
def db_session():
    """A fresh in-memory SQLite database, isolated per test."""
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def client(db_session):
    """A TestClient whose `get_db` dependency yields the isolated test session."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def make_user(db_session, role: UserRole = UserRole.STAFF, email: str = "staff@example.com") -> User:
    """Persist and return a staff user with a known password ("Password123!")."""
    user = User(
        email=email,
        hashed_password=hash_password("Password123!"),
        full_name="Test User",
        role=role,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def auth_headers(user: User) -> dict[str, str]:
    """Build an Authorization header carrying a valid access token for `user`."""
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def staff_user(db_session) -> User:
    return make_user(db_session, role=UserRole.STAFF, email="staff@example.com")


@pytest.fixture()
def admin_user(db_session) -> User:
    return make_user(db_session, role=UserRole.ADMIN, email="admin@example.com")


@pytest.fixture()
def owner_user(db_session) -> User:
    return make_user(db_session, role=UserRole.OWNER, email="owner@example.com")


@pytest.fixture()
def trainer_user(db_session) -> User:
    return make_user(db_session, role=UserRole.TRAINER, email="trainer@example.com")


@pytest.fixture()
def staff_headers(staff_user) -> dict[str, str]:
    return auth_headers(staff_user)


@pytest.fixture()
def admin_headers(admin_user) -> dict[str, str]:
    return auth_headers(admin_user)


@pytest.fixture()
def owner_headers(owner_user) -> dict[str, str]:
    return auth_headers(owner_user)


@pytest.fixture()
def trainer_headers(trainer_user) -> dict[str, str]:
    return auth_headers(trainer_user)


def make_member(db_session, enrolled_by: int, **overrides) -> Member:
    """Persist and return a Member, with sensible defaults for required fields."""
    defaults = dict(
        full_name="Jane Doe",
        email=None,
        phone="555-0100",
        date_of_birth=date(1995, 1, 1),
        gender="female",
        join_date=date.today(),
        status=MemberStatus.ACTIVE,
        enrolled_by=enrolled_by,
    )
    defaults.update(overrides)
    member = Member(**defaults)
    db_session.add(member)
    db_session.commit()
    db_session.refresh(member)
    return member


def make_plan(db_session, duration_type: DurationType = DurationType.MONTHLY, **overrides) -> MembershipPlan:
    """Persist and return a MembershipPlan."""
    defaults = dict(
        name="Monthly Basic",
        duration_type=duration_type,
        price=Decimal("29.99"),
        is_active=True,
    )
    defaults.update(overrides)
    plan = MembershipPlan(**defaults)
    db_session.add(plan)
    db_session.commit()
    db_session.refresh(plan)
    return plan
