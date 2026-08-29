"""Business logic for registration, login, token issuance, and token refresh."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Tuple

from sqlalchemy.orm import Session

from app.auth.jwt import create_access_token, create_refresh_token, decode_token
from app.auth.password import hash_password, verify_password
from app.config import settings
from app.exceptions import ConflictError, UnauthorizedError
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import RegisterRequest

logger = logging.getLogger(__name__)


def register_user(db: Session, data: RegisterRequest) -> User:
    """Create a new staff account. Raises `ConflictError` if the email is taken."""
    existing = db.query(User).filter(User.email == data.email).first()
    if existing is not None:
        raise ConflictError("An account with this email already exists")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("Registered new user id=%s email=%s", user.id, user.email)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Verify email/password credentials. Raises `UnauthorizedError` on failure."""
    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(password, user.hashed_password):
        raise UnauthorizedError("Invalid email or password")
    if not user.is_active:
        raise UnauthorizedError("This account has been deactivated")
    return user


def issue_tokens(db: Session, user: User) -> Tuple[str, str]:
    """Create a new access/refresh token pair for `user` and persist the refresh token."""
    access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db.add(RefreshToken(user_id=user.id, token=refresh_token, expires_at=expires_at, revoked=False))
    db.commit()

    logger.info("Issued token pair for user id=%s", user.id)
    return access_token, refresh_token


def refresh_access_token(db: Session, refresh_token: str) -> Tuple[str, str, User]:
    """Exchange a valid, unrevoked refresh token for a new token pair (rotation).

    The presented refresh token is revoked as part of the exchange. Raises
    `UnauthorizedError` if the token is invalid, unknown, revoked, or expired.
    Returns the new (access_token, refresh_token, user).
    """
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise UnauthorizedError("Invalid token type")

    stored = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
    if stored is None or stored.revoked:
        raise UnauthorizedError("Refresh token has been revoked or does not exist")

    expires_at = stored.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise UnauthorizedError("Refresh token has expired")

    user = db.query(User).filter(User.id == stored.user_id).first()
    if user is None or not user.is_active:
        raise UnauthorizedError("User not found or inactive")

    # Rotate: revoke the presented token before minting a new pair.
    stored.revoked = True
    db.add(stored)
    db.commit()

    new_access_token, new_refresh_token = issue_tokens(db, user)
    return new_access_token, new_refresh_token, user


def revoke_refresh_token(db: Session, refresh_token: str) -> None:
    """Revoke a refresh token (logout). No-op if the token is unknown."""
    stored = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
    if stored is None:
        logger.warning("Logout attempted with unknown refresh token")
        return
    stored.revoked = True
    db.add(stored)
    db.commit()
