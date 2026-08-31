"""Member model — a gym member enrolled by staff."""

from __future__ import annotations

import enum
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.attendance import Attendance
    from app.models.location import Location
    from app.models.member_subscription import MemberSubscription
    from app.models.member_vital import MemberVital
    from app.models.payment import Payment
    from app.models.user import User
    from app.models.workout_routine import WorkoutRoutine


class MemberStatus(str, enum.Enum):
    """Overall enrollment status of a member."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"


class TrainingCategory(str, enum.Enum):
    """Which training track a member enrolled under."""

    PERSONAL_TRAINING = "personal_training"
    GROUP_TRAINING = "group_training"


class Member(Base, TimestampMixin):
    """A gym member enrolled by a staff/admin user."""

    __tablename__ = "members"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    member_code: Mapped[str] = mapped_column(
        String(16), unique=True, nullable=False, index=True
    )
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    birth_month: Mapped[int] = mapped_column(Integer, nullable=False)
    birth_year: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    emergency_contact_name: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )
    emergency_contact_phone: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    join_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[MemberStatus] = mapped_column(
        Enum(
            MemberStatus,
            name="member_status",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        default=MemberStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    training_category: Mapped[TrainingCategory] = mapped_column(
        Enum(
            TrainingCategory,
            name="training_category",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
        index=True,
    )
    whatsapp_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    medical_history: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    goal: Mapped[str | None] = mapped_column(String(255), nullable=True)
    referred_by_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    referred_by_member_id: Mapped[int | None] = mapped_column(
        ForeignKey("members.id", ondelete="SET NULL"), nullable=True, index=True
    )
    location_id: Mapped[int | None] = mapped_column(
        ForeignKey("locations.id", ondelete="SET NULL"), nullable=True, index=True
    )
    enrolled_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    # Set by staff to grant this member self-service login (their own
    # attendance/vitals only). Null means the member has no login access.
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relationships
    enrolled_by_user: Mapped[User] = relationship(
        back_populates="enrolled_members", foreign_keys=[enrolled_by]
    )
    location: Mapped[Location | None] = relationship(back_populates="members")
    referred_by_member: Mapped[Member | None] = relationship(
        remote_side="Member.id", foreign_keys=[referred_by_member_id]
    )
    subscriptions: Mapped[list[MemberSubscription]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )
    payments: Mapped[list[Payment]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )
    attendances: Mapped[list[Attendance]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )
    workout_routines: Mapped[list[WorkoutRoutine]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )
    vitals: Mapped[list[MemberVital]] = relationship(
        back_populates="member",
        cascade="all, delete-orphan",
        order_by="MemberVital.recorded_at",
    )

    @property
    def current_plan_name(self) -> str | None:
        """The name of this member's most recently assigned plan, or None if
        they've never had a subscription. Used so the UI can show the actual
        admin-created Plan a member is on instead of a fixed category label."""
        if not self.subscriptions:
            return None
        latest = max(self.subscriptions, key=lambda sub: sub.id)
        return latest.plan.name

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return (
            f"<Member id={self.id} full_name={self.full_name!r} status={self.status}>"
        )
