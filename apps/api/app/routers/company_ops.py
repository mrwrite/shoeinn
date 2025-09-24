from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_company_user
from app.models.appointment import Appointment
from app.models.notification import Notification
from app.models.service import Service
from app.utils.notifications import enqueue_notification_intent, record_notification_event
from app.utils.time import local_iso_from_utc

router = APIRouter(prefix="/company", tags=["company"])


@router.get("/appointments/open")
def open_appointments(current=Depends(get_current_company_user), db: Session = Depends(get_db)):
    user, company_id = current
    q = (
        db.query(Appointment)
        .join(Notification, Notification.appointment_id == Appointment.id)
        .filter(
            Notification.company_id == company_id,
            Notification.kind == "new_request",
            Notification.status.in_(["pending", "retrying"]),
            Appointment.status == "requested",
        )
        .order_by(Appointment.start_time_utc.asc())
    )
    items = []
    for appt in q.all():
        service_name = None
        if appt.service_id:
            svc = db.get(Service, appt.service_id)
            service_name = svc.name if svc else None
        items.append({
            "id": appt.id,
            "customer_city": appt.city,
            "customer_state": appt.state,
            "service_name": service_name,
            "start_time_iso": local_iso_from_utc(appt.start_time_utc, appt.tz_offset_min),
        })
    return items


@router.post("/appointments/{appointment_id}/claim")
def claim_appointment(appointment_id: str, current=Depends(get_current_company_user), db: Session = Depends(get_db)):
    user, company_id = current
    appt_uuid = UUID(appointment_id)
    appt = db.get(Appointment, appt_uuid)
    if not appt:
        raise HTTPException(status_code=404, detail="Not found")
    if appt.company_id and appt.company_id != company_id:
        raise HTTPException(status_code=400, detail="Already claimed")
    appt.company_id = company_id
    appt.status = "claimed"
    notif = (
        db.query(Notification)
        .filter_by(company_id=company_id, appointment_id=appt_uuid, kind="new_request")
        .first()
    )
    if notif:
        ack_time = datetime.now(timezone.utc)
        notif.status = "acknowledged"
        notif.delivered = True
        notif.delivered_at = ack_time
        if notif.outbox_entry:
            notif.outbox_entry.status = "cancelled"
            notif.outbox_entry.locked_at = None
            notif.outbox_entry.processed_at = ack_time
        record_notification_event(
            db,
            notif,
            "notification_acknowledged",
            {"appointment_id": str(appt_uuid)},
        )
    enqueue_notification_intent(
        db,
        company_id=company_id,
        appointment_id=appt_uuid,
        kind="status_change",
        channel="email",
        payload={"appointment_id": str(appt_uuid), "status": appt.status},
    )
    db.commit()
    return {"id": appt.id, "status": appt.status}


@router.get("/appointments")
def company_appointments(current=Depends(get_current_company_user), db: Session = Depends(get_db)):
    user, company_id = current
    q = db.query(Appointment).filter_by(company_id=company_id).order_by(Appointment.start_time_utc.desc())
    items = []
    for appt in q.all():
        service_name = None
        if appt.service_id:
            svc = db.get(Service, appt.service_id)
            service_name = svc.name if svc else None
        items.append({
            "id": appt.id,
            "service_name": service_name,
            "type": appt.type,
            "start_time_iso": local_iso_from_utc(appt.start_time_utc, appt.tz_offset_min),
            "status": appt.status,
        })
    return items
