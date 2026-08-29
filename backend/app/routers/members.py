"""API routes for the Member Enrollment module.

Every endpoint requires an authenticated staff user (any role — enrollment
and lookup are not role-gated); `require_role` is not used here for that
reason but remains available from `app.dependencies` for endpoints that do
need to restrict by role.
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.member import MemberStatus
from app.schemas.member import MemberCreate, MemberListResponse, MemberResponse, MemberUpdate
from app.services import member_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/members", tags=["members"])


@router.get("/", response_model=MemberListResponse)
async def list_members(
    search: Optional[str] = Query(default=None, description="Search by member full name or phone"),
    status_filter: Optional[MemberStatus] = Query(default=None, alias="status", description="Filter by member status"),
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(default=20, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> MemberListResponse:
    """List members with optional search/status filtering and pagination."""
    items, total, pages = member_service.list_members(db, search=search, status=status_filter, page=page, limit=limit)
    return MemberListResponse(items=items, total=total, page=page, limit=limit, pages=pages)


@router.post("/", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
async def create_member(
    payload: MemberCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> MemberResponse:
    """Enroll a new member, recording the authenticated user as `enrolled_by`."""
    member = member_service.create_member(db, payload, current_user_id=current_user.id)
    return member


@router.get("/{member_id}", response_model=MemberResponse)
async def get_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> MemberResponse:
    """Fetch a single member by id."""
    return member_service.get_member(db, member_id)


@router.put("/{member_id}", response_model=MemberResponse)
async def update_member(
    member_id: int,
    payload: MemberUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> MemberResponse:
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
    return None
