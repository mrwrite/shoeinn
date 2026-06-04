"""FastAPI application entrypoint."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routers import (
    appointments,
    auth,
    care_categories,
    companies,
    company_ops,
    live,
    admin,
    dev_seed,
    health,
    services,
    slots,
    webhooks,
    push,
    users,
    payment_return,
)
from app.workers.payment_sync import payment_sync_worker
from pathlib import Path
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    stream=sys.stdout,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    force=True,  # <- IMPORTANT: overrides existing handlers/config
)

app = FastAPI(title="ShoeInn API")

static_dir = Path(__file__).resolve().parent / "static"
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(care_categories.router)
app.include_router(companies.router)
app.include_router(services.router)
app.include_router(appointments.router)
app.include_router(company_ops.router)
app.include_router(live.router)
app.include_router(dev_seed.router)
app.include_router(slots.router)
app.include_router(webhooks.router)
app.include_router(push.router)
app.include_router(users.router)
app.include_router(payment_return.router)


@app.on_event("startup")
def _startup() -> None:
    payment_sync_worker.start()


@app.on_event("shutdown")
def _shutdown() -> None:
    payment_sync_worker.stop()
