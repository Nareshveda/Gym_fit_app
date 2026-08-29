"""Pydantic request/response schemas for the admin module."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


class AdminUserResponse(BaseModel):
    """Public representation of a staff account, as seen by an admin/owner."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool


class UpdateUserRequest(BaseModel):
    """Payload to update another staff account's role and/or active status.

    Both fields are optional so a caller may update just one of them; at
    least one should be provided for the request to have any effect.
    """

    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class RoleCount(BaseModel):
    """Number of staff accounts holding a given role."""

    role: UserRole
    count: int = Field(ge=0)


class AdminStatsResponse(BaseModel):
    """Aggregate staff counts for the admin dashboard."""

    total_staff: int = Field(ge=0)
    by_role: List[RoleCount]
