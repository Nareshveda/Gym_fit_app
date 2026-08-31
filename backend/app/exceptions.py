"""Custom application exceptions and their FastAPI exception handlers.

Routers and services raise these instead of `HTTPException` so error handling
stays consistent across modules; handlers are wired into the app in main.py.
"""

from __future__ import annotations

import logging

from fastapi import Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class AppException(Exception):
    """Base class for all custom application exceptions."""

    def __init__(
        self,
        message: str,
        code: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
    ) -> None:
        """Store a human-readable message, a machine-readable code, and the HTTP status."""
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(AppException):
    """Raised when a requested resource does not exist (maps to HTTP 404)."""

    def __init__(self, resource: str = "Resource") -> None:
        super().__init__(
            f"{resource} not found", "NOT_FOUND", status.HTTP_404_NOT_FOUND
        )


class ConflictError(AppException):
    """Raised when a request conflicts with existing state, e.g. duplicate email (HTTP 409)."""

    def __init__(self, message: str = "Conflict with existing resource") -> None:
        super().__init__(message, "CONFLICT", status.HTTP_409_CONFLICT)


class ValidationError(AppException):
    """Raised for domain-level validation failures not caught by Pydantic (HTTP 422)."""

    def __init__(self, message: str = "Validation failed") -> None:
        super().__init__(
            message, "VALIDATION_ERROR", status.HTTP_422_UNPROCESSABLE_ENTITY
        )


class UnauthorizedError(AppException):
    """Raised when authentication is missing or invalid (HTTP 401)."""

    def __init__(self, message: str = "Not authenticated") -> None:
        super().__init__(message, "UNAUTHORIZED", status.HTTP_401_UNAUTHORIZED)


class ForbiddenError(AppException):
    """Raised when an authenticated user lacks permission for an action (HTTP 403)."""

    def __init__(self, message: str = "Not authorized to perform this action") -> None:
        super().__init__(message, "FORBIDDEN", status.HTTP_403_FORBIDDEN)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Convert an AppException into a consistent JSON error response."""
    logger.warning(
        "AppException on %s %s: [%s] %s",
        request.method,
        request.url.path,
        exc.code,
        exc.message,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler: log the full traceback and return a generic 500 response."""
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
            }
        },
    )
