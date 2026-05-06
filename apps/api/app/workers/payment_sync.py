"""Worker that reconciles payment state with the booking database."""

from __future__ import annotations

import logging
import threading

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import SessionLocal
from app.models import Appointment, PaymentStatus
from app.services.payment_gateway import PaymentGateway, PaymentGatewayError
from app.services.payment_reconciliation import reconcile_payment_record

logger = logging.getLogger(__name__)

_TERMINAL_PAYMENT_STATUSES = {
    PaymentStatus.succeeded,
    PaymentStatus.failed,
    PaymentStatus.refunded,
    PaymentStatus.disputed,
}
class PaymentSyncWorker:
    """Background worker that polls the payment service for updates."""

    def __init__(self) -> None:
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()
        self._gateway = PaymentGateway()

    def start(self) -> None:
        if not settings.enable_payment_sync_worker:
            logger.info("Payment sync worker disabled via configuration")
            return
        if self._gateway.mode != "service":
            logger.info("Payment sync worker not started - payment mode is %s", self._gateway.mode)
            return
        if not self._gateway.enabled:
            logger.warning("Payment sync worker not started - PAYMENT_MODE=service requires payment service URL")
            return
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._run, name="payment-sync-worker", daemon=True)
        self._thread.start()
        logger.info("Payment sync worker started")

    def stop(self) -> None:
        if not self._thread:
            return
        self._stop.set()
        self._thread.join(timeout=5)
        logger.info("Payment sync worker stopped")

    def _run(self) -> None:
        interval = max(1, settings.payment_sync_interval_seconds)
        while not self._stop.is_set():
            try:
                self._sync_iteration()
            except Exception:  # pragma: no cover - defensive logging
                logger.exception("Payment sync iteration failed")
            finally:
                self._stop.wait(interval)

    def _sync_iteration(self) -> None:
        session: Session = SessionLocal()
        try:
            pending = (
                session.query(Appointment)
                .filter(
                    Appointment.payment_id.isnot(None),
                    or_(
                        Appointment.payment_status.is_(None),
                        Appointment.payment_status.not_in(_TERMINAL_PAYMENT_STATUSES),
                    ),
                )
                .all()
            )
            for appointment in pending:
                self._sync_appointment(session, appointment)
            session.commit()
        finally:
            session.close()

    def _sync_appointment(self, session: Session, appointment: Appointment) -> None:
        booking_id = str(appointment.id)
        try:
            payment_record = self._gateway.fetch_payment(booking_id=booking_id)
        except PaymentGatewayError as exc:
            logger.warning(
                "Payment lookup failed", extra={"appointment_id": booking_id, "error": str(exc)}
            )
            return

        new_status = PaymentStatus(payment_record.status)
        if appointment.payment_status == new_status:
            return

        logger.info(
            "Payment status change", extra={"appointment_id": booking_id, "status": new_status.value}
        )
        reconcile_payment_record(session, appointment, payment_record)


payment_sync_worker = PaymentSyncWorker()


__all__ = ["payment_sync_worker", "PaymentSyncWorker"]
