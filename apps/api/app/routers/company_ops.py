from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import create_access_token, get_current_company_user, verify_password
from app.models import Appointment, AppointmentEvent, AppointmentStatus, Service
from app.models.user import User

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
        .filter(Appointment.status == AppointmentStatus.REQUESTED)
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
    if not appt or appt.company_id != company_id:
        raise HTTPException(status_code=404, detail="Not found")

    appt.status = payload.status
    if payload.confirmed_time:
        appt.confirmed_time = payload.confirmed_time.astimezone(timezone.utc)

    db.add(
        AppointmentEvent(
            appointment_id=appt.id,
            kind="status_change",
            payload={"status": appt.status.value},
        )
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return {"id": appt.id, "status": appt.status}
