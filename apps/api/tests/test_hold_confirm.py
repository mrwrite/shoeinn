from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models import (
    Appointment,
    AppointmentHold,
    CompanyUser,
    HoldStatus,
    Notification,
    NotificationOutbox,
    User,
)
from app.routers.appointments import get_payment_gateway
from app.services.payment_gateway import CheckoutSession, PaymentRecord


def _pick_service(client: TestClient) -> tuple[UUID, UUID]:
    res = client.get("/services")
    assert res.status_code == 200
    data = res.json()
    return UUID(data[0]["id"]), UUID(data[0]["company_id"])


def _auth_header(user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"Authorization": f"Bearer {token}"}


class FakeServiceGateway:
    def __init__(self) -> None:
        self.mode = "service"
        self.enabled = True
        self.payment_status = "pending"

    def create_checkout_session(
        self,
        *,
        booking_id: str,
        amount_cents: int,
        currency: str,
        customer_email: str | None,
        customer_name: str | None,
    ) -> CheckoutSession:
        del customer_name
        return CheckoutSession(
            payment_id=f"pay_{booking_id}",
            checkout_session_id=f"cs_{booking_id}",
            checkout_url=f"https://checkout.stripe.test/{booking_id}",
            status="pending",
        )

    def fetch_payment(self, *, booking_id: str) -> PaymentRecord:
        return PaymentRecord(
            payment_id=f"pay_{booking_id}",
            booking_id=booking_id,
            status=self.payment_status,
            amount_expected=1000,
            amount_received=1000 if self.payment_status == "succeeded" else None,
            currency="usd",
        )


def test_hold_and_confirm_flow(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "payment_mode", "mock")
    monkeypatch.setattr(settings, "payment_checkout_success_url", "")
    monkeypatch.setattr(settings, "payment_checkout_cancel_url", "")
    monkeypatch.setattr(settings, "payment_mobile_redirect_base", "")

    service_id, company_id = _pick_service(client)
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
            "company_id": str(company_id),
                "customer_name": "Test User",
                "customer_phone": "1234567890",
                "customer_email": "test@example.com",
        },
    )
    assert confirm_res.status_code == 200, confirm_res.text
    appointment = confirm_res.json()
    assert appointment["service_id"] == str(service_id)
    assert appointment["status"] == "confirmed"
    assert appointment["payment_status"] == "succeeded"
    assert appointment["payment_checkout_url"] is None
    assert appointment["payment_mode"] == "mock"
    assert "simulated" in appointment["payment_message"].lower()

    db_session.expire_all()
    holds = db_session.query(AppointmentHold).all()
    assert holds[0].status == HoldStatus.CONFIRMED

    appts = db_session.query(Appointment).all()
    assert len(appts) == 1

    notifications = db_session.query(Notification).all()
    kinds = {n.kind for n in notifications}
    assert "APPOINTMENT_CONFIRMED" in kinds

    outbox_entries = db_session.query(NotificationOutbox).all()
    assert outbox_entries, "Expected outbox rows to be created"
    assert outbox_entries[0].notification_id == notifications[0].id
    assert isinstance(outbox_entries[0].payload_json, dict)


def test_confirm_expired_hold_returns_gone(client: TestClient, db_session: Session) -> None:
    service_id, company_id = _pick_service(client)
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
            "company_id": str(company_id),
            "customer_name": "Expired User",
            "customer_phone": "000",
            "customer_email": "expired@example.com",
        },
    )
    assert response.status_code == 410


def test_confirm_in_service_mode_requires_payment_service_url(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service_id, company_id = _pick_service(client)
    start_time = datetime.now(timezone.utc).replace(hour=11, minute=0, second=0, microsecond=0) + timedelta(days=1)

    monkeypatch.setattr(settings, "payment_mode", "service")
    monkeypatch.setattr(settings, "payment_service_base_url", None)

    hold_res = client.post(
        "/appointments/holds",
        json={
            "service_id": str(service_id),
            "start_time": start_time.isoformat(),
        },
    )
    assert hold_res.status_code == 201, hold_res.text

    confirm_res = client.post(
        "/appointments/confirm",
        json={
            "hold_id": hold_res.json()["id"],
            "company_id": str(company_id),
            "customer_name": "Service Mode User",
            "customer_phone": "1234567890",
            "customer_email": "service@example.com",
        },
    )
    assert confirm_res.status_code == 502
    assert "PAYMENT_MODE=service requires PAYMENT_SERVICE_BASE_URL" in confirm_res.json()["detail"]


def test_confirm_in_service_mode_requires_real_return_urls(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service_id, company_id = _pick_service(client)
    start_time = datetime.now(timezone.utc).replace(hour=12, minute=0, second=0, microsecond=0) + timedelta(days=1)

    monkeypatch.setattr(settings, "payment_mode", "service")
    monkeypatch.setattr(settings, "payment_service_base_url", "http://payments.test")
    monkeypatch.setattr(settings, "payment_mobile_redirect_base", "https://example.com/app")

    hold_res = client.post(
        "/appointments/holds",
        json={
            "service_id": str(service_id),
            "start_time": start_time.isoformat(),
        },
    )
    assert hold_res.status_code == 201, hold_res.text

    confirm_res = client.post(
        "/appointments/confirm",
        json={
            "hold_id": hold_res.json()["id"],
            "company_id": str(company_id),
            "customer_name": "Service Mode User",
            "customer_phone": "1234567890",
            "customer_email": "service@example.com",
        },
    )
    assert confirm_res.status_code == 502
    detail = confirm_res.json()["detail"]
    assert "PAYMENT_MODE=service requires a valid mobile/frontend redirect base" in detail
    assert "PAYMENT_MOBILE_REDIRECT_BASE" in detail
    assert "placeholder" in detail


def test_service_mode_payment_refresh_and_unpaid_cancel_flow(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service_id, company_id = _pick_service(client)
    start_time = datetime.now(timezone.utc).replace(hour=13, minute=0, second=0, microsecond=0) + timedelta(days=1)

    customer = User(
        email="service-customer@example.com",
        full_name="Service Customer",
        role="customer",
        password_hash=hash_password("Password1!"),
    )
    db_session.add(customer)
    db_session.commit()

    gateway = FakeServiceGateway()
    client.app.dependency_overrides[get_payment_gateway] = lambda: gateway
    monkeypatch.setattr(settings, "payment_mode", "service")

    hold_res = client.post(
        "/appointments/holds",
        json={
            "service_id": str(service_id),
            "start_time": start_time.isoformat(),
            "customer_email": customer.email,
        },
    )
    assert hold_res.status_code == 201, hold_res.text

    confirm_res = client.post(
        "/appointments/confirm",
        json={
            "hold_id": hold_res.json()["id"],
            "company_id": str(company_id),
            "customer_name": "Service Customer",
            "customer_phone": "1234567890",
            "customer_email": customer.email,
        },
    )
    assert confirm_res.status_code == 200, confirm_res.text
    appointment = confirm_res.json()
    assert appointment["status"] == "pending_payment"
    assert appointment["payment_status"] == "pending"
    assert appointment["payment_mode"] == "service"
    assert appointment["payment_checkout_url"].startswith("https://checkout.stripe.test/")
    assert appointment["payment_message"]

    headers = _auth_header(customer)
    mine_res = client.get("/appointments/mine", headers=headers)
    assert mine_res.status_code == 200, mine_res.text
    mine_items = mine_res.json()
    pending_item = next((item for item in mine_items if item["id"] == appointment["id"]), None)
    assert pending_item is not None
    assert pending_item["status"] == "pending_payment"
    assert pending_item["payment_status"] == "pending"
    assert pending_item["payment_mode"] == "service"
    assert pending_item["payment_checkout_url"].startswith("https://checkout.stripe.test/")

    gateway.payment_status = "succeeded"
    refresh_res = client.post(f"/appointments/{appointment['id']}/payment/refresh", headers=headers)
    assert refresh_res.status_code == 200, refresh_res.text
    refreshed = refresh_res.json()
    assert refreshed["status"] == "confirmed"
    assert refreshed["payment_status"] == "succeeded"
    assert refreshed["payment_checkout_url"] is None

    paid_cancel = client.post(f"/appointments/{appointment['id']}/payment/cancel", headers=headers)
    assert paid_cancel.status_code == 409

    second_hold_res = client.post(
        "/appointments/holds",
        json={
            "service_id": str(service_id),
            "start_time": (start_time + timedelta(hours=1)).isoformat(),
            "customer_email": customer.email,
        },
    )
    assert second_hold_res.status_code == 201, second_hold_res.text

    gateway.payment_status = "pending"
    second_confirm = client.post(
        "/appointments/confirm",
        json={
            "hold_id": second_hold_res.json()["id"],
            "company_id": str(company_id),
            "customer_name": "Service Customer",
            "customer_phone": "1234567890",
            "customer_email": customer.email,
        },
    )
    assert second_confirm.status_code == 200, second_confirm.text

    cancel_res = client.post(f"/appointments/{second_confirm.json()['id']}/payment/cancel", headers=headers)
    assert cancel_res.status_code == 200, cancel_res.text
    cancelled = cancel_res.json()
    assert cancelled["status"] == "cancelled"
    assert cancelled["payment_status"] == "failed"
    assert cancelled["payment_checkout_url"] is None

    mine_after_cancel = client.get("/appointments/mine", headers=headers)
    assert mine_after_cancel.status_code == 200, mine_after_cancel.text
    assert all(item["id"] != second_confirm.json()["id"] for item in mine_after_cancel.json())

    client.app.dependency_overrides.pop(get_payment_gateway, None)


def test_consecutive_service_mode_bookings_remain_in_customer_appointments(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service_id, company_id = _pick_service(client)
    start_time = datetime.now(timezone.utc).replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=2)

    customer = User(
        email="consecutive-service-customer@example.com",
        full_name="Consecutive Service Customer",
        role="customer",
        password_hash=hash_password("Password1!"),
    )
    db_session.add(customer)
    db_session.commit()

    gateway = FakeServiceGateway()
    client.app.dependency_overrides[get_payment_gateway] = lambda: gateway
    monkeypatch.setattr(settings, "payment_mode", "service")

    headers = _auth_header(customer)
    appointment_ids: list[str] = []

    for offset in range(2):
        hold_res = client.post(
            "/appointments/holds",
            json={
                "service_id": str(service_id),
                "start_time": (start_time + timedelta(hours=offset)).isoformat(),
                "customer_email": customer.email,
            },
        )
        assert hold_res.status_code == 201, hold_res.text

        confirm_res = client.post(
            "/appointments/confirm",
            json={
                "hold_id": hold_res.json()["id"],
                "company_id": str(company_id),
                "customer_name": "Consecutive Service Customer",
                "customer_phone": "1234567890",
                "customer_email": customer.email,
            },
        )
        assert confirm_res.status_code == 200, confirm_res.text
        appointment = confirm_res.json()
        assert appointment["status"] == "pending_payment"
        assert appointment["payment_status"] == "pending"
        assert appointment["payment_mode"] == "service"
        assert appointment["payment_checkout_url"].startswith("https://checkout.stripe.test/")
        appointment_ids.append(appointment["id"])

    pending_mine_res = client.get("/appointments/mine", headers=headers)
    assert pending_mine_res.status_code == 200, pending_mine_res.text
    pending_items = {item["id"]: item for item in pending_mine_res.json()}
    assert set(appointment_ids).issubset(pending_items)
    assert all(pending_items[appointment_id]["payment_status"] == "pending" for appointment_id in appointment_ids)
    assert all(pending_items[appointment_id]["payment_mode"] == "service" for appointment_id in appointment_ids)

    gateway.payment_status = "succeeded"
    for appointment_id in appointment_ids:
        refresh_res = client.post(f"/appointments/{appointment_id}/payment/refresh", headers=headers)
        assert refresh_res.status_code == 200, refresh_res.text
        assert refresh_res.json()["payment_status"] == "succeeded"

    paid_mine_res = client.get("/appointments/mine", headers=headers)
    assert paid_mine_res.status_code == 200, paid_mine_res.text
    paid_items = {item["id"]: item for item in paid_mine_res.json()}
    assert set(appointment_ids).issubset(paid_items)
    assert all(paid_items[appointment_id]["status"] == "confirmed" for appointment_id in appointment_ids)
    assert all(paid_items[appointment_id]["payment_status"] == "succeeded" for appointment_id in appointment_ids)
    assert all(paid_items[appointment_id]["payment_mode"] == "service" for appointment_id in appointment_ids)

    client.app.dependency_overrides.pop(get_payment_gateway, None)


def test_service_mode_payment_refresh_keeps_unpaid_session_pending(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service_id, company_id = _pick_service(client)
    start_time = datetime.now(timezone.utc).replace(hour=15, minute=0, second=0, microsecond=0) + timedelta(days=1)

    customer = User(
        email="pending-session@example.com",
        full_name="Pending Session Customer",
        role="customer",
        password_hash=hash_password("Password1!"),
    )
    db_session.add(customer)
    db_session.commit()

    gateway = FakeServiceGateway()
    client.app.dependency_overrides[get_payment_gateway] = lambda: gateway
    monkeypatch.setattr(settings, "payment_mode", "service")

    hold_res = client.post(
        "/appointments/holds",
        json={
            "service_id": str(service_id),
            "start_time": start_time.isoformat(),
            "customer_email": customer.email,
        },
    )
    assert hold_res.status_code == 201, hold_res.text

    confirm_res = client.post(
        "/appointments/confirm",
        json={
            "hold_id": hold_res.json()["id"],
            "company_id": str(company_id),
            "customer_name": "Pending Session Customer",
            "customer_phone": "1234567890",
            "customer_email": customer.email,
        },
    )
    assert confirm_res.status_code == 200, confirm_res.text
    appointment = confirm_res.json()

    gateway.payment_status = "requires_action"
    refresh_res = client.post(f"/appointments/{appointment['id']}/payment/refresh", headers=_auth_header(customer))
    assert refresh_res.status_code == 200, refresh_res.text
    refreshed = refresh_res.json()
    assert refreshed["status"] == "pending_payment"
    assert refreshed["payment_status"] == "requires_action"
    assert refreshed["payment_checkout_url"].startswith("https://checkout.stripe.test/")

    client.app.dependency_overrides.pop(get_payment_gateway, None)


def test_payment_webhook_confirms_pending_payment_booking(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service_id, company_id = _pick_service(client)
    start_time = datetime.now(timezone.utc).replace(hour=14, minute=0, second=0, microsecond=0) + timedelta(days=1)

    customer = User(
        email="webhook-customer@example.com",
        full_name="Webhook Customer",
        role="customer",
        password_hash=hash_password("Password1!"),
    )
    db_session.add(customer)
    db_session.commit()

    gateway = FakeServiceGateway()
    client.app.dependency_overrides[get_payment_gateway] = lambda: gateway
    monkeypatch.setattr(settings, "payment_mode", "service")

    hold_res = client.post(
        "/appointments/holds",
        json={
            "service_id": str(service_id),
            "start_time": start_time.isoformat(),
            "customer_email": customer.email,
        },
    )
    assert hold_res.status_code == 201, hold_res.text

    confirm_res = client.post(
        "/appointments/confirm",
        json={
            "hold_id": hold_res.json()["id"],
            "company_id": str(company_id),
            "customer_name": "Webhook Customer",
            "customer_phone": "1234567890",
            "customer_email": customer.email,
        },
    )
    assert confirm_res.status_code == 200, confirm_res.text
    appointment = confirm_res.json()
    assert appointment["status"] == "pending_payment"

    webhook_res = client.post(
        "/webhooks/payments",
        json={
            "booking_id": appointment["id"],
            "status": "succeeded",
            "amount_expected": appointment["payment_amount_expected"],
            "amount_received": appointment["payment_amount_expected"],
            "currency": appointment["payment_currency"],
        },
    )
    assert webhook_res.status_code == 200, webhook_res.text
    payload = webhook_res.json()
    assert payload["previous_status"] == "pending_payment"
    assert payload["status"] == "confirmed"
    assert payload["payment_status"] == "succeeded"

    latest = client.get(f"/appointments/{appointment['id']}", headers=_auth_header(customer))
    assert latest.status_code == 200, latest.text
    assert latest.json()["status"] == "confirmed"

    client.app.dependency_overrides.pop(get_payment_gateway, None)
