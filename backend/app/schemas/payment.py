"""Pydantic schemas for payments."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.payment import PaymentMethod
from app.schemas.subscription import SubscriptionResponse


class PaymentCreate(BaseModel):
    """Payload to record a payment against a member's subscription."""

    member_id: int = Field(..., gt=0)
    subscription_id: int = Field(..., gt=0)
    amount: Decimal = Field(
        ..., gt=0, description="Payment amount; must be greater than 0."
    )
    payment_method: PaymentMethod
    payment_date: date | None = Field(
        default=None,
        description="Date the payment was made; defaults to today when omitted.",
    )
    reference_number: str | None = Field(
        default=None,
        max_length=100,
        description="Transaction/UTR/reference number, e.g. for UPI or bank transfer",
    )
    notes: str | None = Field(default=None, max_length=1000)


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
    reference_number: str | None
    notes: str | None
    created_at: datetime

    # The subscription (and its admin-created Plan) this payment was made
    # against — the frontend renders `subscription.plan.name` as the "Plan"
    # column.
    subscription: SubscriptionResponse | None = None
