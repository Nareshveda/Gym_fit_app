"""API endpoints for member vitals (progress tracking).

Mounted under ``/api/v1/members/{member_id}/vitals`` as a sub-resource of
Member Enrollment, mirroring how the Attendance module mounts a member
history endpoint under the same prefix. Every endpoint requires an
authenticated user via ``get_current_user``.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.member_vital import MemberVital
from app.schemas.member_vital import VitalCreate, VitalResponse, VitalsDashboardResponse
from app.services import vital_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/members", tags=["vitals"])


@router.post(
    "/{member_id}/vitals",
    response_model=VitalResponse,
    status_code=status.HTTP_201_CREATED,
)
async def record_vital(
    member_id: int,
    payload: VitalCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> MemberVital:
    """Log a new vitals reading (height/weight) for a member.

    Fails with 404 if the member does not exist.
    """
    return vital_service.record_vital(
        db, member_id, payload, recorded_by=current_user.id
    )


@router.get("/{member_id}/vitals", response_model=list[VitalResponse])
async def list_vitals(
    member_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> list[MemberVital]:
    """List every vitals reading for a member, oldest first.

    Fails with 404 if the member does not exist.
    """
    return vital_service.list_vitals(db, member_id)


@router.get("/{member_id}/vitals/dashboard", response_model=VitalsDashboardResponse)
async def get_vitals_dashboard(
    member_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> VitalsDashboardResponse:
    """Return the member's vitals history plus deltas vs. their baseline reading.

    Fails with 404 if the member does not exist.
    """
    return vital_service.get_dashboard(db, member_id)
