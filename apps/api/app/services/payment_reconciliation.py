from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.enums import AppointmentStatus
from app.models import Appointment, AppointmentEvent, AppointmentHold, HoldStatus, PaymentStatus
from app.services.notifications import (
    APPOINTMENT_CONFIRMED,
    APPOINTMENT_STATUS_CHANGED,
    NEW_APPOINTMENT,
    PAYMENT_FAILED,
    PAYMENT_SUCCEEDED,
    enqueue_company_user_notifications,
    enqueue_customer_notification,
)
from app.services.payment_gateway import PaymentRecord


def reconcile_payment_record(session: Session, appointment: Appointment, payment_record: PaymentRecord) -> bool:
    new_status = PaymentStatus(payment_record.status)
    status_changed = appointment.payment_status != new_status

    appointment.payment_status = new_status
    if payment_record.amount_expected is not None:
        appointment.payment_amount_expected = payment_record.amount_expected
    appointment.payment_amount_received = payment_record.amount_received
    appointment.payment_currency = payment_record.currency or appointment.payment_currency

    if new_status == PaymentStatus.succeeded:
        if appointment.status != AppointmentStatus.confirmed:
            previous_status = appointment.status
            appointment.status = AppointmentStatus.confirmed
            appointment.confirmed_time = datetime.now(timezone.utc)
            _confirm_hold(session, appointment)
            enqueue_customer_notification(session, appointment, PAYMENT_SUCCEEDED)
            enqueue_customer_notification(
                session,
                appointment,
                APPOINTMENT_STATUS_CHANGED,
                payload={"old_status": previous_status.value, "new_status": appointment.status.value},
            )
            enqueue_customer_notification(session, appointment, APPOINTMENT_CONFIRMED)
            enqueue_company_user_notifications(session, appointment.company_id, appointment, NEW_APPOINTMENT)
            _append_status_event(session, appointment)
        appointment.payment_checkout_url = None
    elif new_status == PaymentStatus.failed:
        if appointment.status != AppointmentStatus.payment_failed:
            previous_status = appointment.status
            appointment.status = AppointmentStatus.payment_failed
            appointment.payment_checkout_url = None
            _release_hold(session, appointment)
            enqueue_customer_notification(session, appointment, PAYMENT_FAILED)
            enqueue_customer_notification(
                session,
                appointment,
                APPOINTMENT_STATUS_CHANGED,
                payload={"old_status": previous_status.value, "new_status": appointment.status.value},
            )
            _append_status_event(session, appointment)

    return status_changed


def cancel_unpaid_appointment(session: Session, appointment: Appointment) -> None:
    previous_status = appointment.status
    appointment.status = AppointmentStatus.cancelled
    if appointment.payment_status != PaymentStatus.succeeded:
        appointment.payment_status = PaymentStatus.failed
    appointment.payment_checkout_url = None
    _release_hold(session, appointment)
    enqueue_customer_notification(session, appointment, PAYMENT_FAILED)
    enqueue_customer_notification(
        session,
        appointment,
        APPOINTMENT_STATUS_CHANGED,
        payload={"old_status": previous_status.value, "new_status": appointment.status.value},
    )
    _append_status_event(session, appointment)


def _confirm_hold(session: Session, appointment: Appointment) -> None:
    hold = appointment.hold_id and session.get(AppointmentHold, appointment.hold_id)
    if hold:
        hold.status = HoldStatus.CONFIRMED
        hold.ttl_expires_at = _ensure_utc(hold.ttl_expires_at)


def _release_hold(session: Session, appointment: Appointment) -> None:
    hold = appointment.hold_id and session.get(AppointmentHold, appointment.hold_id)
    if hold:
        hold.status = HoldStatus.EXPIRED
        hold.ttl_expires_at = datetime.now(timezone.utc)


def _append_status_event(session: Session, appointment: Appointment) -> None:
    session.add(
        AppointmentEvent(
            appointment_id=appointment.id,
            kind="status_change",
            payload={"status": appointment.status.value},
        )
    )


def _ensure_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)
