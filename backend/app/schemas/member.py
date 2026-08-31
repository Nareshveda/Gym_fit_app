"""Pydantic schemas for the Member Enrollment module.

Mirrors ``app.models.member.Member`` (owned by DATABASE-AGENT). All request
schemas use full type hints and Pydantic v2 syntax per CLAUDE.md — no
``any``-typed fields, validation happens at the boundary so the service layer
can trust the shapes it receives.
"""

from __future__ import annotations

import re
from datetime import date, datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    ValidationInfo,
    computed_field,
    field_validator,
)

from app.models.member import MemberStatus, TrainingCategory

# 7-15 significant digits, optionally with a leading "+", and spaces/hyphens
# as separators (e.g. "+91 98765 43210", "987-654-3210"). This is the fix
# for a real bug found in testing: the old `max_length=30` alone let
# obviously-invalid phone numbers (16+ characters) through.
_PHONE_PATTERN = re.compile(r"^\+?[0-9][0-9 \-]{5,20}[0-9]$")
_NAME_PATTERN = re.compile(r"^[A-Za-z][A-Za-z.'\- ]{0,149}$")
_VALID_GENDERS = {"male", "female", "other", "prefer_not_to_say"}
_CURRENT_YEAR = date.today().year


def _validate_phone(value: str | None, field_name: str | None) -> str | None:
    # An empty string means "no value" for these optional fields, same as
    # None — clients (the enrollment/edit form included) commonly send ""
    # rather than omitting the key entirely, and it should never be treated
    # as an invalid phone number.
    if value is None or value == "":
        return None
    digits = re.sub(r"[^0-9]", "", value)
    if len(digits) < 7 or len(digits) > 15 or not _PHONE_PATTERN.match(value):
        raise ValueError(
            f"{field_name or 'value'} must be 7-15 digits, optionally with +, spaces, or hyphens"
        )
    return value


def _validate_name(value: str | None, field_name: str | None) -> str | None:
    if value is None or value == "":
        return None
    if not _NAME_PATTERN.match(value):
        raise ValueError(
            f"{field_name or 'value'} may only contain letters, spaces, apostrophes, periods, and hyphens"
        )
    return value


def _empty_str_to_none(value: object) -> object:
    """Treat "" the same as omitting the field, before `EmailStr`/etc. type
    validation runs — clients commonly send "" for a blank optional field
    rather than omitting the key."""
    return None if value == "" else value


class MemberBase(BaseModel):
    """Fields shared by create/update payloads, matching the ``members`` table."""

    full_name: str = Field(
        ..., min_length=1, max_length=150, description="Member's full name"
    )
    email: EmailStr | None = Field(
        default=None, description="Member's email address (optional, unique)"
    )
    phone: str = Field(
        ..., min_length=7, max_length=20, description="Member's mobile number"
    )
    whatsapp_number: str | None = Field(
        default=None,
        max_length=20,
        description="Member's WhatsApp number, if different from phone",
    )
    birth_month: int = Field(..., ge=1, le=12, description="Month of birth (1-12)")
    birth_year: int = Field(..., ge=1900, le=_CURRENT_YEAR, description="Year of birth")
    gender: str = Field(
        ..., description="One of: male, female, other, prefer_not_to_say"
    )
    address: str | None = Field(
        default=None, max_length=500, description="Member's home address"
    )
    emergency_contact_name: str | None = Field(
        default=None,
        max_length=150,
        description="Name of the member's emergency contact",
    )
    emergency_contact_phone: str | None = Field(
        default=None,
        max_length=20,
        description="Phone number of the member's emergency contact",
    )
    photo_url: str | None = Field(
        default=None, max_length=500, description="URL of the member's profile photo"
    )
    training_category: TrainingCategory = Field(
        ..., description="Personal training or group training"
    )
    medical_history: str | None = Field(
        default=None,
        max_length=2000,
        description="Relevant medical history / conditions / injuries",
    )
    goal: str | None = Field(
        default=None, max_length=255, description="Member's fitness goal"
    )
    location_id: int | None = Field(
        default=None, description="Branch/location this member belongs to"
    )
    referred_by_name: str | None = Field(
        default=None,
        max_length=150,
        description="Free-text name of whoever referred this member (if not a member)",
    )
    referred_by_member_id: int | None = Field(
        default=None, description="The existing member who referred this member, if any"
    )

    @field_validator("email", "address", mode="before")
    @classmethod
    def empty_optional_strings_to_none(cls, value: object) -> object:
        return _empty_str_to_none(value)

    @field_validator("full_name", "emergency_contact_name", "referred_by_name")
    @classmethod
    def validate_name_fields(
        cls, value: str | None, info: ValidationInfo
    ) -> str | None:
        return _validate_name(value, info.field_name)

    @field_validator("phone", "whatsapp_number", "emergency_contact_phone")
    @classmethod
    def validate_phone_fields(
        cls, value: str | None, info: ValidationInfo
    ) -> str | None:
        return _validate_phone(value, info.field_name)

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, value: str) -> str:
        if value not in _VALID_GENDERS:
            raise ValueError(
                f"gender must be one of: {', '.join(sorted(_VALID_GENDERS))}"
            )
        return value


class MemberCreate(MemberBase):
    """Payload for enrolling a new member (``POST /api/v1/members``).

    ``enrolled_by`` is never accepted from the client — the service layer
    stamps it from the authenticated staff user's id. ``member_code`` is
    generated server-side, never accepted from the client either.
    """

    join_date: date = Field(
        default_factory=date.today, description="Date the member was enrolled"
    )
    status: MemberStatus = Field(
        default=MemberStatus.ACTIVE, description="Initial enrollment status"
    )


class MemberUpdate(BaseModel):
    """Payload for a partial update (``PUT /api/v1/members/{id}``).

    Every field is optional so callers can send only what changed.
    """

    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    email: EmailStr | None = Field(default=None)
    phone: str | None = Field(default=None, min_length=7, max_length=20)
    whatsapp_number: str | None = Field(default=None, max_length=20)
    birth_month: int | None = Field(default=None, ge=1, le=12)
    birth_year: int | None = Field(default=None, ge=1900, le=_CURRENT_YEAR)
    gender: str | None = Field(default=None)
    address: str | None = Field(default=None, max_length=500)
    emergency_contact_name: str | None = Field(default=None, max_length=150)
    emergency_contact_phone: str | None = Field(default=None, max_length=20)
    photo_url: str | None = Field(default=None, max_length=500)
    training_category: TrainingCategory | None = Field(default=None)
    medical_history: str | None = Field(default=None, max_length=2000)
    goal: str | None = Field(default=None, max_length=255)
    location_id: int | None = Field(default=None)
    referred_by_name: str | None = Field(default=None, max_length=150)
    referred_by_member_id: int | None = Field(default=None)
    join_date: date | None = Field(default=None)
    status: MemberStatus | None = Field(default=None)

    @field_validator("email", "address", mode="before")
    @classmethod
    def empty_optional_strings_to_none(cls, value: object) -> object:
        return _empty_str_to_none(value)

    @field_validator("full_name", "emergency_contact_name", "referred_by_name")
    @classmethod
    def validate_name_fields(
        cls, value: str | None, info: ValidationInfo
    ) -> str | None:
        return _validate_name(value, info.field_name)

    @field_validator("phone", "whatsapp_number", "emergency_contact_phone")
    @classmethod
    def validate_phone_fields(
        cls, value: str | None, info: ValidationInfo
    ) -> str | None:
        return _validate_phone(value, info.field_name)

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, value: str | None) -> str | None:
        if value is not None and value not in _VALID_GENDERS:
            raise ValueError(
                f"gender must be one of: {', '.join(sorted(_VALID_GENDERS))}"
            )
        return value


class MemberResponse(MemberBase):
    """Full member representation returned from detail/create/update endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    member_code: str
    join_date: date
    status: MemberStatus
    enrolled_by: int
    created_at: datetime
    updated_at: datetime
    current_plan_name: str | None = Field(
        default=None,
        description="Name of the member's most recently assigned plan (admin-created), or null if none",
    )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def age(self) -> int:
        """Current age in whole years, derived from ``birth_month``/``birth_year``."""
        today = date.today()
        years = today.year - self.birth_year
        had_birthday_this_year = today.month >= self.birth_month
        return years if had_birthday_this_year else years - 1


class MemberListItem(BaseModel):
    """Lightweight member representation used in list/search results."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    member_code: str
    full_name: str
    email: EmailStr | None = None
    phone: str
    photo_url: str | None = None
    status: MemberStatus
    training_category: TrainingCategory
    location_id: int | None = None
    join_date: date
    current_plan_name: str | None = Field(
        default=None,
        description="Name of the member's most recently assigned plan (admin-created), or null if none",
    )


class MemberListResponse(BaseModel):
    """Paginated envelope returned by ``GET /api/v1/members``."""

    items: list[MemberListItem]
    total: int = Field(..., description="Total number of members matching the filters")
    page: int = Field(..., ge=1, description="Current page number (1-indexed)")
    limit: int = Field(..., ge=1, description="Number of items per page")
    pages: int = Field(..., ge=0, description="Total number of pages available")
