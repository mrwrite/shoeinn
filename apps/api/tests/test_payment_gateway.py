from __future__ import annotations

import json

import httpx
import pytest

from app.core.config import settings
from app.services.payment_gateway import PaymentGateway, PaymentGatewayError


def test_mock_mode_allows_checkout_without_real_return_urls(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "payment_mode", "mock")
    monkeypatch.setattr(settings, "payment_service_base_url", None)
    monkeypatch.setattr(settings, "payment_checkout_success_url", "")
    monkeypatch.setattr(settings, "payment_checkout_cancel_url", "")

    gateway = PaymentGateway()

    checkout = gateway.create_checkout_session(
        booking_id="booking-mock",
        amount_cents=1200,
        currency="usd",
        customer_email="demo@example.test",
    )

    assert checkout.status == "succeeded"
    assert checkout.checkout_url is None


@pytest.mark.parametrize(
    ("success_url", "cancel_url", "expected_message"),
    [
        ("", "", "is missing"),
        ("https://example.com/payment/success", "https://example.com/payment/cancel", "is still placeholder"),
    ],
)
def test_service_mode_requires_real_return_urls(
    monkeypatch: pytest.MonkeyPatch,
    success_url: str,
    cancel_url: str,
    expected_message: str,
) -> None:
    monkeypatch.setattr(settings, "payment_mode", "service")
    monkeypatch.setattr(settings, "payment_service_base_url", "http://payments.test")
    monkeypatch.setattr(settings, "payment_checkout_success_url", success_url)
    monkeypatch.setattr(settings, "payment_checkout_cancel_url", cancel_url)

    gateway = PaymentGateway(base_url="http://payments.test")

    with pytest.raises(PaymentGatewayError) as exc_info:
        gateway.create_checkout_session(
            booking_id="booking-service",
            amount_cents=1200,
            currency="usd",
            customer_email="service@example.test",
        )

    message = str(exc_info.value)
    assert "PAYMENT_MODE=service requires valid checkout return URLs" in message
    assert "PAYMENT_CHECKOUT_SUCCESS_URL" in message
    assert "PAYMENT_CHECKOUT_CANCEL_URL" in message
    assert expected_message in message


def test_service_mode_succeeds_with_valid_return_urls(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "payment_mode", "service")
    monkeypatch.setattr(settings, "payment_service_base_url", "http://payments.test")
    monkeypatch.setattr(settings, "payment_checkout_success_url", "http://127.0.0.1:8000/payment/return/success")
    monkeypatch.setattr(settings, "payment_checkout_cancel_url", "http://127.0.0.1:8000/payment/return/cancel")

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
    )

    assert checkout.payment_id == "pay_123"
    assert checkout.checkout_session_id == "cs_123"
    assert checkout.checkout_url == "https://checkout.stripe.test/cs_123"
    assert captured_payload["success_url"] == "http://127.0.0.1:8000/payment/return/success"
    assert captured_payload["cancel_url"] == "http://127.0.0.1:8000/payment/return/cancel"
