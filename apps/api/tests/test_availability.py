from __future__ import annotations

from datetime import date, datetime, timedelta
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Appointment


def _service_with_duration(client: TestClient) -> tuple[UUID, int, UUID]:
    res = client.get("/services")
    assert res.status_code == 200
    for item in res.json():
        if item["duration_minutes"] > 0:
            return UUID(item["id"]), item["duration_minutes"], UUID(item["company_id"])
    raise AssertionError("Expected at least one service with duration")


def test_availability_lists_slots(client: TestClient) -> None:
    service_id, _, _ = _service_with_duration(client)
    target_date = (date.today() + timedelta(days=1)).isoformat()

    res = client.get("/availability", params={"service_id": str(service_id), "date": target_date})
    assert res.status_code == 200
    slots = res.json()
    assert isinstance(slots, list)
    assert slots, "Expected availability slots"


def test_conflicting_appointment_blocks_slot(client: TestClient, db_session: Session) -> None:
    service_id, duration, company_id = _service_with_duration(client)
    target_date = (date.today() + timedelta(days=1)).isoformat()
    res = client.get("/availability", params={"service_id": str(service_id), "date": target_date})
    assert res.status_code == 200
    slots = res.json()
    first_slot = datetime.fromisoformat(slots[0])

    appointment = Appointment(
        service_id=service_id,
        company_id=company_id,
        customer_name="Blocker",
        customer_phone="000",
        customer_email=None,
        start_time=first_slot,
        end_time=first_slot + timedelta(minutes=duration),
    )
    db_session.add(appointment)
    db_session.commit()

    res_after = client.get("/availability", params={"service_id": str(service_id), "date": target_date})
    assert res_after.status_code == 200
    refreshed_slots = res_after.json()
    assert first_slot.isoformat() not in refreshed_slots
