from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.enums import AppointmentStatus
from app.models import (
    Appointment,
    AppointmentAssignment,
    AppointmentEvent,
    Company,
    CompanyUser,
    Notification,
    PushToken,
    Service,
    User,
)


def _auth_header(user: User, *, company_id=None) -> dict[str, str]:
    payload = {"sub": str(user.id), "role": user.role}
    if company_id is not None:
        payload["company_id"] = str(company_id)
    token = create_access_token(payload)
    return {"Authorization": f"Bearer {token}"}


def _access_token(user: User, *, company_id=None) -> str:
    return _auth_header(user, company_id=company_id)["Authorization"].split(" ", 1)[1]


def _make_company(db: Session, *, name: str = "Claim Co") -> Company:
    company = Company(id=uuid4(), name=name, city="Austin", state="TX")
    db.add(company)
    db.flush()
    return company


def _make_user(db: Session, *, email: str, role: str, full_name: str) -> User:
    user = User(email=email, full_name=full_name, role=role, password_hash=hash_password("pass1234"))
    db.add(user)
    db.flush()
    return user


def _make_service(db: Session, company: Company) -> Service:
    service = Service(
        company_id=company.id,
        name="Deep Clean",
        slug=f"deep-clean-{company.id.hex[:6]}",
        description="",
        duration_minutes=30,
        price_cents=2000,
    )
    db.add(service)
    db.flush()
    return service


def _make_appointment(
    db: Session,
    *,
    company: Company,
    service: Service,
    status: AppointmentStatus = AppointmentStatus.confirmed,
    email: str | None = "customer@example.com",
    phone: str | None = "555-0100",
) -> Appointment:
    now = datetime.now(timezone.utc)
    appointment = Appointment(
        company_id=company.id,
        service_id=service.id,
        customer_name="Customer",
        customer_phone=phone,
        customer_email=email,
        start_time=now,
        confirmed_time=now,
        end_time=now + timedelta(minutes=30),
        status=status,
    )
    db.add(appointment)
    db.flush()
    return appointment


def test_claim_creates_assignment_event_and_customer_notifications(db_session: Session, client: TestClient) -> None:
    company = _make_company(db_session)
    service = _make_service(db_session, company)
    provider = _make_user(
        db_session,
        email="provider@example.com",
        role="provider",
        full_name="Pat Provider",
    )
    customer = _make_user(
        db_session,
        email="customer@example.com",
        role="customer",
        full_name="Casey Customer",
    )
    db_session.add_all(
        [
            CompanyUser(user_id=provider.id, company_id=company.id),
            PushToken(user_id=customer.id, token="ExpoPushToken[claim]", enabled=True, platform="ios"),
        ]
    )
    appointment = _make_appointment(db_session, company=company, service=service, email=customer.email)
    db_session.commit()

    response = client.post(
        f"/company/appointments/{appointment.id}/claim",
        headers=_auth_header(provider, company_id=company.id),
    )

    assert response.status_code == 201, response.text
    payload = response.json()
    assert payload["provider_name"] == "Pat Provider"

    db_session.expire_all()
    assignments = (
        db_session.query(AppointmentAssignment)
        .filter(AppointmentAssignment.appointment_id == appointment.id, AppointmentAssignment.is_active.is_(True))
        .all()
    )
    assert len(assignments) == 1

    events = db_session.query(AppointmentEvent).filter(AppointmentEvent.appointment_id == appointment.id).all()
    assert any(
        event.kind == "assignment_claimed"
        and event.payload["old_provider_name"] is None
        and event.payload["new_provider_name"] == "Pat Provider"
        for event in events
    )

    notifications = db_session.query(Notification).filter(Notification.appointment_id == appointment.id).all()
    kinds = {(notification.kind, notification.channel) for notification in notifications}
    assert ("APPOINTMENT_PROVIDER_ASSIGNED", "in_app") in kinds
    assert ("APPOINTMENT_PROVIDER_ASSIGNED", "push") in kinds
    assert ("APPOINTMENT_PROVIDER_ASSIGNED", "email") not in kinds


def test_claim_publishes_live_assignment_event_to_company_clients(db_session: Session, client: TestClient) -> None:
    company = _make_company(db_session, name="Live Claim Co")
    service = _make_service(db_session, company)
    provider = _make_user(
        db_session,
        email="live-provider@example.com",
        role="provider",
        full_name="Live Provider",
    )
    db_session.add(CompanyUser(user_id=provider.id, company_id=company.id))
    appointment = _make_appointment(db_session, company=company, service=service)
    db_session.commit()

    token = _access_token(provider, company_id=company.id)
    with client.websocket_connect(f"/live/ws?token={token}") as websocket:
        response = client.post(
            f"/company/appointments/{appointment.id}/claim",
            headers=_auth_header(provider, company_id=company.id),
        )

        assert response.status_code == 201, response.text
        payload = websocket.receive_json()
        assert payload["type"] == "assignment_changed"
        assert payload["event_kind"] == "assignment_claimed"
        assert payload["appointment_id"] == str(appointment.id)
        assert payload["assignment_action"] == "claimed"
        assert payload["new_provider_name"] == "Live Provider"


def test_guest_booking_with_phone_only_gets_sms_assignment_notification(db_session: Session, client: TestClient) -> None:
    company = _make_company(db_session, name="Guest Sms Claim Co")
    service = _make_service(db_session, company)
    provider = _make_user(
        db_session,
        email="provider-sms@example.com",
        role="provider",
        full_name="Pat Provider",
    )
    db_session.add(CompanyUser(user_id=provider.id, company_id=company.id))
    appointment = _make_appointment(
        db_session,
        company=company,
        service=service,
        email=None,
        phone="555-222-3333",
    )
    db_session.commit()

    response = client.post(
        f"/company/appointments/{appointment.id}/claim",
        headers=_auth_header(provider, company_id=company.id),
    )

    assert response.status_code == 201, response.text

    notifications = db_session.query(Notification).filter(Notification.appointment_id == appointment.id).all()
    kinds = {(notification.kind, notification.channel, notification.target) for notification in notifications}
    assert ("APPOINTMENT_PROVIDER_ASSIGNED", "sms", "555-222-3333") in kinds
    assert not any(channel == "email" for _, channel, _ in kinds)
    assert not any(channel == "in_app" for _, channel, _ in kinds)
    assert not any(channel == "push" for _, channel, _ in kinds)


def test_guest_booking_with_email_and_phone_prefers_email_assignment_notification(
    db_session: Session,
    client: TestClient,
) -> None:
    company = _make_company(db_session, name="Guest Both Claim Co")
    service = _make_service(db_session, company)
    provider = _make_user(
        db_session,
        email="provider-both@example.com",
        role="provider",
        full_name="Pat Provider",
    )
    db_session.add(CompanyUser(user_id=provider.id, company_id=company.id))
    appointment = _make_appointment(
        db_session,
        company=company,
        service=service,
        email="guest-both@example.com",
        phone="555-444-5555",
    )
    db_session.commit()

    response = client.post(
        f"/company/appointments/{appointment.id}/claim",
        headers=_auth_header(provider, company_id=company.id),
    )

    assert response.status_code == 201, response.text

    notifications = db_session.query(Notification).filter(Notification.appointment_id == appointment.id).all()
    kinds = {(notification.kind, notification.channel, notification.target) for notification in notifications}
    assert ("APPOINTMENT_PROVIDER_ASSIGNED", "email", "guest-both@example.com") in kinds
    assert not any(channel == "sms" for _, channel, _ in kinds)


def test_claim_returns_conflict_when_appointment_already_assigned(db_session: Session, client: TestClient) -> None:
    company = _make_company(db_session, name="Conflict Co")
    service = _make_service(db_session, company)
    provider_one = _make_user(db_session, email="one@example.com", role="provider", full_name="One Provider")
    provider_two = _make_user(db_session, email="two@example.com", role="provider", full_name="Two Provider")
    db_session.add_all(
        [
            CompanyUser(user_id=provider_one.id, company_id=company.id),
            CompanyUser(user_id=provider_two.id, company_id=company.id),
        ]
    )
    appointment = _make_appointment(db_session, company=company, service=service)
    db_session.add(
        AppointmentAssignment(
            appointment_id=appointment.id,
            company_id=company.id,
            user_id=provider_one.id,
            is_active=True,
        )
    )
    db_session.commit()

    response = client.post(
        f"/company/appointments/{appointment.id}/claim",
        headers=_auth_header(provider_two, company_id=company.id),
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Appointment already assigned"


def test_customer_assignment_endpoint_returns_provider_full_name_and_404_when_unassigned(
    db_session: Session,
    client: TestClient,
) -> None:
    company = _make_company(db_session, name="Customer Detail Co")
    service = _make_service(db_session, company)
    provider = _make_user(
        db_session,
        email="provider-detail@example.com",
        role="provider",
        full_name="Pat Provider",
    )
    customer = _make_user(
        db_session,
        email="customer-detail@example.com",
        role="customer",
        full_name="Customer Detail",
    )
    db_session.add(CompanyUser(user_id=provider.id, company_id=company.id))
    appointment = _make_appointment(db_session, company=company, service=service, email=customer.email)
    db_session.commit()

    unassigned = client.get(
        f"/appointments/{appointment.id}/assignment",
        headers=_auth_header(customer),
    )
    assert unassigned.status_code == 404
    assert unassigned.json()["detail"] == "No provider assigned"

    db_session.add(
        AppointmentAssignment(
            appointment_id=appointment.id,
            company_id=company.id,
            user_id=provider.id,
            is_active=True,
        )
    )
    db_session.commit()

    assigned = client.get(
        f"/appointments/{appointment.id}/assignment",
        headers=_auth_header(customer),
    )
    assert assigned.status_code == 200
    assert assigned.json()["provider_name"] == "Pat Provider"


def test_company_admin_can_reassign_and_provider_cannot(db_session: Session, client: TestClient) -> None:
    company = _make_company(db_session, name="Reassign Co")
    service = _make_service(db_session, company)
    provider_one = _make_user(db_session, email="provider-one@example.com", role="provider", full_name="One Provider")
    provider_two = _make_user(db_session, email="provider-two@example.com", role="provider", full_name="Two Provider")
    admin = _make_user(db_session, email="admin@example.com", role="company_admin", full_name="Admin User")
    customer = _make_user(db_session, email="customer-reassign@example.com", role="customer", full_name="Customer")
    db_session.add_all(
        [
            CompanyUser(user_id=provider_one.id, company_id=company.id),
            CompanyUser(user_id=provider_two.id, company_id=company.id),
            CompanyUser(user_id=admin.id, company_id=company.id),
        ]
    )
    appointment = _make_appointment(db_session, company=company, service=service, email=customer.email)
    initial_assignment = AppointmentAssignment(
        appointment_id=appointment.id,
        company_id=company.id,
        user_id=provider_one.id,
        is_active=True,
    )
    db_session.add(initial_assignment)
    db_session.commit()

    forbidden = client.post(
        f"/company/appointments/{appointment.id}/reassign",
        json={"provider_user_id": str(provider_one.id)},
        headers=_auth_header(provider_one, company_id=company.id),
    )
    assert forbidden.status_code == 403

    response = client.post(
        f"/company/appointments/{appointment.id}/reassign",
        json={"provider_user_id": str(provider_two.id)},
        headers=_auth_header(admin, company_id=company.id),
    )

    assert response.status_code == 201, response.text
    assert response.json()["provider_name"] == "Two Provider"

    db_session.expire_all()
    active_assignments = (
        db_session.query(AppointmentAssignment)
        .filter(AppointmentAssignment.appointment_id == appointment.id, AppointmentAssignment.is_active.is_(True))
        .all()
    )
    assert len(active_assignments) == 1
    assert active_assignments[0].user_id == provider_two.id

    old_assignment = db_session.get(AppointmentAssignment, initial_assignment.id)
    assert old_assignment is not None
    assert old_assignment.is_active is False
    assert old_assignment.unassigned_at is not None

    event = (
        db_session.query(AppointmentEvent)
        .filter(
            AppointmentEvent.appointment_id == appointment.id,
            AppointmentEvent.kind == "assignment_reassigned",
        )
        .one()
    )
    assert event.payload["old_provider_name"] == "One Provider"
    assert event.payload["new_provider_name"] == "Two Provider"

    notifications = db_session.query(Notification).filter(Notification.appointment_id == appointment.id).all()
    assert any(notification.kind == "APPOINTMENT_PROVIDER_REASSIGNED" for notification in notifications)
    assert any(notification.kind == "APPOINTMENT_PROVIDER_REASSIGNED" and notification.channel == "in_app" for notification in notifications)


def test_status_update_publishes_live_status_event_to_customer_clients(db_session: Session, client: TestClient) -> None:
    company = _make_company(db_session, name="Live Status Co")
    service = _make_service(db_session, company)
    provider = _make_user(
        db_session,
        email="status-provider@example.com",
        role="provider",
        full_name="Status Provider",
    )
    customer = _make_user(
        db_session,
        email="status-customer@example.com",
        role="customer",
        full_name="Status Customer",
    )
    db_session.add(CompanyUser(user_id=provider.id, company_id=company.id))
    appointment = _make_appointment(db_session, company=company, service=service, email=customer.email)
    db_session.add(
        AppointmentAssignment(
            appointment_id=appointment.id,
            company_id=company.id,
            user_id=provider.id,
            is_active=True,
        )
    )
    db_session.commit()

    token = _access_token(customer)
    with client.websocket_connect(f"/live/ws?token={token}") as websocket:
        response = client.post(
            f"/company/appointments/{appointment.id}/status",
            json={"status": "en_route_pickup"},
            headers=_auth_header(provider, company_id=company.id),
        )

        assert response.status_code == 200, response.text
        payload = websocket.receive_json()
        assert payload["type"] == "appointment_status_changed"
        assert payload["event_kind"] == "status_change"
        assert payload["appointment_id"] == str(appointment.id)
        assert payload["previous_status"] == "confirmed"
        assert payload["status"] == "en_route_pickup"
