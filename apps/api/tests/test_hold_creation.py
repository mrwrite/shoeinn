from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Appointment, AppointmentStatus


def _service_and_company(client: TestClient) -> tuple[UUID, UUID]:
    res = client.get("/services")
    assert res.status_code == 200
    data = res.json()
    assert data, "No seeded services available"
    service = data[0]
    return UUID(service["id"]), UUID(service["company_id"])


def test_create_hold_success(client: TestClient) -> None:
    service_id, _ = _service_and_company(client)
    start_time = datetime.now(timezone.utc).replace(hour=12, minute=0, second=0, microsecond=0) + timedelta(days=1)

    response = client.post(
        "/appointments/holds",
        json={"service_id": str(service_id), "start_time": start_time.isoformat()},
    )

    assert response.status_code == 201, response.text
    payload = response.json()
    assert payload["service_id"] == str(service_id)
    assert datetime.fromisoformat(payload["end_time"]) > datetime.fromisoformat(payload["start_time"])


def test_create_hold_conflict_with_active_appointment(client: TestClient, db_session: Session) -> None:
    service_id, company_id = _service_and_company(client)
    start_time = datetime.now(timezone.utc).replace(hour=14, minute=0, second=0, microsecond=0) + timedelta(days=1)
    end_time = start_time + timedelta(minutes=30)

    existing = Appointment(
        service_id=service_id,
        company_id=company_id,
        type="pickup",
        customer_name="Existing",
        customer_phone="555-1111",
        start_time=start_time,
        end_time=end_time,
        status=AppointmentStatus.confirmed,
    )
    db_session.add(existing)
    db_session.commit()

    response = client.post(
        "/appointments/holds",
        json={"service_id": str(service_id), "start_time": start_time.isoformat()},
    )

    assert response.status_code == 409
    assert "Time slot already booked" in response.text


def test_create_hold_allows_cancelled_overlap(client: TestClient, db_session: Session) -> None:
    service_id, company_id = _service_and_company(client)
    start_time = datetime.now(timezone.utc).replace(hour=16, minute=0, second=0, microsecond=0) + timedelta(days=1)
    end_time = start_time + timedelta(minutes=30)

    cancelled = Appointment(
        service_id=service_id,
        company_id=company_id,
        type="pickup",
        customer_name="Cancelled",
        customer_phone="555-2222",
        start_time=start_time,
        end_time=end_time,
        status=AppointmentStatus.cancelled,
    )
    db_session.add(cancelled)
    db_session.commit()

    response = client.post(
        "/appointments/holds",
        json={"service_id": str(service_id), "start_time": start_time.isoformat()},
    )

    assert response.status_code == 201, response.text
