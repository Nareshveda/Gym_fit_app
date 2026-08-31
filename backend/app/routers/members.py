"""API routes for the Member Enrollment module.

Every endpoint requires an authenticated staff user (any role — enrollment
and lookup are not role-gated); `require_role` is not used here for that
reason but remains available from `app.dependencies` for endpoints that do
need to restrict by role.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.member import Member, MemberStatus, TrainingCategory
from app.schemas.auth import SetMemberPasswordRequest
from app.schemas.member import (
    MemberCreate,
    MemberListResponse,
    MemberResponse,
    MemberUpdate,
)
from app.services import auth_service, member_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/members", tags=["members"])


@router.get("/", response_model=MemberListResponse)
async def list_members(
    search: str | None = Query(
        default=None, description="Search by member full name or phone"
    ),
    status_filter: MemberStatus | None = Query(
        default=None, alias="status", description="Filter by member status"
    ),
    training_category: TrainingCategory | None = Query(
        default=None, description="Filter by training category"
    ),
    location_id: int | None = Query(
        default=None, description="Filter by location/branch"
    ),
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(
        default=20, ge=1, le=100, description="Number of items per page"
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> MemberListResponse:
    """List members with optional search/status/category/location filtering and pagination."""
    items, total, pages = member_service.list_members(
        db,
        search=search,
        status=status_filter,
        training_category=training_category,
        location_id=location_id,
        page=page,
        limit=limit,
    )
    return MemberListResponse(
        items=items, total=total, page=page, limit=limit, pages=pages
    )


@router.post("/", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
async def create_member(
    payload: MemberCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> Member:
    """Enroll a new member, recording the authenticated user as `enrolled_by`."""
    member = member_service.create_member(db, payload, current_user_id=current_user.id)
    return member


@router.get("/{member_id}", response_model=MemberResponse)
async def get_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> Member:
    """Fetch a single member by id."""
    return member_service.get_member(db, member_id)


@router.put("/{member_id}", response_model=MemberResponse)
async def update_member(
    member_id: int,
    payload: MemberUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> Member:
    """Apply a partial update to an existing member."""
    return member_service.update_member(db, member_id, payload)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> None:
    """Soft-delete a member by setting status to inactive (never hard-deletes)."""
    member_service.deactivate_member(db, member_id)


@router.put("/{member_id}/credentials", response_model=MemberResponse)
async def set_member_credentials(
    member_id: int,
    payload: SetMemberPasswordRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> Member:
    """Grant or reset a member's self-service login password.

    The member then signs in at the same `/auth/login` staff/member share,
    seeing only their own attendance and vitals. Fails with 400 if the member
    has no email on file (login is keyed by email).
    """
    return auth_service.set_member_password(db, member_id, payload.password)
