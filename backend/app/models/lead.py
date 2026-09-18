"""Lead model — a public "Join the Crew" inquiry submitted from the marketing site."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Lead(Base):
    """An inquiry submitted by a prospective member via the public site.

    Never deleted, like Attendance/Payment — but unlike those, `contacted`
    is intentionally mutable so staff/owner can track follow-up in the
    admin area without the submission itself ever changing.
    """

    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)
    whatsapp_number: Mapped[str] = mapped_column(String(20), nullable=False)
    preferred_time: Mapped[str] = mapped_column(String(150), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    contacted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<Lead id={self.id} full_name={self.full_name!r}>"
