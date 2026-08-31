"""Exercise model — an entry in the shared exercise library (post-MVP)."""

from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.routine_exercise import RoutineExercise


class ExerciseCategory(str, enum.Enum):
    """Broad category an exercise belongs to."""

    CARDIO = "cardio"
    STRENGTH = "strength"
    FLEXIBILITY = "flexibility"


class Exercise(Base):
    """A reusable exercise definition assignable to workout routines."""

    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    category: Mapped[ExerciseCategory] = mapped_column(
        Enum(
            ExerciseCategory,
            name="exercise_category",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
        index=True,
    )
    muscle_group: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    routine_exercises: Mapped[list[RoutineExercise]] = relationship(
        back_populates="exercise"
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<Exercise id={self.id} name={self.name!r} category={self.category}>"
