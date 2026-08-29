"""RoutineExercise model — join entity assigning an Exercise to a WorkoutRoutine
on a given day, with prescribed sets/reps/weight (post-MVP)."""
from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import CheckConstraint, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.exercise import Exercise
    from app.models.workout_routine import WorkoutRoutine


class RoutineExercise(Base):
    """One exercise prescription within a workout routine on a given day."""

    __tablename__ = "routine_exercises"
    __table_args__ = (
        CheckConstraint("day_of_week >= 0 AND day_of_week <= 6", name="ck_routine_exercises_day_of_week"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    routine_id: Mapped[int] = mapped_column(
        ForeignKey("workout_routines.id", ondelete="CASCADE"), nullable=False, index=True
    )
    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    sets: Mapped[int] = mapped_column(Integer, nullable=False)
    reps: Mapped[int] = mapped_column(Integer, nullable=False)
    weight: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    rest_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    order: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    routine: Mapped["WorkoutRoutine"] = relationship(back_populates="routine_exercises")
    exercise: Mapped["Exercise"] = relationship(back_populates="routine_exercises")

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<RoutineExercise id={self.id} routine_id={self.routine_id} exercise_id={self.exercise_id}>"
