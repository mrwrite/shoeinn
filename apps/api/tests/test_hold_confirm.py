from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Appointment, AppointmentHold, HoldStatus, NotificationOutbox


def _pick_service_id(client: TestClient) -> UUID:
    res = client.get("/services")
    assert res.status_code == 200
    data = res.json()
    return UUID(data[0]["id"])


def test_hold_and_confirm_flow(client: TestClient, db_session: Session) -> None:
    service_id = _pick_service_id(client)
    start_time = datetime.now(timezone.utc).replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=1)

    hold_res = client.post(
        "/appointments/holds",
        json={
            "service_id": str(service_id),
            "start_time": start_time.isoformat(),
        },
    )
    assert hold_res.status_code == 201, hold_res.text
    hold_data = hold_res.json()
    ttl = datetime.fromisoformat(hold_data["ttl_expires_at"])
    assert ttl > datetime.now(timezone.utc)

    confirm_res = client.post(
        "/appointments/confirm",
        json={
            "hold_id": hold_data["id"],
            "customer_name": "Test User",
            "customer_phone": "1234567890",
            "customer_email": "test@example.com",
        },
    )
    assert confirm_res.status_code == 200, confirm_res.text
    appointment = confirm_res.json()
    assert appointment["service_id"] == str(service_id)

    db_session.expire_all()
    holds = db_session.query(AppointmentHold).all()
    assert holds[0].status == HoldStatus.CONFIRMED

    appts = db_session.query(Appointment).all()
    assert len(appts) == 1

    outbox_entries = db_session.query(NotificationOutbox).all()
    assert len(outbox_entries) == 1
    assert outbox_entries[0].type == "APPOINTMENT_CONFIRMED"


def test_confirm_expired_hold_returns_gone(client: TestClient, db_session: Session) -> None:
    service_id = _pick_service_id(client)
    start_time = datetime.now(timezone.utc).replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1)
    hold = AppointmentHold(
        service_id=service_id,
        start_time=start_time,
        end_time=start_time + timedelta(minutes=30),
        ttl_expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
        status=HoldStatus.PENDING,
    )
    db_session.add(hold)
    db_session.commit()

    response = client.post(
        "/appointments/confirm",
        json={
            "hold_id": str(hold.id),
            "customer_name": "Expired User",
            "customer_phone": "000",
            "customer_email": "expired@example.com",
        },
    )
    assert response.status_code == 410
