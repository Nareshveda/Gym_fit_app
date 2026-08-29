"""Member subscription endpoints (assign a plan to a member, list a member's subscriptions)."""
from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse
from app.services import fee_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/members", tags=["subscriptions"])


@router.post("/{member_id}/subscriptions", response_model=SubscriptionResponse, status_code=201)
async def create_member_subscription(
    member_id: int,
    payload: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> SubscriptionResponse:
    """Assign a membership plan to a member, computing the initial due_date."""
    return fee_service.assign_subscription(
        db, member_id=member_id, plan_id=payload.plan_id, start_date=payload.start_date
    )


@router.get("/{member_id}/subscriptions", response_model=List[SubscriptionResponse])
async def get_member_subscriptions(
    member_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> List[SubscriptionResponse]:
    """List all subscriptions for a member."""
    return fee_service.list_member_subscriptions(db, member_id)
