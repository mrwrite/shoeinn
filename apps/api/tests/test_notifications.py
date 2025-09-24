from datetime import datetime, timedelta, timezone
from uuid import UUID

import pytest

from app.core.db import SessionLocal
from app.models.appointment import Appointment
from app.models.company import Company
from app.models.notification import Notification
from app.models.service import Service
from app.models.user import User
from app.utils.notification_dispatcher import dispatch_outbox_batch
from app.utils.notifications import enqueue_notification_intent
from tests.test_flow import auth_headers, client, reset_db


def _create_company_and_appointment() -> tuple[str, str]:
    with SessionLocal() as db:
        company = Company(name="Notif Co", city="Austin", state="TX")
        customer = User(email="notif@test.com", password_hash="hash", role="customer")
        db.add_all([company, customer])
        db.flush()
        service = Service(
            company_id=company.id,
            name="Notification Service",
            description="",
            price_cents=1000,
            duration_min=30,
        )
        db.add(service)
        db.flush()
        appt = Appointment(
            customer_id=customer.id,
            company_id=company.id,
            service_id=service.id,
            type="pickup",
            start_time_utc=datetime.now(timezone.utc),
            tz_offset_min=0,
        )
        db.add(appt)
        db.commit()
        return company.id, appt.id


def _book_api_appointment() -> tuple[str, str]:
    client.post("/dev/seed")
    client.post(
        "/auth/register",
        json={
            "email": "notifyuser@test.com",
            "password": "Password1!",
            "full_name": "Notify User",
            "role": "customer",
        },
    )
    token = client.post("/auth/login", json={"email": "notifyuser@test.com", "password": "Password1!"}).json()[
        "access_token"
    ]
    company_id = client.get("/companies").json()[0]["id"]
    service_id = client.get(f"/companies/{company_id}/services").json()[0]["id"]
    payload = {
        "company_id": company_id,
        "service_id": service_id,
        "type": "pickup",
        "address": {
            "line1": "1 Main",
            "line2": None,
            "city": "Austin",
            "state": "TX",
            "postal_code": "73301",
        },
        "start_time_iso": "2025-08-18T15:30:00-05:00",
    }
    resp = client.post("/appointments", json=payload, headers=auth_headers(token))
    resp.raise_for_status()
    appointment_id = resp.json()["id"]
    return company_id, appointment_id


@pytest.fixture(autouse=True)
def cleanup_db():
    reset_db()
    yield
    reset_db()


def test_appointment_creation_enqueues_notification():
    company_id, appointment_id = _book_api_appointment()

    with SessionLocal() as db:
        notif = (
            db.query(Notification)
            .filter_by(
                company_id=company_id,
                appointment_id=UUID(appointment_id),
                kind="new_request",
            )
            .one()
        )
        assert notif.status == "pending"
        assert notif.delivery_attempts == 0
        assert notif.outbox_entry is not None
        assert notif.outbox_entry.status == "pending"


def test_dispatcher_retries_and_dead_letter():
    company_id, appointment_id = _create_company_and_appointment()

    with SessionLocal() as db:
        retry_notif = enqueue_notification_intent(
            db,
            company_id=company_id,
            appointment_id=appointment_id,
            kind="retry_test",
            channel="email",
            target="temporary-failure",
        )
        dlq_notif = enqueue_notification_intent(
            db,
            company_id=company_id,
            appointment_id=appointment_id,
            kind="dlq_test",
            channel="email",
            target="permanent-failure",
        )
        db.commit()
        retry_id = retry_notif.id
        dlq_id = dlq_notif.id

    with SessionLocal() as db:
        processed, succeeded, failed = dispatch_outbox_batch(db)
        assert processed == 2
        assert succeeded == 0
        assert failed == 2
        db.commit()

    with SessionLocal() as db:
        retry_loaded = db.get(Notification, retry_id)
        dlq_loaded = db.get(Notification, dlq_id)

        assert retry_loaded.status == "retrying"
        assert retry_loaded.delivery_attempts == 1
        assert retry_loaded.outbox_entry.status == "pending"
        assert retry_loaded.next_attempt_at is not None
        assert any(e.event_type == "delivery_retry_scheduled" for e in retry_loaded.events)

        assert dlq_loaded.status == "failed"
        assert dlq_loaded.dead_lettered is True
        assert dlq_loaded.outbox_entry.status == "dead_lettered"
        assert any(e.event_type == "delivery_failed" for e in dlq_loaded.events)

        retry_loaded.target = None
        next_attempt = retry_loaded.next_attempt_at
        db.commit()

    with SessionLocal() as db:
        processed, succeeded, failed = dispatch_outbox_batch(
            db, now=next_attempt + timedelta(seconds=1)
        )
        assert processed >= 1
        assert succeeded >= 1
        db.commit()

    with SessionLocal() as db:
        retry_loaded = db.get(Notification, retry_id)
        assert retry_loaded.status == "delivered"
        assert retry_loaded.delivered is True
        assert any(e.event_type == "delivery_success" for e in retry_loaded.events)


def test_webhook_updates_notification_status():
    company_id, appointment_id = _create_company_and_appointment()

    with SessionLocal() as db:
        notification = enqueue_notification_intent(
            db,
            company_id=company_id,
            appointment_id=appointment_id,
            kind="webhook_test",
            channel="email",
        )
        db.commit()
        notif_id = notification.id

    delivered = client.post(
        "/webhooks/email",
        json={
            "notification_id": str(notif_id),
            "status": "delivered",
            "provider_message_id": "abc-123",
        },
    )
    assert delivered.status_code == 200

    with SessionLocal() as db:
        notif = db.get(Notification, notif_id)
        assert notif.status == "delivered"
        assert notif.delivered is True
        assert any(e.event_type == "provider_delivery_confirmed" for e in notif.events)

    with SessionLocal() as db:
        failure_notification = enqueue_notification_intent(
            db,
            company_id=company_id,
            appointment_id=appointment_id,
            kind="webhook_failure",
            channel="email",
        )
        db.commit()
        failure_id = failure_notification.id

    failure_resp = client.post(
        "/webhooks/email",
        json={
            "notification_id": str(failure_id),
            "status": "failed",
            "error_code": "HARD",
            "error_message": "Provider failure",
        },
    )
    assert failure_resp.status_code == 200

    with SessionLocal() as db:
        failure_loaded = db.get(Notification, failure_id)
        assert failure_loaded.status == "failed"
        assert failure_loaded.dead_lettered is True
        assert any(e.event_type == "provider_delivery_failed" for e in failure_loaded.events)
