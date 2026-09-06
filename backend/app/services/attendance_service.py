"""Business logic for the attendance module.

Routers call into these functions rather than touching the ORM directly, per
project convention (skills/BACKEND.md). All functions take an explicit
``Session`` so they stay easy to unit test without a live FastAPI app.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import date as date_type
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.exceptions import ConflictError, NotFoundError
from app.models.attendance import Attendance
from app.models.member import Member

logger = logging.getLogger(__name__)

# A streak can't meaningfully run longer than this many days; capping the
# lookback keeps the streak query cheap regardless of how long a member has
# been enrolled.
_STREAK_LOOKBACK_DAYS = 400


def check_in(db: Session, member_id: int) -> Attendance:
    """Check a member in for today.

    Raises:
        NotFoundError: if no member exists with ``member_id``.
        ConflictError: if the member already has an open attendance record
            (i.e. a record for today with ``check_out_time`` still null).
    """
    member = db.query(Member).filter(Member.id == member_id).first()
    if member is None:
        raise NotFoundError("Member")

    today = date_type.today()
    open_record = (
        db.query(Attendance)
        .filter(
            Attendance.member_id == member_id,
            Attendance.date == today,
            Attendance.check_out_time.is_(None),
        )
        .first()
    )
    if open_record is not None:
        raise ConflictError("Member already has an open check-in for today")

    now = datetime.now(timezone.utc)
    attendance = Attendance(
        member_id=member_id,
        check_in_time=now,
        check_out_time=None,
        date=today,
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    logger.info("Member %s checked in (attendance_id=%s)", member_id, attendance.id)
    return attendance


def check_out(db: Session, attendance_id: int) -> Attendance:
    """Check a member out by closing the given attendance record.

    Raises:
        NotFoundError: if no attendance record exists with ``attendance_id``.
        ConflictError: if the record has already been checked out.
    """
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if attendance is None:
        raise NotFoundError("Attendance record")

    if attendance.check_out_time is not None:
        raise ConflictError("Attendance record is already checked out")

    attendance.check_out_time = datetime.now(timezone.utc)
    db.commit()
    db.refresh(attendance)
    logger.info(
        "Attendance %s checked out (member_id=%s)", attendance_id, attendance.member_id
    )
    return attendance


def list_attendance(
    db: Session,
    date_filter: date_type | None = None,
    member_id: int | None = None,
) -> list[Attendance]:
    """List attendance records, optionally filtered by date and/or member."""
    query = db.query(Attendance)
    if date_filter is not None:
        query = query.filter(Attendance.date == date_filter)
    if member_id is not None:
        query = query.filter(Attendance.member_id == member_id)
    return query.order_by(Attendance.check_in_time.desc()).all()


def list_member_attendance(db: Session, member_id: int) -> list[Attendance]:
    """List the full attendance history for a single member.

    Raises:
        NotFoundError: if no member exists with ``member_id``.
    """
    member = db.query(Member).filter(Member.id == member_id).first()
    if member is None:
        raise NotFoundError("Member")

    return (
        db.query(Attendance)
        .filter(Attendance.member_id == member_id)
        .order_by(Attendance.check_in_time.desc())
        .all()
    )


def _current_streak(attendance_dates: set[date_type]) -> int:
    """Continuous-day count ending today (or yesterday, if today has no
    check-in yet) — 0 if the most recent visit is older than that."""
    if not attendance_dates:
        return 0

    today = date_type.today()
    cursor = today if today in attendance_dates else today - timedelta(days=1)
    if cursor not in attendance_dates:
        return 0

    streak = 0
    while cursor in attendance_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def compute_streaks(db: Session, member_ids: list[int]) -> dict[int, int]:
    """Current continuous-day attendance streak for each of the given members.

    Members with no recent attendance are simply absent from the result
    (callers should default to 0). A single grouped query, not one query per
    member, and capped to the last `_STREAK_LOOKBACK_DAYS` days so it stays
    cheap no matter how long a member's full history is.
    """
    if not member_ids:
        return {}

    cutoff = date_type.today() - timedelta(days=_STREAK_LOOKBACK_DAYS)
    rows = (
        db.query(Attendance.member_id, Attendance.date)
        .filter(Attendance.member_id.in_(member_ids), Attendance.date >= cutoff)
        .distinct()
        .all()
    )

    dates_by_member: dict[int, set[date_type]] = defaultdict(set)
    for member_id, day in rows:
        dates_by_member[member_id].add(day)

    return {member_id: _current_streak(dates) for member_id, dates in dates_by_member.items()}


def get_member_streak(db: Session, member_id: int) -> int:
    """Current continuous-day attendance streak for a single member."""
    return compute_streaks(db, [member_id]).get(member_id, 0)
