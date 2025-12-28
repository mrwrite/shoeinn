from datetime import datetime, timezone
import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.enums import AppointmentStatus
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import create_access_token, get_current_company_user, verify_password
from app.models import Appointment, AppointmentEvent, Notification, Service
from app.models.user import User
from app.schemas.notification import NotificationRead
from app.services.notifications import (
    APPOINTMENT_CONFIRMED,
    APPOINTMENT_STATUS_CHANGED,
    NEW_APPOINTMENT,
    enqueue_company_user_notifications,
    enqueue_customer_notification,
)

router = APIRouter(prefix="/company", tags=["company"])


class StatusUpdate(BaseModel):
    status: AppointmentStatus
    confirmed_time: datetime | None = None


class ProviderLogin(BaseModel):
    email: str
    password: str


@router.post("/auth/login")
def provider_login(payload: ProviderLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or user.role != "company" or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/appointments/open")
def open_appointments(current=Depends(get_current_company_user), db: Session = Depends(get_db)):
    _, company_id = current
    q = (
        db.query(Appointment)
        # .filter(Appointment.status == AppointmentStatus.confirmed)
        .filter((Appointment.company_id == company_id) | (Appointment.company_id.is_(None)))
        .order_by(Appointment.start_time.asc())
    )
    items = []
    for appt in q.all():
        service_name = None
        if appt.service_id:
            svc = db.get(Service, appt.service_id)
            service_name = svc.name if svc else None
        items.append(
            {
                "id": appt.id,
                "customer_city": appt.city,
                "customer_state": appt.state,
                "service_name": service_name,
                "start_time": appt.start_time,
                "status": appt.status.value,
            }
        )
    return items


@router.post("/appointments/{appointment_id}/claim")
def claim_appointment(
    appointment_id: UUID, current=Depends(get_current_company_user), db: Session = Depends(get_db)
):
    _, company_id = current
    appt = db.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Not found")
    if appt.company_id and appt.company_id != company_id:
        raise HTTPException(status_code=400, detail="Already claimed")
    if appt.status != AppointmentStatus.REQUESTED:
        raise HTTPException(status_code=400, detail="Not available")

    appt.company_id = company_id
    previous_status = appt.status
    appt.status = AppointmentStatus.CONFIRMED
    appt.confirmed_time = appt.confirmed_time or datetime.now(timezone.utc)

    db.add(
        AppointmentEvent(
            appointment_id=appt.id,
            kind="status_change",
            payload={"status": appt.status.value},
        )
    )
    db.add(appt)
    enqueue_customer_notification(
        db,
        appt,
        APPOINTMENT_STATUS_CHANGED,
        payload={"old_status": previous_status.value, "new_status": appt.status.value},
    )
    enqueue_customer_notification(db, appt, APPOINTMENT_CONFIRMED)
    enqueue_company_user_notifications(db, company_id, appt, NEW_APPOINTMENT)
    db.commit()
    db.refresh(appt)
    return {"id": appt.id, "status": appt.status}


@router.get("/appointments")
def company_appointments(current=Depends(get_current_company_user), db: Session = Depends(get_db)):
    _, company_id = current
    q = db.query(Appointment).filter_by(company_id=company_id).order_by(Appointment.start_time.desc())
    items = []
    for appt in q.all():
        service_name = None
        if appt.service_id:
            svc = db.get(Service, appt.service_id)
            service_name = svc.name if svc else None
        items.append(
            {
                "id": appt.id,
                "service_name": service_name,
                "type": appt.type,
                "start_time": appt.start_time,
                "status": appt.status.value,
            }
        )
    return items


@router.post("/appointments/{appointment_id}/status")
def update_status(
    appointment_id: UUID,
    payload: StatusUpdate,
    current=Depends(get_current_company_user),
    db: Session = Depends(get_db),
):
    _, company_id = current
    appt = db.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Not found")
    if appt.company_id and appt.company_id != company_id:
        raise HTTPException(status_code=404, detail="Not found")

    if appt.company_id is None:
        appt.company_id = company_id

    previous_status = appt.status
    appt.status = payload.status
    if payload.confirmed_time:
        appt.confirmed_time = payload.confirmed_time.astimezone(timezone.utc)
    elif payload.status == AppointmentStatus.confirmed:
        appt.confirmed_time = datetime.now(timezone.utc)

    db.add(
        AppointmentEvent(
            appointment_id=appt.id,
            kind="status_change",
            payload={"status": appt.status.value},
        )
    )
    db.add(appt)
    enqueue_customer_notification(
        db,
        appt,
        APPOINTMENT_STATUS_CHANGED,
        payload={"old_status": previous_status.value, "new_status": appt.status.value},
    )
    if appt.company_id:
        enqueue_company_user_notifications(
            db,
            appt.company_id,
            appt,
            APPOINTMENT_STATUS_CHANGED,
            payload={"old_status": previous_status.value, "new_status": appt.status.value},
        )
    db.commit()
    db.refresh(appt)
    return {"id": appt.id, "status": appt.status}


def _serialize_notification(notification: Notification) -> NotificationRead:
    payload = {}
    if notification.payload_json:
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


@router.get("/notifications", response_model=list[NotificationRead])
def list_notifications(current=Depends(get_current_company_user), db: Session = Depends(get_db)):
    user, company_id = current
    target = str(user.id)
    notifications = (
        db.query(Notification)
        .filter(
            Notification.company_id == company_id,
            Notification.channel == "in_app",
            Notification.target == target,
        )
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [_serialize_notification(n) for n in notifications]


@router.post("/notifications/{notification_id}/ack", response_model=NotificationRead)
def ack_notification(
    notification_id: UUID,
    current=Depends(get_current_company_user),
    db: Session = Depends(get_db),
):
    user, company_id = current
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Not found")
    if notification.company_id != company_id or notification.channel != "in_app":
        raise HTTPException(status_code=404, detail="Not found")
    if notification.target != str(user.id):
        raise HTTPException(status_code=403, detail="Forbidden")

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
