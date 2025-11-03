"""FastAPI application entrypoint."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import appointments, health, services
from app.workers.payment_sync import payment_sync_worker

app = FastAPI(title="ShoeInn API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(services.router)
app.include_router(appointments.router)


@app.on_event("startup")
def _startup() -> None:
    payment_sync_worker.start()


@app.on_event("shutdown")
def _shutdown() -> None:
    payment_sync_worker.stop()
