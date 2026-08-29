"""Pydantic schemas for the Member Enrollment module.

Mirrors ``app.models.member.Member`` (owned by DATABASE-AGENT). All request
schemas use full type hints and Pydantic v2 syntax per CLAUDE.md — no
``any``-typed fields, validation happens at the boundary so the service layer
can trust the shapes it receives.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.member import MemberStatus


class MemberBase(BaseModel):
    """Fields shared by create/update payloads, matching the ``members`` table."""

    full_name: str = Field(..., min_length=1, max_length=150, description="Member's full name")
    email: Optional[EmailStr] = Field(default=None, description="Member's email address (optional, unique)")
    phone: str = Field(..., min_length=1, max_length=30, description="Member's contact phone number")
    date_of_birth: date = Field(..., description="Member's date of birth")
    gender: str = Field(..., min_length=1, max_length=20, description="Member's gender")
    address: Optional[str] = Field(default=None, max_length=500, description="Member's home address")
    emergency_contact_name: Optional[str] = Field(
        default=None, max_length=150, description="Name of the member's emergency contact"
    )
    emergency_contact_phone: Optional[str] = Field(
        default=None, max_length=30, description="Phone number of the member's emergency contact"
    )
    photo_url: Optional[str] = Field(default=None, max_length=500, description="URL of the member's profile photo")

    @field_validator("date_of_birth")
    @classmethod
    def date_of_birth_not_in_future(cls, value: date) -> date:
        """Reject a date of birth in the future."""
        if value > date.today():
            raise ValueError("date_of_birth cannot be in the future")
        return value


class MemberCreate(MemberBase):
    """Payload for enrolling a new member (``POST /api/v1/members``).

    ``enrolled_by`` is never accepted from the client — the service layer
    stamps it from the authenticated staff user's id.
    """

    join_date: date = Field(default_factory=date.today, description="Date the member was enrolled")
    status: MemberStatus = Field(default=MemberStatus.ACTIVE, description="Initial enrollment status")


class MemberUpdate(BaseModel):
    """Payload for a partial update (``PUT /api/v1/members/{id}``).

    Every field is optional so callers can send only what changed.
    """

    full_name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    email: Optional[EmailStr] = Field(default=None)
    phone: Optional[str] = Field(default=None, min_length=1, max_length=30)
    date_of_birth: Optional[date] = Field(default=None)
    gender: Optional[str] = Field(default=None, min_length=1, max_length=20)
    address: Optional[str] = Field(default=None, max_length=500)
    emergency_contact_name: Optional[str] = Field(default=None, max_length=150)
    emergency_contact_phone: Optional[str] = Field(default=None, max_length=30)
    photo_url: Optional[str] = Field(default=None, max_length=500)
    join_date: Optional[date] = Field(default=None)
    status: Optional[MemberStatus] = Field(default=None)

    @field_validator("date_of_birth")
    @classmethod
    def date_of_birth_not_in_future(cls, value: Optional[date]) -> Optional[date]:
        """Reject a date of birth in the future, when provided."""
        if value is not None and value > date.today():
            raise ValueError("date_of_birth cannot be in the future")
        return value


class MemberResponse(MemberBase):
    """Full member representation returned from detail/create/update endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    join_date: date
    status: MemberStatus
    enrolled_by: int
    created_at: datetime
    updated_at: datetime


class MemberListItem(BaseModel):
    """Lightweight member representation used in list/search results."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: Optional[EmailStr] = None
    phone: str
    photo_url: Optional[str] = None
    status: MemberStatus
    join_date: date


class MemberListResponse(BaseModel):
    """Paginated envelope returned by ``GET /api/v1/members``."""

    items: List[MemberListItem]
    total: int = Field(..., description="Total number of members matching the filters")
    page: int = Field(..., ge=1, description="Current page number (1-indexed)")
    limit: int = Field(..., ge=1, description="Number of items per page")
    pages: int = Field(..., ge=0, description="Total number of pages available")
