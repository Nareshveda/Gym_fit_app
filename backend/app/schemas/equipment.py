"""Pydantic schemas for gym equipment/inventory (admin-only module)."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.location import LocationResponse


class EquipmentCreate(BaseModel):
    """Payload to add a new equipment record."""

    name: str = Field(..., min_length=1, max_length=150)
    brand: str | None = Field(default=None, max_length=150)
    purchase_date: date | None = None
    amount: Decimal | None = Field(default=None, ge=0, description="Purchase amount")
    warranty_details: str | None = Field(default=None, max_length=500)
    service_schedule: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=1000)
    location_ids: list[int] = Field(
        default_factory=list,
        description="Locations this equipment is assigned to (empty = unassigned stock)",
    )


class EquipmentUpdate(BaseModel):
    """Payload to update an equipment record. All fields optional."""

    name: str | None = Field(default=None, min_length=1, max_length=150)
    brand: str | None = Field(default=None, max_length=150)
    purchase_date: date | None = None
    amount: Decimal | None = Field(default=None, ge=0)
    warranty_details: str | None = Field(default=None, max_length=500)
    service_schedule: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=1000)
    location_ids: list[int] | None = Field(
        default=None, description="Replaces the full set of assigned locations"
    )


class EquipmentResponse(BaseModel):
    """An equipment record as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    brand: str | None
    purchase_date: date | None
    amount: Decimal | None
    warranty_details: str | None
    service_schedule: str | None
    notes: str | None
    locations: list[LocationResponse]
    document_url: str | None = None
    document_filename: str | None = None
    created_at: datetime
    updated_at: datetime
