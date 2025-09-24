from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.notification import Notification
from app.utils.notification_dispatcher import compute_backoff_seconds
from app.utils.notifications import record_notification_event


class ProviderCallback(BaseModel):
    notification_id: UUID
    status: str
    provider_message_id: str | None = None
    error_code: str | None = None
    error_message: str | None = None


router = APIRouter(prefix="/webhooks", tags=["webhooks"])


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

