"""RefreshToken model — long-lived tokens used to mint new access tokens."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.member import Member
    from app.models.user import User


class RefreshToken(Base):
    """A refresh token issued to a staff user or a logged-in member, revocable
    independently of access tokens. Exactly one of `user_id`/`member_id` is set —
    the two actor types share this table since they share the JWT issuance flow."""

    __tablename__ = "refresh_tokens"
    __table_args__ = (
        CheckConstraint(
            "(user_id IS NOT NULL AND member_id IS NULL) OR "
            "(user_id IS NULL AND member_id IS NOT NULL)",
            name="ck_refresh_tokens_exactly_one_owner",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    member_id: Mapped[int | None] = mapped_column(
        ForeignKey("members.id", ondelete="CASCADE"), nullable=True, index=True
    )
    token: Mapped[str] = mapped_column(
        String(512), unique=True, index=True, nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    user: Mapped[User | None] = relationship(back_populates="refresh_tokens")
    member: Mapped[Member | None] = relationship()

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return (
            f"<RefreshToken id={self.id} user_id={self.user_id} "
            f"member_id={self.member_id} revoked={self.revoked}>"
        )
