import json
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_customer, get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationAckSummary, NotificationRead
from app.schemas.user import (
    CustomerAddressUpdate,
    NotificationPreferencesRead,
    NotificationPreferencesUpdate,
    UserRead,
)

router = APIRouter(tags=["users"])


def _serialize_notification(notification: Notification) -> NotificationRead:
    payload = {}
    if notification.payload_json:
        if isinstance(notification.payload_json, dict):
            payload = notification.payload_json
        else:
            try:
                payload = json.loads(notification.payload_json)
            except json.JSONDecodeError:
                payload = {}
    return NotificationRead(
        id=notification.id,
        company_id=notification.company_id,
        appointment_id=notification.appointment_id,
        kind=notification.kind,
        channel=notification.channel,
        target=notification.target,
        payload=payload,
        status=notification.status,
        delivered=notification.delivered,
        delivered_at=notification.delivered_at,
        read_at=notification.read_at,
        created_at=notification.created_at,
    )


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)) -> UserRead:
    try:
        return UserRead.model_validate(current_user, from_attributes=True)
    except ValidationError as exc:
        raise HTTPException(
            status_code=500,
            detail="Current user record is invalid. Please contact support.",
        ) from exc


@router.patch("/me/address", response_model=UserRead)
def update_my_address(
    payload: CustomerAddressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserRead:
    current_user.address_line1 = payload.address_line1
    current_user.address_line2 = payload.address_line2
    current_user.city = payload.city
    current_user.state = payload.state
    current_user.postal_code = payload.postal_code
    current_user.country = payload.country or "US"

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return UserRead.model_validate(current_user, from_attributes=True)


def _read_bool_flag(value: str | bool | None, default: bool = True) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    return str(value).strip().lower() not in {"false", "0", "off", "no"}


def _write_bool_flag(value: bool) -> bool:
    return bool(value)


@router.get("/me/notifications", response_model=list[NotificationRead])
def list_my_notifications(
    current_customer: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> list[NotificationRead]:
    notifications = (
        db.query(Notification)
        .filter(
            Notification.channel == "in_app",
            Notification.target == str(current_customer.id),
        )
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [_serialize_notification(notification) for notification in notifications]


@router.post("/me/notifications/{notification_id}/ack", response_model=NotificationRead)
def ack_my_notification(
    notification_id: UUID,
    current_customer: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> NotificationRead:
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Not found")
    if notification.channel != "in_app" or notification.target != str(current_customer.id):
        raise HTTPException(status_code=404, detail="Not found")

    now = datetime.now(timezone.utc)
    notification.read_at = now
    if not notification.delivered:
        notification.delivered = True
        notification.delivered_at = now
        notification.status = "delivered"
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return _serialize_notification(notification)


@router.post("/me/notifications/ack-all", response_model=NotificationAckSummary)
def ack_all_my_notifications(
    current_customer: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> NotificationAckSummary:
    notifications = (
        db.query(Notification)
        .filter(
            Notification.channel == "in_app",
            Notification.target == str(current_customer.id),
            Notification.read_at.is_(None),
        )
        .all()
    )

    now = datetime.now(timezone.utc)
    updated = 0
    for notification in notifications:
        notification.read_at = now
        if not notification.delivered:
            notification.delivered = True
            notification.delivered_at = now
            notification.status = "delivered"
        db.add(notification)
        updated += 1

    db.commit()
    return NotificationAckSummary(updated=updated)


@router.get("/me/notification-preferences", response_model=NotificationPreferencesRead)
def read_my_notification_preferences(
    current_customer: User = Depends(get_current_customer),
) -> NotificationPreferencesRead:
    return NotificationPreferencesRead(
        customer_push_enabled=_read_bool_flag(getattr(current_customer, "customer_push_enabled", True)),
        customer_push_assignment_updates=_read_bool_flag(
            getattr(current_customer, "customer_push_assignment_updates", True)
        ),
        customer_push_milestone_updates=_read_bool_flag(
            getattr(current_customer, "customer_push_milestone_updates", True)
        ),
    )


@router.patch("/me/notification-preferences", response_model=NotificationPreferencesRead)
def update_my_notification_preferences(
    payload: NotificationPreferencesUpdate,
    current_customer: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> NotificationPreferencesRead:
    current_customer.customer_push_enabled = _write_bool_flag(payload.customer_push_enabled)
    current_customer.customer_push_assignment_updates = _write_bool_flag(payload.customer_push_assignment_updates)
    current_customer.customer_push_milestone_updates = _write_bool_flag(payload.customer_push_milestone_updates)
    db.add(current_customer)
    db.commit()
    db.refresh(current_customer)
    return NotificationPreferencesRead(
        customer_push_enabled=_read_bool_flag(current_customer.customer_push_enabled),
        customer_push_assignment_updates=_read_bool_flag(current_customer.customer_push_assignment_updates),
        customer_push_milestone_updates=_read_bool_flag(current_customer.customer_push_milestone_updates),
    )
