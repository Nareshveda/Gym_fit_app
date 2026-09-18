"""API endpoints for public "Join the Crew" inquiries (leads).

Submitting an inquiry is public (no auth) — it's filled out from the
marketing site before a visitor has any account. Reviewing submitted
inquiries is restricted to owner/admin via `require_role`, same as the
rest of the admin area.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadResponse, LeadUpdate
from app.services import lead_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/leads", tags=["leads"])


@router.post("/", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
) -> Lead:
    """Submit a "Join the Crew" inquiry from the public site."""
    return lead_service.create_lead(db, payload)


@router.get("/", response_model=list[LeadResponse])
async def list_leads(
    db: Session = Depends(get_db),
    _current_user=Depends(require_role("owner", "admin")),
) -> list[Lead]:
    """List every submitted inquiry, most recent first (owner/admin only)."""
    return lead_service.list_leads(db)


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: int,
    payload: LeadUpdate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_role("owner", "admin")),
) -> Lead:
    """Mark a lead as contacted/not contacted (owner/admin only)."""
    return lead_service.update_lead(db, lead_id, payload)
