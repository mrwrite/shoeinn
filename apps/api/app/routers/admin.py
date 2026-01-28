from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_admin_user, hash_password
from app.enums import AppointmentStatus
from app.models import (
    Appointment,
    AppointmentAssignment,
    AppointmentEvent,
    AppointmentHold,
    AppointmentLocationUpdate,
    Company,
    CompanyUser,
    Notification,
    NotificationOutbox,
    Service,
)
from app.models.user import User
from app.schemas.admin import CompanyCreate, CompanyUserCreate, CompanyUserCreated
from app.schemas.company import CompanyOut

router = APIRouter(prefix="/admin", tags=["admin"])


def _generate_temp_password() -> str:
    return secrets.token_urlsafe(8)


def _clear_demo_data(db: Session) -> None:
    db.query(NotificationOutbox).delete()
    db.query(Notification).delete()
    db.query(AppointmentLocationUpdate).delete()
    db.query(AppointmentAssignment).delete()
    db.query(AppointmentEvent).delete()
    db.query(AppointmentHold).delete()
    db.query(Appointment).delete()
    db.query(Service).delete()
    db.query(CompanyUser).delete()
    db.query(Company).delete()
    db.query(User).filter(User.role != "admin").delete()
    db.flush()


def _create_demo_user(db: Session, *, email: str, role: str, full_name: str, password: str) -> User:
    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        role=role,
    )
    db.add(user)
    db.flush()
    return user


def _seed_demo_data(db: Session) -> dict[str, object]:
    now = datetime.now(timezone.utc)
    company_one = Company(name="Downtown ShoeInn", city="San Francisco", state="CA")
    company_two = Company(name="Uptown ShoeInn", city="New York", state="NY")
    db.add_all([company_one, company_two])
    db.flush()

    services: list[Service] = []
    for company in (company_one, company_two):
        basic = Service(
            company_id=company.id,
            name="Basic Clean",
            slug=f"basic-{company.id.hex[:4]}",
            description="Exterior wipe, lace wash, deodorize.",
            duration_minutes=30,
            price_cents=2500,
        )
        deluxe = Service(
            company_id=company.id,
            name="Premium Restore",
            slug=f"premium-{company.id.hex[:4]}",
            description="Deep clean + scuffs + crease care.",
            duration_minutes=90,
            price_cents=6000,
        )
        services.extend([basic, deluxe])
    db.add_all(services)
    db.flush()

    provider_one = _create_demo_user(
        db,
        email="provider1@example.com",
        role="provider",
        full_name="Pat Provider",
        password="demo1234",
    )
    provider_two = _create_demo_user(
        db,
        email="provider2@example.com",
        role="provider",
        full_name="Taylor Runner",
        password="demo1234",
    )
    db.add_all(
        [
            CompanyUser(user_id=provider_one.id, company_id=company_one.id),
            CompanyUser(user_id=provider_two.id, company_id=company_two.id),
        ]
    )

    customer_one = _create_demo_user(
        db,
        email="customer1@example.com",
        role="customer",
        full_name="Casey Customer",
        password="demo1234",
    )
    customer_two = _create_demo_user(
        db,
        email="customer2@example.com",
        role="customer",
        full_name="Reese Rider",
        password="demo1234",
    )

    appt_one = Appointment(
        company_id=company_one.id,
        service_id=services[0].id,
        customer_name=customer_one.full_name,
        customer_phone="555-111-2222",
        customer_email=customer_one.email,
        start_time=now + timedelta(hours=1),
        confirmed_time=now,
        end_time=now + timedelta(hours=2),
        status=AppointmentStatus.en_route_pickup,
    )
    appt_two = Appointment(
        company_id=company_two.id,
        service_id=services[2].id,
        customer_name=customer_two.full_name,
        customer_phone="555-333-4444",
        customer_email=customer_two.email,
        start_time=now + timedelta(hours=3),
        confirmed_time=now,
        end_time=now + timedelta(hours=4),
        status=AppointmentStatus.ready,
    )
    db.add_all([appt_one, appt_two])
    db.flush()

    assignment = AppointmentAssignment(
        appointment_id=appt_one.id,
        company_id=company_one.id,
        user_id=provider_one.id,
    )
    db.add(assignment)
    db.flush()

    db.add(
        AppointmentLocationUpdate(
            appointment_id=appt_one.id,
            user_id=provider_one.id,
            lat=37.7749,
            lng=-122.4194,
            heading=120.0,
            speed=4.0,
            accuracy=8.0,
            recorded_at=now,
        )
    )

    db.commit()
    return {
        "companies": 2,
        "providers": 2,
        "customers": 2,
        "appointments": 2,
        "assignments": 1,
    }


@router.post("/companies", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(
    payload: CompanyCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin_user),
):
    existing = db.query(Company).filter(Company.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company name exists")
    company = Company(**payload.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.get("/companies", response_model=list[CompanyOut])
def list_companies(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin_user),
):
    return db.query(Company).order_by(Company.created_at.desc()).all()


@router.post("/company-users", response_model=CompanyUserCreated, status_code=status.HTTP_201_CREATED)
def create_company_user(
    payload: CompanyUserCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin_user),
):
    company = db.get(Company, payload.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email exists")

    temp_password = payload.password or _generate_temp_password()
    user = User(
        email=payload.email,
        password_hash=hash_password(temp_password),
        full_name=payload.full_name,
        role=payload.role or "company",
    )
    db.add(user)
    db.flush()

    company_user = CompanyUser(user_id=user.id, company_id=company.id)
    db.add(company_user)
    db.commit()
    db.refresh(user)

    return CompanyUserCreated(user=user, company_id=company.id, temp_password=temp_password if not payload.password else None)


@router.post("/demo/reset")
def reset_demo(db: Session = Depends(get_db), current_admin=Depends(get_current_admin_user)):
    _clear_demo_data(db)
    return _seed_demo_data(db)
