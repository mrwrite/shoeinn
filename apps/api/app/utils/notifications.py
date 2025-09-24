from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.notification_event import NotificationEvent
from app.models.notification_outbox import NotificationOutbox

logger = logging.getLogger(__name__)


def _ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _serialize_payload(payload: dict[str, Any] | None) -> str:
    if not payload:
        return "{}"
    return json.dumps(payload)


def enqueue_notification_intent(
    db: Session,
    *,
    company_id: str,
    appointment_id: str,
    kind: str,
    channel: str = "email",
    target: str | None = None,
    payload: dict[str, Any] | None = None,
    available_at: datetime | None = None,
) -> Notification:
    """Create a notification and associated outbox entry in a single transaction."""

    now = datetime.now(timezone.utc)
    next_attempt_at = _ensure_utc(available_at) or now
    payload_json = _serialize_payload(payload)

    notification = Notification(
        company_id=company_id,
        appointment_id=appointment_id,
        kind=kind,
        channel=channel,
        target=target,
        payload_json=payload_json,
        status="pending",
        delivered=False,
        delivery_attempts=0,
        next_attempt_at=next_attempt_at,
    )
    outbox = NotificationOutbox(
        notification=notification,
        channel=channel,
        target=target,
        payload_json=payload_json,
        available_at=next_attempt_at,
        status="pending",
    )
    db.add(notification)
    db.add(outbox)
    logger.debug(
        "Enqueued notification intent",
        extra={
            "notification_id": str(notification.id),
            "appointment_id": str(appointment_id),
            "company_id": company_id,
            "channel": channel,
            "target": target,
        },
    )
    return notification


def record_notification_event(
    db: Session,
    notification: Notification,
    event_type: str,
    payload: dict[str, Any] | None = None,
) -> NotificationEvent:
    event = NotificationEvent(
        notification_id=notification.id,
        event_type=event_type,
        payload_json=_serialize_payload(payload),
    )
    db.add(event)
    logger.debug(
        "Recorded notification event",
        extra={
            "notification_id": str(notification.id),
            "event_type": event_type,
        },
    )
    return event

