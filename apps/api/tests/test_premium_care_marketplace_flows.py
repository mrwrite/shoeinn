from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models import CompanyUser, Notification, User
from app.routers.appointments import get_payment_gateway
from app.services.payment_gateway import CheckoutSession, PaymentRecord


def _auth_header(user: User, *, company_id: UUID | None = None) -> dict[str, str]:
    payload = {"sub": str(user.id), "role": user.role}
    if company_id is not None:
        payload["company_id"] = str(company_id)
    token = create_access_token(payload)
    return {"Authorization": f"Bearer {token}"}


def _access_token(user: User, *, company_id: UUID | None = None) -> str:
    return _auth_header(user, company_id=company_id)["Authorization"].split(" ", 1)[1]


def _make_user(db: Session, *, email: str, role: str, full_name: str) -> User:
    user = User(email=email, full_name=full_name, role=role, password_hash=hash_password("Password1!"))
    db.add(user)
    db.flush()
    return user


def _pick_service(client: TestClient, *, category_slug: str) -> dict:
    response = client.get("/services", params={"category_slug": category_slug})
    assert response.status_code == 200, response.text
    services = response.json()
    assert services
    return services[0]


def _start_time(days: int = 1, hour: int = 10) -> datetime:
    return datetime.now(timezone.utc).replace(hour=hour, minute=0, second=0, microsecond=0) + timedelta(days=days)


def _create_hold(client: TestClient, service_id: str, start_time: datetime, *, customer_email: str | None = None) -> str:
    response = client.post(
        "/appointments/holds",
        json={
            "service_id": service_id,
            "start_time": start_time.isoformat(),
            "customer_email": customer_email,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def _confirm_hold(
    client: TestClient,
    *,
    hold_id: str,
    company_id: str,
    customer_name: str,
    customer_email: str,
) -> dict:
    response = client.post(
        "/appointments/confirm",
        json={
            "hold_id": hold_id,
            "company_id": company_id,
            "customer_name": customer_name,
            "customer_phone": "5551234567",
            "customer_email": customer_email,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


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
        del amount_cents, currency, customer_email, customer_name
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


def test_existing_shoe_quote_hold_confirm_and_filters_keep_category_metadata(
    client: TestClient,
) -> None:
    service = _pick_service(client, category_slug="shoes")
    start_time = _start_time(hour=9)

    quote_response = client.post(
        "/appointments/quote",
        json={
            "service_id": service["id"],
            "start_time": start_time.isoformat(),
            "type": "pickup",
        },
    )
    assert quote_response.status_code == 200, quote_response.text
    quote = quote_response.json()
    assert quote["service_id"] == service["id"]
    assert quote["service_name"] == service["name"]
    assert quote["category_id"] == service["category_id"]
    assert quote["category_slug"] == "shoes"
    assert quote["category_name"] == service["category_name"]

    hold_id = _create_hold(client, service["id"], start_time)
    appointment = _confirm_hold(
        client,
        hold_id=hold_id,
        company_id=service["company_id"],
        customer_name="Shoe Regression Customer",
        customer_email="shoe-regression@example.com",
    )

    assert appointment["service_id"] == service["id"]
    assert appointment["service_name"] == service["name"]
    assert appointment["category_slug"] == "shoes"
    assert appointment["status"] == "confirmed"
    assert appointment["payment_status"] == "succeeded"

    company_services = client.get(
        f"/companies/{service['company_id']}/services",
        params={"category_slug": "shoes"},
    )
    assert company_services.status_code == 200, company_services.text
    assert any(item["id"] == service["id"] for item in company_services.json())


def test_non_shoe_service_mode_payment_refresh_preserves_category_metadata(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = _pick_service(client, category_slug="dry-cleaning")
    customer = _make_user(
        db_session,
        email="dry-cleaning-payment@example.com",
        role="customer",
        full_name="Dry Cleaning Customer",
    )
    db_session.commit()

    gateway = FakeServiceGateway()
    client.app.dependency_overrides[get_payment_gateway] = lambda: gateway
    monkeypatch.setattr(settings, "payment_mode", "service")

    hold_id = _create_hold(client, service["id"], _start_time(hour=11), customer_email=customer.email)
    appointment = _confirm_hold(
        client,
        hold_id=hold_id,
        company_id=service["company_id"],
        customer_name="Dry Cleaning Customer",
        customer_email=customer.email,
    )

    assert appointment["status"] == "pending_payment"
    assert appointment["payment_status"] == "pending"
    assert appointment["payment_checkout_url"].startswith("https://checkout.stripe.test/")
    assert appointment["category_slug"] == "dry-cleaning"
    assert appointment["category_icon_key"] == service["category_icon_key"]

    gateway.payment_status = "succeeded"
    refresh = client.post(
        f"/appointments/{appointment['id']}/payment/refresh",
        headers=_auth_header(customer),
    )
    assert refresh.status_code == 200, refresh.text
    refreshed = refresh.json()
    assert refreshed["status"] == "confirmed"
    assert refreshed["payment_status"] == "succeeded"
    assert refreshed["payment_checkout_url"] is None
    assert refreshed["category_slug"] == "dry-cleaning"


def test_non_shoe_assignment_status_notifications_live_events_and_appointment_views(
    client: TestClient,
    db_session: Session,
) -> None:
    service = _pick_service(client, category_slug="laundry")
    customer = _make_user(
        db_session,
        email="laundry-customer@example.com",
        role="customer",
        full_name="Laundry Customer",
    )
    provider = _make_user(
        db_session,
        email="laundry-provider@example.com",
        role="provider",
        full_name="Laundry Provider",
    )
    admin = _make_user(
        db_session,
        email="laundry-admin@example.com",
        role="company_admin",
        full_name="Laundry Admin",
    )
    company_id = UUID(service["company_id"])
    db_session.add_all(
        [
            CompanyUser(user_id=provider.id, company_id=company_id),
            CompanyUser(user_id=admin.id, company_id=company_id),
        ]
    )
    db_session.commit()

    hold_id = _create_hold(client, service["id"], _start_time(days=2, hour=12), customer_email=customer.email)
    appointment = _confirm_hold(
        client,
        hold_id=hold_id,
        company_id=service["company_id"],
        customer_name="Laundry Customer",
        customer_email=customer.email,
    )
    assert appointment["status"] == "confirmed"
    assert appointment["category_slug"] == "laundry"

    claim = client.post(
        f"/company/appointments/{appointment['id']}/claim",
        headers=_auth_header(provider, company_id=company_id),
    )
    assert claim.status_code == 201, claim.text
    claim_payload = claim.json()
    assert claim_payload["provider_name"] == "Laundry Provider"
    assert claim_payload["service_name"] == service["name"]
    assert claim_payload["category_slug"] == "laundry"

    token = _access_token(customer)
    with client.websocket_connect(f"/live/ws?token={token}") as websocket:
        status_response = client.post(
            f"/company/appointments/{appointment['id']}/status",
            json={"status": "en_route_pickup"},
            headers=_auth_header(provider, company_id=company_id),
        )
        assert status_response.status_code == 200, status_response.text
        live_payload = websocket.receive_json()

    assert live_payload["type"] == "appointment_status_changed"
    assert live_payload["appointment_id"] == appointment["id"]
    assert live_payload["previous_status"] == "confirmed"
    assert live_payload["status"] == "en_route_pickup"
    assert live_payload["actor_role"] == "provider"
    assert live_payload["service_name"] == service["name"]
    assert live_payload["category_slug"] == "laundry"

    customer_detail = client.get(f"/appointments/{appointment['id']}", headers=_auth_header(customer))
    assert customer_detail.status_code == 200, customer_detail.text
    detail_payload = customer_detail.json()
    assert detail_payload["status"] == "en_route_pickup"
    assert detail_payload["category_slug"] == "laundry"

    mine = client.get("/appointments/mine", headers=_auth_header(customer))
    assert mine.status_code == 200, mine.text
    mine_item = next(item for item in mine.json() if item["id"] == appointment["id"])
    assert mine_item["status"] == "en_route_pickup"
    assert mine_item["service_id"] == service["id"]
    assert mine_item["category_slug"] == "laundry"

    provider_jobs = client.get("/company/appointments/my", headers=_auth_header(provider, company_id=company_id))
    assert provider_jobs.status_code == 200, provider_jobs.text
    provider_item = next(item for item in provider_jobs.json() if item["id"] == appointment["id"])
    assert provider_item["category_slug"] == "laundry"
    assert provider_item["service_name"] == service["name"]

    admin_jobs = client.get("/company/appointments/open", headers=_auth_header(admin, company_id=company_id))
    assert admin_jobs.status_code == 200, admin_jobs.text
    admin_item = next(item for item in admin_jobs.json() if item["id"] == appointment["id"])
    assert admin_item["category_slug"] == "laundry"
    assert admin_item["provider_name"] == "Laundry Provider"

    notification = (
        db_session.query(Notification)
        .filter(
            Notification.appointment_id == UUID(appointment["id"]),
            Notification.kind == "APPOINTMENT_STATUS_CHANGED",
            Notification.channel == "in_app",
            Notification.target == str(customer.id),
        )
        .order_by(Notification.created_at.desc())
        .first()
    )
    assert notification is not None
    assert notification.payload_json["new_status"] == "en_route_pickup"
    assert notification.payload_json["service_name"] == service["name"]
    assert notification.payload_json["category_slug"] == "laundry"
