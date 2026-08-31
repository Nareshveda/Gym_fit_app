"""Admin endpoints: staff listing, role/status management, and dashboard stats.

All endpoints are restricted to the "owner" and "admin" roles via
`require_role`, imported from `app.dependencies` (not reimplemented here).
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
from app.schemas.admin import (
    AdminCreateUserRequest,
    AdminStatsResponse,
    AdminUserResponse,
    UpdateUserRequest,
)
from app.services import admin_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserResponse])
async def list_users(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role("owner", "admin")),
) -> list[User]:
    """List all staff accounts."""
    return admin_service.list_users(db)


@router.post(
    "/users", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED
)
async def create_user(
    data: AdminCreateUserRequest,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role("owner", "admin")),
) -> User:
    """Create a new staff/trainer/admin/owner account.

    Unlike public self-registration, this endpoint may assign any role —
    it is restricted to owner/admin callers via `require_role`.
    """
    return admin_service.create_user(db, data)


@router.put("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: int,
    data: UpdateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin")),
) -> User:
    """Update a staff account's role and/or active status.

    A caller cannot demote themselves out of admin/owner access or
    deactivate their own account (see `admin_service.update_user`).
    """
    return admin_service.update_user(db, user_id, data, current_user)


@router.get("/stats", response_model=AdminStatsResponse)
async def get_stats(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role("owner", "admin")),
) -> AdminStatsResponse:
    """Return total staff count and a breakdown of counts by role."""
    return admin_service.get_stats(db)
