"""MembershipPlan model — monthly/quarterly/yearly plans members subscribe to."""

from __future__ import annotations

import enum
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.member_subscription import MemberSubscription


class DurationType(str, enum.Enum):
    """Billing cadence of a membership plan."""

    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class MembershipPlan(Base, TimestampMixin):
    """A membership plan (e.g. "Monthly Basic") that members subscribe to."""

    __tablename__ = "membership_plans"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    duration_type: Mapped[DurationType] = mapped_column(
        Enum(
            DurationType,
            name="duration_type",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
    )
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships. No delete cascade: a plan with subscription history is
    # deactivated (is_active=False), not deleted; the FK is RESTRICT.
    subscriptions: Mapped[list[MemberSubscription]] = relationship(
        back_populates="plan"
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<MembershipPlan id={self.id} name={self.name!r} duration_type={self.duration_type}>"
