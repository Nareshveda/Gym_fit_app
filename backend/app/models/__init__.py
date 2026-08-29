"""SQLAlchemy models package.

Import every model module here so that (a) ``Base.metadata`` is fully
populated for Alembic autogenerate / ``create_all``, and (b) callers can do
``from app.models import User, Member, ...`` without knowing which submodule
a model lives in.
"""
from __future__ import annotations

from app.models.attendance import Attendance
from app.models.base import Base, TimestampMixin
from app.models.exercise import Exercise, ExerciseCategory
from app.models.member import Member, MemberStatus
from app.models.member_subscription import MemberSubscription, SubscriptionStatus
from app.models.membership_plan import DurationType, MembershipPlan
from app.models.payment import Payment, PaymentMethod
from app.models.refresh_token import RefreshToken
from app.models.routine_exercise import RoutineExercise
from app.models.user import User, UserRole
from app.models.workout_routine import WorkoutRoutine

__all__ = [
    "Base",
    "TimestampMixin",
    "User",
    "UserRole",
    "RefreshToken",
    "Member",
    "MemberStatus",
    "MembershipPlan",
    "DurationType",
    "MemberSubscription",
    "SubscriptionStatus",
    "Payment",
    "PaymentMethod",
    "Attendance",
    "Exercise",
    "ExerciseCategory",
    "WorkoutRoutine",
    "RoutineExercise",
]
