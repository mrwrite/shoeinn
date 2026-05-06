from __future__ import annotations

import json
import time

import pytest
import stripe
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Payment, PaymentEventOutbox, PaymentStatus, ProcessedStripeEvent


@pytest.fixture(autouse=True)
def _clear_settings_cache() -> None:
    get_settings.cache_clear()
    get_settings()


def test_create_checkout_session(client: TestClient, db_session: Session) -> None:
    payload = {
        "booking_id": "booking-123",
        "amount": 5000,
        "currency": "usd",
        "success_url": "https://example.com/success",
        "cancel_url": "https://example.com/cancel",
        "customer_email": "guest@example.com",
    }

    response = client.post("/payments/checkout-session", json=payload)
    assert response.status_code == 201
    data = response.json()

    fake_stripe = client.app.state.fake_stripe
    assert data["checkout_session_id"] in fake_stripe.checkout_sessions

    payment = db_session.scalar(select(Payment).where(Payment.booking_id == payload["booking_id"]))
    assert payment is not None
    assert payment.amount_expected == payload["amount"]
    assert payment.currency == payload["currency"]
    assert payment.status == PaymentStatus.pending
    assert payment.stripe_checkout_session_id == data["checkout_session_id"]

    session_kwargs = fake_stripe.checkout_sessions[data["checkout_session_id"]]["kwargs"]
    assert session_kwargs["metadata"]["booking_id"] == payload["booking_id"]


def test_create_payment_intent(client: TestClient, db_session: Session) -> None:
    payload = {
        "booking_id": "booking-456",
        "amount": 7200,
        "currency": "usd",
        "customer_id": "cus_test_123",
    }

    response = client.post("/payments/payment-intent", json=payload)
    assert response.status_code == 201
    data = response.json()

    fake_stripe = client.app.state.fake_stripe
    assert data["payment_intent_id"] in fake_stripe.payment_intents

    payment = db_session.scalar(select(Payment).where(Payment.booking_id == payload["booking_id"]))
    assert payment is not None
    assert payment.stripe_payment_intent_id == data["payment_intent_id"]
    assert payment.amount_expected == payload["amount"]


def _post_webhook(client: TestClient, event: dict[str, object]) -> dict:
    payload = json.dumps(event)
    settings = get_settings()
    timestamp = int(time.time())
    signed_payload = f"{timestamp}.{payload}"
    signature = stripe.WebhookSignature._compute_signature(
        signed_payload, settings.stripe_webhook_secret
    )
    header = f"t={timestamp},v1={signature}"
    response = client.post(
        "/payments/webhooks/stripe",
        data=payload,
        headers={"Stripe-Signature": header, "Content-Type": "application/json"},
    )
    assert response.status_code == 200
    return response.json()


def test_webhook_transitions_payment_and_is_idempotent(client: TestClient, db_session: Session) -> None:
    payment = Payment(
        booking_id="booking-webhook",
        tenant_id="test-tenant",
        amount_expected=5000,
        currency="usd",
        stripe_payment_intent_id="pi_test_success",
    )
    db_session.add(payment)
    db_session.commit()

    event = {
        "id": "evt_success",
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": "pi_test_success",
                "amount_received": 5000,
            }
        },
    }

    result = _post_webhook(client, event)
    assert result["received"] is True

    db_session.refresh(payment)
    assert payment.status == PaymentStatus.succeeded
    assert payment.amount_received == 5000

    processed = db_session.get(ProcessedStripeEvent, "evt_success")
    assert processed is not None

    outbox_entries = db_session.scalars(select(PaymentEventOutbox).where(PaymentEventOutbox.payment_id == payment.id)).all()
    assert len(outbox_entries) == 1
    assert outbox_entries[0].event_type == "PaymentSucceeded"

    result = _post_webhook(client, event)
    assert result["received"] is True

    outbox_entries = db_session.scalars(select(PaymentEventOutbox).where(PaymentEventOutbox.payment_id == payment.id)).all()
    assert len(outbox_entries) == 1, "duplicate events should not be enqueued"


def test_refund_and_dispute_generate_compensation(client: TestClient, db_session: Session) -> None:
    payment = Payment(
        booking_id="booking-refund",
        tenant_id="test-tenant",
        amount_expected=4000,
        currency="usd",
        stripe_payment_intent_id="pi_test_refund",
    )
    db_session.add(payment)
    db_session.commit()

    refund_event = {
        "id": "evt_refund",
        "type": "charge.refunded",
        "data": {
            "object": {
                "id": "ch_test_refund",
                "payment_intent": "pi_test_refund",
                "amount_refunded": 4000,
            }
        },
    }

    dispute_event = {
        "id": "evt_dispute",
        "type": "charge.dispute.created",
        "data": {
            "object": {
                "id": "dp_test",
                "payment_intent": "pi_test_refund",
            }
        },
    }

    _post_webhook(client, refund_event)
    db_session.refresh(payment)
    assert payment.status == PaymentStatus.refunded

    outbox_entries = db_session.scalars(select(PaymentEventOutbox).where(PaymentEventOutbox.payment_id == payment.id)).all()
    event_types = [entry.event_type for entry in outbox_entries]
    assert "PaymentRefunded" in event_types
    assert "CompensatingActionRequested" in event_types

    _post_webhook(client, dispute_event)
    db_session.refresh(payment)
    assert payment.status == PaymentStatus.disputed

    outbox_entries = db_session.scalars(select(PaymentEventOutbox).where(PaymentEventOutbox.payment_id == payment.id)).all()
    event_types = [entry.event_type for entry in outbox_entries]
    assert "PaymentDisputed" in event_types
