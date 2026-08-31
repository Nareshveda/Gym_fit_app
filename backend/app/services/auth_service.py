"""Business logic for registration, login, token issuance, and token refresh.

Two actor types share this module's token-issuance flow: staff `User`
accounts and, since the member self-service portal, `Member` accounts with a
password set (via `set_member_password`, staff-only). See `app.dependencies`
for how a token's `actor` claim is resolved back to the right table.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.auth.jwt import create_access_token, create_refresh_token, decode_token
from app.auth.password import hash_password, verify_password
from app.config import settings
from app.exceptions import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
)
from app.models.member import Member, MemberStatus
from app.models.refresh_token import RefreshToken
from app.models.user import User, UserRole
from app.schemas.auth import RegisterRequest
from app.services.file_storage import IMAGE_TYPES, save_upload

_AVATAR_SUBDIR = "avatars"

logger = logging.getLogger(__name__)

Actor = Literal["staff", "member"]


def register_user(db: Session, data: RegisterRequest) -> User:
    """Create the very first account for a brand-new deployment, as `owner`.

    This endpoint is public/unauthenticated, so it must never be usable to
    add staff to an already-running gym — every account after the first must
    be created through the admin-gated user-management endpoints instead.
    Raises `ForbiddenError` once any user exists, and `ConflictError` if the
    email is already taken (only reachable in the empty-database case).
    """
    if db.query(User).first() is not None:
        raise ForbiddenError(
            "Registration is closed. Ask an owner or admin to create your account."
        )

    existing = db.query(User).filter(User.email == data.email).first()
    if existing is not None:
        raise ConflictError("An account with this email already exists")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=UserRole.OWNER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("Registered new user id=%s email=%s", user.id, user.email)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Verify email/password credentials against staff accounts only.

    Raises `UnauthorizedError` on failure. Kept separate from
    `authenticate_actor` for `/auth/register`, which only ever creates staff
    accounts and has no business authenticating a member.
    """
    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(password, user.hashed_password):
        raise UnauthorizedError("Invalid email or password")
    if not user.is_active:
        raise UnauthorizedError("This account has been deactivated")
    return user


def authenticate_actor(
    db: Session, email: str, password: str
) -> tuple[Actor, User | Member]:
    """Verify email/password credentials against staff accounts, then members.

    A `Member` only has login access once staff has set a password for them
    (see `set_member_password`) — one with no `hashed_password` can never
    authenticate here even with a correct-looking guess. Raises
    `UnauthorizedError` on failure or if the matched account is deactivated.
    """
    user = db.query(User).filter(User.email == email).first()
    if user is not None and verify_password(password, user.hashed_password):
        if not user.is_active:
            raise UnauthorizedError("This account has been deactivated")
        return "staff", user

    member = db.query(Member).filter(Member.email == email).first()
    if (
        member is not None
        and member.hashed_password is not None
        and verify_password(password, member.hashed_password)
    ):
        if member.status == MemberStatus.INACTIVE:
            raise UnauthorizedError("This account has been deactivated")
        return "member", member

    raise UnauthorizedError("Invalid email or password")


def set_member_password(db: Session, member_id: int, password: str) -> Member:
    """Grant or reset a member's self-service login password (staff-only action).

    Raises `ValidationError` if the member has no email on file — login is
    keyed by email, so a password would be unusable without one.
    """
    member = db.query(Member).filter(Member.id == member_id).first()
    if member is None:
        raise NotFoundError("Member")
    if member.email is None:
        raise ValidationError(
            "This member has no email on file — add one before granting login access."
        )
    member.hashed_password = hash_password(password)
    db.commit()
    db.refresh(member)
    logger.info("Set login password for member id=%s", member_id)
    return member


async def set_user_avatar(db: Session, user: User, upload_file: UploadFile) -> User:
    """Upload (or replace) a staff user's own profile picture. jpg/jpeg/png, up to 10 MB."""
    _stored_filename, url_path = await save_upload(
        upload_file, _AVATAR_SUBDIR, IMAGE_TYPES
    )
    user.avatar_url = url_path
    db.commit()
    db.refresh(user)
    logger.info("Set avatar for user id=%s", user.id)
    return user


async def set_member_avatar(
    db: Session, member: Member, upload_file: UploadFile
) -> Member:
    """Upload (or replace) a member's own profile picture. jpg/jpeg/png, up to 10 MB."""
    _stored_filename, url_path = await save_upload(
        upload_file, _AVATAR_SUBDIR, IMAGE_TYPES
    )
    member.photo_url = url_path
    db.commit()
    db.refresh(member)
    logger.info("Set avatar for member id=%s", member.id)
    return member


def issue_tokens(db: Session, user: User) -> tuple[str, str]:
    """Create a new access/refresh token pair for a staff `user`. Thin wrapper
    over `issue_tokens_for_actor` kept for the register/login staff call sites."""
    return issue_tokens_for_actor(db, "staff", user)


def issue_tokens_for_actor(
    db: Session, actor: Actor, subject: User | Member
) -> tuple[str, str]:
    """Create a new access/refresh token pair for `subject` and persist the refresh token.

    Every token embeds an `actor` claim ("staff"/"member") alongside `sub` so
    the two id spaces (Users vs. Members) can never be confused on decode.
    """
    role_claim = "member" if isinstance(subject, Member) else subject.role.value
    access_token = create_access_token(
        {"sub": str(subject.id), "role": role_claim, "actor": actor}
    )
    refresh_token = create_refresh_token({"sub": str(subject.id), "actor": actor})

    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    owner_kwargs = (
        {"user_id": subject.id} if actor == "staff" else {"member_id": subject.id}
    )
    db.add(
        RefreshToken(
            token=refresh_token, expires_at=expires_at, revoked=False, **owner_kwargs
        )
    )
    db.commit()

    logger.info("Issued token pair for actor=%s id=%s", actor, subject.id)
    return access_token, refresh_token


def refresh_access_token(
    db: Session, refresh_token: str
) -> tuple[str, str, Actor, User | Member]:
    """Exchange a valid, unrevoked refresh token for a new token pair (rotation).

    The presented refresh token is revoked as part of the exchange. Raises
    `UnauthorizedError` if the token is invalid, unknown, revoked, or expired.
    Returns the new (access_token, refresh_token, actor, subject).
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

    actor: Actor
    subject: User | Member
    if stored.member_id is not None:
        actor = "member"
        member = db.query(Member).filter(Member.id == stored.member_id).first()
        if member is None or member.status == MemberStatus.INACTIVE:
            raise UnauthorizedError("Member not found or inactive")
        subject = member
    else:
        actor = "staff"
        user = db.query(User).filter(User.id == stored.user_id).first()
        if user is None or not user.is_active:
            raise UnauthorizedError("User not found or inactive")
        subject = user

    # Rotate: revoke the presented token before minting a new pair.
    stored.revoked = True
    db.add(stored)
    db.commit()

    new_access_token, new_refresh_token = issue_tokens_for_actor(db, actor, subject)
    return new_access_token, new_refresh_token, actor, subject


def revoke_refresh_token(db: Session, refresh_token: str) -> None:
    """Revoke a refresh token (logout). No-op if the token is unknown."""
    stored = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
    if stored is None:
        logger.warning("Logout attempted with unknown refresh token")
        return
    stored.revoked = True
    db.add(stored)
    db.commit()
