from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.enums import AppointmentStatus
from app.models import (
    Appointment,
    AppointmentAssignment,
    AppointmentLocationUpdate,
    Company,
    CompanyUser,
    Service,
    User,
)


def _auth_header(user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"Authorization": f"Bearer {token}"}


def _make_company(db: Session) -> Company:
    company = Company(id=uuid4(), name="Demo Co", city="SF", state="CA")
    db.add(company)
    db.flush()
    return company


def _make_user(db: Session, *, email: str, role: str, full_name: str) -> User:
    user = User(email=email, full_name=full_name, role=role, password_hash=hash_password("pass1234"))
    db.add(user)
    db.flush()
    return user


def _make_service(db: Session, company: Company) -> Service:
    svc = Service(
        company_id=company.id,
        name="Test",
        slug=f"svc-{company.id.hex[:4]}",
        description="",
        duration_minutes=30,
        price_cents=1000,
    )
    db.add(svc)
    db.flush()
    return svc


def _make_appointment(db: Session, *, company: Company, service: Service, status: AppointmentStatus, email: str) -> Appointment:
    now = datetime.now(timezone.utc)
    appt = Appointment(
        company_id=company.id,
        service_id=service.id,
        customer_name="Test Customer",
        customer_phone="000",
        customer_email=email,
        start_time=now,
        confirmed_time=now,
        end_time=now + timedelta(hours=1),
        status=status,
    )
    db.add(appt)
    db.flush()
    return appt


def test_location_requires_assignment(db_session: Session, client: TestClient) -> None:
    company = _make_company(db_session)
    service = _make_service(db_session, company)

    provider_one = _make_user(db_session, email="one@example.com", role="provider", full_name="One")
    provider_two = _make_user(db_session, email="two@example.com", role="provider", full_name="Two")
    db_session.add_all(
        [
            CompanyUser(user_id=provider_one.id, company_id=company.id),
            CompanyUser(user_id=provider_two.id, company_id=company.id),
        ]
    )
    appointment = _make_appointment(
        db_session,
        company=company,
        service=service,
        status=AppointmentStatus.en_route_pickup,
        email="customer@example.com",
    )
    db_session.add(AppointmentAssignment(appointment_id=appointment.id, company_user_id=provider_one.id))
    db_session.commit()

    res = client.post(
        f"/company/appointments/{appointment.id}/location",
        json={"lat": 10, "lng": 20},
        headers=_auth_header(provider_two),
    )
    assert res.status_code == 403


def test_location_blocked_outside_travel(db_session: Session, client: TestClient) -> None:
    company = _make_company(db_session)
    service = _make_service(db_session, company)
    provider = _make_user(db_session, email="provider@example.com", role="provider", full_name="Provider")
    db_session.add(CompanyUser(user_id=provider.id, company_id=company.id))
    appointment = _make_appointment(
        db_session,
        company=company,
        service=service,
        status=AppointmentStatus.confirmed,
        email="customer@example.com",
    )
    db_session.add(AppointmentAssignment(appointment_id=appointment.id, company_user_id=provider.id))
    db_session.commit()

    res = client.post(
        f"/company/appointments/{appointment.id}/location",
        json={"lat": 10, "lng": 20},
        headers=_auth_header(provider),
    )
    assert res.status_code == 400


def test_customer_cannot_view_other_location(db_session: Session, client: TestClient) -> None:
    company = _make_company(db_session)
    service = _make_service(db_session, company)
    provider = _make_user(db_session, email="provider@example.com", role="provider", full_name="Provider")
    db_session.add(CompanyUser(user_id=provider.id, company_id=company.id))
    appointment = _make_appointment(
        db_session,
        company=company,
        service=service,
        status=AppointmentStatus.en_route_pickup,
        email="owner@example.com",
    )
    db_session.add(AppointmentAssignment(appointment_id=appointment.id, company_user_id=provider.id))
    db_session.add(
        AppointmentLocationUpdate(
            appointment_id=appointment.id,
            company_user_id=provider.id,
            lat=1,
            lng=2,
            recorded_at=datetime.now(timezone.utc),
        )
    )

    customer = _make_user(db_session, email="viewer@example.com", role="customer", full_name="Viewer")
    db_session.commit()

    res = client.get(
        f"/appointments/{appointment.id}/location/latest",
        headers=_auth_header(customer),
    )
    assert res.status_code == 403


def test_latest_location_ordering(db_session: Session, client: TestClient) -> None:
    company = _make_company(db_session)
    service = _make_service(db_session, company)
    provider = _make_user(db_session, email="provider@example.com", role="provider", full_name="Provider")
    db_session.add(CompanyUser(user_id=provider.id, company_id=company.id))
    customer = _make_user(db_session, email="customer@example.com", role="customer", full_name="Customer")
    appointment = _make_appointment(
        db_session,
        company=company,
        service=service,
        status=AppointmentStatus.en_route_pickup,
        email=customer.email,
    )
    db_session.add(AppointmentAssignment(appointment_id=appointment.id, company_user_id=provider.id))
    db_session.add_all(
        [
            AppointmentLocationUpdate(
                appointment_id=appointment.id,
                company_user_id=provider.id,
                lat=1,
                lng=1,
                recorded_at=datetime.now(timezone.utc) - timedelta(minutes=5),
            ),
            AppointmentLocationUpdate(
                appointment_id=appointment.id,
                company_user_id=provider.id,
                lat=5,
                lng=6,
                recorded_at=datetime.now(timezone.utc),
            ),
        ]
    )
    db_session.commit()

    res = client.get(
        f"/appointments/{appointment.id}/location/latest",
        headers=_auth_header(customer),
    )
    assert res.status_code == 200
    data = res.json()
    assert data["lat"] == 5
    assert data["lng"] == 6
