"""Fee management business logic: plans, subscriptions, and payments.

Owned by BACKEND-AGENT (Fee Management module). Routers in
``app.routers.plans``, ``app.routers.subscriptions``, and
``app.routers.payments`` delegate all persistence and domain rules here.
"""

from __future__ import annotations

import logging
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.exceptions import NotFoundError, ValidationError
from app.models.member import Member
from app.models.member_subscription import MemberSubscription, SubscriptionStatus
from app.models.membership_plan import DurationType, MembershipPlan
from app.models.payment import Payment, PaymentMethod
from app.schemas.plan import PlanCreate, PlanUpdate

logger = logging.getLogger(__name__)

# Calendar-day increment applied to a subscription's due_date per plan cadence.
_DURATION_DAYS: dict[DurationType, int] = {
    DurationType.MONTHLY: 30,
    DurationType.QUARTERLY: 90,
    DurationType.YEARLY: 365,
}

_EXPIRING_SOON_WINDOW_DAYS = 7


def _duration_days(duration_type: DurationType) -> int:
    """Return the number of calendar days a plan's billing cycle spans."""
    return _DURATION_DAYS[duration_type]


# --- Plans -------------------------------------------------------------------


def create_plan(db: Session, plan_data: PlanCreate) -> MembershipPlan:
    """Create a new membership plan."""
    plan = MembershipPlan(
        name=plan_data.name,
        duration_type=plan_data.duration_type,
        price=plan_data.price,
        description=plan_data.description,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    logger.info("Created membership plan id=%s name=%s", plan.id, plan.name)
    return plan


def list_plans(db: Session, active_only: bool = False) -> list[MembershipPlan]:
    """List membership plans, optionally restricted to active ones."""
    query = db.query(MembershipPlan)
    if active_only:
        query = query.filter(MembershipPlan.is_active.is_(True))
    return query.order_by(MembershipPlan.name).all()


def _get_plan_or_404(db: Session, plan_id: int) -> MembershipPlan:
    """Fetch a membership plan by id or raise NotFoundError."""
    plan = db.query(MembershipPlan).filter(MembershipPlan.id == plan_id).first()
    if plan is None:
        raise NotFoundError("Membership plan")
    return plan


def update_plan(db: Session, plan_id: int, plan_data: PlanUpdate) -> MembershipPlan:
    """Apply a partial update to an existing membership plan."""
    plan = _get_plan_or_404(db, plan_id)
    updates = plan_data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(plan, field, value)
    db.commit()
    db.refresh(plan)
    logger.info(
        "Updated membership plan id=%s fields=%s", plan.id, list(updates.keys())
    )
    return plan


def deactivate_plan(db: Session, plan_id: int) -> MembershipPlan:
    """Soft-delete a plan by setting is_active=False (subscription history is preserved)."""
    plan = _get_plan_or_404(db, plan_id)
    plan.is_active = False
    db.commit()
    db.refresh(plan)
    logger.info("Deactivated membership plan id=%s", plan.id)
    return plan


# --- Subscriptions -------------------------------------------------------------


def _get_member_or_404(db: Session, member_id: int) -> Member:
    """Fetch a member by id or raise NotFoundError."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if member is None:
        raise NotFoundError("Member")
    return member


def _get_subscription_or_404(db: Session, subscription_id: int) -> MemberSubscription:
    """Fetch a subscription by id or raise NotFoundError."""
    subscription = (
        db.query(MemberSubscription)
        .filter(MemberSubscription.id == subscription_id)
        .first()
    )
    if subscription is None:
        raise NotFoundError("Subscription")
    return subscription


def assign_subscription(
    db: Session, member_id: int, plan_id: int, start_date: date | None = None
) -> MemberSubscription:
    """Enroll a member in a membership plan, computing the initial due_date.

    ``due_date`` is ``start_date`` plus the plan's billing cycle length
    (monthly=+30d, quarterly=+90d, yearly=+365d). The subscription starts
    with status=active.
    """
    _get_member_or_404(db, member_id)
    plan = _get_plan_or_404(db, plan_id)
    if not plan.is_active:
        raise ValidationError("Cannot assign an inactive membership plan")

    effective_start = start_date or date.today()
    due_date = effective_start + timedelta(days=_duration_days(plan.duration_type))

    subscription = MemberSubscription(
        member_id=member_id,
        plan_id=plan_id,
        start_date=effective_start,
        due_date=due_date,
        status=SubscriptionStatus.ACTIVE,
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    logger.info(
        "Assigned subscription id=%s member_id=%s plan_id=%s due_date=%s",
        subscription.id,
        member_id,
        plan_id,
        due_date,
    )
    return subscription


def list_member_subscriptions(db: Session, member_id: int) -> list[MemberSubscription]:
    """List all subscriptions for a member, most recently started first."""
    _get_member_or_404(db, member_id)
    return (
        db.query(MemberSubscription)
        .filter(MemberSubscription.member_id == member_id)
        .order_by(MemberSubscription.start_date.desc())
        .all()
    )


# --- Payments ------------------------------------------------------------------


def record_payment(
    db: Session,
    member_id: int,
    subscription_id: int,
    amount: Decimal,
    method: PaymentMethod,
    recorded_by: int,
    notes: str | None = None,
    payment_date: date | None = None,
    reference_number: str | None = None,
) -> Payment:
    """Record a payment and advance the subscription's due_date/status.

    A payment renews the subscription for one billing cycle: due_date moves
    forward by the plan's cycle length from whichever is later of the
    subscription's current due_date or today (so a long-overdue subscription
    doesn't stay overdue immediately after being paid), and status resets to
    active. ``amount`` must be strictly positive (also enforced by the
    ``PaymentCreate`` schema; re-checked here since this function may be
    called from other services).
    """
    if amount <= 0:
        raise ValidationError("Payment amount must be greater than 0")

    _get_member_or_404(db, member_id)
    subscription = _get_subscription_or_404(db, subscription_id)
    if subscription.member_id != member_id:
        raise ValidationError("Subscription does not belong to this member")

    payment = Payment(
        member_id=member_id,
        subscription_id=subscription_id,
        amount=amount,
        payment_date=payment_date or date.today(),
        payment_method=method,
        recorded_by=recorded_by,
        reference_number=reference_number,
        notes=notes,
    )
    db.add(payment)

    plan = (
        db.query(MembershipPlan)
        .filter(MembershipPlan.id == subscription.plan_id)
        .first()
    )
    if plan is not None:
        base_date = max(subscription.due_date, date.today())
        subscription.due_date = base_date + timedelta(
            days=_duration_days(plan.duration_type)
        )
    subscription.status = SubscriptionStatus.ACTIVE

    db.commit()
    db.refresh(payment)
    logger.info(
        "Recorded payment id=%s member_id=%s subscription_id=%s amount=%s new_due_date=%s",
        payment.id,
        member_id,
        subscription_id,
        amount,
        subscription.due_date,
    )
    return payment


def list_payments(
    db: Session,
    member_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    status: SubscriptionStatus | None = None,
) -> list[Payment]:
    """List payments, optionally filtered by member, payment-date range, and subscription status.

    ``status`` filters by the status of the payment's related subscription
    (Payment itself has no status column).
    """
    query = db.query(Payment)
    if member_id is not None:
        query = query.filter(Payment.member_id == member_id)
    if date_from is not None:
        query = query.filter(Payment.payment_date >= date_from)
    if date_to is not None:
        query = query.filter(Payment.payment_date <= date_to)
    if status is not None:
        query = query.join(
            MemberSubscription, Payment.subscription_id == MemberSubscription.id
        ).filter(MemberSubscription.status == status)
    return query.order_by(Payment.payment_date.desc()).all()


def list_member_payments(db: Session, member_id: int) -> list[Payment]:
    """List all payments recorded for a specific member."""
    _get_member_or_404(db, member_id)
    return list_payments(db, member_id=member_id)


# --- Overdue tracking ------------------------------------------------------


def list_overdue(db: Session) -> list[MemberSubscription]:
    """Recompute and return subscriptions that are overdue or expiring soon.

    A subscription is:
      - ``overdue`` when its due_date has already passed;
      - ``expiring_soon`` when its due_date falls within the next 7 days.

    Statuses are refreshed in-place (and committed) before the filtered list
    is returned, so downstream consumers (dashboards, notifications) always
    see up-to-date status values without relying on a separate scheduled job.
    Cancelled subscriptions are left untouched.
    """
    today = date.today()
    expiring_threshold = today + timedelta(days=_EXPIRING_SOON_WINDOW_DAYS)

    candidates = (
        db.query(MemberSubscription)
        .filter(
            MemberSubscription.status.in_(
                [
                    SubscriptionStatus.ACTIVE,
                    SubscriptionStatus.OVERDUE,
                    SubscriptionStatus.EXPIRING_SOON,
                ]
            )
        )
        .all()
    )

    result: list[MemberSubscription] = []
    changed = False
    for subscription in candidates:
        if subscription.due_date < today:
            if subscription.status != SubscriptionStatus.OVERDUE:
                subscription.status = SubscriptionStatus.OVERDUE
                changed = True
            result.append(subscription)
        elif subscription.due_date <= expiring_threshold:
            if subscription.status != SubscriptionStatus.EXPIRING_SOON:
                subscription.status = SubscriptionStatus.EXPIRING_SOON
                changed = True
            result.append(subscription)

    if changed:
        db.commit()

    result.sort(key=lambda subscription: subscription.due_date)
    return result
