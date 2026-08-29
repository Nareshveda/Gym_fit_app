"""Business logic for aggregating dashboard statistics.

Read-only aggregate queries across Member, MemberSubscription, Payment, and
Attendance (owned by their respective modules) — this module performs no
writes.
"""
from __future__ import annotations

import logging
from datetime import date
from decimal import Decimal
from typing import List

from sqlalchemy import extract, func
from sqlalchemy.orm import Session, joinedload

from app.models.attendance import Attendance
from app.models.member import Member, MemberStatus
from app.models.member_subscription import MemberSubscription, SubscriptionStatus
from app.models.payment import Payment
from app.schemas.dashboard import DashboardStatsResponse, ExpiringSubscriptionItem

logger = logging.getLogger(__name__)

# Cap on the "expiring soon" mini-list shown on the dashboard.
_EXPIRING_SOON_LIST_LIMIT = 5


def get_dashboard_stats(db: Session) -> DashboardStatsResponse:
    """Compute the aggregate stats shown on the dashboard's stat cards.

    Runs one aggregate query per metric: member counts by status, subscription
    counts by status, this calendar month's payment total, today's attendance
    count, and a short list of the soonest-due EXPIRING_SOON subscriptions.
    """
    today = date.today()

    total_members = db.query(func.count(Member.id)).scalar() or 0

    active_members = (
        db.query(func.count(Member.id))
        .filter(Member.status == MemberStatus.ACTIVE)
        .scalar()
        or 0
    )

    expiring_soon_count = (
        db.query(func.count(MemberSubscription.id))
        .filter(MemberSubscription.status == SubscriptionStatus.EXPIRING_SOON)
        .scalar()
        or 0
    )

    overdue_count = (
        db.query(func.count(MemberSubscription.id))
        .filter(MemberSubscription.status == SubscriptionStatus.OVERDUE)
        .scalar()
        or 0
    )

    revenue_this_month: Decimal = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(
            extract("year", Payment.payment_date) == today.year,
            extract("month", Payment.payment_date) == today.month,
        )
        .scalar()
        or Decimal("0")
    )

    attendance_today = (
        db.query(func.count(Attendance.id)).filter(Attendance.date == today).scalar() or 0
    )

    expiring_soon = _get_expiring_soon_list(db)

    logger.info(
        "Computed dashboard stats: total_members=%s active_members=%s "
        "expiring_soon_count=%s overdue_count=%s revenue_this_month=%s attendance_today=%s",
        total_members,
        active_members,
        expiring_soon_count,
        overdue_count,
        revenue_this_month,
        attendance_today,
    )

    return DashboardStatsResponse(
        total_members=total_members,
        active_members=active_members,
        expiring_soon_count=expiring_soon_count,
        overdue_count=overdue_count,
        revenue_this_month=Decimal(revenue_this_month),
        attendance_today=attendance_today,
        expiring_soon=expiring_soon,
    )


def _get_expiring_soon_list(db: Session) -> List[ExpiringSubscriptionItem]:
    """Return the soonest-due EXPIRING_SOON subscriptions, for the dashboard mini-list."""
    rows = (
        db.query(MemberSubscription)
        .options(joinedload(MemberSubscription.member))
        .filter(MemberSubscription.status == SubscriptionStatus.EXPIRING_SOON)
        .order_by(MemberSubscription.due_date.asc())
        .limit(_EXPIRING_SOON_LIST_LIMIT)
        .all()
    )
    return [
        ExpiringSubscriptionItem(
            subscription_id=row.id,
            member_id=row.member_id,
            member_name=row.member.full_name,
            due_date=row.due_date,
        )
        for row in rows
    ]
