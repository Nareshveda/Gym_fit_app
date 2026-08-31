"""Lightweight staff directory schema, used to search for who to check in.

Distinct from ``app.schemas.admin.AdminUserResponse`` (which is only
reachable by owner/admin) — this is a read-only, non-role-gated listing
any authenticated user can query to find a colleague to check in.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.models.user import UserRole


class StaffListItem(BaseModel):
    """A single staff/trainer directory entry."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    role: UserRole
    is_active: bool
