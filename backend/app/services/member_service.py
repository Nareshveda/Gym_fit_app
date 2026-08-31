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

from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.exceptions import ConflictError, NotFoundError
from app.models.member import Member, MemberStatus, TrainingCategory
from app.models.member_subscription import MemberSubscription
from app.schemas.member import MemberCreate, MemberUpdate

logger = logging.getLogger(__name__)

_CODE_PREFIX = {
    TrainingCategory.PERSONAL_TRAINING: "PT",
    TrainingCategory.GROUP_TRAINING: "GT",
}
_MAX_CODE_ATTEMPTS = 5


def _generate_member_code(db: Session, training_category: TrainingCategory) -> str:
    """Generate a human-readable, permanent member code (e.g. ``PT-0001``).

    Sequential per category, based on how many members already exist in
    that category. Not regenerated if the member later switches category.
    """
    prefix = _CODE_PREFIX[training_category]
    existing = (
        db.query(Member).filter(Member.training_category == training_category).count()
    )
    return f"{prefix}-{existing + 1:04d}"


def create_member(db: Session, data: MemberCreate, current_user_id: int) -> Member:
    """Enroll a new member, stamping ``enrolled_by`` from the current staff user
    and generating a permanent, category-prefixed ``member_code``.

    Raises:
        ConflictError: if ``email`` is provided and already belongs to another member.
    """
    for attempt in range(1, _MAX_CODE_ATTEMPTS + 1):
        member = Member(
            member_code=_generate_member_code(db, data.training_category),
            full_name=data.full_name,
            email=data.email,
            phone=data.phone,
            whatsapp_number=data.whatsapp_number,
            birth_month=data.birth_month,
            birth_year=data.birth_year,
            gender=data.gender,
            address=data.address,
            emergency_contact_name=data.emergency_contact_name,
            emergency_contact_phone=data.emergency_contact_phone,
            photo_url=data.photo_url,
            training_category=data.training_category,
            medical_history=data.medical_history,
            goal=data.goal,
            location_id=data.location_id,
            referred_by_name=data.referred_by_name,
            referred_by_member_id=data.referred_by_member_id,
            join_date=data.join_date,
            status=data.status,
            enrolled_by=current_user_id,
        )
        db.add(member)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            # A `member_code` collision (concurrent enrollments in the same
            # category) is retried with a freshly recomputed count; any other
            # integrity error (e.g. duplicate email) is a real conflict.
            if (
                "member_code" in str(getattr(exc.orig, "args", exc))
                and attempt < _MAX_CODE_ATTEMPTS
            ):
                continue
            logger.warning(
                "Member creation conflict: email=%s already exists", data.email
            )
            raise ConflictError("A member with this email already exists")
        db.refresh(member)
        logger.info(
            "Member enrolled: id=%s code=%s enrolled_by=%s",
            member.id,
            member.member_code,
            current_user_id,
        )
        return member
    raise ConflictError("Could not generate a unique member code, please retry")


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
    search: str | None = None,
    status: MemberStatus | None = None,
    training_category: TrainingCategory | None = None,
    location_id: int | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Member], int, int]:
    """List members with optional search/filter and pagination.

    ``search`` matches (case-insensitively) against ``full_name``, ``phone``,
    or ``member_code``. ``status`` filters to an exact ``MemberStatus``
    value. ``training_category`` filters to an exact ``TrainingCategory``
    value.

    Returns:
        A tuple of ``(items, total, pages)`` where ``total`` is the count of
        matching rows across all pages and ``pages`` is the total page count.
    """
    # `current_plan_name` (exposed on MemberListItem) walks each member's
    # `subscriptions` -> `plan`, so eager-load both to avoid an N+1 query
    # per row on this list endpoint.
    query = db.query(Member).options(
        selectinload(Member.subscriptions).joinedload(MemberSubscription.plan)
    )

    if search:
        like_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Member.full_name.ilike(like_pattern),
                Member.phone.ilike(like_pattern),
                Member.member_code.ilike(like_pattern),
            )
        )

    if status is not None:
        query = query.filter(Member.status == status)

    if training_category is not None:
        query = query.filter(Member.training_category == training_category)

    if location_id is not None:
        query = query.filter(Member.location_id == location_id)

    total = query.count()
    pages = ceil(total / limit) if total else 0

    items = (
        query.order_by(Member.full_name.asc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    logger.debug(
        "Listed members: search=%r status=%s page=%s limit=%s total=%s",
        search,
        status,
        page,
        limit,
        total,
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
        logger.warning(
            "Member update conflict: id=%s email=%s", member_id, updates.get("email")
        )
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
