"""Business logic for public "Join the Crew" inquiries (leads)."""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.schemas.lead import LeadCreate

logger = logging.getLogger(__name__)


def create_lead(db: Session, data: LeadCreate) -> Lead:
    """Record a new inquiry submitted from the public site.

    Args:
        db: Database session
        data: Inquiry form data

    Returns:
        Created Lead object
    """
    lead = Lead(
        full_name=data.full_name,
        phone_number=data.phone_number,
        whatsapp_number=data.whatsapp_number,
        preferred_time=data.preferred_time,
        note=data.note,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    logger.info("Lead submitted: id=%s full_name=%s", lead.id, lead.full_name)
    return lead


def list_leads(db: Session) -> list[Lead]:
    """Return every inquiry, most recent first.

    Ties on `created_at` (server clock resolution, e.g. two submissions in
    the same test or the same request burst) break on `id` descending so
    ordering is always deterministic.
    """
    return db.query(Lead).order_by(Lead.created_at.desc(), Lead.id.desc()).all()
