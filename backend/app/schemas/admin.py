"""Pydantic request/response schemas for the admin module."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


class AdminUserResponse(BaseModel):
    """Public representation of a staff account, as seen by an admin/owner."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    phone: str | None = None
    location_id: int | None = None
    role: UserRole
    is_active: bool


class AdminCreateUserRequest(BaseModel):
    """Payload to create a new staff/trainer/admin account (owner/admin only).

    Unlike `RegisterRequest` (public self-registration, always `staff`),
    this endpoint is role-gated and may assign any role.
    """

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=150)
    phone: str | None = Field(default=None, max_length=30)
    location_id: int | None = Field(
        default=None, description="Branch/location this staff member works at"
    )
    role: UserRole = UserRole.STAFF


class UpdateUserRequest(BaseModel):
    """Payload to update another staff account's role and/or active status.

    All fields are optional so a caller may update just the ones that
    changed; at least one should be provided for the request to have any effect.
    """

    role: UserRole | None = None
    is_active: bool | None = None
    location_id: int | None = None


class RoleCount(BaseModel):
    """Number of staff accounts holding a given role."""

    role: UserRole
    count: int = Field(ge=0)


class AdminStatsResponse(BaseModel):
    """Aggregate staff counts for the admin dashboard."""

    total_staff: int = Field(ge=0)
    by_role: list[RoleCount]
