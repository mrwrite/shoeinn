"""Worker that reconciles payment state with the booking database."""

from __future__ import annotations

import logging
import threading
from datetime import datetime, timezone

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import SessionLocal
from app.models import (
    Appointment,
    AppointmentHold,
    AppointmentStatus,
    HoldStatus,
    PaymentStatus,
    NotificationOutbox,
)
from app.services.payment_gateway import PaymentGateway, PaymentGatewayError

logger = logging.getLogger(__name__)

_TERMINAL_PAYMENT_STATUSES = {
    PaymentStatus.SUCCEEDED,
    PaymentStatus.FAILED,
    PaymentStatus.REFUNDED,
    PaymentStatus.DISPUTED,
}


def _ensure_timezone(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


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
        if not self._gateway.enabled:
            logger.warning("Payment sync worker not started - payment service URL missing")
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
                        Appointment.payment_status.notin(_TERMINAL_PAYMENT_STATUSES),
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
        appointment.payment_status = new_status
        if payment_record.amount_expected is not None:
            appointment.payment_amount_expected = payment_record.amount_expected
        appointment.payment_amount_received = payment_record.amount_received
        appointment.payment_currency = payment_record.currency or appointment.payment_currency

        if new_status == PaymentStatus.SUCCEEDED:
            appointment.status = AppointmentStatus.CONFIRMED
            self._confirm_hold(session, appointment)
        elif new_status == PaymentStatus.FAILED:
            appointment.status = AppointmentStatus.CANCELLED
            self._release_hold(session, appointment)

    def _confirm_hold(self, session: Session, appointment: Appointment) -> None:
        hold = appointment.hold_id and session.get(AppointmentHold, appointment.hold_id)
        if hold:
            hold.status = HoldStatus.CONFIRMED
            hold.ttl_expires_at = _ensure_timezone(hold.ttl_expires_at)
        payload = {
            "appointment_id": str(appointment.id),
            "service_id": str(appointment.service_id),
            "customer_name": appointment.customer_name,
            "customer_phone": appointment.customer_phone,
            "customer_email": appointment.customer_email,
            "start_time": _ensure_timezone(appointment.start_time).isoformat(),
            "end_time": _ensure_timezone(appointment.end_time).isoformat(),
            "payment_id": appointment.payment_id,
            "payment_status": appointment.payment_status.value,
            "payment_amount_expected": appointment.payment_amount_expected,
            "payment_amount_received": appointment.payment_amount_received,
            "payment_currency": appointment.payment_currency,
        }
        session.add(
            NotificationOutbox(
                type="APPOINTMENT_CONFIRMED",
                payload=payload,
            )
        )

    def _release_hold(self, session: Session, appointment: Appointment) -> None:
        hold = appointment.hold_id and session.get(AppointmentHold, appointment.hold_id)
        if hold:
            hold.status = HoldStatus.EXPIRED
            hold.ttl_expires_at = datetime.now(timezone.utc)
        session.add(
            NotificationOutbox(
                type="APPOINTMENT_PAYMENT_FAILED",
                payload={
                    "appointment_id": str(appointment.id),
                    "service_id": str(appointment.service_id),
                    "customer_name": appointment.customer_name,
                    "customer_phone": appointment.customer_phone,
                    "customer_email": appointment.customer_email,
                    "start_time": _ensure_timezone(appointment.start_time).isoformat(),
                    "end_time": _ensure_timezone(appointment.end_time).isoformat(),
                    "payment_id": appointment.payment_id,
                    "payment_status": appointment.payment_status.value,
                },
            )
        )


payment_sync_worker = PaymentSyncWorker()


__all__ = ["payment_sync_worker", "PaymentSyncWorker"]
