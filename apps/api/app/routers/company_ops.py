from datetime import datetime, timezone
import json
import secrets
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, field_validator
from app.enums import AppointmentStatus
from sqlalchemy import exists, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import (
    create_access_token,
    get_current_company_admin,
    get_current_company_user,
    hash_password,
    verify_password,
)
from app.models import (
    Appointment,
    AppointmentAssignment,
    AppointmentEvent,
    AppointmentLocationUpdate,
    Notification,
    Service,
)
from app.models.company_user import CompanyUser
from app.models.user import User
from app.schemas.notification import NotificationRead
from app.schemas.appointment import AppointmentAssignmentRead, LocationUpdateCreate, LocationUpdateRead
from app.schemas.user import UserOut
from app.services.notifications import (
    APPOINTMENT_CONFIRMED,
    APPOINTMENT_STATUS_CHANGED,
    NEW_APPOINTMENT,
    enqueue_company_user_notifications,
    enqueue_customer_notification,
)

router = APIRouter(prefix="/company", tags=["company"])

logger = logging.getLogger(__name__)

TRAVEL_STATUSES = {
    AppointmentStatus.en_route_pickup,
    AppointmentStatus.picked_up,
    AppointmentStatus.out_for_delivery,
}


class StatusUpdate(BaseModel):
    status: AppointmentStatus
    confirmed_time: datetime | None = None


class ProviderLogin(BaseModel):
    email: str
    password: str


class CompanyUserCreatePayload(BaseModel):
    email: EmailStr
    full_name: str
    password: str | None = None
    role: str = "provider"

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        if value not in {"provider"}:
            raise ValueError("Invalid role")
        return value


class CompanyUserCreated(BaseModel):
    user: UserOut
    company_id: UUID
    temp_password: str | None = None


def _generate_temp_password() -> str:
    return secrets.token_urlsafe(8)


@router.post("/auth/login")
def provider_login(payload: ProviderLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if (
        not user
        or user.role not in {"company", "provider", "company_admin"}
        or not verify_password(payload.password, user.password_hash)
    ):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/appointments/open")
def open_appointments(current=Depends(get_current_company_user), db: Session = Depends(get_db)):
    user, company_id = current
    logger.info(f"open_appointments user_id={user.id} email={getattr(user,'email',None)} company_id={company_id}")
    
    confirmed_count = (
        db.query(Appointment.id)
        .filter(Appointment.company_id == company_id)
        .filter(Appointment.status == AppointmentStatus.confirmed)
        .count()
    )
    logger.info(f"confirmed_count for company_id={company_id} => {confirmed_count}")
    
    has_active_assignment = (
        db.query(AppointmentAssignment.id)
        .filter(
            AppointmentAssignment.appointment_id == Appointment.id,
            AppointmentAssignment.is_active.is_(True),
        )
        .exists()
    )

    q = (
        db.query(Appointment)
        .outerjoin(
            AppointmentAssignment,
            and_(
                AppointmentAssignment.appointment_id == Appointment.id,
                AppointmentAssignment.is_active.is_(True),
            ),
        )
        .filter(Appointment.company_id == company_id)
        .filter(Appointment.status == AppointmentStatus.confirmed)
        .filter(AppointmentAssignment.id.is_(None))  # <-- only unassigned
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
                "customer_name": appt.customer_name,
                "address_line1": appt.address_line1,
                "city": appt.city,
                "state": appt.state,
                "postal_code": appt.postal_code,
                "service_name": service_name,
                "start_time": appt.start_time,
                "status": appt.status.value,
                "is_assigned": False,
                "assigned_to_me": False,
            }
        )
    return items


@router.get("/appointments/claimed")
def claimed_appointments(current=Depends(get_current_company_user), db: Session = Depends(get_db)):
    current_user, company_id = current

    q = (
        db.query(Appointment, AppointmentAssignment)
        .join(AppointmentAssignment, AppointmentAssignment.appointment_id == Appointment.id)
        .filter(AppointmentAssignment.company_id == company_id)
        .filter(AppointmentAssignment.user_id == current_user.id)
        .filter(AppointmentAssignment.is_active.is_(True))
        .order_by(Appointment.start_time.asc())
    )
    items = []
    for appt, assignment in q.all():
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
                "is_assigned": True,
                "assigned_to_me": True,
                "assignment_id": assignment.id,
            }
        )
    return items


@router.post(
    "/appointments/{appointment_id}/claim",
    response_model=AppointmentAssignmentRead,
    status_code=status.HTTP_201_CREATED,
)
def claim_appointment(
    appointment_id: UUID, current=Depends(get_current_company_user), db: Session = Depends(get_db)
):
    current_user, company_id = current
    appt = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .with_for_update()
        .first()
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Not found")
    if appt.company_id != company_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if appt.status != AppointmentStatus.confirmed:
        raise HTTPException(status_code=400, detail="Appointment not claimable")

    existing = (
        db.query(AppointmentAssignment)
        .filter(
            AppointmentAssignment.appointment_id == appointment_id,
            AppointmentAssignment.is_active.is_(True),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Appointment already assigned")

    assignment = AppointmentAssignment(
        appointment_id=appointment_id, user_id=current_user.id, company_id=company_id, is_active=True
    )
    db.add(assignment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        logger.exception("IntegrityError when claiming appointment %s", appointment_id)
        raise HTTPException(status_code=400, detail="Appointment already assigned")
    db.refresh(assignment)

    return AppointmentAssignmentRead.model_validate(
        {
            "id": assignment.id,
            "appointment_id": assignment.appointment_id,
            "user_id": assignment.user_id,
            "assigned_at": assignment.assigned_at,
            "unassigned_at": assignment.unassigned_at,
            "is_active": assignment.is_active,
            "provider_name": current_user.full_name,
        }
    )


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


@router.post(
    "/appointments/{appointment_id}/location",
    response_model=LocationUpdateRead,
    status_code=status.HTTP_201_CREATED,
)
def post_location_update(
    appointment_id: UUID,
    payload: LocationUpdateCreate,
    current=Depends(get_current_company_user),
    db: Session = Depends(get_db),
):
    current_user, company_id = current
    appt = db.get(Appointment, appointment_id)
    if not appt or (appt.company_id and appt.company_id != company_id):
        raise HTTPException(status_code=404, detail="Not found")

    assignment = (
        db.query(AppointmentAssignment)
        .filter(
            AppointmentAssignment.appointment_id == appointment_id,
            AppointmentAssignment.is_active.is_(True),
        )
        .first()
    )
    if assignment is None or assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not assigned to this appointment")

    if appt.status not in TRAVEL_STATUSES:
        raise HTTPException(status_code=400, detail="Appointment not in a travel state")

    update = AppointmentLocationUpdate(
        appointment_id=appointment_id,
        user_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(update)
    db.commit()
    db.refresh(update)

    return LocationUpdateRead.model_validate(update, from_attributes=True)


@router.get("/appointments/all")
def all_appointments(current=Depends(get_current_company_admin), db: Session = Depends(get_db)):
    _, company_id = current
    q = (
        db.query(Appointment, AppointmentAssignment, User)
        .outerjoin(
            AppointmentAssignment,
            and_(
                AppointmentAssignment.appointment_id == Appointment.id,
                AppointmentAssignment.is_active.is_(True),
            ),
        )
        .outerjoin(User, User.id == AppointmentAssignment.user_id)
        .filter(Appointment.company_id == company_id)
        .order_by(Appointment.start_time.asc())
    )

    results = []
    for appt, assignment, user in q.all():
        service_name = None
        if appt.service_id:
            svc = db.get(Service, appt.service_id)
            service_name = svc.name if svc else None
        results.append(
            {
                "id": appt.id,
                "service_name": service_name,
                "type": appt.type,
                "start_time": appt.start_time,
                "status": appt.status.value,
                "assigned_user_id": assignment.user_id if assignment else None,
                "assigned_at": assignment.assigned_at if assignment else None,
                "is_active": assignment.is_active if assignment else False,
                "assigned_provider_name": user.full_name if user else None,
            }
        )
    return results


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


@router.post("/users", response_model=CompanyUserCreated, status_code=status.HTTP_201_CREATED)
def create_company_user(
    payload: CompanyUserCreatePayload,
    current=Depends(get_current_company_admin),
    db: Session = Depends(get_db),
):
    _, company_id = current

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email exists")

    temp_password = payload.password or _generate_temp_password()
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
        password_hash=hash_password(temp_password),
    )
    db.add(user)
    db.flush()
    db.add(CompanyUser(user_id=user.id, company_id=company_id))
    db.commit()
    db.refresh(user)

    return CompanyUserCreated(
        user=user, company_id=company_id, temp_password=None if payload.password else temp_password
    )


@router.get("/users", response_model=list[UserOut])
def list_company_users(current=Depends(get_current_company_admin), db: Session = Depends(get_db)):
    _, company_id = current
    users = (
        db.query(User)
        .join(CompanyUser, CompanyUser.user_id == User.id)
        .filter(CompanyUser.company_id == company_id)
        .order_by(User.full_name.asc())
        .all()
    )
    return users


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
