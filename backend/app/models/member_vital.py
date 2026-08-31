"""MemberVital model — a point-in-time height/weight/BMI reading for a member.

The first record is written at enrollment time from the vitals captured on
the enrollment form; trainers can log additional readings later so the
member's dashboard can chart progress over time.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.member import Member
    from app.models.user import User


class MemberVital(Base):
    """A single vitals reading (height/weight/BMI) for a member."""

    __tablename__ = "member_vitals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    member_id: Mapped[int] = mapped_column(
        ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    height_cm: Mapped[Decimal | None] = mapped_column(Numeric(5, 1), nullable=True)
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(5, 1), nullable=False)
    bmi: Mapped[Decimal | None] = mapped_column(Numeric(4, 1), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    recorded_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        # Only created_at (no TimestampMixin) — vitals readings are
        # immutable and never updated in place.
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    member: Mapped[Member] = relationship(back_populates="vitals")
    recorded_by_user: Mapped[User] = relationship()

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<MemberVital id={self.id} member_id={self.member_id} recorded_at={self.recorded_at}>"
