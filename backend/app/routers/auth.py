"""Auth endpoints: register, login, refresh, logout, and profile (me)."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UpdateMeRequest,
    UserResponse,
)
from app.services import auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
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
    """Authenticate with email/password and return a token pair."""
    user = auth_service.authenticate_user(db, data.email, data.password)
    access_token, refresh_token = auth_service.issue_tokens(db, user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Rotate a refresh token for a new access/refresh token pair."""
    access_token, refresh_token, user = auth_service.refresh_access_token(db, data.refresh_token)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(data: RefreshRequest, db: Session = Depends(get_db)) -> None:
    """Revoke a refresh token, ending the associated session."""
    auth_service.revoke_refresh_token(db, data.refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UpdateMeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Update the currently authenticated user's own profile."""
    if data.full_name is not None:
        current_user.full_name = data.full_name
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
