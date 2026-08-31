"""Business logic for gym locations/branches (admin-managed)."""

from __future__ import annotations

import logging

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions import ConflictError, NotFoundError
from app.models.location import Location
from app.schemas.location import LocationCreate, LocationUpdate

logger = logging.getLogger(__name__)


def list_locations(db: Session) -> list[Location]:
    """Return every location, ordered by name."""
    return db.query(Location).order_by(Location.name.asc()).all()


def create_location(db: Session, data: LocationCreate) -> Location:
    """Create a new location/branch.

    Raises:
        ConflictError: if a location with this name already exists.
    """
    location = Location(name=data.name, address=data.address, phone=data.phone)
    db.add(location)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError("A location with this name already exists")
    db.refresh(location)
    logger.info("Location created: id=%s name=%s", location.id, location.name)
    return location


def get_location(db: Session, location_id: int) -> Location:
    """Fetch a single location by id.

    Raises:
        NotFoundError: if no location with `location_id` exists.
    """
    location = db.get(Location, location_id)
    if location is None:
        raise NotFoundError("Location")
    return location


def update_location(db: Session, location_id: int, data: LocationUpdate) -> Location:
    """Apply a partial update to an existing location.

    Raises:
        NotFoundError: if no location with `location_id` exists.
        ConflictError: if the update sets `name` to one already in use.
    """
    location = get_location(db, location_id)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(location, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError("A location with this name already exists")
    db.refresh(location)
    return location


def delete_location(db: Session, location_id: int) -> None:
    """Permanently delete a location.

    Members/staff assigned to it are un-assigned (ON DELETE SET NULL), not
    deleted — a location is purely organizational metadata.

    Raises:
        NotFoundError: if no location with `location_id` exists.
    """
    location = get_location(db, location_id)
    db.delete(location)
    db.commit()
    logger.info("Location deleted: id=%s", location_id)
