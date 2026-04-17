from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.core.security import create_access_token, hash_password
from app.enums import AppointmentStatus
from app.models import Appointment, Company, Notification, Service, User


def _auth_header(user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"Authorization": f"Bearer {token}"}


def test_customer_can_list_only_their_in_app_notifications(client, db_session):
    company = Company(name="Notify Co", city="Austin", state="TX")
    db_session.add(company)
    db_session.flush()

    service = Service(
        company_id=company.id,
        name="Deep Clean",
        slug="deep-clean-notify",
        description="",
        duration_minutes=30,
        price_cents=2500,
    )
    db_session.add(service)
    db_session.flush()

    customer = User(
        email="customer-notify@example.com",
        full_name="Customer Notify",
        role="customer",
        password_hash=hash_password("pass1234"),
    )
    other_customer = User(
        email="other-notify@example.com",
        full_name="Other Customer",
        role="customer",
        password_hash=hash_password("pass1234"),
    )
    db_session.add_all([customer, other_customer])
    db_session.flush()

    appointment = Appointment(
        company_id=company.id,
        service_id=service.id,
        customer_name="Customer Notify",
        customer_phone="555-1234",
        customer_email=customer.email,
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc) + timedelta(minutes=30),
        status=AppointmentStatus.confirmed,
    )
    db_session.add(appointment)
    db_session.flush()

    db_session.add_all(
        [
            Notification(
                company_id=company.id,
                appointment_id=appointment.id,
                kind="APPOINTMENT_PROVIDER_ASSIGNED",
                channel="in_app",
                target=str(customer.id),
                payload_json={"appointment_id": str(appointment.id)},
                delivered=True,
                status="delivered",
            ),
            Notification(
                company_id=company.id,
                appointment_id=appointment.id,
                kind="APPOINTMENT_STATUS_CHANGED",
                channel="in_app",
                target=str(other_customer.id),
                payload_json={"appointment_id": str(appointment.id)},
                delivered=True,
                status="delivered",
            ),
            Notification(
                company_id=company.id,
                appointment_id=appointment.id,
                kind="APPOINTMENT_STATUS_CHANGED",
                channel="email",
                target=customer.email,
                payload_json={"appointment_id": str(appointment.id)},
                delivered=True,
                status="delivered",
            ),
        ]
    )
    db_session.commit()

    response = client.get("/me/notifications", headers=_auth_header(customer))

    assert response.status_code == 200, response.text
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["kind"] == "APPOINTMENT_PROVIDER_ASSIGNED"
    assert payload[0]["target"] == str(customer.id)


def test_customer_can_ack_their_own_notification(client, db_session):
    company = Company(name="Ack Co", city="Austin", state="TX")
    db_session.add(company)
    db_session.flush()

    customer = User(
        email="ack@example.com",
        full_name="Ack Customer",
        role="customer",
        password_hash=hash_password("pass1234"),
    )
    other_customer = User(
        email="other-ack@example.com",
        full_name="Other Ack",
        role="customer",
        password_hash=hash_password("pass1234"),
    )
    db_session.add_all([customer, other_customer])
    db_session.flush()

    notification = Notification(
        company_id=company.id,
        appointment_id=None,
        kind="APPOINTMENT_STATUS_CHANGED",
        channel="in_app",
        target=str(customer.id),
        payload_json={"new_status": "ready"},
        delivered=True,
        status="delivered",
    )
    foreign_notification = Notification(
        company_id=company.id,
        appointment_id=None,
        kind="APPOINTMENT_STATUS_CHANGED",
        channel="in_app",
        target=str(other_customer.id),
        payload_json={"new_status": "delivered"},
        delivered=True,
        status="delivered",
    )
    db_session.add_all([notification, foreign_notification])
    db_session.commit()

    response = client.post(f"/me/notifications/{notification.id}/ack", headers=_auth_header(customer))

    assert response.status_code == 200, response.text
    assert response.json()["read_at"] is not None

    forbidden = client.post(f"/me/notifications/{foreign_notification.id}/ack", headers=_auth_header(customer))
    assert forbidden.status_code == 404


def test_customer_can_ack_all_their_notifications(client, db_session):
    company = Company(name="Bulk Ack Co", city="Austin", state="TX")
    db_session.add(company)
    db_session.flush()

    customer = User(
        email="bulk-ack@example.com",
        full_name="Bulk Ack Customer",
        role="customer",
        password_hash=hash_password("pass1234"),
    )
    other_customer = User(
        email="bulk-other@example.com",
        full_name="Bulk Other",
        role="customer",
        password_hash=hash_password("pass1234"),
    )
    db_session.add_all([customer, other_customer])
    db_session.flush()

    unread_one = Notification(
        company_id=company.id,
        appointment_id=None,
        kind="APPOINTMENT_STATUS_CHANGED",
        channel="in_app",
        target=str(customer.id),
        payload_json={"new_status": "ready"},
        delivered=True,
        status="delivered",
    )
    unread_two = Notification(
        company_id=company.id,
        appointment_id=None,
        kind="APPOINTMENT_PROVIDER_ASSIGNED",
        channel="in_app",
        target=str(customer.id),
        payload_json={},
        delivered=False,
        status="queued",
    )
    already_read = Notification(
        company_id=company.id,
        appointment_id=None,
        kind="APPOINTMENT_STATUS_CHANGED",
        channel="in_app",
        target=str(customer.id),
        payload_json={"new_status": "delivered"},
        delivered=True,
        status="delivered",
        read_at=datetime.now(timezone.utc),
    )
    foreign = Notification(
        company_id=company.id,
        appointment_id=None,
        kind="APPOINTMENT_STATUS_CHANGED",
        channel="in_app",
        target=str(other_customer.id),
        payload_json={"new_status": "ready"},
        delivered=True,
        status="delivered",
    )
    db_session.add_all([unread_one, unread_two, already_read, foreign])
    db_session.commit()

    response = client.post("/me/notifications/ack-all", headers=_auth_header(customer))

    assert response.status_code == 200, response.text
    assert response.json() == {"updated": 2}

    db_session.refresh(unread_one)
    db_session.refresh(unread_two)
    db_session.refresh(already_read)
    db_session.refresh(foreign)

    assert unread_one.read_at is not None
    assert unread_two.read_at is not None
    assert unread_two.delivered is True
    assert unread_two.status == "delivered"
    assert already_read.read_at is not None
    assert foreign.read_at is None
