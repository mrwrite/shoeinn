from __future__ import annotations

import json
from urllib.parse import parse_qs, urlparse

import httpx
import pytest

from app.core.config import settings
from app.services.payment_gateway import PaymentGateway, PaymentGatewayError


def test_mock_mode_allows_checkout_without_real_return_urls(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "payment_mode", "mock")
    monkeypatch.setattr(settings, "payment_service_base_url", None)
    monkeypatch.setattr(settings, "payment_checkout_success_url", "")
    monkeypatch.setattr(settings, "payment_checkout_cancel_url", "")
    monkeypatch.setattr(settings, "payment_mobile_redirect_base", "")

    gateway = PaymentGateway()

    checkout = gateway.create_checkout_session(
        booking_id="booking-mock",
        amount_cents=1200,
        currency="usd",
        customer_email="demo@example.test",
        customer_name="Demo User",
    )

    assert checkout.status == "succeeded"
    assert checkout.checkout_url is None


@pytest.mark.parametrize(
    ("redirect_base", "expected_message"),
    [
        ("", "is missing"),
        ("https://example.com/app", "is still placeholder"),
    ],
)
def test_service_mode_requires_real_return_urls(
    monkeypatch: pytest.MonkeyPatch,
    redirect_base: str,
    expected_message: str,
) -> None:
    monkeypatch.setattr(settings, "payment_mode", "service")
    monkeypatch.setattr(settings, "payment_service_base_url", "http://payments.test")
    monkeypatch.setattr(settings, "payment_mobile_redirect_base", redirect_base)

    gateway = PaymentGateway(base_url="http://payments.test")

    with pytest.raises(PaymentGatewayError) as exc_info:
        gateway.create_checkout_session(
            booking_id="booking-service",
            amount_cents=1200,
            currency="usd",
            customer_email="service@example.test",
            customer_name="Service User",
        )

    message = str(exc_info.value)
    assert "PAYMENT_MODE=service requires a valid mobile/frontend redirect base" in message
    assert "PAYMENT_MOBILE_REDIRECT_BASE" in message
    assert expected_message in message


def test_service_mode_succeeds_with_valid_return_urls(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "payment_mode", "service")
    monkeypatch.setattr(settings, "payment_service_base_url", "http://payments.test")
    monkeypatch.setattr(settings, "payment_mobile_redirect_base", "shoeinn://app")

    captured_payload: dict[str, object] = {}

    def _handler(request: httpx.Request) -> httpx.Response:
        captured_payload.update(json.loads(request.content.decode("utf-8")))
        return httpx.Response(
            200,
            json={
                "payment_id": "pay_123",
                "checkout_session_id": "cs_123",
                "checkout_url": "https://checkout.stripe.test/cs_123",
                "status": "pending",
            },
        )

    gateway = PaymentGateway(base_url="http://payments.test")
    gateway._client = lambda: httpx.Client(transport=httpx.MockTransport(_handler), base_url="http://payments.test")

    checkout = gateway.create_checkout_session(
        booking_id="booking-service",
        amount_cents=1200,
        currency="usd",
        customer_email="service@example.test",
        customer_name="Service Customer",
    )

    assert checkout.payment_id == "pay_123"
    assert checkout.checkout_session_id == "cs_123"
    assert checkout.checkout_url == "https://checkout.stripe.test/cs_123"
    assert captured_payload["customer_name"] == "Service Customer"

    success_url = str(captured_payload["success_url"])
    cancel_url = str(captured_payload["cancel_url"])
    success_parts = urlparse(success_url)
    cancel_parts = urlparse(cancel_url)
    assert success_parts.scheme == "shoeinn"
    assert success_parts.netloc == "app"
    assert success_parts.path == "/payment/success"
    assert cancel_parts.path == "/payment/cancel"
    assert "/payments/" not in success_url
    assert "/payments/" not in cancel_url

    success_query = parse_qs(success_parts.query)
    cancel_query = parse_qs(cancel_parts.query)
    assert success_query["booking_id"] == ["booking-service"]
    assert success_query["session_id"] == ["{CHECKOUT_SESSION_ID}"]
    assert cancel_query["booking_id"] == ["booking-service"]
    assert "session_id" not in cancel_query
