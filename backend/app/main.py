"""FastAPI application entrypoint for HSP (gym management SaaS).

Foundation phase: app instance, CORS, global exception handling, and a
health check. Module routers (auth, members, plans, payments, attendance,
admin) are added by their respective Phase 2 agents.
"""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.exceptions import (
    AppException,
    app_exception_handler,
    unhandled_exception_handler,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Starlette's stubs type the handler param as Callable[..., Exception], not
# generic over the registered exception subclass, hence the ignore below.
app.add_exception_handler(AppException, app_exception_handler)  # type: ignore[arg-type]
app.add_exception_handler(Exception, unhandled_exception_handler)

# Serves files saved by app.services.file_storage (equipment documents, etc.)
# back out at the URL path stored in each record's `document_url`.
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """Liveness/readiness check used by deployment validation gates."""
    return {"status": "healthy"}


@app.on_event("startup")
async def on_startup() -> None:
    """Log basic startup info for observability."""
    logger.info(
        "%s v%s starting up (environment=%s)",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.ENVIRONMENT,
    )


# --- Phase 2 module routers ---------------------------------------------
# Each router already declares its own full "/api/v1/..." prefix, so no
# extra prefix is passed here (doing so would double it up).
from app.routers import (
    admin,
    attendance,
    auth,
    dashboard,
    equipment,
    locations,
    member_self,
    member_vitals,
    members,
    payments,
    plans,
    staff,
    staff_attendance,
    subscriptions,
)

app.include_router(auth.router)
app.include_router(members.router)
app.include_router(plans.router)
app.include_router(subscriptions.router)
app.include_router(payments.router)
app.include_router(attendance.router)
app.include_router(attendance.members_router)
app.include_router(member_vitals.router)
app.include_router(admin.router)
app.include_router(dashboard.router)
app.include_router(staff.router)
app.include_router(staff_attendance.router)
app.include_router(locations.router)
app.include_router(equipment.router)
app.include_router(member_self.router)
