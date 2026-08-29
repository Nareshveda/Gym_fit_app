"""Member model — a gym member enrolled by staff."""
from __future__ import annotations

import enum
from datetime import date
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.attendance import Attendance
    from app.models.member_subscription import MemberSubscription
    from app.models.payment import Payment
    from app.models.user import User
    from app.models.workout_routine import WorkoutRoutine


class MemberStatus(str, enum.Enum):
    """Overall enrollment status of a member."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"


class Member(Base, TimestampMixin):
    """A gym member enrolled by a staff/admin user."""

    __tablename__ = "members"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    emergency_contact_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    join_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[MemberStatus] = mapped_column(
        Enum(MemberStatus, name="member_status", values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        default=MemberStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    enrolled_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    # Relationships
    enrolled_by_user: Mapped["User"] = relationship(
        back_populates="enrolled_members", foreign_keys=[enrolled_by]
    )
    subscriptions: Mapped[List["MemberSubscription"]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )
    payments: Mapped[List["Payment"]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )
    attendances: Mapped[List["Attendance"]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )
    workout_routines: Mapped[List["WorkoutRoutine"]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<Member id={self.id} full_name={self.full_name!r} status={self.status}>"
