from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_customer
from app.models.appointment import Appointment
from app.models.company import Company
from app.models.notification import Notification
from app.models.service import Service
from app.schemas.appointment import AppointmentCreate
from app.utils.time import local_iso_from_utc, parse_client_iso, to_utc, tz_offset_minutes

router = APIRouter(tags=["appointments"])


@router.post("/appointments")
def create_appointment(payload: AppointmentCreate, current_user=Depends(get_current_customer), db: Session = Depends(get_db)):
    dt = parse_client_iso(payload.start_time_iso)
    appt = Appointment(
        customer_id=current_user.id,
        company_id=payload.company_id,
        service_id=payload.service_id,
        type=payload.type,
        address_line1=payload.address.line1,
        address_line2=payload.address.line2,
        city=payload.address.city,
        state=payload.address.state,
        postal_code=payload.address.postal_code,
        start_time_utc=to_utc(dt),
        tz_offset_min=tz_offset_minutes(dt),
        notes=payload.notes,
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    company_ids = []
    if payload.company_id:
        company_ids = [payload.company_id]
    else:
        company_ids = [c.id for c in db.query(Company).filter(
            Company.is_active.is_(True),
            Company.city == payload.address.city,
            Company.state == payload.address.state,
        ).order_by(Company.name).limit(5)]
    for cid in company_ids:
        db.add(Notification(company_id=cid, appointment_id=appt.id, kind="new_request"))
    db.commit()
    return {"id": appt.id, "status": appt.status}


@router.get("/appointments/me")
def my_appointments(current_user=Depends(get_current_customer), db: Session = Depends(get_db)):
    q = db.query(Appointment).filter_by(customer_id=current_user.id)
    results = []
    for appt in q.order_by(Appointment.start_time_utc).all():
        company_name = None
        service_name = None
        if appt.company_id:
            company = db.get(Company, appt.company_id)
            company_name = company.name if company else None
        if appt.service_id:
            service = db.get(Service, appt.service_id)
            service_name = service.name if service else None
        results.append({
            "id": appt.id,
            "company_name": company_name,
            "service_name": service_name,
            "type": appt.type,
            "start_time_iso": local_iso_from_utc(appt.start_time_utc, appt.tz_offset_min),
            "status": appt.status,
        })
    return results
