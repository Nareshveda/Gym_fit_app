"""Business logic for the attendance module.

Routers call into these functions rather than touching the ORM directly, per
project convention (skills/BACKEND.md). All functions take an explicit
``Session`` so they stay easy to unit test without a live FastAPI app.
"""

from __future__ import annotations

import logging
from datetime import date as date_type
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.exceptions import ConflictError, NotFoundError
from app.models.attendance import Attendance
from app.models.member import Member

logger = logging.getLogger(__name__)


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
