from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_company_user
from app.models.appointment import Appointment
from app.models.notification import Notification
from app.models.service import Service
from app.utils.time import local_iso_from_utc

router = APIRouter(prefix="/company", tags=["company"])


@router.get("/appointments/open")
def open_appointments(current=Depends(get_current_company_user), db: Session = Depends(get_db)):
    user, company_id = current
    q = (
        db.query(Appointment)
        .join(Notification, Notification.appointment_id == Appointment.id)
        .filter(Notification.company_id == company_id, Appointment.status == "requested", Notification.delivered.is_(False))
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
    appt = db.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Not found")
    if appt.company_id and appt.company_id != company_id:
        raise HTTPException(status_code=400, detail="Already claimed")
    appt.company_id = company_id
    appt.status = "claimed"
    notif = db.query(Notification).filter_by(company_id=company_id, appointment_id=appointment_id, delivered=False).first()
    if notif:
        notif.delivered = True
    db.add(Notification(company_id=company_id, appointment_id=appointment_id, kind="status_change"))
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
