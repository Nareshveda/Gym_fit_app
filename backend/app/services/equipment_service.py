"""Business logic for the equipment/inventory module (admin-only)."""

from __future__ import annotations

import logging

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.models.equipment import Equipment
from app.models.location import Location
from app.schemas.equipment import EquipmentCreate, EquipmentUpdate
from app.services.file_storage import save_upload

logger = logging.getLogger(__name__)

_DOCUMENT_SUBDIR = "equipment"


def _resolve_locations(db: Session, location_ids: list[int]) -> list[Location]:
    if not location_ids:
        return []
    locations = db.query(Location).filter(Location.id.in_(location_ids)).all()
    found_ids = {location.id for location in locations}
    missing = set(location_ids) - found_ids
    if missing:
        raise NotFoundError(
            f"Location(s) not found: {', '.join(str(i) for i in sorted(missing))}"
        )
    return locations


def list_equipment(db: Session) -> list[Equipment]:
    """Return every equipment record, ordered by name."""
    return db.query(Equipment).order_by(Equipment.name.asc()).all()


def create_equipment(db: Session, data: EquipmentCreate) -> Equipment:
    """Add a new equipment record, optionally assigned to one or more locations."""
    equipment = Equipment(
        name=data.name,
        brand=data.brand,
        purchase_date=data.purchase_date,
        amount=data.amount,
        warranty_details=data.warranty_details,
        service_schedule=data.service_schedule,
        notes=data.notes,
        locations=_resolve_locations(db, data.location_ids),
    )
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    logger.info("Equipment created: id=%s name=%s", equipment.id, equipment.name)
    return equipment


def get_equipment(db: Session, equipment_id: int) -> Equipment:
    """Fetch a single equipment record by id.

    Raises:
        NotFoundError: if no equipment with `equipment_id` exists.
    """
    equipment = db.get(Equipment, equipment_id)
    if equipment is None:
        raise NotFoundError("Equipment")
    return equipment


def update_equipment(
    db: Session, equipment_id: int, data: EquipmentUpdate
) -> Equipment:
    """Apply a partial update to an equipment record.

    ``location_ids``, when provided, replaces the full set of assigned
    locations rather than merging with the existing set.

    Raises:
        NotFoundError: if no equipment with `equipment_id` exists.
    """
    equipment = get_equipment(db, equipment_id)
    updates = data.model_dump(exclude_unset=True, exclude={"location_ids"})
    for field, value in updates.items():
        setattr(equipment, field, value)

    if data.location_ids is not None:
        equipment.locations = _resolve_locations(db, data.location_ids)

    db.commit()
    db.refresh(equipment)
    return equipment


async def attach_document(
    db: Session, equipment_id: int, upload_file: UploadFile
) -> Equipment:
    """Attach (or replace) a warranty/invoice document on an equipment record.

    Accepts .jpg/.jpeg/.pdf/.doc/.docx up to 10 MB. Raises `NotFoundError` if
    no equipment with `equipment_id` exists, or `ValidationError` if the file
    fails the type/size checks (see `app.services.file_storage.save_upload`).
    """
    equipment = get_equipment(db, equipment_id)
    _stored_filename, url_path = await save_upload(upload_file, _DOCUMENT_SUBDIR)
    equipment.document_url = url_path
    equipment.document_filename = upload_file.filename
    db.commit()
    db.refresh(equipment)
    logger.info(
        "Document attached to equipment id=%s filename=%s",
        equipment_id,
        upload_file.filename,
    )
    return equipment


def delete_equipment(db: Session, equipment_id: int) -> None:
    """Permanently delete an equipment record.

    Raises:
        NotFoundError: if no equipment with `equipment_id` exists.
    """
    equipment = get_equipment(db, equipment_id)
    db.delete(equipment)
    db.commit()
    logger.info("Equipment deleted: id=%s", equipment_id)
