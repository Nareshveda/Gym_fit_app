"""Business logic for staff/trainer attendance.

Mirrors ``app.services.attendance_service`` (the member-facing equivalent),
including the "no duplicate open check-in" rule, but tracks ``users``
instead of ``members`` so staff attendance is reported separately.
"""

from __future__ import annotations

import logging
from datetime import date as date_type
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.exceptions import ConflictError, NotFoundError
from app.models.staff_attendance import StaffAttendance
from app.models.user import User

logger = logging.getLogger(__name__)


def check_in(db: Session, staff_id: int) -> StaffAttendance:
    """Check a staff/trainer user in for today.

    Raises:
        NotFoundError: if no user exists with ``staff_id``.
        ConflictError: if the user already has an open attendance record
            (i.e. a record for today with ``check_out_time`` still null).
    """
    staff = db.query(User).filter(User.id == staff_id).first()
    if staff is None:
        raise NotFoundError("Staff user")

    today = date_type.today()
    open_record = (
        db.query(StaffAttendance)
        .filter(
            StaffAttendance.staff_id == staff_id,
            StaffAttendance.date == today,
            StaffAttendance.check_out_time.is_(None),
        )
        .first()
    )
    if open_record is not None:
        raise ConflictError("Staff user already has an open check-in for today")

    now = datetime.now(timezone.utc)
    attendance = StaffAttendance(
        staff_id=staff_id,
        check_in_time=now,
        check_out_time=None,
        date=today,
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    logger.info("Staff %s checked in (attendance_id=%s)", staff_id, attendance.id)
    return attendance


def check_out(db: Session, attendance_id: int) -> StaffAttendance:
    """Check a staff/trainer user out by closing the given attendance record.

    Raises:
        NotFoundError: if no attendance record exists with ``attendance_id``.
        ConflictError: if the record has already been checked out.
    """
    attendance = (
        db.query(StaffAttendance).filter(StaffAttendance.id == attendance_id).first()
    )
    if attendance is None:
        raise NotFoundError("Staff attendance record")

    if attendance.check_out_time is not None:
        raise ConflictError("Staff attendance record is already checked out")

    attendance.check_out_time = datetime.now(timezone.utc)
    db.commit()
    db.refresh(attendance)
    logger.info(
        "Staff attendance %s checked out (staff_id=%s)",
        attendance_id,
        attendance.staff_id,
    )
    return attendance


def list_attendance(
    db: Session,
    date_filter: date_type | None = None,
    staff_id: int | None = None,
) -> list[StaffAttendance]:
    """List staff attendance records, optionally filtered by date and/or staff user."""
    query = db.query(StaffAttendance)
    if date_filter is not None:
        query = query.filter(StaffAttendance.date == date_filter)
    if staff_id is not None:
        query = query.filter(StaffAttendance.staff_id == staff_id)
    return query.order_by(StaffAttendance.check_in_time.desc()).all()
