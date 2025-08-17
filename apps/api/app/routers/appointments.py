from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_session
from app.models.service import Service
from app.models.appointment import Appointment
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentOut,
)
from app.utils.time import (
    parse_client_iso,
    to_utc,
    tz_offset_minutes,
    local_iso_from_utc,
)

router = APIRouter()

@router.post("/appointments")
def create_appointment(payload: AppointmentCreate, session: Session = Depends(get_session)):
    service = session.get(Service, payload.service_id)
    if not service:
        raise HTTPException(status_code=400, detail="invalid service_id")
    dt_local = parse_client_iso(payload.start_time_iso)
    appt = Appointment(
        id=uuid4(),
        service_id=payload.service_id,
        type=payload.type,
        address_line1=payload.address.line1,
        address_line2=payload.address.line2,
        city=payload.address.city,
        state=payload.address.state,
        postal_code=payload.address.postal_code,
        start_time_utc=to_utc(dt_local),
        tz_offset_min=tz_offset_minutes(dt_local),
        notes=payload.notes,
        customer_name=payload.customer.name,
        customer_email=payload.customer.email,
        customer_phone=payload.customer.phone,
    )
    session.add(appt)
    session.commit()
    return {"id": str(appt.id)}

@router.get("/appointments/me", response_model=list[AppointmentOut])
def list_my_appointments(
    email: str | None = None,
    phone: str | None = None,
    session: Session = Depends(get_session),
):
    q = session.query(Appointment, Service.name).join(Service)
    if email:
        q = q.filter(Appointment.customer_email == email)
    if phone:
        q = q.filter(Appointment.customer_phone == phone)
    rows = q.order_by(Appointment.start_time_utc).all()
    result: list[AppointmentOut] = []
    for appt, service_name in rows:
        result.append(
            AppointmentOut(
                id=appt.id,
                service_name=service_name,
                type=appt.type,
                start_time_iso=local_iso_from_utc(appt.start_time_utc),
                status=appt.status,
            )
        )
    return result
