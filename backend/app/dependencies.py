"""Shared FastAPI dependencies: DB session, current user, and role-based access.

`get_db` is re-exported from `app.database` (owned by DATABASE-AGENT) so
Phase 2 routers can import everything they need from a single module.

`get_current_user` decodes the bearer access token (via `app.auth.jwt`) and
loads the corresponding `User`, implemented by the Auth module. `require_role`
builds on top of it so other Phase 2 routers can declare their role
requirements.
"""
from __future__ import annotations

import logging
from typing import Callable, Optional

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.auth.jwt import decode_token
from app.database import get_db  # noqa: F401  (re-exported for router imports)
from app.exceptions import ForbiddenError, UnauthorizedError
from app.models.user import User

logger = logging.getLogger(__name__)

# tokenUrl documents where clients obtain a token; auto_error=False lets the
# stub below raise our own UnauthorizedError instead of FastAPI's default.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """Resolve the current authenticated user from a bearer JWT.

    Decodes the access token, loads the `User` by its `sub` claim, and
    verifies the account is active. Raises `UnauthorizedError` if the token
    is missing, invalid, not an access token, or the user is unknown/inactive.
    """
    if token is None:
        raise UnauthorizedError("Not authenticated")

    payload = decode_token(token)
    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type")

    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedError("Invalid token payload")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise UnauthorizedError("User not found or inactive")

    return user


def require_role(*roles: str) -> Callable:
    """Build a dependency that restricts an endpoint to the given roles.

    Roles are one or more of: "owner", "admin", "staff", "trainer".
    Usage: `Depends(require_role("owner", "admin"))`.
    """

    async def role_checker(current_user=Depends(get_current_user)):
        user_role = getattr(current_user, "role", None)
        if user_role not in roles:
            logger.warning("Access denied: role=%s required one of %s", user_role, roles)
            raise ForbiddenError(f"Requires one of roles: {', '.join(roles)}")
        return current_user

    return role_checker
