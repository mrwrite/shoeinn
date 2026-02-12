"""Appointment endpoints covering holds and confirmations."""

from __future__ import annotations

from asyncio.log import logger
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Dict, Tuple
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import get_db
from app.core.security import get_current_customer, get_current_user, get_current_company_user
from app.models import (
    Appointment,
    AppointmentAssignment,
    AppointmentEvent,
    AppointmentLocationUpdate,
    AppointmentHold,
    HoldStatus,
    PaymentStatus,
    Service,
    User,
)
from app.services.notifications import (
    APPOINTMENT_CONFIRMED,
    APPOINTMENT_STATUS_CHANGED,
    NEW_APPOINTMENT,
    enqueue_company_user_notifications,
    enqueue_customer_notification,
)
from app.enums import AppointmentStatus
from app.services.payment_gateway import PaymentGateway, PaymentGatewayError
from app.schemas.appointment import (
    AppointmentAssignmentRead,
    AppointmentConfirm,
    AppointmentEventRead,
    AppointmentListItem,
    AppointmentRead,
    HoldCreate,
    HoldRead,
    LocationUpdateRead,
    AppointmentProviderLocationRead,
    AppointmentProviderLocationResponse,
)

router = APIRouter(prefix="/appointments", tags=["appointments"])

_IDEMPOTENCY_CACHE: Dict[str, Tuple[datetime, dict]] = {}
_CACHE_LOCK = Lock()
_IDEMPOTENCY_TTL = timedelta(minutes=10)
_HOLD_TTL = timedelta(minutes=15)
CANCELLED_STATUS = AppointmentStatus.cancelled


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
            "address_line1": hold.address_line1,
            "address_line2": hold.address_line2,
            "city": hold.city,
            "state": hold.state,
            "postal_code": hold.postal_code,
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
            "company_id": appointment.company_id,
            "service_id": appointment.service_id,
            "hold_id": appointment.hold_id,
            "type": appointment.type,
            "customer_name": appointment.customer_name,
            "customer_phone": appointment.customer_phone,
            "customer_email": appointment.customer_email,
            "address_line1": appointment.address_line1,
            "address_line2": appointment.address_line2,
            "city": appointment.city,
            "state": appointment.state,
            "postal_code": appointment.postal_code,
            "start_time": _ensure_utc(appointment.start_time),
            "confirmed_time": _ensure_utc(appointment.confirmed_time)
            if appointment.confirmed_time
            else None,
            "end_time": _ensure_utc(appointment.end_time) if appointment.end_time else None,
            "status": appointment.status,
            "payment_id": appointment.payment_id,
            "payment_status": appointment.payment_status,
            "payment_checkout_url": appointment.payment_checkout_url,
            "payment_amount_expected": appointment.payment_amount_expected,
            "payment_amount_received": appointment.payment_amount_received,
            "payment_currency": appointment.payment_currency,
            "created_at": _ensure_utc(appointment.created_at),
            "updated_at": _ensure_utc(appointment.updated_at),
        },
        from_attributes=True,
    )


def _normalize_optional(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _resolve_customer_address(
    *,
    db: Session,
    customer_email: str | None,
    address_line1: str | None,
    address_line2: str | None,
    city: str | None,
    state: str | None,
    postal_code: str | None,
) -> dict[str, str | None]:
    resolved = {
        "address_line1": _normalize_optional(address_line1),
        "address_line2": _normalize_optional(address_line2),
        "city": _normalize_optional(city),
        "state": _normalize_optional(state),
        "postal_code": _normalize_optional(postal_code),
    }

    required_present = all(
        [resolved["address_line1"], resolved["city"], resolved["state"], resolved["postal_code"]]
    )
    if required_present:
        return resolved

    if not customer_email:
        return resolved

    user = db.query(User).filter(User.email == customer_email).one_or_none()
    if user is None:
        return resolved

    return {
        "address_line1": resolved["address_line1"] or user.address_line1,
        "address_line2": resolved["address_line2"] or user.address_line2,
        "city": resolved["city"] or user.city,
        "state": resolved["state"] or user.state,
        "postal_code": resolved["postal_code"] or user.postal_code,
    }


@router.get("/mine", response_model=list[AppointmentListItem])
def list_my_appointments(
    current_customer=Depends(get_current_customer), db: Session = Depends(get_db)
) -> list[AppointmentListItem]:
    items: list[AppointmentListItem] = []
    q = (
        db.query(Appointment)
        .filter(Appointment.customer_email == current_customer.email)
        .filter(Appointment.status != AppointmentStatus.cancelled)
        .filter(Appointment.status != AppointmentStatus.completed)
        .order_by(Appointment.start_time.desc())
    )
    for appt in q.all():
        service_name = None
        if appt.service_id:
            svc = db.get(Service, appt.service_id)
            service_name = svc.name if svc else None
        items.append(
            AppointmentListItem.model_validate(
                {
                    "id": appt.id,
                    "company_id": appt.company_id,
                    "service_name": service_name,
                    "customer_name": appt.customer_name,
                    "customer_phone": appt.customer_phone,
                    "address_line1": appt.address_line1,
                    "address_line2": appt.address_line2,
                    "city": appt.city,
                    "state": appt.state,
                    "postal_code": appt.postal_code,
                    "start_time": _ensure_utc(appt.start_time),
                    "status": appt.status,
                }
            )
        )
    return items

def _ensure_company_access(appointment: Appointment, company_id) -> None:
    if appointment.company_id != company_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

def _ensure_customer_access(appointment: Appointment, current_customer) -> None:
    if not appointment.customer_email:
        raise HTTPException(status_code=403, detail="Forbidden")
    if appointment.customer_email.lower() != current_customer.email.lower():
        raise HTTPException(status_code=403, detail="Forbidden")

def _provider_display_name(user: User | None) -> str | None:
    if not user or not user.full_name:
        return None
    parts = [p for p in user.full_name.split(" ") if p]
    if not parts:
        return None
    if len(parts) == 1:
        return parts[0]
    return "".join(p[0].upper() for p in parts[:2])


@router.post("/holds", response_model=HoldRead, status_code=status.HTTP_201_CREATED)
def create_hold(payload: HoldCreate, db: Session = Depends(get_db)) -> HoldRead:
    """Create a new appointment hold for the given service and start time."""

    service = db.query(Service).filter(Service.id == payload.service_id, Service.is_active.is_(True)).one_or_none()
    if service is None:
        raise HTTPException(status_code=400, detail="Invalid service_id")

    if payload.start_time.tzinfo is None:
        raise HTTPException(status_code=400, detail="start_time must include timezone information")

    start_time = _ensure_utc(payload.start_time)
    duration_minutes = service.duration_minutes if service.duration_minutes is not None else 0
    duration = timedelta(minutes=duration_minutes)
    end_time = start_time + duration

    if end_time <= start_time:
        raise HTTPException(status_code=400, detail="Service duration must be greater than zero")

    conflict = (
        db.query(Appointment)
        .filter(
            Appointment.start_time < end_time,
            Appointment.end_time > start_time,
            Appointment.status != CANCELLED_STATUS,
        )
        .filter(Appointment.company_id == service.company_id)
        .first()
    )
    if conflict:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Time slot already booked")

    resolved_address = _resolve_customer_address(
        db=db,
        customer_email=payload.customer_email,
        address_line1=payload.address_line1,
        address_line2=payload.address_line2,
        city=payload.city,
        state=payload.state,
        postal_code=payload.postal_code,
    )

    hold = AppointmentHold(
        service_id=service.id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=payload.customer_email,
        address_line1=resolved_address["address_line1"],
        address_line2=resolved_address["address_line2"],
        city=resolved_address["city"],
        state=resolved_address["state"],
        postal_code=resolved_address["postal_code"],
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


def get_payment_gateway() -> PaymentGateway:
    return PaymentGateway()


@router.get("/{appointment_id}", response_model=AppointmentRead)
def read_appointment(appointment_id: UUID, db: Session = Depends(get_db)) -> AppointmentRead:
    appointment = db.get(Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return _serialize_appointment(appointment)


@router.get("/{appointment_id}/events", response_model=list[AppointmentEventRead])
def read_appointment_events(appointment_id: UUID, db: Session = Depends(get_db)) -> list[AppointmentEventRead]:
    events = (
        db.query(AppointmentEvent)
        .filter(AppointmentEvent.appointment_id == appointment_id)
        .order_by(AppointmentEvent.created_at.asc())
        .all()
    )
    return [AppointmentEventRead.model_validate(event, from_attributes=True) for event in events]


@router.get(
    "/{appointment_id}/provider-location",
    response_model=AppointmentProviderLocationResponse,
)
def read_provider_location(
    appointment_id: UUID,
    current_customer=Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> AppointmentProviderLocationResponse:
    appointment = db.get(Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    _ensure_customer_access(appointment, current_customer)

    update = (
        db.query(AppointmentLocationUpdate)
        .filter(AppointmentLocationUpdate.appointment_id == appointment_id)
        .order_by(AppointmentLocationUpdate.recorded_at.desc())
        .first()
    )
    if update is None:
        return AppointmentProviderLocationResponse(location=None)

    return AppointmentProviderLocationResponse(
        location=AppointmentProviderLocationRead.model_validate(update, from_attributes=True)
    )


@router.get(
    "/{appointment_id}/assignment/company",
    response_model=AppointmentAssignmentRead,
)
def read_assignment_company(
    appointment_id: UUID,
    current=Depends(get_current_company_user),  # returns (user, company_id)
    db: Session = Depends(get_db),
) -> AppointmentAssignmentRead:
    current_user, company_id = current

    appointment = db.get(Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")

    _ensure_company_access(appointment, company_id)

    assignment = (
        db.query(AppointmentAssignment)
        .filter(
            AppointmentAssignment.appointment_id == appointment_id,
            AppointmentAssignment.is_active.is_(True),
        )
        .first()
    )

    # IMPORTANT: for providers, "no assignment" is normal
    if assignment is None:
        raise HTTPException(status_code=404, detail="No provider assigned")

    provider = db.get(User, assignment.user_id)
    return AppointmentAssignmentRead.model_validate(
        {
            "id": assignment.id,
            "appointment_id": assignment.appointment_id,
            "company_id": company_id,
            "user_id": assignment.user_id,
            "assigned_at": assignment.assigned_at,
            "unassigned_at": assignment.unassigned_at,
            "is_active": assignment.is_active,
            "provider_name": _provider_display_name(provider),
        },
        from_attributes=True,
    )

@router.get(
    "/{appointment_id}/assignment",
    response_model=AppointmentAssignmentRead,
)
def read_assignment(
    appointment_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AppointmentAssignmentRead:    
    appointment = db.get(Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")       

    if current_user.role == "customer":
        _ensure_customer_access(appointment, current_user)
    else:
        _ensure_company_access(appointment, current_user, db)   

    assignment = (
        db.query(AppointmentAssignment)
        .filter(
            AppointmentAssignment.appointment_id == appointment_id,
            AppointmentAssignment.is_active.is_(True),
        )
        .first()
    )
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No provider assigned")

    provider = db.get(User, assignment.user_id)
    return AppointmentAssignmentRead.model_validate(
        {
            "id": assignment.id,
            "appointment_id": assignment.appointment_id,
            "user_id": assignment.user_id,
            "assigned_at": assignment.assigned_at,
            "unassigned_at": assignment.unassigned_at,
            "is_active": assignment.is_active,
            "provider_name": _provider_display_name(provider),
        },
        from_attributes=True,
    )


@router.post("/confirm", response_model=AppointmentRead)
def confirm_hold(
    payload: AppointmentConfirm,
    idempotency_key: str | None = Header(default=None, convert_underscores=False, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
    gateway: PaymentGateway = Depends(get_payment_gateway),
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

    duration_minutes = service.duration_minutes if service.duration_minutes is not None else 0
    duration = timedelta(minutes=duration_minutes)
    hold_start = _ensure_utc(hold.start_time)
    hold_end = hold_start + duration

    if hold_end <= hold_start:
        raise HTTPException(status_code=400, detail="Service duration must be greater than zero")

    conflict = (
        db.query(Appointment)
        .filter(
            Appointment.start_time < hold_end,
            Appointment.end_time > hold_start,
            Appointment.status != CANCELLED_STATUS,
        )
        .filter(Appointment.company_id == service.company_id)
        .first()
    )
    if conflict:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Time slot already booked")

    resolved_address = _resolve_customer_address(
        db=db,
        customer_email=payload.customer_email or hold.customer_email,
        address_line1=payload.address_line1 or hold.address_line1,
        address_line2=payload.address_line2 or hold.address_line2,
        city=payload.city or hold.city,
        state=payload.state or hold.state,
        postal_code=payload.postal_code or hold.postal_code,
    )

    hold.customer_name = payload.customer_name
    hold.customer_phone = payload.customer_phone
    hold.customer_email = payload.customer_email
    hold.address_line1 = resolved_address["address_line1"]
    hold.address_line2 = resolved_address["address_line2"]
    hold.city = resolved_address["city"]
    hold.state = resolved_address["state"]
    hold.postal_code = resolved_address["postal_code"]
    hold.start_time = hold_start
    hold.end_time = hold_end
    hold.ttl_expires_at = expires_at

    appointment = (
        db.query(Appointment)
        .filter(Appointment.hold_id == hold.id)
        .order_by(Appointment.created_at.desc())
        .first()
    )
    if appointment and appointment.status != CANCELLED_STATUS:
        response = _serialize_appointment(appointment)
        if idempotency_key:
            _store_idempotent_payload(idempotency_key, response.model_dump())
        return response

    if payload.company_id and payload.company_id != service.company_id:
        raise HTTPException(status_code=400, detail="company_id does not match service")

    company_id = payload.company_id or service.company_id
    if company_id is None:
        raise HTTPException(status_code=400, detail="Missing company_id for appointment")

    appointment = Appointment(
        service_id=hold.service_id,
        hold_id=hold.id,
        company_id=company_id,
        type=payload.type,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=payload.customer_email,
        address_line1=resolved_address["address_line1"],
        address_line2=resolved_address["address_line2"],
        city=resolved_address["city"],
        state=resolved_address["state"],
        postal_code=resolved_address["postal_code"],
        start_time=hold_start,
        end_time=hold_end,
        status=AppointmentStatus.requested,
    )
    db.add(appointment)
    db.flush()

    enqueue_customer_notification(
        db,
        appointment,
        APPOINTMENT_STATUS_CHANGED,
        payload={"old_status": None, "new_status": appointment.status.value},
    )

    booking_id = str(appointment.id)
    currency = settings.payment_currency
    amount_cents = service.price_cents

    using_stub = not gateway.enabled

    try:
        checkout = gateway.create_checkout_session(
            booking_id=booking_id,
            amount_cents=amount_cents,
            currency=currency,
            customer_email=payload.customer_email,
        )
    except PaymentGatewayError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    hold.customer_name = payload.customer_name
    hold.customer_phone = payload.customer_phone
    hold.customer_email = payload.customer_email
    hold.address_line1 = payload.address_line1 or hold.address_line1
    hold.address_line2 = payload.address_line2 or hold.address_line2
    hold.city = payload.city or hold.city
    hold.state = payload.state or hold.state
    hold.postal_code = payload.postal_code or hold.postal_code

    appointment.payment_id = checkout.payment_id

    raw_status = (checkout.status or "").strip().lower()

    try:
        appointment.payment_status = PaymentStatus(raw_status)
    except ValueError:
        appointment.payment_status = PaymentStatus.pending
        
    appointment.payment_checkout_url = checkout.checkout_url
    appointment.payment_amount_expected = amount_cents
    appointment.payment_currency = currency

    if appointment.payment_status == PaymentStatus.succeeded and using_stub:
        previous_status = appointment.status
        appointment.status = AppointmentStatus.confirmed
        appointment.payment_amount_received = appointment.payment_amount_expected
        hold.status = HoldStatus.CONFIRMED
        enqueue_customer_notification(db, appointment, APPOINTMENT_CONFIRMED)
        enqueue_customer_notification(
            db,
            appointment,
            APPOINTMENT_STATUS_CHANGED,
            payload={
                "old_status": previous_status.value if previous_status else None,
                "new_status": appointment.status.value,
            },
        )
        enqueue_company_user_notifications(db, appointment.company_id, appointment, NEW_APPOINTMENT)

    db.add(hold)
    db.add(appointment)
    db.flush()

    db.add(
        AppointmentEvent(
            appointment_id=appointment.id,
            kind="status_change",
            payload={"status": appointment.status.value},
        )
    )

    db.commit()
    db.refresh(appointment)
    db.refresh(hold)

    print(
        f"[Booking] Appointment {appointment.id} awaiting payment for hold {hold.id}"
    )

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
        appointment = (
            db.query(Appointment)
            .filter(
                Appointment.hold_id == hold.id, Appointment.status != CANCELLED_STATUS
            )
            .first()
        )
        if appointment:
            appointment.status = CANCELLED_STATUS
            if appointment.payment_status not in {
                PaymentStatus.failed,
                PaymentStatus.refunded,
                PaymentStatus.disputed,
            }:
                appointment.payment_status = PaymentStatus.failed
            appointment.payment_checkout_url = None
    if holds:
        db.commit()

    expired = len(holds)
    if expired:
        print(f"[Booking] Expired {expired} holds")
    return {"expired": expired}
