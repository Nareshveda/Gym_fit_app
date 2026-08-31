"""API endpoints for the attendance module.

Exposes two routers:
    - ``router``: the primary ``/api/v1/attendance`` endpoints (check-in,
      check-out, and the filterable list).
    - ``members_router``: a single ``/api/v1/members/{id}/attendance``
      endpoint, kept in this file (attendance module ownership) but mounted
      under the members path so member history reads naturally as a
      sub-resource of a member.

Every endpoint requires an authenticated user via ``get_current_user``.
"""

from __future__ import annotations

import logging
from datetime import date as date_type

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceResponse, CheckInRequest
from app.services import attendance_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/attendance", tags=["attendance"])
members_router = APIRouter(prefix="/api/v1/members", tags=["attendance"])


def _to_response(attendance: Attendance) -> AttendanceResponse:
    """Build an `AttendanceResponse`, denormalizing the member's name/photo
    from the loaded relationship so clients don't need a second lookup."""
    return AttendanceResponse(
        id=attendance.id,
        member_id=attendance.member_id,
        member_name=attendance.member.full_name,
        member_photo_url=attendance.member.photo_url,
        check_in_time=attendance.check_in_time,
        check_out_time=attendance.check_out_time,
        date=attendance.date,
        created_at=attendance.created_at,
    )


@router.post(
    "/check-in", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED
)
async def check_in(
    payload: CheckInRequest,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
) -> AttendanceResponse:
    """Check a member in for today.

    Fails with 404 if the member does not exist, or 409 if the member
    already has an open (not checked-out) attendance record for today.
    """
    attendance = attendance_service.check_in(db, payload.member_id)
    return _to_response(attendance)


@router.put("/{attendance_id}/check-out", response_model=AttendanceResponse)
async def check_out(
    attendance_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
) -> AttendanceResponse:
    """Check a member out by closing the given attendance record.

    Fails with 404 if the record does not exist, or 409 if it was already
    checked out.
    """
    attendance = attendance_service.check_out(db, attendance_id)
    return _to_response(attendance)


@router.get("/", response_model=list[AttendanceResponse])
async def list_attendance(
    date: date_type | None = None,
    member_id: int | None = None,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
) -> list[AttendanceResponse]:
    """List attendance records, optionally filtered by date and/or member."""
    records = attendance_service.list_attendance(
        db, date_filter=date, member_id=member_id
    )
    return [_to_response(record) for record in records]


@members_router.get("/{member_id}/attendance", response_model=list[AttendanceResponse])
async def list_member_attendance(
    member_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
) -> list[AttendanceResponse]:
    """List the full attendance history for a single member.

    Fails with 404 if the member does not exist.
    """
    records = attendance_service.list_member_attendance(db, member_id)
    return [_to_response(record) for record in records]
