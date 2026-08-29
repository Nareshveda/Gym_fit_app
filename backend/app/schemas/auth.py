"""Pydantic request/response schemas for the auth module."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


class RegisterRequest(BaseModel):
    """Payload to create a new staff account."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=150)
    role: UserRole = UserRole.STAFF


class LoginRequest(BaseModel):
    """Payload to authenticate with email + password."""

    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    """Payload to exchange a refresh token for a new token pair."""

    refresh_token: str


class UserResponse(BaseModel):
    """Public representation of a User account."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    """Access + refresh token pair returned on register/login/refresh."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class UpdateMeRequest(BaseModel):
    """Payload to update the current user's own profile."""

    full_name: Optional[str] = Field(default=None, min_length=1, max_length=150)
