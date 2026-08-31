"""WorkoutRoutine model — a routine assigned to a member (post-MVP)."""

from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.member import Member
    from app.models.routine_exercise import RoutineExercise
    from app.models.user import User


class WorkoutRoutine(Base, TimestampMixin):
    """A named workout routine assigned to a member by staff/trainer."""

    __tablename__ = "workout_routines"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    member_id: Mapped[int] = mapped_column(
        ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    assigned_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Relationships
    member: Mapped[Member] = relationship(back_populates="workout_routines")
    assigned_by_user: Mapped[User] = relationship(
        back_populates="assigned_routines", foreign_keys=[assigned_by]
    )
    routine_exercises: Mapped[list[RoutineExercise]] = relationship(
        back_populates="routine",
        cascade="all, delete-orphan",
        order_by="RoutineExercise.order",
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<WorkoutRoutine id={self.id} member_id={self.member_id} name={self.name!r}>"
