"""StaffAttendance model — a staff/trainer's check-in/check-out record for a day.

Mirrors ``app.models.attendance.Attendance`` (the member-facing equivalent)
but keys off ``users`` instead of ``members``, so staff/trainer attendance
is tracked and reported separately from member attendance.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class StaffAttendance(Base):
    """A single check-in (and optional check-out) event for a staff/trainer user."""

    __tablename__ = "staff_attendances"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    staff_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    check_in_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    check_out_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    staff: Mapped[User] = relationship()

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return (
            f"<StaffAttendance id={self.id} staff_id={self.staff_id} date={self.date}>"
        )
