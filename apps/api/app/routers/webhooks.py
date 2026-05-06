from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.enums import AppointmentStatus
from app.models import Appointment
from app.models.notification import Notification
from app.models.appointment import PaymentStatus
from app.services.payment_gateway import PaymentRecord
from app.services.payment_reconciliation import reconcile_payment_record
from app.utils.notification_dispatcher import compute_backoff_seconds
from app.utils.notifications import record_notification_event


class ProviderCallback(BaseModel):
    notification_id: UUID
    status: str
    provider_message_id: str | None = None
    error_code: str | None = None
    error_message: str | None = None


class PaymentCallback(BaseModel):
    booking_id: UUID
    status: PaymentStatus
    amount_expected: int | None = None
    amount_received: int | None = None
    currency: str | None = None


router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/payments")
def payment_status_callback(payload: PaymentCallback, db: Session = Depends(get_db)):
    appointment = db.get(Appointment, payload.booking_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    previous_status = appointment.status
    reconcile_payment_record(
        db,
        appointment,
        PaymentRecord(
            payment_id=appointment.payment_id or f"payment_{appointment.id}",
            booking_id=str(appointment.id),
            status=payload.status.value,
            amount_expected=payload.amount_expected,
            amount_received=payload.amount_received,
            currency=payload.currency,
        ),
    )
    db.add(appointment)
    db.commit()
    return {
        "booking_id": str(appointment.id),
        "previous_status": previous_status.value if isinstance(previous_status, AppointmentStatus) else str(previous_status),
        "status": appointment.status.value,
        "payment_status": appointment.payment_status.value if appointment.payment_status else None,
    }


@router.post("/{provider}")
def notification_status_callback(
    provider: str,
    payload: ProviderCallback,
    db: Session = Depends(get_db),
):
    notification = db.get(Notification, payload.notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    now = datetime.now(timezone.utc)
    entry = notification.outbox_entry
    notification.provider_message_id = payload.provider_message_id or notification.provider_message_id

    status = payload.status.lower()
    if status == "delivered":
        notification.status = "delivered"
        notification.delivered = True
        notification.delivered_at = now
        notification.last_error_code = None
        notification.last_error_message = None
        notification.last_error_at = None
        notification.next_attempt_at = None
        if notification.delivery_attempts == 0:
            notification.delivery_attempts = 1
        if entry:
            entry.status = "completed"
            entry.processed_at = now
            entry.locked_at = None
        record_notification_event(
            db,
            notification,
            "provider_delivery_confirmed",
            {
                "provider": provider,
                "provider_message_id": notification.provider_message_id,
            },
        )
    elif status in {"retry", "temporary_failure"}:
        notification.status = "retrying"
        notification.delivery_attempts += 1
        notification.last_attempt_at = now
        notification.last_error_code = payload.error_code
        notification.last_error_message = payload.error_message
        notification.last_error_at = now
        delay_seconds = compute_backoff_seconds(notification.delivery_attempts)
        next_attempt = now + timedelta(seconds=delay_seconds)
        notification.next_attempt_at = next_attempt
        if entry:
            entry.status = "pending"
            entry.available_at = next_attempt
            entry.locked_at = None
        record_notification_event(
            db,
            notification,
            "provider_retry_requested",
            {
                "provider": provider,
                "attempt": notification.delivery_attempts,
                "error_code": payload.error_code,
                "error_message": payload.error_message,
                "next_attempt_at": next_attempt.isoformat(),
            },
        )
    else:
        notification.status = "failed"
        notification.delivered = False
        notification.dead_lettered = True
        notification.delivery_attempts += 1
        notification.last_attempt_at = now
        notification.last_error_code = payload.error_code
        notification.last_error_message = payload.error_message
        notification.last_error_at = now
        notification.next_attempt_at = None
        if entry:
            entry.status = "dead_lettered"
            entry.locked_at = None
            entry.processed_at = now
            entry.dead_letter_reason = payload.error_message
        record_notification_event(
            db,
            notification,
            "provider_delivery_failed",
            {
                "provider": provider,
                "attempt": notification.delivery_attempts,
                "error_code": payload.error_code,
                "error_message": payload.error_message,
            },
        )

    db.commit()
    return {"status": notification.status}

