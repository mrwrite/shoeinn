from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import Event, Thread
from typing import Dict, Protocol
from uuid import UUID

from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import SessionLocal
from app.models.notification import Notification
from app.models.notification_outbox import NotificationOutbox
from app.utils.notifications import record_notification_event
from app.models.push_token import PushToken
from app.services.push_sender import ExpoPushResult, send_expo_push

logger = logging.getLogger(__name__)

_OUTBOX_TABLE_PRESENT = False
_OUTBOX_WARNING_LOGGED = False


@dataclass
class ProviderResult:
    success: bool
    message_id: str | None = None
    temporary_failure: bool = False
    error_code: str | None = None
    error_message: str | None = None


class NotificationProvider(Protocol):
    """Interface implemented by concrete notification providers."""

    channel: str

    def send(  # pragma: no cover - protocol definition
        self, *, session: Session, notification: Notification, payload: dict
    ) -> ProviderResult:
        raise NotImplementedError


class StubProvider:
    """Simple provider used for local development and tests."""

    def __init__(self, channel: str) -> None:
        self.channel = channel

    def send(self, *, session: Session, notification: Notification, payload: dict) -> ProviderResult:
        target = (notification.target or "").lower()
        if target in {"temporary-failure", "temp-fail"}:
            return ProviderResult(
                success=False,
                temporary_failure=True,
                error_code="TEMP",
                error_message="Simulated temporary failure",
            )
        if target in {"permanent-failure", "hard-fail"}:
            return ProviderResult(
                success=False,
                temporary_failure=False,
                error_code="HARD",
                error_message="Simulated hard failure",
            )
        message_id = f"{self.channel}:{notification.id}"
        logger.info(
            "Dispatched notification",
            extra={
                "notification_id": str(notification.id),
                "channel": self.channel,
                "target": notification.target,
            },
        )
        return ProviderResult(success=True, message_id=message_id)


class PushProvider:
    channel = "push"

    def send(self, *, session: Session, notification: Notification, payload: dict) -> ProviderResult:
        target = notification.target
        if not target:
            return ProviderResult(success=False, temporary_failure=False, error_message="Missing push target")

        try:
            user_id = UUID(str(target))
        except (TypeError, ValueError):
            return ProviderResult(success=False, temporary_failure=False, error_message="Invalid push target")

        tokens = (
            session.query(PushToken)
            .filter(PushToken.user_id == user_id, PushToken.enabled.is_(True))
            .all()
        )
        if not tokens:
            return ProviderResult(success=True, message_id="push:no_tokens")

        title, body = _push_text(notification, payload)
        result: ExpoPushResult = send_expo_push([t.token for t in tokens], title, body, payload)

        if result.invalid_tokens:
            now = datetime.now(timezone.utc)
            for token_value in result.invalid_tokens:
                token_model = (
                    session.query(PushToken)
                    .filter(PushToken.user_id == user_id, PushToken.token == token_value)
                    .first()
                )
                if token_model:
                    token_model.enabled = False
                    token_model.last_seen_at = now
                    session.add(token_model)

        if result.temporary_failure:
            return ProviderResult(
                success=False,
                temporary_failure=True,
                error_code="PUSH_TEMP",
                error_message=result.error_message,
            )

        return ProviderResult(success=True, message_id="expo_push")


def default_provider_registry() -> Dict[str, NotificationProvider]:
    return {
        "email": StubProvider("email"),
        "sms": StubProvider("sms"),
        "fcm": StubProvider("fcm"),
        "apns": StubProvider("apns"),
        "push": PushProvider(),
    }


def _load_payload(entry: NotificationOutbox) -> dict:
    if not entry.payload_json:
        return {}

    if isinstance(entry.payload_json, dict):
        return entry.payload_json

    try:
        return json.loads(entry.payload_json)
    except json.JSONDecodeError:  # pragma: no cover - defensive
        logger.warning("Invalid JSON payload on notification %s", entry.notification_id)
        return {}


def _ensure_provider(channel: str, providers: Dict[str, NotificationProvider]) -> NotificationProvider | None:
    provider = providers.get(channel)
    if provider:
        return provider
    logger.error("No provider registered for channel '%s'", channel)
    return None


def _push_text(notification: Notification, payload: dict) -> tuple[str, str]:
    kind = (notification.kind or "").upper()
    appointment_id = payload.get("appointment_id") if isinstance(payload, dict) else None
    base_title = "Appointment update"
    base_body = "There is an update to your appointment."

    if kind == "NEW_APPOINTMENT":
        base_title = "New appointment booked"
        base_body = "A customer just booked an appointment."
    elif kind == "APPOINTMENT_CONFIRMED":
        base_title = "Appointment confirmed"
        base_body = "Your appointment has been confirmed."
    elif kind == "APPOINTMENT_STATUS_CHANGED":
        new_status = payload.get("new_status") if isinstance(payload, dict) else None
        base_title = "Appointment status updated"
        if new_status:
            base_body = f"Status changed to {new_status}."
    elif kind == "PAYMENT_SUCCEEDED":
        base_title = "Payment received"
        base_body = "Your payment was received."
    elif kind == "PAYMENT_FAILED":
        base_title = "Payment failed"
        base_body = "Payment for your appointment failed."

    if appointment_id:
        base_body = f"{base_body} (ID: {appointment_id})"

    return base_title, base_body


_BACKOFF_SCHEDULE = [30, 120, 600, 1800, 7200]


def compute_backoff_seconds(attempt: int) -> int:
    if attempt <= 0:
        return _BACKOFF_SCHEDULE[0]
    if attempt <= len(_BACKOFF_SCHEDULE):
        return _BACKOFF_SCHEDULE[attempt - 1]
    return _BACKOFF_SCHEDULE[-1]


def dispatch_outbox_batch(
    session: Session,
    *,
    providers: Dict[str, NotificationProvider] | None = None,
    now: datetime | None = None,
) -> tuple[int, int, int]:
    """Process pending notification outbox entries.

    Returns a tuple of (processed, succeeded, failed).
    """

    if not _ensure_outbox_table(session):
        return 0, 0, 0

    providers = providers or default_provider_registry()
    now = now or datetime.now(timezone.utc)
    processed = succeeded = failed = 0

    entries = (
        session.query(NotificationOutbox)
        .filter(
            NotificationOutbox.status == "pending",
            NotificationOutbox.available_at <= now,
            NotificationOutbox.locked_at.is_(None),
        )
        .order_by(NotificationOutbox.created_at.asc())
        .with_for_update(skip_locked=True)
        .all()
    )

    for entry in entries:
        processed += 1
        entry.status = "processing"
        entry.locked_at = now
        notification = entry.notification

        if notification is None:
           entry.status = "dead_lettered"
           entry.processed_at = now
           entry.locked_at = None
           entry.dead_letter_reason = "Orphaned outbox entry: notification missing"
           failed += 1
           continue

        notification.last_attempt_at = now
        notification.delivery_attempts += 1

        channel = entry.channel or notification.channel

        if channel == "in_app":
            succeeded += 1
            _mark_in_app_delivered(session, notification, entry, now)
            continue

        provider = _ensure_provider(channel, providers)
        payload = _load_payload(entry)

        if not provider:
            failed += 1
            _handle_failure(
                session,
                notification,
                entry,
                ProviderResult(
                    success=False,
                    temporary_failure=False,
                    error_code="NO_PROVIDER",
                    error_message=f"Missing provider for channel {entry.channel}",
                ),
                now,
            )
            continue

        result = provider.send(session=session, notification=notification, payload=payload)

        if result.success:
            succeeded += 1
            _handle_success(session, notification, entry, result, now)
        else:
            failed += 1
            _handle_failure(session, notification, entry, result, now)

    return processed, succeeded, failed


def _ensure_outbox_table(session: Session) -> bool:
    """Verify the notification_outbox table exists before querying it.

    In early local setups the migration that creates this table may not have run
    yet. Instead of raising repeated errors, skip processing until the schema is
    ready.
    """

    global _OUTBOX_TABLE_PRESENT, _OUTBOX_WARNING_LOGGED

    if _OUTBOX_TABLE_PRESENT:
        return True

    try:
        bind = session.get_bind()
        if bind is None:
            return False
        inspector = inspect(bind)
        table_name = NotificationOutbox.__table__.name
        _OUTBOX_TABLE_PRESENT = table_name in inspector.get_table_names()
    except Exception:  # pragma: no cover - defensive
        logger.exception("Failed to inspect database for notification outbox table")
        return False

    if not _OUTBOX_TABLE_PRESENT and not _OUTBOX_WARNING_LOGGED:
        logger.warning(
            "Notification outbox table missing; skipping dispatcher run until migrations are applied."
        )
        _OUTBOX_WARNING_LOGGED = True

    return _OUTBOX_TABLE_PRESENT


def _handle_success(
    session: Session,
    notification: Notification,
    entry: NotificationOutbox,
    result: ProviderResult,
    now: datetime,
) -> None:
    notification.status = "delivered"
    notification.delivered = True
    notification.delivered_at = now
    notification.provider_message_id = result.message_id
    notification.next_attempt_at = None
    notification.last_error_code = None
    notification.last_error_message = None
    notification.last_error_at = None
    notification.dead_lettered = False
    entry.status = "completed"
    entry.processed_at = now
    entry.locked_at = None
    record_notification_event(
        session,
        notification,
        "delivery_success",
        {
            "provider_message_id": result.message_id,
            "channel": notification.channel,
        },
    )


def _handle_failure(
    session: Session,
    notification: Notification,
    entry: NotificationOutbox,
    result: ProviderResult,
    now: datetime,
) -> None:
    notification.last_error_code = result.error_code
    notification.last_error_message = result.error_message
    notification.last_error_at = now

    attempts = notification.delivery_attempts
    max_attempts = max(1, settings.notification_max_attempts)

    if result.temporary_failure and attempts < max_attempts:
        notification.status = "retrying"
        delay = timedelta(seconds=compute_backoff_seconds(attempts))
        next_attempt = now + delay
        notification.next_attempt_at = next_attempt
        entry.status = "pending"
        entry.available_at = next_attempt
        entry.locked_at = None
        record_notification_event(
            session,
            notification,
            "delivery_retry_scheduled",
            {
                "attempt": attempts,
                "next_attempt_at": next_attempt.isoformat(),
                "channel": notification.channel,
            },
        )
        return

    notification.status = "failed"
    notification.dead_lettered = True
    notification.next_attempt_at = None
    entry.status = "dead_lettered"
    entry.processed_at = now
    entry.locked_at = None
    entry.dead_letter_reason = result.error_message
    record_notification_event(
        session,
        notification,
        "delivery_failed",
        {
            "attempt": attempts,
            "channel": notification.channel,
            "error_code": result.error_code,
            "error_message": result.error_message,
        },
    )


class NotificationDispatcherWorker:
    """Simple background dispatcher that polls the outbox and sends notifications."""

    def __init__(self, providers: Dict[str, NotificationProvider] | None = None) -> None:
        self._providers = providers or default_provider_registry()
        self._stop_event = Event()
        self._thread: Thread | None = None

    def start(self) -> None:
        if not settings.enable_notification_dispatcher:
            logger.info("Notification dispatcher disabled via settings")
            return
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
        interval = max(1, settings.notification_dispatch_interval_seconds)
        while not self._stop_event.is_set():
            try:
                with SessionLocal() as session:
                    processed, _, _ = dispatch_outbox_batch(
                        session,
                        providers=self._providers,
                    )
                    if processed:
                        session.commit()
                    else:
                        session.rollback()
            except Exception:  # pragma: no cover - defensive path
                logger.exception("Notification dispatcher run failed")
            self._stop_event.wait(interval)


notification_dispatcher = NotificationDispatcherWorker()


def _mark_in_app_delivered(
    session: Session, notification: Notification, entry: NotificationOutbox, now: datetime
) -> None:
    notification.status = "delivered"
    notification.delivered = True
    notification.delivered_at = now
    notification.next_attempt_at = None
    entry.status = "completed"
    entry.processed_at = now
    entry.locked_at = None
    record_notification_event(
        session,
        notification,
        "in_app_recorded",
        {"channel": "in_app"},
    )

