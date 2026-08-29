"""Payment model — a recorded payment against a member's subscription."""
from __future__ import annotations

import enum
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import CheckConstraint, Date, DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.member import Member
    from app.models.member_subscription import MemberSubscription
    from app.models.user import User


class PaymentMethod(str, enum.Enum):
    """How a payment was collected."""

    CASH = "cash"
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    OTHER = "other"


class Payment(Base):
    """A payment recorded by staff against a member's subscription."""

    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_payments_amount_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    member_id: Mapped[int] = mapped_column(
        ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    subscription_id: Mapped[int] = mapped_column(
        ForeignKey("member_subscriptions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    payment_method: Mapped[PaymentMethod] = mapped_column(
        Enum(
            PaymentMethod,
            name="payment_method",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
    )
    recorded_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    member: Mapped["Member"] = relationship(back_populates="payments")
    subscription: Mapped["MemberSubscription"] = relationship(back_populates="payments")
    recorded_by_user: Mapped["User"] = relationship(
        back_populates="recorded_payments", foreign_keys=[recorded_by]
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<Payment id={self.id} member_id={self.member_id} amount={self.amount}>"
