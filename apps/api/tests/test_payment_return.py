from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings


def test_payment_return_success_page_includes_app_link(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "payment_mobile_redirect_base", "shoeinn://app")

    response = client.get("/payment/return/success?booking_id=booking-123&session_id=cs_123")
    assert response.status_code == 200
    body = response.text
    assert "Payment received" in body
    assert "shoeinn://app/payment/success?booking_id=booking-123&session_id=cs_123" in body
    assert "Open ShoeInn" in body


def test_payment_return_cancel_page_without_app_link_shows_manual_fallback(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "payment_mobile_redirect_base", "")

    response = client.get("/payment/return/cancel?booking_id=booking-456&session_id=cs_456")
    assert response.status_code == 200
    body = response.text
    assert "Checkout canceled" in body
    assert "Return to ShoeInn manually" in body
    assert "Open ShoeInn" not in body
