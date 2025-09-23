from __future__ import annotations

import logging
from datetime import datetime, timezone
from threading import Event, Thread
from typing import Optional

from sqlalchemy.exc import OperationalError, ProgrammingError

from app.core.config import settings
from app.core.db import SessionLocal
from app.models.appointment_hold import AppointmentHold

logger = logging.getLogger(__name__)


def clear_expired_holds(now: Optional[datetime] = None) -> int:
    """Remove expired hold rows and return the number of rows deleted."""

    now = now or datetime.now(timezone.utc)
    comparison_time = now
    if comparison_time.tzinfo is not None:
        comparison_time = comparison_time.astimezone(timezone.utc).replace(tzinfo=None)
    with SessionLocal() as session:
        try:
            deleted = (
                session.query(AppointmentHold)
                .filter(AppointmentHold.expires_at <= comparison_time)
                .delete(synchronize_session=False)
            )
            session.commit()
            return deleted
        except (OperationalError, ProgrammingError):  # pragma: no cover - defensive path
            session.rollback()
            return 0


class HoldCleanupWorker:
    """Lightweight background worker that periodically clears expired holds."""

    def __init__(self) -> None:
        self._stop_event = Event()
        self._thread: Thread | None = None

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        if not self._thread:
            return
        self._stop_event.set()
        self._thread.join(timeout=1)
        self._thread = None

    def _run(self) -> None:
        interval = max(1, settings.hold_cleanup_interval_seconds)
        while not self._stop_event.is_set():
            try:
                clear_expired_holds()
            except Exception:  # pragma: no cover - defensive logging path
                logger.exception("Failed to clear expired appointment holds")
            self._stop_event.wait(interval)


hold_cleanup_worker = HoldCleanupWorker()

