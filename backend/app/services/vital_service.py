"""Business logic for member vitals (progress tracking).

Each reading is immutable once recorded — a correction is a new reading,
not an edit — so trend charts always reflect what was actually measured
on a given day.
"""

from __future__ import annotations

import logging
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.models.member import Member
from app.models.member_vital import MemberVital
from app.schemas.member_vital import VitalCreate, VitalsDashboardResponse

logger = logging.getLogger(__name__)


def _compute_bmi(height_cm: Decimal | None, weight_kg: Decimal) -> Decimal | None:
    """BMI = weight(kg) / height(m)^2, rounded to one decimal place."""
    if height_cm is None or height_cm <= 0:
        return None
    height_m = height_cm / Decimal(100)
    bmi = weight_kg / (height_m * height_m)
    return bmi.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)


def record_vital(
    db: Session, member_id: int, data: VitalCreate, recorded_by: int
) -> MemberVital:
    """Log a new vitals reading for a member.

    If ``height_cm`` is omitted, the member's most recently recorded height
    is reused (adults' height rarely changes between check-ins).

    Raises:
        NotFoundError: if no member with ``member_id`` exists.
    """
    member = db.get(Member, member_id)
    if member is None:
        raise NotFoundError("Member")

    height_cm = data.height_cm
    if height_cm is None:
        last_with_height = (
            db.query(MemberVital)
            .filter(
                MemberVital.member_id == member_id, MemberVital.height_cm.isnot(None)
            )
            .order_by(MemberVital.recorded_at.desc(), MemberVital.id.desc())
            .first()
        )
        if last_with_height is not None:
            height_cm = last_with_height.height_cm

    vital = MemberVital(
        member_id=member_id,
        recorded_at=data.recorded_at,
        height_cm=height_cm,
        weight_kg=data.weight_kg,
        bmi=_compute_bmi(height_cm, data.weight_kg),
        notes=data.notes,
        recorded_by=recorded_by,
    )
    db.add(vital)
    db.commit()
    db.refresh(vital)
    logger.info(
        "Vitals recorded: member_id=%s vital_id=%s recorded_by=%s",
        member_id,
        vital.id,
        recorded_by,
    )
    return vital


def list_vitals(db: Session, member_id: int) -> list[MemberVital]:
    """List every vitals reading for a member, oldest first.

    Raises:
        NotFoundError: if no member with ``member_id`` exists.
    """
    member = db.get(Member, member_id)
    if member is None:
        raise NotFoundError("Member")

    return (
        db.query(MemberVital)
        .filter(MemberVital.member_id == member_id)
        .order_by(MemberVital.recorded_at.asc(), MemberVital.id.asc())
        .all()
    )


def get_dashboard(db: Session, member_id: int) -> VitalsDashboardResponse:
    """Build the vitals dashboard: full history plus deltas vs. the baseline reading."""
    history = list_vitals(db, member_id)
    baseline = history[0] if history else None
    latest = history[-1] if history else None

    weight_change = None
    bmi_change = None
    if baseline is not None and latest is not None and latest.id != baseline.id:
        weight_change = latest.weight_kg - baseline.weight_kg
        if latest.bmi is not None and baseline.bmi is not None:
            bmi_change = latest.bmi - baseline.bmi

    return VitalsDashboardResponse(
        member_id=member_id,
        history=history,
        latest=latest,
        baseline=baseline,
        weight_change_kg=weight_change,
        bmi_change=bmi_change,
    )
