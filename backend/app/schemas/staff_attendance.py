"""Pydantic request/response schemas for staff/trainer attendance."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class StaffCheckInRequest(BaseModel):
    """Payload to check a staff/trainer user in for the current day.

    ``staff_id`` is optional — omit it to check the authenticated caller
    themselves in, or provide it (e.g. from a front-desk search) to check
    in a different staff/trainer user.
    """

    staff_id: int | None = Field(
        default=None, gt=0, description="Staff user to check in; defaults to the caller"
    )


class StaffAttendanceResponse(BaseModel):
    """Public representation of a single staff attendance record."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    staff_id: int
    staff_name: str
    check_in_time: datetime
    check_out_time: datetime | None
    date: date
    created_at: datetime
