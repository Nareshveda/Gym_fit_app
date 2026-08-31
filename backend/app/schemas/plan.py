"""Pydantic schemas for membership plans."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.membership_plan import DurationType


class PlanCreate(BaseModel):
    """Payload to create a new membership plan."""

    name: str = Field(..., min_length=1, max_length=150)
    duration_type: DurationType
    price: Decimal = Field(..., gt=0)
    description: str | None = Field(default=None, max_length=1000)


class PlanUpdate(BaseModel):
    """Payload to update an existing membership plan. All fields are optional (partial update)."""

    name: str | None = Field(default=None, min_length=1, max_length=150)
    duration_type: DurationType | None = None
    price: Decimal | None = Field(default=None, gt=0)
    description: str | None = Field(default=None, max_length=1000)
    is_active: bool | None = None


class PlanResponse(BaseModel):
    """Membership plan as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    duration_type: DurationType
    price: Decimal
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
