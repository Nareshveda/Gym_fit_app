"""Payment endpoints: record payments, list/filter payments, overdue subscriptions."""

from __future__ import annotations

import logging
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.member_subscription import MemberSubscription, SubscriptionStatus
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.schemas.subscription import SubscriptionResponse
from app.services import fee_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["payments"])


@router.get("/payments", response_model=list[PaymentResponse])
async def get_payments(
    member_id: int | None = Query(default=None),
    date_from: date | None = Query(
        default=None, description="Inclusive lower bound on payment_date."
    ),
    date_to: date | None = Query(
        default=None, description="Inclusive upper bound on payment_date."
    ),
    status: SubscriptionStatus | None = Query(
        default=None, description="Filter by the related subscription's status."
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> list[Payment]:
    """List payments, optionally filtered by member, date range, and subscription status."""
    return fee_service.list_payments(
        db, member_id=member_id, date_from=date_from, date_to=date_to, status=status
    )


@router.post("/payments", response_model=PaymentResponse, status_code=201)
async def create_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> Payment:
    """Record a payment against a member's subscription; advances the subscription's due_date."""
    return fee_service.record_payment(
        db,
        member_id=payload.member_id,
        subscription_id=payload.subscription_id,
        amount=payload.amount,
        method=payload.payment_method,
        recorded_by=current_user.id,
        notes=payload.notes,
        payment_date=payload.payment_date,
        reference_number=payload.reference_number,
    )


@router.get("/members/{member_id}/payments", response_model=list[PaymentResponse])
async def get_member_payments(
    member_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> list[Payment]:
    """List all payments recorded for a specific member."""
    return fee_service.list_member_payments(db, member_id)


@router.get("/payments/overdue", response_model=list[SubscriptionResponse])
async def get_overdue_subscriptions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> list[MemberSubscription]:
    """List subscriptions that are overdue or expiring within 7 days."""
    return fee_service.list_overdue(db)
