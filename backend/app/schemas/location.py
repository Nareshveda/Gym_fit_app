"""Pydantic schemas for gym locations/branches."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LocationCreate(BaseModel):
    """Payload to create a new location/branch."""

    name: str = Field(..., min_length=1, max_length=150)
    address: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=30)


class LocationUpdate(BaseModel):
    """Payload to update an existing location. All fields optional."""

    name: str | None = Field(default=None, min_length=1, max_length=150)
    address: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=30)
    is_active: bool | None = None


class LocationResponse(BaseModel):
    """A location/branch as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    address: str | None
    phone: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
