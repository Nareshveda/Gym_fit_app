"""Member self-service portal endpoints.

Mounted at ``/api/v1/me`` (not ``/api/v1/members/{id}``) to avoid colliding
with that router's ``/{member_id}`` path — and because these read the
member's *own* record from their token via ``get_current_member``, never a
path-supplied id. A logged-in member sees only their own attendance and
vitals here; everything else (other members, payments, admin, plans) stays
behind ``get_current_user``, which rejects member tokens outright.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_member, get_db
from app.models.attendance import Attendance
from app.models.member import Member
from app.models.member_vital import MemberVital
from app.schemas.attendance import AttendanceResponse
from app.schemas.member_vital import VitalResponse, VitalsDashboardResponse
from app.services import attendance_service, vital_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/me", tags=["member-portal"])


def _to_attendance_response(attendance: Attendance) -> AttendanceResponse:
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


@router.get("/attendance", response_model=list[AttendanceResponse])
async def get_my_attendance(
    current_member: Member = Depends(get_current_member),
    db: Session = Depends(get_db),
) -> list[AttendanceResponse]:
    """List the logged-in member's own attendance history."""
    records = attendance_service.list_member_attendance(db, current_member.id)
    return [_to_attendance_response(record) for record in records]


@router.get("/vitals", response_model=list[VitalResponse])
async def get_my_vitals(
    current_member: Member = Depends(get_current_member),
    db: Session = Depends(get_db),
) -> list[MemberVital]:
    """List the logged-in member's own vitals history, oldest first."""
    return vital_service.list_vitals(db, current_member.id)


@router.get("/vitals/dashboard", response_model=VitalsDashboardResponse)
async def get_my_vitals_dashboard(
    current_member: Member = Depends(get_current_member),
    db: Session = Depends(get_db),
) -> VitalsDashboardResponse:
    """The logged-in member's vitals history plus deltas vs. their baseline reading."""
    return vital_service.get_dashboard(db, current_member.id)
