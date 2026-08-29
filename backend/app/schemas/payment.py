"""Pydantic schemas for payments."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.payment import PaymentMethod


class PaymentCreate(BaseModel):
    """Payload to record a payment against a member's subscription."""

    member_id: int = Field(..., gt=0)
    subscription_id: int = Field(..., gt=0)
    amount: Decimal = Field(..., gt=0, description="Payment amount; must be greater than 0.")
    payment_method: PaymentMethod
    payment_date: Optional[date] = Field(
        default=None, description="Date the payment was made; defaults to today when omitted."
    )
    notes: Optional[str] = Field(default=None, max_length=1000)


class PaymentResponse(BaseModel):
    """A recorded payment as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    member_id: int
    subscription_id: int
    amount: Decimal
    payment_date: date
    payment_method: PaymentMethod
    recorded_by: int
    notes: Optional[str]
    created_at: datetime
