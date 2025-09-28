from datetime import datetime, timedelta, timezone

from app.core.db import SessionLocal
from app.models.appointment_hold import AppointmentHold
from app.models.available_slot import AvailableSlot
from app.models.service import Service
from app.models.user import User
from app.utils.holds import clear_expired_holds

from tests.test_flow import auth_headers, client, reset_db, seed_services


def _create_slot(db, service: Service, start_time: datetime) -> AvailableSlot:
    slot = AvailableSlot(
        company_id=service.company_id,
        service_id=service.id,
        start_time_utc=start_time,
        is_available=True,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


def _register_customer(email: str) -> str:
    client.post(
        "/auth/register",
        json={
            "email": email,
            "password": "Password1!",
            "full_name": "Test User",
            "role": "customer",
        },
    )
    token = client.post("/auth/login", json={"email": email, "password": "Password1!"}).json()["access_token"]
    return token


def _get_customer_id(email: str) -> str:
    with SessionLocal() as db:
        return db.query(User).filter_by(email=email).one().id


def test_competing_bookings_fail_fast():
    reset_db()
    try:
        seed_services()

        with SessionLocal() as db:
            service = db.query(Service).filter_by(name="Basic Clean").one()
            service_id = service.id
            company_id = service.company_id
            start_time = datetime(2025, 1, 1, 15, 0, tzinfo=timezone.utc)
            _create_slot(db, service, start_time)

        token_one = _register_customer("one@test.com")
        token_two = _register_customer("two@test.com")

        payload = {
            "company_id": str(company_id),
            "service_id": str(service_id),
            "type": "pickup",
            "address": {
                "line1": "1 Main",
                "line2": None,
                "city": "Austin",
                "state": "TX",
                "postal_code": "73301",
            },
            "start_time_iso": start_time.isoformat(),
        }

        first = client.post("/appointments", json=payload, headers=auth_headers(token_one))
        assert first.status_code == 200

        second = client.post("/appointments", json=payload, headers=auth_headers(token_two))
        assert second.status_code == 409

        with SessionLocal() as db:
            slot = db.query(AvailableSlot).filter_by(company_id=company_id, start_time_utc=start_time).one()
            assert slot.is_available is False
    finally:
        reset_db()


def test_hold_expiration_releases_slot():
    reset_db()
    try:
        seed_services()

        with SessionLocal() as db:
            service = db.query(Service).filter_by(name="Basic Clean").one()
            service_id = service.id
            company_id = service.company_id
            start_time = datetime(2025, 1, 2, 12, 0, tzinfo=timezone.utc)
            _create_slot(db, service, start_time)

        holder_token = _register_customer("holder@test.com")
        competitor_token = _register_customer("competitor@test.com")
        holder_id = _get_customer_id("holder@test.com")

        with SessionLocal() as db:
            hold = AppointmentHold(
                customer_id=holder_id,
                company_id=company_id,
                service_id=service_id,
                start_time_utc=start_time,
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
            )
            db.add(hold)
            db.commit()

        payload = {
            "company_id": str(company_id),
            "service_id": str(service_id),
            "type": "pickup",
            "address": {
                "line1": "1 Main",
                "line2": None,
                "city": "Austin",
                "state": "TX",
                "postal_code": "73301",
            },
            "start_time_iso": start_time.isoformat(),
        }

        blocked = client.post("/appointments", json=payload, headers=auth_headers(competitor_token))
        assert blocked.status_code == 409

        with SessionLocal() as db:
            hold = db.query(AppointmentHold).filter_by(company_id=company_id, start_time_utc=start_time).one()
            hold.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
            db.commit()

        clear_expired_holds()

        response = client.post("/appointments", json=payload, headers=auth_headers(competitor_token))
        assert response.status_code == 200

        with SessionLocal() as db:
            holds = db.query(AppointmentHold).filter_by(company_id=company_id, start_time_utc=start_time).all()
            assert holds
            assert all(not h.active for h in holds)
    finally:
        reset_db()

