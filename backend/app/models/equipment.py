"""Equipment model — gym equipment/inventory records (admin-only module)."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Column, Date, ForeignKey, Numeric, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.location import Location

# Many-to-many: a single piece of equipment may be assigned to one location,
# several, or none yet (unassigned stock).
equipment_locations = Table(
    "equipment_locations",
    Base.metadata,
    Column(
        "equipment_id", ForeignKey("equipment.id", ondelete="CASCADE"), primary_key=True
    ),
    Column(
        "location_id", ForeignKey("locations.id", ondelete="CASCADE"), primary_key=True
    ),
)


class Equipment(Base, TimestampMixin):
    """A single piece of gym equipment and its purchase/warranty/service record."""

    __tablename__ = "equipment"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    brand: Mapped[str | None] = mapped_column(String(150), nullable=True)
    purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    warranty_details: Mapped[str | None] = mapped_column(String(500), nullable=True)
    service_schedule: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # An attached document (warranty card, invoice, receipt — jpg/pdf/doc/docx).
    # `document_url` is what clients fetch it back from; `document_filename`
    # is the original upload name, kept for display since the stored file is
    # renamed to a random UUID on disk.
    document_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    document_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relationships
    locations: Mapped[list[Location]] = relationship(
        secondary=equipment_locations, back_populates="equipment"
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<Equipment id={self.id} name={self.name!r}>"
