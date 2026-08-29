"""Pydantic schemas for the Dashboard module.

Aggregates counts and sums across Member, MemberSubscription, Payment, and
Attendance (all owned by their respective modules) into a single stats
payload for ``GET /api/v1/dashboard/stats``. Full type hints, Pydantic v2
syntax, no ``any``-typed fields, per CLAUDE.md.
"""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import List

from pydantic import BaseModel, ConfigDict, Field


class ExpiringSubscriptionItem(BaseModel):
    """A single subscription nearing its due date, for the dashboard's mini-list."""

    model_config = ConfigDict(from_attributes=True)

    subscription_id: int = Field(..., description="MemberSubscription id")
    member_id: int = Field(..., description="Member id")
    member_name: str = Field(..., description="Member's full name")
    due_date: date = Field(..., description="Subscription due date")


class DashboardStatsResponse(BaseModel):
    """Aggregate stats payload powering the dashboard's stat cards."""

    total_members: int = Field(..., description="Total number of enrolled members")
    active_members: int = Field(..., description="Members with status ACTIVE")
    expiring_soon_count: int = Field(
        ..., description="Subscriptions with status EXPIRING_SOON"
    )
    overdue_count: int = Field(..., description="Subscriptions with status OVERDUE")
    revenue_this_month: Decimal = Field(
        ..., description="Sum of Payment.amount for the current calendar month"
    )
    attendance_today: int = Field(..., description="Count of Attendance rows for today")
    expiring_soon: List[ExpiringSubscriptionItem] = Field(
        default_factory=list,
        description=(
            "Up to 5 soonest-due EXPIRING_SOON subscriptions, for a dashboard mini-list"
        ),
    )
