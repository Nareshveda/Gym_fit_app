"""API endpoints for staff/trainer attendance.

Mirrors ``app.routers.attendance`` (the member-facing equivalent). Every
endpoint requires an authenticated user via ``get_current_user`` — any
staff/trainer can check themselves (or, via ``staff_id``, a colleague) in.
"""

from __future__ import annotations

import logging
from datetime import date as date_type

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.staff_attendance import StaffAttendance
from app.schemas.staff_attendance import StaffAttendanceResponse, StaffCheckInRequest
from app.services import staff_attendance_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/staff-attendance", tags=["staff-attendance"])


def _to_response(attendance: StaffAttendance) -> StaffAttendanceResponse:
    """Build a `StaffAttendanceResponse`, denormalizing the staff user's name
    from the loaded relationship so clients don't need a second lookup."""
    return StaffAttendanceResponse(
        id=attendance.id,
        staff_id=attendance.staff_id,
        staff_name=attendance.staff.full_name,
        check_in_time=attendance.check_in_time,
        check_out_time=attendance.check_out_time,
        date=attendance.date,
        created_at=attendance.created_at,
    )


@router.post(
    "/check-in",
    response_model=StaffAttendanceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def check_in(
    payload: StaffCheckInRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> StaffAttendanceResponse:
    """Check a staff/trainer user in for today (defaults to the caller).

    Fails with 404 if the target user does not exist, or 409 if they
    already have an open (not checked-out) attendance record for today.
    """
    staff_id = payload.staff_id if payload.staff_id is not None else current_user.id
    attendance = staff_attendance_service.check_in(db, staff_id)
    return _to_response(attendance)


@router.put("/{attendance_id}/check-out", response_model=StaffAttendanceResponse)
async def check_out(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> StaffAttendanceResponse:
    """Check a staff/trainer user out by closing the given attendance record.

    Fails with 404 if the record does not exist, or 409 if it was already
    checked out.
    """
    attendance = staff_attendance_service.check_out(db, attendance_id)
    return _to_response(attendance)


@router.get("/", response_model=list[StaffAttendanceResponse])
async def list_attendance(
    date: date_type | None = None,
    staff_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> list[StaffAttendanceResponse]:
    """List staff attendance records, optionally filtered by date and/or staff user."""
    records = staff_attendance_service.list_attendance(
        db, date_filter=date, staff_id=staff_id
    )
    return [_to_response(record) for record in records]
