"""Business logic for the Member Enrollment module.

Routers call into this module rather than touching the ORM directly, per the
project's router/service/model layering (skills/BACKEND.md). All write
operations that can conflict with existing data (e.g. duplicate email) raise
``app.exceptions.ConflictError``; lookups that fail raise ``NotFoundError`` —
both are translated to HTTP responses by the handlers wired in main.py.
"""
from __future__ import annotations

import logging
from math import ceil
from typing import Optional, Tuple

from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions import ConflictError, NotFoundError
from app.models.member import Member, MemberStatus
from app.schemas.member import MemberCreate, MemberUpdate

logger = logging.getLogger(__name__)


def create_member(db: Session, data: MemberCreate, current_user_id: int) -> Member:
    """Enroll a new member, stamping ``enrolled_by`` from the current staff user.

    Raises:
        ConflictError: if ``email`` is provided and already belongs to another member.
    """
    member = Member(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        date_of_birth=data.date_of_birth,
        gender=data.gender,
        address=data.address,
        emergency_contact_name=data.emergency_contact_name,
        emergency_contact_phone=data.emergency_contact_phone,
        photo_url=data.photo_url,
        join_date=data.join_date,
        status=data.status,
        enrolled_by=current_user_id,
    )
    db.add(member)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        logger.warning("Member creation conflict: email=%s already exists", data.email)
        raise ConflictError("A member with this email already exists")
    db.refresh(member)
    logger.info("Member enrolled: id=%s enrolled_by=%s", member.id, current_user_id)
    return member


def get_member(db: Session, member_id: int) -> Member:
    """Fetch a single member by id.

    Raises:
        NotFoundError: if no member with ``member_id`` exists.
    """
    member = db.get(Member, member_id)
    if member is None:
        logger.info("Member not found: id=%s", member_id)
        raise NotFoundError("Member")
    return member


def list_members(
    db: Session,
    search: Optional[str] = None,
    status: Optional[MemberStatus] = None,
    page: int = 1,
    limit: int = 20,
) -> Tuple[list[Member], int, int]:
    """List members with optional search/filter and pagination.

    ``search`` matches (case-insensitively) against ``full_name`` or ``phone``.
    ``status`` filters to an exact ``MemberStatus`` value.

    Returns:
        A tuple of ``(items, total, pages)`` where ``total`` is the count of
        matching rows across all pages and ``pages`` is the total page count.
    """
    query = db.query(Member)

    if search:
        like_pattern = f"%{search.strip()}%"
        query = query.filter(or_(Member.full_name.ilike(like_pattern), Member.phone.ilike(like_pattern)))

    if status is not None:
        query = query.filter(Member.status == status)

    total = query.count()
    pages = ceil(total / limit) if total else 0

    items = (
        query.order_by(Member.full_name.asc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    logger.debug(
        "Listed members: search=%r status=%s page=%s limit=%s total=%s", search, status, page, limit, total
    )
    return items, total, pages


def update_member(db: Session, member_id: int, data: MemberUpdate) -> Member:
    """Apply a partial update to an existing member.

    Raises:
        NotFoundError: if no member with ``member_id`` exists.
        ConflictError: if the update sets ``email`` to one already in use.
    """
    member = get_member(db, member_id)

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(member, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        logger.warning("Member update conflict: id=%s email=%s", member_id, updates.get("email"))
        raise ConflictError("A member with this email already exists")
    db.refresh(member)
    logger.info("Member updated: id=%s fields=%s", member_id, list(updates.keys()))
    return member


def deactivate_member(db: Session, member_id: int) -> Member:
    """Soft-delete a member by setting ``status`` to ``INACTIVE``.

    Members are never hard-deleted — related payments, attendance, and
    subscription history must remain intact.

    Raises:
        NotFoundError: if no member with ``member_id`` exists.
    """
    member = get_member(db, member_id)
    member.status = MemberStatus.INACTIVE
    db.commit()
    db.refresh(member)
    logger.info("Member deactivated (soft delete): id=%s", member_id)
    return member
