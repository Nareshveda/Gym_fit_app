"""JWT creation and decoding for access/refresh tokens.

Tokens are signed with ``app.config.settings.SECRET_KEY`` / ``ALGORITHM``.
Access tokens expire after ``ACCESS_TOKEN_EXPIRE_MINUTES``; refresh tokens
after ``REFRESH_TOKEN_EXPIRE_DAYS``. Each token embeds a ``type`` claim
("access" or "refresh") so one cannot be used in place of the other.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from jose import JWTError, jwt

from app.config import settings
from app.exceptions import UnauthorizedError

logger = logging.getLogger(__name__)

ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


def _create_token(data: Dict[str, Any], expires_delta: timedelta, token_type: str) -> str:
    """Encode a JWT embedding `data`, an expiry, a `type` claim, and a unique `jti`.

    The `jti` (JWT ID) guarantees each token is a distinct string even when
    issued for the same subject within the same second — refresh tokens are
    stored in a column with a UNIQUE constraint, so byte-identical tokens
    would otherwise collide.
    """
    to_encode = dict(data)
    now = datetime.now(timezone.utc)
    to_encode.update({"exp": now + expires_delta, "iat": now, "jti": uuid.uuid4().hex, "type": token_type})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(data: Dict[str, Any]) -> str:
    """Create a short-lived access token embedding `data` (typically {"sub": user_id})."""
    return _create_token(
        data, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES), ACCESS_TOKEN_TYPE
    )


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create a long-lived refresh token embedding `data` (typically {"sub": user_id})."""
    return _create_token(
        data, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS), REFRESH_TOKEN_TYPE
    )


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT's signature and expiry, returning its claims.

    Raises `UnauthorizedError` if the token is missing, malformed, expired,
    or signed with the wrong key.
    """
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        logger.warning("JWT decode failed: %s", exc)
        raise UnauthorizedError("Invalid or expired token") from exc
