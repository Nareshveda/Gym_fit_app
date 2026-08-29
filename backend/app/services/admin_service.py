"""Business logic for the admin module: staff listing, role/status updates, and stats."""
from __future__ import annotations

import logging
from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.exceptions import ConflictError, NotFoundError
from app.models.user import User, UserRole
from app.schemas.admin import AdminStatsResponse, RoleCount, UpdateUserRequest

logger = logging.getLogger(__name__)

# Roles that grant admin-panel access; used to guard self-demotion.
_ADMIN_ACCESS_ROLES = {UserRole.OWNER, UserRole.ADMIN}


def list_users(db: Session) -> List[User]:
    """Return every staff account, ordered by id."""
    return db.query(User).order_by(User.id).all()


def update_user(db: Session, user_id: int, data: UpdateUserRequest, current_user: User) -> User:
    """Update a staff account's role and/or active status.

    Raises `NotFoundError` if no user with `user_id` exists. Raises
    `ConflictError` if the caller is targeting their own account and the
    change would remove their admin/owner access or deactivate them —
    self-service demotion/deactivation is blocked to avoid an admin
    locking themselves out.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise NotFoundError("User")

    if user.id == current_user.id:
        resulting_role = data.role if data.role is not None else user.role
        resulting_active = data.is_active if data.is_active is not None else user.is_active
        if resulting_role not in _ADMIN_ACCESS_ROLES or not resulting_active:
            logger.warning("User id=%s attempted to self-demote/deactivate via admin panel", user.id)
            raise ConflictError("You cannot remove your own admin access or deactivate your own account")

    if data.role is not None:
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active

    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("User id=%s updated by user id=%s (role=%s, is_active=%s)", user.id, current_user.id, user.role, user.is_active)
    return user


def get_stats(db: Session) -> AdminStatsResponse:
    """Return the total staff count and a breakdown of counts by role."""
    rows = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    by_role = [RoleCount(role=role, count=count) for role, count in rows]
    total_staff = sum(item.count for item in by_role)
    return AdminStatsResponse(total_staff=total_staff, by_role=by_role)
