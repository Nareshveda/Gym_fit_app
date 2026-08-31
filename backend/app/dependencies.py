"""Shared FastAPI dependencies: DB session, current user, and role-based access.

`get_db` is re-exported from `app.database` (owned by DATABASE-AGENT) so
Phase 2 routers can import everything they need from a single module.

Two actor types share the same JWT issuance flow (see `app.services.auth_service`):
staff `User` accounts (owner/admin/staff/trainer) and, since the member
self-service portal, `Member` accounts with a password set. Every access
token carries an `actor` claim ("staff" or "member", defaulting to "staff"
for tokens issued before this existed) so the two can't be confused even if
their numeric ids collide. `get_current_actor` resolves either; `get_current_user`
and `get_current_member` are actor-specific wrappers around it — nearly every
existing endpoint depends on `get_current_user`, so a member token is rejected
there rather than accidentally resolving to an unrelated staff account with
the same id. `require_role` builds on `get_current_user` for staff role checks.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Literal

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.auth.jwt import decode_token
from app.database import get_db
from app.exceptions import ForbiddenError, UnauthorizedError
from app.models.member import Member, MemberStatus
from app.models.user import User

logger = logging.getLogger(__name__)

# tokenUrl documents where clients obtain a token; auto_error=False lets the
# stub below raise our own UnauthorizedError instead of FastAPI's default.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_actor(
    token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> tuple[Literal["staff", "member"], User | Member]:
    """Resolve the current authenticated actor (staff user or member) from a bearer JWT.

    Decodes the access token and loads the `User` or `Member` named by its
    `sub`/`actor` claims, verifying the account is active. Raises
    `UnauthorizedError` if the token is missing, invalid, not an access
    token, or the account is unknown/inactive.
    """
    if token is None:
        raise UnauthorizedError("Not authenticated")

    payload = decode_token(token)
    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type")

    subject_id = payload.get("sub")
    if subject_id is None:
        raise UnauthorizedError("Invalid token payload")

    actor = payload.get("actor", "staff")

    if actor == "member":
        member = db.query(Member).filter(Member.id == int(subject_id)).first()
        if member is None or member.status == MemberStatus.INACTIVE:
            raise UnauthorizedError("Member not found or inactive")
        return "member", member

    user = db.query(User).filter(User.id == int(subject_id)).first()
    if user is None or not user.is_active:
        raise UnauthorizedError("User not found or inactive")
    return "staff", user


async def get_current_user(
    actor_subject: tuple[Literal["staff", "member"], User | Member] = Depends(
        get_current_actor
    ),
) -> User:
    """Resolve the current authenticated *staff* user. Rejects member tokens —
    every existing staff endpoint depends on this, so a member account can
    never reach it even if its id happens to collide with a staff user's."""
    actor, subject = actor_subject
    if actor != "staff" or not isinstance(subject, User):
        raise UnauthorizedError("This action requires a staff account")
    return subject


async def get_current_member(
    actor_subject: tuple[Literal["staff", "member"], User | Member] = Depends(
        get_current_actor
    ),
) -> Member:
    """Resolve the current authenticated *member* (self-service portal only)."""
    actor, subject = actor_subject
    if actor != "member" or not isinstance(subject, Member):
        raise UnauthorizedError("This action requires a member account")
    return subject


def require_role(*roles: str) -> Callable:
    """Build a dependency that restricts an endpoint to the given roles.

    Roles are one or more of: "owner", "admin", "staff", "trainer".
    Usage: `Depends(require_role("owner", "admin"))`.
    """

    async def role_checker(current_user=Depends(get_current_user)):
        user_role = getattr(current_user, "role", None)
        if user_role not in roles:
            logger.warning(
                "Access denied: role=%s required one of %s", user_role, roles
            )
            raise ForbiddenError(f"Requires one of roles: {', '.join(roles)}")
        return current_user

    return role_checker
