"""Location model — a gym branch/location."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.equipment import Equipment
    from app.models.member import Member
    from app.models.user import User


class Location(Base, TimestampMixin):
    """A physical branch/location the gym operates."""

    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships. Members/staff keep a nullable FK (ON DELETE SET NULL)
    # so deleting a location never cascades into deleting people —  it just
    # un-assigns them. Equipment uses a many-to-many association since a
    # single piece of equipment may serve multiple locations.
    members: Mapped[list[Member]] = relationship(back_populates="location")
    staff: Mapped[list[User]] = relationship(back_populates="location")
    equipment: Mapped[list[Equipment]] = relationship(
        secondary="equipment_locations", back_populates="locations"
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<Location id={self.id} name={self.name!r}>"
