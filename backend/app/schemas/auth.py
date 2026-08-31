"""Pydantic request/response schemas for the auth module."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


class RegisterRequest(BaseModel):
    """Payload to self-register a new account.

    No `role` field on purpose: public self-registration always creates a
    `staff` account. Granting a higher role (admin/owner/trainer) requires
    going through the admin-gated `POST /api/v1/admin/users` endpoint.
    """

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=150)


class LoginRequest(BaseModel):
    """Payload to authenticate with email + password."""

    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    """Payload to exchange a refresh token for a new token pair."""

    refresh_token: str


class UserResponse(BaseModel):
    """Public representation of a User (staff) account."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime
    actor: Literal["staff"] = "staff"


class MemberAuthResponse(BaseModel):
    """Public representation of a Member's own login profile — deliberately
    thin (id/name/code only, no address/medical/payment fields) since this
    is what a member sees of themself, not what staff see of a member."""

    id: int
    email: EmailStr | None
    full_name: str
    member_code: str
    role: Literal["member"] = "member"
    is_active: bool
    avatar_url: str | None = None
    created_at: datetime
    actor: Literal["member"] = "member"


class TokenResponse(BaseModel):
    """Access + refresh token pair returned on register/login/refresh."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse | MemberAuthResponse


class UpdateMeRequest(BaseModel):
    """Payload to update the current actor's own profile (full name only —
    a member's other fields are staff-managed, not self-service)."""

    full_name: str | None = Field(default=None, min_length=1, max_length=150)


class SetMemberPasswordRequest(BaseModel):
    """Payload for staff to grant/reset a member's self-service login password."""

    password: str = Field(min_length=8, max_length=128)
