from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable

from sqlalchemy.orm import Session

from app.models import Appointment, CompanyUser
from app.utils.notifications import enqueue_notification_intent


APPOINTMENT_CONFIRMED = "APPOINTMENT_CONFIRMED"
APPOINTMENT_STATUS_CHANGED = "APPOINTMENT_STATUS_CHANGED"
NEW_APPOINTMENT = "NEW_APPOINTMENT"
PAYMENT_SUCCEEDED = "PAYMENT_SUCCEEDED"
PAYMENT_FAILED = "PAYMENT_FAILED"
WELCOME = "WELCOME"


def _default_payload(appointment: Appointment) -> dict:
    return {
        "appointment_id": str(appointment.id),
        "company_id": str(appointment.company_id) if appointment.company_id else None,
        "service_id": str(appointment.service_id) if appointment.service_id else None,
        "customer_name": appointment.customer_name,
        "customer_email": appointment.customer_email,
        "customer_phone": appointment.customer_phone,
        "start_time": appointment.start_time.isoformat() if appointment.start_time else None,
        "end_time": appointment.end_time.isoformat() if appointment.end_time else None,
    }


def _mark_in_app_delivered(notification, outbox) -> None:
    now = datetime.now(timezone.utc)
    notification.status = "delivered"
    notification.delivered = True
    notification.delivered_at = now
    notification.next_attempt_at = None
    outbox.status = "completed"
    outbox.processed_at = now
    outbox.locked_at = None


def enqueue_customer_notification(
    db: Session,
    appointment: Appointment,
    kind: str,
    *,
    channel: str = "email",
    payload: dict | None = None,
):
    target = appointment.customer_email or appointment.customer_phone
    if not target:
        return None

    payload_data = _default_payload(appointment)
    if payload:
        payload_data.update(payload)

    notification = enqueue_notification_intent(
        db,
        company_id=appointment.company_id,
        appointment_id=appointment.id,
        kind=kind,
        channel=channel,
        target=target,
        payload=payload_data,
    )
    if channel == "in_app" and notification.outbox_entry:
        _mark_in_app_delivered(notification, notification.outbox_entry)
    return notification


def _company_users(db: Session, company_id) -> Iterable[CompanyUser]:
    return db.query(CompanyUser).filter(CompanyUser.company_id == company_id).all()


def enqueue_company_user_notifications(
    db: Session,
    company_id,
    appointment: Appointment,
    kind: str,
    payload: dict | None = None,
):
    notifications = []
    users = _company_users(db, company_id)
    payload_data = _default_payload(appointment)
    if payload:
        payload_data.update(payload)

    for company_user in users:
        target = str(company_user.user_id)
        notification = enqueue_notification_intent(
            db,
            company_id=company_id,
            appointment_id=appointment.id,
            kind=kind,
            channel="in_app",
            target=target,
            payload=payload_data,
        )
        if notification.outbox_entry:
            _mark_in_app_delivered(notification, notification.outbox_entry)
        notifications.append(notification)
    return notifications


__all__ = [
    "APPOINTMENT_CONFIRMED",
    "APPOINTMENT_STATUS_CHANGED",
    "NEW_APPOINTMENT",
    "PAYMENT_FAILED",
    "PAYMENT_SUCCEEDED",
    "WELCOME",
    "enqueue_customer_notification",
    "enqueue_company_user_notifications",
]
