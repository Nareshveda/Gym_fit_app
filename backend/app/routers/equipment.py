"""API endpoints for the equipment/inventory module.

Every endpoint here is restricted to owner/admin — inventory records
(purchase cost, warranty, etc.) are not staff/trainer-visible.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.models.equipment import Equipment
from app.schemas.equipment import EquipmentCreate, EquipmentResponse, EquipmentUpdate
from app.services import equipment_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/equipment", tags=["equipment"])


@router.get("/", response_model=list[EquipmentResponse])
async def list_equipment(
    db: Session = Depends(get_db),
    _current_user=Depends(require_role("owner", "admin")),
) -> list[Equipment]:
    """List every equipment/inventory record."""
    return equipment_service.list_equipment(db)


@router.post("/", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_equipment(
    payload: EquipmentCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_role("owner", "admin")),
) -> Equipment:
    """Add a new equipment record."""
    return equipment_service.create_equipment(db, payload)


@router.get("/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_role("owner", "admin")),
) -> Equipment:
    """Fetch a single equipment record."""
    return equipment_service.get_equipment(db, equipment_id)


@router.put("/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
    equipment_id: int,
    payload: EquipmentUpdate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_role("owner", "admin")),
) -> Equipment:
    """Apply a partial update to an equipment record."""
    return equipment_service.update_equipment(db, equipment_id, payload)


@router.post("/{equipment_id}/document", response_model=EquipmentResponse)
async def upload_equipment_document(
    equipment_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _current_user=Depends(require_role("owner", "admin")),
) -> Equipment:
    """Attach (or replace) a warranty/invoice document on an equipment record.

    Accepts .jpg, .jpeg, .pdf, .doc, or .docx, up to 10 MB.
    """
    return await equipment_service.attach_document(db, equipment_id, file)


@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_role("owner", "admin")),
) -> None:
    """Delete an equipment record."""
    equipment_service.delete_equipment(db, equipment_id)
