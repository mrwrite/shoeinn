from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.core.security import create_access_token, hash_password
from app.enums import AppointmentStatus
from app.models import Appointment, Company, Notification, PushToken, Service, User
from app.services.notifications import APPOINTMENT_PROVIDER_ASSIGNED, APPOINTMENT_STATUS_CHANGED, enqueue_customer_notification


def _auth_header(user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"Authorization": f"Bearer {token}"}


def _make_customer(db_session, *, email: str = "prefs@example.com") -> User:
    customer = User(
        email=email,
        full_name="Pref Customer",
        role="customer",
        password_hash=hash_password("pass1234"),
    )
    db_session.add(customer)
    db_session.flush()
    return customer


def _make_appointment(db_session, customer: User) -> Appointment:
    company = Company(name="Prefs Co", city="Austin", state="TX")
    db_session.add(company)
    db_session.flush()
    service = Service(
        company_id=company.id,
        name="Deep Clean",
        slug=f"pref-service-{company.id.hex[:6]}",
        description="",
        duration_minutes=30,
        price_cents=2500,
    )
    db_session.add(service)
    db_session.flush()
    appointment = Appointment(
        company_id=company.id,
        service_id=service.id,
        customer_name=customer.full_name,
        customer_phone="555-1000",
        customer_email=customer.email,
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc) + timedelta(minutes=30),
        status=AppointmentStatus.confirmed,
    )
    db_session.add(appointment)
    db_session.flush()
    return appointment


def test_customer_can_read_and_update_notification_preferences(client, db_session):
    customer = _make_customer(db_session)
    db_session.commit()

    read_response = client.get("/me/notification-preferences", headers=_auth_header(customer))
    assert read_response.status_code == 200, read_response.text
    assert read_response.json() == {
        "customer_push_enabled": True,
        "customer_push_assignment_updates": True,
        "customer_push_milestone_updates": True,
    }

    update_response = client.patch(
        "/me/notification-preferences",
        headers=_auth_header(customer),
        json={
            "customer_push_enabled": True,
            "customer_push_assignment_updates": False,
            "customer_push_milestone_updates": True,
        },
    )
    assert update_response.status_code == 200, update_response.text
    assert update_response.json()["customer_push_assignment_updates"] is False


def test_customer_push_respects_assignment_and_milestone_preferences(db_session):
    customer = _make_customer(db_session)
    appointment = _make_appointment(db_session, customer)
    db_session.add(PushToken(user_id=customer.id, token="ExpoPushToken[prefs]", enabled=True, platform="ios"))
    customer.customer_push_enabled = True
    customer.customer_push_assignment_updates = False
    customer.customer_push_milestone_updates = True
    db_session.add(customer)
    db_session.commit()

    enqueue_customer_notification(
        db_session,
        appointment,
        APPOINTMENT_PROVIDER_ASSIGNED,
        payload={"new_provider_name": "Pat Provider"},
    )
    enqueue_customer_notification(
        db_session,
        appointment,
        APPOINTMENT_STATUS_CHANGED,
        payload={"old_status": "cleaning", "new_status": "ready"},
    )
    db_session.commit()

    rows = db_session.query(Notification).filter(Notification.target == str(customer.id)).all()
    pairs = {(row.kind, row.channel) for row in rows}
    assert ("APPOINTMENT_PROVIDER_ASSIGNED", "in_app") in pairs
    assert ("APPOINTMENT_PROVIDER_ASSIGNED", "push") not in pairs
    assert ("APPOINTMENT_STATUS_CHANGED", "in_app") in pairs
    assert ("APPOINTMENT_STATUS_CHANGED", "push") in pairs


def test_customer_push_payload_includes_appointment_destination(db_session):
    customer = _make_customer(db_session, email="dest@example.com")
    appointment = _make_appointment(db_session, customer)
    db_session.add(PushToken(user_id=customer.id, token="ExpoPushToken[destination]", enabled=True, platform="ios"))
    db_session.commit()

    enqueue_customer_notification(
        db_session,
        appointment,
        APPOINTMENT_STATUS_CHANGED,
        payload={"old_status": "ready", "new_status": "out_for_delivery"},
    )
    db_session.commit()

    row = (
        db_session.query(Notification)
        .filter(Notification.target == str(customer.id), Notification.channel == "push")
        .one()
    )
    assert row.payload_json["destination_screen"] == "AppointmentDetail"
    assert row.payload_json["destination_appointment_id"] == str(appointment.id)
