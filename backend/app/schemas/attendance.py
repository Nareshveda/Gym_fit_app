"""Pydantic request/response schemas for the attendance module."""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class CheckInRequest(BaseModel):
    """Payload to check a member in for the current day."""

    member_id: int = Field(gt=0, description="ID of the member checking in")


class AttendanceResponse(BaseModel):
    """Public representation of a single attendance record."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    member_id: int
    check_in_time: datetime
    check_out_time: datetime | None
    date: date
    created_at: datetime
