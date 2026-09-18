"""Lead model — a public "Join the Crew" inquiry submitted from the marketing site."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Lead(Base):
    """An inquiry submitted by a prospective member via the public site.

    Append-only, like Attendance/Payment — a lead is never edited or deleted
    once submitted, only reviewed by staff/owner in the admin area.
    """

    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)
    whatsapp_number: Mapped[str] = mapped_column(String(20), nullable=False)
    preferred_time: Mapped[str] = mapped_column(String(150), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<Lead id={self.id} full_name={self.full_name!r}>"
