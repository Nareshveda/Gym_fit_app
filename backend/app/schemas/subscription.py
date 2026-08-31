"""Pydantic schemas for member subscriptions."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.member_subscription import SubscriptionStatus
from app.schemas.plan import PlanResponse


class SubscriptionCreate(BaseModel):
    """Payload to assign a membership plan to a member."""

    plan_id: int = Field(..., gt=0)
    start_date: date | None = Field(
        default=None,
        description="Subscription start date; defaults to today when omitted.",
    )


class SubscriptionResponse(BaseModel):
    """A member's subscription as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    member_id: int
    plan_id: int
    start_date: date
    due_date: date
    status: SubscriptionStatus
    created_at: datetime
    updated_at: datetime
    plan: PlanResponse | None = None
