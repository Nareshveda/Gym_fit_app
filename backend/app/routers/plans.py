"""Membership plan endpoints (create, list, update, deactivate)."""
from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.schemas.plan import PlanCreate, PlanResponse, PlanUpdate
from app.services import fee_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/plans", tags=["plans"])


@router.get("/", response_model=List[PlanResponse])
async def get_plans(
    active_only: bool = Query(default=False, description="Restrict results to active plans only."),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> List[PlanResponse]:
    """List membership plans, optionally restricted to active ones."""
    return fee_service.list_plans(db, active_only=active_only)


@router.post("/", response_model=PlanResponse, status_code=201)
async def create_plan(
    payload: PlanCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> PlanResponse:
    """Create a new membership plan."""
    return fee_service.create_plan(db, payload)


@router.put("/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: int,
    payload: PlanUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> PlanResponse:
    """Update an existing membership plan (partial update)."""
    return fee_service.update_plan(db, plan_id, payload)


@router.delete("/{plan_id}", response_model=PlanResponse)
async def deactivate_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> PlanResponse:
    """Deactivate (soft-delete) a membership plan; subscription history is preserved."""
    return fee_service.deactivate_plan(db, plan_id)
