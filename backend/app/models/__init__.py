"""SQLAlchemy models package.

Import every model module here so that (a) ``Base.metadata`` is fully
populated for Alembic autogenerate / ``create_all``, and (b) callers can do
``from app.models import User, Member, ...`` without knowing which submodule
a model lives in.
"""

from __future__ import annotations

from app.models.attendance import Attendance
from app.models.base import Base, TimestampMixin
from app.models.equipment import Equipment, equipment_locations
from app.models.exercise import Exercise, ExerciseCategory
from app.models.location import Location
from app.models.member import Member, MemberStatus, TrainingCategory
from app.models.member_subscription import MemberSubscription, SubscriptionStatus
from app.models.member_vital import MemberVital
from app.models.membership_plan import DurationType, MembershipPlan
from app.models.payment import Payment, PaymentMethod
from app.models.refresh_token import RefreshToken
from app.models.routine_exercise import RoutineExercise
from app.models.staff_attendance import StaffAttendance
from app.models.user import User, UserRole
from app.models.workout_routine import WorkoutRoutine

__all__ = [
    "Attendance",
    "Base",
    "DurationType",
    "Equipment",
    "Exercise",
    "ExerciseCategory",
    "Location",
    "Member",
    "MemberStatus",
    "MemberSubscription",
    "MemberVital",
    "MembershipPlan",
    "Payment",
    "PaymentMethod",
    "RefreshToken",
    "RoutineExercise",
    "StaffAttendance",
    "SubscriptionStatus",
    "TimestampMixin",
    "TrainingCategory",
    "User",
    "UserRole",
    "WorkoutRoutine",
    "equipment_locations",
]
