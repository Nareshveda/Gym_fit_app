"""API endpoints for gym locations/branches.

Listing is open to any authenticated user (needed for dropdowns on the
Member/Staff forms); creating, updating, and deleting a location is
restricted to owner/admin via `require_role`.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db, require_role
from app.models.location import Location
from app.schemas.location import LocationCreate, LocationResponse, LocationUpdate
from app.services import location_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/locations", tags=["locations"])


@router.get("/", response_model=list[LocationResponse])
async def list_locations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> list[Location]:
    """List every location/branch."""
    return location_service.list_locations(db)


@router.post("/", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    payload: LocationCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_role("owner", "admin")),
) -> Location:
    """Add a new location/branch (owner/admin only)."""
    return location_service.create_location(db, payload)


@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: int,
    payload: LocationUpdate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_role("owner", "admin")),
) -> Location:
    """Update a location/branch (owner/admin only)."""
    return location_service.update_location(db, location_id, payload)


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_role("owner", "admin")),
) -> None:
    """Delete a location/branch (owner/admin only). Members/staff assigned to
    it are un-assigned, not deleted."""
    location_service.delete_location(db, location_id)
