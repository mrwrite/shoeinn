"""Appointment endpoints covering holds and confirmations."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Dict, Tuple
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import Appointment, AppointmentHold, HoldStatus, NotificationOutbox, Service
from app.schemas.appointment import AppointmentConfirm, AppointmentRead, HoldCreate, HoldRead

router = APIRouter(prefix="/appointments", tags=["appointments"])

_IDEMPOTENCY_CACHE: Dict[str, Tuple[datetime, dict]] = {}
_CACHE_LOCK = Lock()
_IDEMPOTENCY_TTL = timedelta(minutes=10)
_HOLD_TTL = timedelta(minutes=15)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _ensure_utc(value: datetime) -> datetime:
    """Normalise a datetime to timezone-aware UTC."""

    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _get_idempotent_payload(key: str) -> dict | None:
    now = _utcnow()
    with _CACHE_LOCK:
        payload = _IDEMPOTENCY_CACHE.get(key)
        if payload is None:
            return None
        expires_at, data = payload
        if expires_at < now:
            del _IDEMPOTENCY_CACHE[key]
            return None
        return data


def _store_idempotent_payload(key: str, data: dict) -> None:
    expires_at = _utcnow() + _IDEMPOTENCY_TTL
    with _CACHE_LOCK:
        _IDEMPOTENCY_CACHE[key] = (expires_at, data)


def _serialize_hold(hold: AppointmentHold) -> HoldRead:
    return HoldRead.model_validate(
        {
            "id": hold.id,
            "service_id": hold.service_id,
            "customer_name": hold.customer_name,
            "customer_phone": hold.customer_phone,
            "customer_email": hold.customer_email,
            "start_time": _ensure_utc(hold.start_time),
            "end_time": _ensure_utc(hold.end_time),
            "ttl_expires_at": _ensure_utc(hold.ttl_expires_at),
            "status": hold.status,
        },
        from_attributes=True,
    )


def _serialize_appointment(appointment: Appointment) -> AppointmentRead:
    return AppointmentRead.model_validate(
        {
            "id": appointment.id,
            "service_id": appointment.service_id,
            "customer_name": appointment.customer_name,
            "customer_phone": appointment.customer_phone,
            "customer_email": appointment.customer_email,
            "start_time": _ensure_utc(appointment.start_time),
            "end_time": _ensure_utc(appointment.end_time),
            "created_at": _ensure_utc(appointment.created_at),
        },
        from_attributes=True,
    )


@router.post("/holds", response_model=HoldRead, status_code=status.HTTP_201_CREATED)
def create_hold(payload: HoldCreate, db: Session = Depends(get_db)) -> HoldRead:
    """Create a new appointment hold for the given service and start time."""

    service = db.query(Service).filter(Service.id == payload.service_id, Service.is_active.is_(True)).one_or_none()
    if service is None:
        raise HTTPException(status_code=400, detail="Invalid service_id")

    if payload.start_time.tzinfo is None:
        raise HTTPException(status_code=400, detail="start_time must include timezone information")

    start_time = payload.start_time.astimezone(timezone.utc)
    duration = timedelta(minutes=service.duration_minutes) if service.duration_minutes > 0 else timedelta()
    end_time = start_time + duration

    conflict = (
        db.query(Appointment)
        .filter(Appointment.start_time < end_time, Appointment.end_time > start_time)
        .first()
    )
    if conflict:
        raise HTTPException(status_code=400, detail="Time slot already booked")

    hold = AppointmentHold(
        service_id=service.id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=payload.customer_email,
        start_time=start_time,
        end_time=end_time,
        ttl_expires_at=_utcnow() + _HOLD_TTL,
        status=HoldStatus.PENDING,
    )
    db.add(hold)
    db.commit()
    db.refresh(hold)

    print(f"[Booking] Hold created {hold.id} for service {service.slug} at {start_time.isoformat()}")

    return _serialize_hold(hold)


@router.post("/confirm", response_model=AppointmentRead)
def confirm_hold(
    payload: AppointmentConfirm,
    idempotency_key: str | None = Header(default=None, convert_underscores=False, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
) -> AppointmentRead:
    """Confirm an existing appointment hold and create an appointment."""

    if idempotency_key:
        cached = _get_idempotent_payload(idempotency_key)
        if cached is not None:
            print(f"[Booking] Idempotent replay for key {idempotency_key}")
            return AppointmentRead.model_validate(cached)

    hold = db.query(AppointmentHold).filter(AppointmentHold.id == payload.hold_id).one_or_none()
    if hold is None:
        raise HTTPException(status_code=400, detail="Hold not found")

    now = _utcnow()
    expires_at = _ensure_utc(hold.ttl_expires_at)
    if expires_at < now:
        hold.status = HoldStatus.EXPIRED
        db.add(hold)
        db.commit()
        raise HTTPException(status_code=410, detail="Hold expired")

    if hold.status == HoldStatus.CONFIRMED:
        appointment = (
            db.query(Appointment)
            .filter(Appointment.service_id == hold.service_id, Appointment.start_time == hold.start_time)
            .order_by(Appointment.created_at.desc())
            .first()
        )
        if appointment:
            return _serialize_appointment(appointment)
        raise HTTPException(status_code=400, detail="Hold already confirmed")

    service = db.query(Service).filter(Service.id == hold.service_id).one()

    duration = timedelta(minutes=service.duration_minutes) if service.duration_minutes > 0 else timedelta()
    hold_start = _ensure_utc(hold.start_time)
    hold_end = hold_start + duration

    conflict = (
        db.query(Appointment)
        .filter(Appointment.start_time < hold_end, Appointment.end_time > hold_start)
        .first()
    )
    if conflict:
        raise HTTPException(status_code=400, detail="Time slot already booked")

    hold.customer_name = payload.customer_name
    hold.customer_phone = payload.customer_phone
    hold.customer_email = payload.customer_email
    hold.status = HoldStatus.CONFIRMED
    hold.start_time = hold_start
    hold.end_time = hold_end
    hold.ttl_expires_at = expires_at

    appointment = Appointment(
        service_id=hold.service_id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=payload.customer_email,
        start_time=hold_start,
        end_time=hold_end,
    )
    db.add(appointment)

    outbox_entry = NotificationOutbox(
        type="APPOINTMENT_CONFIRMED",
        payload={
            "appointment_id": str(appointment.id),
            "service_id": str(hold.service_id),
            "customer_name": payload.customer_name,
            "customer_phone": payload.customer_phone,
            "customer_email": payload.customer_email,
            "start_time": hold_start.isoformat(),
            "end_time": hold_end.isoformat(),
        },
    )
    db.add(outbox_entry)

    db.add(hold)
    db.commit()
    db.refresh(appointment)
    db.refresh(hold)

    print(f"[Booking] Appointment confirmed {appointment.id} from hold {hold.id}")

    response = _serialize_appointment(appointment)
    if idempotency_key:
        _store_idempotent_payload(idempotency_key, response.model_dump())
    return response


@router.post("/holds/expire")
def expire_holds(db: Session = Depends(get_db)) -> dict[str, int]:
    """Expire holds whose TTL has passed."""

    now = _utcnow()
    holds = (
        db.query(AppointmentHold)
        .filter(AppointmentHold.status == HoldStatus.PENDING, AppointmentHold.ttl_expires_at < now)
        .all()
    )

    for hold in holds:
        hold.status = HoldStatus.EXPIRED
    if holds:
        db.commit()

    expired = len(holds)
    if expired:
        print(f"[Booking] Expired {expired} holds")
    return {"expired": expired}
