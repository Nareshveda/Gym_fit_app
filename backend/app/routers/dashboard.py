"""Dashboard endpoints: aggregate overview stats for the home screen."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.dashboard import DashboardStatsResponse
from app.services import dashboard_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardStatsResponse:
    """Return aggregate stats (member counts, revenue, attendance) for the dashboard."""
    logger.info("Fetching dashboard stats for user id=%s", current_user.id)
    return dashboard_service.get_dashboard_stats(db)
