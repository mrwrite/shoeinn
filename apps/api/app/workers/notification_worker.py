"""Worker that drains the notification_outbox and delivers messages."""

from __future__ import annotations

import logging
import threading
from datetime import datetime, timezone

from app.core.config import settings
from app.core.db import SessionLocal
from app.utils.notification_dispatcher import dispatch_outbox_batch, default_provider_registry

logger = logging.getLogger(__name__)


class NotificationWorker:
    def __init__(self) -> None:
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()
        self._providers = default_provider_registry()

    def start(self) -> None:
        if not settings.enable_notification_dispatcher:
            logger.info("Notification worker disabled via configuration")
            return
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._run, name="notification-worker", daemon=True)
        self._thread.start()
        logger.info("Notification worker started")

    def stop(self) -> None:
        if not self._thread:
            return
        self._stop.set()
        self._thread.join(timeout=5)
        logger.info("Notification worker stopped")

    def _run(self) -> None:
        interval = max(1, settings.notification_dispatch_interval_seconds)
        while not self._stop.is_set():
            try:
                self._process_pending()
            except Exception:  # pragma: no cover - defensive logging
                logger.exception("Notification worker iteration failed")
            finally:
                self._stop.wait(interval)

    def _process_pending(self) -> None:
        now = datetime.now(timezone.utc)
        with SessionLocal() as session:
            processed, succeeded, failed = dispatch_outbox_batch(
                session, providers=self._providers, now=now
            )
            if processed:
                session.commit()
            else:
                session.rollback()
            if processed:
                logger.info(
                    "Notification worker processed batch",
                    extra={"processed": processed, "succeeded": succeeded, "failed": failed},
                )


notification_worker = NotificationWorker()


__all__ = ["notification_worker", "NotificationWorker"]


if __name__ == "__main__":  # pragma: no cover - manual invocation
    worker = NotificationWorker()
    worker.start()
    try:
        while True:
            worker._stop.wait(1)
    except KeyboardInterrupt:
        worker.stop()

