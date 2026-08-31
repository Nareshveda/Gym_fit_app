"""Auth endpoints: register, login, refresh, logout, and profile (me).

`/me` (GET/PUT) is shared by both actor types — a staff user or a
self-service member — via `get_current_actor`; every other endpoint here
only ever concerns staff accounts.
"""

from __future__ import annotations

import logging
from typing import Literal

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_actor
from app.models.member import Member, MemberStatus
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    MemberAuthResponse,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UpdateMeRequest,
    UserResponse,
)
from app.services import auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _to_auth_response(
    actor: Literal["staff", "member"], subject: User | Member
) -> UserResponse | MemberAuthResponse:
    """Build the right `TokenResponse.user` / `/auth/me` shape for `subject`."""
    if actor == "member" and isinstance(subject, Member):
        return MemberAuthResponse(
            id=subject.id,
            email=subject.email,
            full_name=subject.full_name,
            member_code=subject.member_code,
            is_active=subject.status != MemberStatus.INACTIVE,
            avatar_url=subject.photo_url,
            created_at=subject.created_at,
        )
    return UserResponse.model_validate(subject)


@router.post(
    "/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED
)
async def register(
    data: RegisterRequest, db: Session = Depends(get_db)
) -> TokenResponse:
    """Create a new staff account and return an initial token pair."""
    user = auth_service.register_user(db, data)
    access_token, refresh_token = auth_service.issue_tokens(db, user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Authenticate with email/password (staff or a member with login access
    granted) and return a token pair."""
    actor, subject = auth_service.authenticate_actor(db, data.email, data.password)
    access_token, refresh_token = auth_service.issue_tokens_for_actor(
        db, actor, subject
    )
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_to_auth_response(actor, subject),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Rotate a refresh token for a new access/refresh token pair."""
    access_token, refresh_token, actor, subject = auth_service.refresh_access_token(
        db, data.refresh_token
    )
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_to_auth_response(actor, subject),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(data: RefreshRequest, db: Session = Depends(get_db)) -> None:
    """Revoke a refresh token, ending the associated session."""
    auth_service.revoke_refresh_token(db, data.refresh_token)


@router.get("/me", response_model=UserResponse | MemberAuthResponse)
async def get_me(
    actor_subject: tuple[Literal["staff", "member"], User | Member] = Depends(
        get_current_actor
    ),
) -> UserResponse | MemberAuthResponse:
    """Return the currently authenticated actor's profile (staff user or member)."""
    actor, subject = actor_subject
    return _to_auth_response(actor, subject)


@router.put("/me", response_model=UserResponse | MemberAuthResponse)
async def update_me(
    data: UpdateMeRequest,
    actor_subject: tuple[Literal["staff", "member"], User | Member] = Depends(
        get_current_actor
    ),
    db: Session = Depends(get_db),
) -> UserResponse | MemberAuthResponse:
    """Update the currently authenticated actor's own profile (full name only)."""
    actor, subject = actor_subject
    if data.full_name is not None:
        subject.full_name = data.full_name
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return _to_auth_response(actor, subject)


@router.post("/me/avatar", response_model=UserResponse | MemberAuthResponse)
async def upload_my_avatar(
    file: UploadFile = File(...),
    actor_subject: tuple[Literal["staff", "member"], User | Member] = Depends(
        get_current_actor
    ),
    db: Session = Depends(get_db),
) -> UserResponse | MemberAuthResponse:
    """Upload (or replace) the current actor's own profile picture.

    Accepts .jpg, .jpeg, or .png, up to 10 MB.
    """
    actor, subject = actor_subject
    updated: User | Member
    if isinstance(subject, Member):
        updated = await auth_service.set_member_avatar(db, subject, file)
    else:
        updated = await auth_service.set_user_avatar(db, subject, file)
    return _to_auth_response(actor, updated)
