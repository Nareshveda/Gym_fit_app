"""Pydantic schemas for public "Join the Crew" inquiries (leads)."""

from __future__ import annotations

import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator

# Same shape as the member phone validator: 7-15 significant digits,
# optionally with a leading "+", and spaces/hyphens as separators.
_PHONE_PATTERN = re.compile(r"^\+?[0-9][0-9 \-]{5,20}[0-9]$")
_NOTE_MAX_WORDS = 500


def _validate_phone(value: str, field_name: str | None) -> str:
    digits = re.sub(r"[^0-9]", "", value)
    if len(digits) < 7 or len(digits) > 15 or not _PHONE_PATTERN.match(value):
        raise ValueError(
            f"{field_name or 'value'} must be 7-15 digits, optionally with +, spaces, or hyphens"
        )
    return value


class LeadCreate(BaseModel):
    """Payload submitted from the public "Join the Crew" inquiry form."""

    full_name: str = Field(..., min_length=1, max_length=150)
    phone_number: str = Field(..., min_length=7, max_length=20)
    whatsapp_number: str = Field(..., min_length=7, max_length=20)
    preferred_time: str = Field(
        ..., min_length=1, max_length=150, description="Preferred time to call/discuss"
    )
    note: str | None = Field(default=None, max_length=4000)

    @field_validator("phone_number", "whatsapp_number")
    @classmethod
    def validate_phone_fields(cls, value: str, info: ValidationInfo) -> str:
        return _validate_phone(value, info.field_name)

    @field_validator("note")
    @classmethod
    def validate_note_word_count(cls, value: str | None) -> str | None:
        if value is None or value.strip() == "":
            return None
        word_count = len(value.split())
        if word_count > _NOTE_MAX_WORDS:
            raise ValueError(f"note must be {_NOTE_MAX_WORDS} words or fewer")
        return value


class LeadUpdate(BaseModel):
    """Payload to mark whether a lead has been contacted (owner/admin only)."""

    contacted: bool


class LeadResponse(BaseModel):
    """A submitted inquiry, as reviewed by staff/owner in the admin area."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    phone_number: str
    whatsapp_number: str
    preferred_time: str
    note: str | None
    contacted: bool
    created_at: datetime
