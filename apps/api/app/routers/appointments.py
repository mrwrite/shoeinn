from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import get_db
from app.core.security import get_current_customer
from app.models.appointment import Appointment
from app.models.appointment_hold import AppointmentHold
from app.models.available_slot import AvailableSlot
from app.models.company import Company
from app.models.service import Service
from app.schemas.appointment import AppointmentCreate
from app.utils.time import local_iso_from_utc, parse_client_iso, to_utc, tz_offset_minutes
from app.utils.notifications import enqueue_notification_intent

router = APIRouter(tags=["appointments"])


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


@router.post("/appointments")
def create_appointment(payload: AppointmentCreate, current_user=Depends(get_current_customer), db: Session = Depends(get_db)):
    dt = parse_client_iso(payload.start_time_iso)
    now = datetime.now(timezone.utc)
    hold_duration = timedelta(minutes=settings.appointment_hold_minutes)
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
    start_time_utc = appt.start_time_utc
    hold_key = {
        "company_id": payload.company_id,
        "service_id": payload.service_id,
        "start_time_utc": start_time_utc,
    }

    try:
        hold = (
            db.query(AppointmentHold)
            .filter_by(**hold_key)
            .one_or_none()
        )

        if hold and _ensure_utc(hold.expires_at) <= now:
            db.delete(hold)
            db.flush()
            hold = None

        if hold:
            if hold.customer_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Time slot already reserved")
            hold.version += 1
            hold.expires_at = now + hold_duration
            hold.active = True
        else:
            hold = AppointmentHold(
                customer_id=current_user.id,
                expires_at=now + hold_duration,
                active=True,
                **hold_key,
            )
            db.add(hold)
            db.flush()

        existing_appt = (
            db.query(Appointment)
            .filter_by(company_id=payload.company_id, start_time_utc=start_time_utc)
            .one_or_none()
        )
        if existing_appt:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Time slot already booked")

        db.add(appt)
        db.flush()

        slot = (
            db.query(AvailableSlot)
            .filter_by(**hold_key)
            .one_or_none()
        )
        if slot:
            slot.mark_booked(now)
        else:
            slot = AvailableSlot(**hold_key)
            slot.mark_booked(now)
            db.add(slot)

        hold.mark_consumed()

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
            enqueue_notification_intent(
                db,
                company_id=cid,
                appointment_id=appt.id,
                kind="new_request",
                channel="email",
                payload={
                    "appointment_id": str(appt.id),
                    "company_id": cid,
                    "kind": "new_request",
                },
            )

        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Time slot already booked")

    db.refresh(appt)
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
