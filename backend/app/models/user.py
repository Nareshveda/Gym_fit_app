"""User model — staff/admin/owner/trainer accounts (email + password auth)."""

from __future__ import annotations

import enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.attendance import Attendance  # noqa: F401
    from app.models.location import Location
    from app.models.member import Member
    from app.models.payment import Payment
    from app.models.refresh_token import RefreshToken
    from app.models.workout_routine import WorkoutRoutine


class UserRole(str, enum.Enum):
    """Roles a staff account can hold."""

    OWNER = "owner"
    ADMIN = "admin"
    STAFF = "staff"
    TRAINER = "trainer"


class User(Base, TimestampMixin):
    """A staff/admin account that can log in and operate the system."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    location_id: Mapped[int | None] = mapped_column(
        ForeignKey("locations.id", ondelete="SET NULL"), nullable=True, index=True
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(
            UserRole,
            name="user_role",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        default=UserRole.STAFF,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    refresh_tokens: Mapped[list[RefreshToken]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    enrolled_members: Mapped[list[Member]] = relationship(
        back_populates="enrolled_by_user", foreign_keys="Member.enrolled_by"
    )
    recorded_payments: Mapped[list[Payment]] = relationship(
        back_populates="recorded_by_user", foreign_keys="Payment.recorded_by"
    )
    assigned_routines: Mapped[list[WorkoutRoutine]] = relationship(
        back_populates="assigned_by_user", foreign_keys="WorkoutRoutine.assigned_by"
    )
    location: Mapped[Location | None] = relationship(back_populates="staff")

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<User id={self.id} email={self.email!r} role={self.role}>"
