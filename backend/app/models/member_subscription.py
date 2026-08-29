"""MemberSubscription model — a member's enrollment in a membership plan."""
from __future__ import annotations

import enum
from datetime import date
from typing import TYPE_CHECKING, List

from sqlalchemy import Date, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.member import Member
    from app.models.membership_plan import MembershipPlan
    from app.models.payment import Payment


class SubscriptionStatus(str, enum.Enum):
    """Lifecycle status of a member's subscription to a plan."""

    ACTIVE = "active"
    EXPIRING_SOON = "expiring_soon"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class MemberSubscription(Base, TimestampMixin):
    """A member's subscription period on a given membership plan."""

    __tablename__ = "member_subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    member_id: Mapped[int] = mapped_column(
        ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    plan_id: Mapped[int] = mapped_column(
        ForeignKey("membership_plans.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(
            SubscriptionStatus,
            name="subscription_status",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        default=SubscriptionStatus.ACTIVE,
        nullable=False,
        index=True,
    )

    # Relationships
    member: Mapped["Member"] = relationship(back_populates="subscriptions")
    plan: Mapped["MembershipPlan"] = relationship(back_populates="subscriptions")
    payments: Mapped[List["Payment"]] = relationship(
        back_populates="subscription", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<MemberSubscription id={self.id} member_id={self.member_id} status={self.status}>"
