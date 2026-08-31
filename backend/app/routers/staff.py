"""Read-only staff directory endpoint.

Distinct from ``/api/v1/admin/users`` (owner/admin only, used for role
management) — this is reachable by any authenticated user so front-desk
staff can look up a colleague to check in via the Staff Attendance module.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.staff import StaffListItem
from app.services import admin_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/staff", tags=["staff"])


@router.get("/", response_model=list[StaffListItem])
async def list_staff(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> list[User]:
    """List every staff/trainer account (id, name, role, active status)."""
    return admin_service.list_users(db)
