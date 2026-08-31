"""Pydantic request/response schemas for member vitals (progress tracking)."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class VitalCreate(BaseModel):
    """Payload to log a new vitals reading for a member."""

    recorded_at: date = Field(
        default_factory=date.today, description="Date the reading was taken"
    )
    height_cm: Decimal | None = Field(
        default=None,
        gt=0,
        description="Height in centimeters (omit to reuse the member's last known height)",
    )
    weight_kg: Decimal = Field(..., gt=0, description="Weight in kilograms")
    notes: str | None = Field(
        default=None, max_length=500, description="Optional trainer notes"
    )


class VitalResponse(BaseModel):
    """A single vitals reading as returned by the vitals endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    member_id: int
    recorded_at: date
    height_cm: Decimal | None
    weight_kg: Decimal
    bmi: Decimal | None
    notes: str | None
    recorded_by: int
    created_at: datetime


class VitalsDashboardResponse(BaseModel):
    """A member's vitals history plus the deltas needed to chart progress."""

    member_id: int
    history: list[VitalResponse] = Field(..., description="All readings, oldest first")
    latest: VitalResponse | None = Field(
        default=None, description="Most recent reading"
    )
    baseline: VitalResponse | None = Field(
        default=None, description="First reading, taken at enrollment"
    )
    weight_change_kg: Decimal | None = Field(
        default=None,
        description="latest.weight_kg - baseline.weight_kg (negative = weight lost)",
    )
    bmi_change: Decimal | None = Field(
        default=None, description="latest.bmi - baseline.bmi"
    )
