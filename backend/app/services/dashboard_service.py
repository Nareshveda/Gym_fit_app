"""Business logic for aggregating dashboard statistics.

Read-only aggregate queries across Member, MemberSubscription, Payment, and
Attendance (owned by their respective modules) — this module performs no
writes.
"""

from __future__ import annotations

import logging
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import extract, func
from sqlalchemy.orm import Session, joinedload

from app.models.attendance import Attendance
from app.models.location import Location
from app.models.member import Member, MemberStatus
from app.models.member_subscription import MemberSubscription, SubscriptionStatus
from app.models.membership_plan import MembershipPlan
from app.models.payment import Payment
from app.schemas.dashboard import (
    AtRiskMember,
    DashboardStatsResponse,
    ExpiringSubscriptionItem,
    LocationMemberCount,
    MonthlyNewMembers,
    MostActiveMember,
    PlanMemberCount,
)

logger = logging.getLogger(__name__)

# Cap on the "expiring soon" / "at risk" mini-lists shown on the dashboard.
_EXPIRING_SOON_LIST_LIMIT = 5
_AT_RISK_LIST_LIMIT = 5
_NEW_MEMBERS_MONTHS = 6
_MOST_ACTIVE_WINDOW_DAYS = 30
_AT_RISK_WINDOW_DAYS = 14


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

    revenue_this_month = _revenue_for_month(db, today.year, today.month)
    last_month_year, last_month = (
        (today.year - 1, 12) if today.month == 1 else (today.year, today.month - 1)
    )
    revenue_last_month = _revenue_for_month(db, last_month_year, last_month)

    attendance_today = (
        db.query(func.count(Attendance.id)).filter(Attendance.date == today).scalar()
        or 0
    )
    week_start = today - timedelta(days=today.weekday())
    attendance_this_week = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.date >= week_start, Attendance.date <= today)
        .scalar()
        or 0
    )

    expiring_soon = _get_expiring_soon_list(db)
    members_by_location = _get_members_by_location(db)
    new_members_by_month = _get_new_members_by_month(db)
    most_active_member = _get_most_active_member(db)
    at_risk_members, at_risk_count = _get_at_risk_members(db)
    plan_split = _get_plan_split(db)

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
        revenue_this_month=revenue_this_month,
        revenue_last_month=revenue_last_month,
        attendance_today=attendance_today,
        attendance_this_week=attendance_this_week,
        expiring_soon=expiring_soon,
        members_by_location=members_by_location,
        new_members_by_month=new_members_by_month,
        most_active_member=most_active_member,
        at_risk_members=at_risk_members,
        at_risk_count=at_risk_count,
        plan_split=plan_split,
    )


def _revenue_for_month(db: Session, year: int, month: int) -> Decimal:
    """Sum of `Payment.amount` for the given calendar month."""
    total = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(
            extract("year", Payment.payment_date) == year,
            extract("month", Payment.payment_date) == month,
        )
        .scalar()
        or 0
    )
    return Decimal(total)


def _get_expiring_soon_list(db: Session) -> list[ExpiringSubscriptionItem]:
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


def _get_members_by_location(db: Session) -> list[LocationMemberCount]:
    """Active member headcount per branch, plus an 'Unassigned' bucket."""
    rows = (
        db.query(Location.id, Location.name, func.count(Member.id))
        .outerjoin(
            Member,
            (Member.location_id == Location.id)
            & (Member.status == MemberStatus.ACTIVE),
        )
        .group_by(Location.id, Location.name)
        .order_by(Location.name)
        .all()
    )
    result = [
        LocationMemberCount(location_id=loc_id, location_name=name, member_count=count)
        for loc_id, name, count in rows
    ]
    unassigned_count = (
        db.query(func.count(Member.id))
        .filter(Member.location_id.is_(None), Member.status == MemberStatus.ACTIVE)
        .scalar()
        or 0
    )
    if unassigned_count:
        result.append(
            LocationMemberCount(
                location_id=None,
                location_name="Unassigned",
                member_count=unassigned_count,
            )
        )
    return result


def _get_new_members_by_month(
    db: Session, months: int = _NEW_MEMBERS_MONTHS
) -> list[MonthlyNewMembers]:
    """New enrollments for each of the last `months` calendar months, oldest first."""
    today = date.today()
    periods: list[tuple[int, int]] = []
    year, month = today.year, today.month
    for _ in range(months):
        periods.append((year, month))
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    periods.reverse()

    range_start = date(periods[0][0], periods[0][1], 1)
    rows = (
        db.query(
            extract("year", Member.join_date),
            extract("month", Member.join_date),
            func.count(Member.id),
        )
        .filter(Member.join_date >= range_start)
        .group_by(extract("year", Member.join_date), extract("month", Member.join_date))
        .all()
    )
    counts = {(int(y), int(m)): count for y, m, count in rows}
    return [
        MonthlyNewMembers(month=f"{y:04d}-{m:02d}", count=counts.get((y, m), 0))
        for y, m in periods
    ]


def _get_most_active_member(
    db: Session, days: int = _MOST_ACTIVE_WINDOW_DAYS
) -> MostActiveMember | None:
    """The member with the most check-ins in the trailing `days` window."""
    since = date.today() - timedelta(days=days)
    row = (
        db.query(Member, func.count(Attendance.id).label("visit_count"))
        .join(Attendance, Attendance.member_id == Member.id)
        .filter(Attendance.date >= since)
        .group_by(Member.id)
        .order_by(func.count(Attendance.id).desc())
        .first()
    )
    if row is None:
        return None
    member, visit_count = row
    return MostActiveMember(
        member_id=member.id, member_name=member.full_name, visit_count=visit_count
    )


def _get_at_risk_members(
    db: Session, days: int = _AT_RISK_WINDOW_DAYS
) -> tuple[list[AtRiskMember], int]:
    """Active members with no check-in in the trailing `days` window — worth a nudge.

    Returns (up to `_AT_RISK_LIST_LIMIT` members for the mini-list, total count).
    """
    since = date.today() - timedelta(days=days)
    last_visit = (
        db.query(Attendance.member_id, func.max(Attendance.date).label("last_visit"))
        .group_by(Attendance.member_id)
        .subquery()
    )
    query = (
        db.query(Member, last_visit.c.last_visit)
        .outerjoin(last_visit, last_visit.c.member_id == Member.id)
        .filter(Member.status == MemberStatus.ACTIVE)
        .filter((last_visit.c.last_visit.is_(None)) | (last_visit.c.last_visit < since))
    )
    total = query.count()
    rows = query.order_by(Member.full_name).limit(_AT_RISK_LIST_LIMIT).all()
    members = [
        AtRiskMember(
            member_id=member.id,
            member_name=member.full_name,
            last_visit_date=last_visit_date,
        )
        for member, last_visit_date in rows
    ]
    return members, total


def _get_plan_split(db: Session) -> list[PlanMemberCount]:
    """Active members grouped by their current (most recently assigned)
    membership plan — the actual admin-created plan, not a fixed category."""
    latest_subscription_ids = (
        db.query(
            MemberSubscription.member_id,
            func.max(MemberSubscription.id).label("latest_id"),
        )
        .group_by(MemberSubscription.member_id)
        .subquery()
    )
    rows = (
        db.query(MembershipPlan.name, func.count(Member.id))
        .select_from(Member)
        .join(latest_subscription_ids, latest_subscription_ids.c.member_id == Member.id)
        .join(
            MemberSubscription,
            MemberSubscription.id == latest_subscription_ids.c.latest_id,
        )
        .join(MembershipPlan, MembershipPlan.id == MemberSubscription.plan_id)
        .filter(Member.status == MemberStatus.ACTIVE)
        .group_by(MembershipPlan.name)
        .all()
    )
    result = [
        PlanMemberCount(plan_name=name, member_count=count) for name, count in rows
    ]

    no_plan_count = (
        db.query(func.count(Member.id))
        .filter(Member.status == MemberStatus.ACTIVE)
        .filter(~Member.id.in_(db.query(MemberSubscription.member_id).distinct()))
        .scalar()
        or 0
    )
    if no_plan_count:
        result.append(PlanMemberCount(plan_name="No Plan", member_count=no_plan_count))
    return result
