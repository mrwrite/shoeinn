from __future__ import annotations

from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import inspect, text

from app.core.config import settings
from app.core.db import SessionLocal
from app.models.notification_outbox import NotificationOutbox

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/ready")
def ready():
    try:
        with SessionLocal() as session:
            bind = session.get_bind()
            if bind is None:
                raise RuntimeError("Database engine unavailable")

            session.execute(text("SELECT 1"))

            inspector = inspect(bind)
            outbox_table = NotificationOutbox.__table__.name
            if outbox_table not in inspector.get_table_names():
                raise RuntimeError(f"Required table missing: {outbox_table}")

            version_rows = session.execute(text("SELECT version_num FROM alembic_version")).scalars().all()
            if not version_rows:
                raise RuntimeError("Alembic version table is empty")

            alembic_cfg = Config(str(Path(__file__).resolve().parents[2] / "alembic.ini"))
            alembic_cfg.set_main_option("script_location", str(Path(__file__).resolve().parents[2] / "alembic"))
            script = ScriptDirectory.from_config(alembic_cfg)
            expected_heads = set(script.get_heads())
            current_heads = set(version_rows)
            if current_heads != expected_heads:
                raise RuntimeError(
                    f"Database migration head mismatch: current={sorted(current_heads)} expected={sorted(expected_heads)}"
                )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Not ready: {exc}",
        ) from exc

    payment_mode = "service" if settings.payment_service_base_url else "stub"
    return {
        "status": "ready",
        "database": "ok",
        "migrations": "ok",
        "notification_outbox": "ok",
        "payment_mode": payment_mode,
        "live_events_mode": "single_instance",
    }
