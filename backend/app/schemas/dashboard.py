"""Pydantic schemas for the Dashboard module.

Aggregates counts and sums across Member, MemberSubscription, Payment, and
Attendance (all owned by their respective modules) into a single stats
payload for ``GET /api/v1/dashboard/stats``. Full type hints, Pydantic v2
syntax, no ``any``-typed fields, per CLAUDE.md.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ExpiringSubscriptionItem(BaseModel):
    """A single subscription nearing its due date, for the dashboard's mini-list."""

    model_config = ConfigDict(from_attributes=True)

    subscription_id: int = Field(..., description="MemberSubscription id")
    member_id: int = Field(..., description="Member id")
    member_name: str = Field(..., description="Member's full name")
    due_date: date = Field(..., description="Subscription due date")


class LocationMemberCount(BaseModel):
    """Active member count for one branch/location (or "Unassigned")."""

    location_id: int | None = Field(
        None, description="Location id, or null for members with no branch assigned"
    )
    location_name: str = Field(..., description="Location name, or 'Unassigned'")
    member_count: int = Field(..., description="Active members at this location")


class MonthlyNewMembers(BaseModel):
    """New enrollments in a single calendar month, for a trend chart."""

    month: str = Field(..., description="Calendar month as YYYY-MM")
    count: int = Field(..., description="Members enrolled (join_date) in that month")


class MostActiveMember(BaseModel):
    """The member with the most check-ins in the trailing window."""

    member_id: int
    member_name: str
    visit_count: int = Field(
        ..., description="Attendance check-ins in the trailing window"
    )


class AtRiskMember(BaseModel):
    """An active member with no check-in in the trailing window — worth a nudge."""

    member_id: int
    member_name: str
    last_visit_date: date | None = Field(
        None,
        description="Most recent attendance date on record, or null if never checked in",
    )


class PlanMemberCount(BaseModel):
    """Active member count on one admin-created membership plan (or "No Plan")."""

    plan_name: str
    member_count: int


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
    revenue_last_month: Decimal = Field(
        ..., description="Sum of Payment.amount for the previous calendar month"
    )
    attendance_today: int = Field(..., description="Count of Attendance rows for today")
    attendance_this_week: int = Field(
        ...,
        description="Count of Attendance rows from Monday of this week through today",
    )
    expiring_soon: list[ExpiringSubscriptionItem] = Field(
        default_factory=list,
        description=(
            "Up to 5 soonest-due EXPIRING_SOON subscriptions, for a dashboard mini-list"
        ),
    )
    members_by_location: list[LocationMemberCount] = Field(default_factory=list)
    new_members_by_month: list[MonthlyNewMembers] = Field(
        default_factory=list,
        description="New enrollments for each of the last 6 calendar months, oldest first",
    )
    most_active_member: MostActiveMember | None = Field(
        None,
        description="Most check-ins in the last 30 days, if any attendance is on record",
    )
    at_risk_members: list[AtRiskMember] = Field(
        default_factory=list,
        description="Up to 5 active members with no check-in in the last 14 days",
    )
    at_risk_count: int = Field(
        ..., description="Total active members with no check-in in the last 14 days"
    )
    plan_split: list[PlanMemberCount] = Field(
        default_factory=list,
        description="Active members grouped by their current membership plan (admin-created plan names)",
    )
