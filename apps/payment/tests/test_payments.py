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
    assert payment.customer_email == payload["customer_email"]
    assert payment.stripe_customer_id is not None

    session_kwargs = fake_stripe.checkout_sessions[data["checkout_session_id"]]["kwargs"]
    assert session_kwargs["metadata"]["booking_id"] == payload["booking_id"]
    assert session_kwargs["success_url"] == payload["success_url"]
    assert session_kwargs["cancel_url"] == payload["cancel_url"]
    assert session_kwargs["customer"] == payment.stripe_customer_id
    assert "customer_email" not in session_kwargs
    assert session_kwargs["saved_payment_method_options"]["payment_method_save"] == "enabled"


def test_create_checkout_session_reuses_existing_stripe_customer(client: TestClient, db_session: Session) -> None:
    first_response = client.post(
        "/payments/checkout-session",
        json={
            "booking_id": "booking-original",
            "amount": 5000,
            "currency": "usd",
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel",
            "customer_email": "repeat@example.com",
            "customer_name": "Repeat Customer",
        },
    )
    assert first_response.status_code == 201

    fake_stripe = client.app.state.fake_stripe
    created_customer_count = len(fake_stripe.customers)
    first_payment = db_session.scalar(select(Payment).where(Payment.booking_id == "booking-original"))
    assert first_payment is not None

    response = client.post(
        "/payments/checkout-session",
        json={
            "booking_id": "booking-repeat",
            "amount": 7200,
            "currency": "usd",
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel",
            "customer_email": "repeat@example.com",
            "customer_name": "Repeat Customer",
        },
    )
    assert response.status_code == 201

    second_payment = db_session.scalar(select(Payment).where(Payment.booking_id == "booking-repeat"))
    assert second_payment is not None
    assert second_payment.stripe_customer_id == first_payment.stripe_customer_id
    assert len(fake_stripe.customers) == created_customer_count

    session_kwargs = fake_stripe.checkout_sessions[response.json()["checkout_session_id"]]["kwargs"]
    assert session_kwargs["customer"] == second_payment.stripe_customer_id


def test_get_payment_reconciles_paid_checkout_session(client: TestClient, db_session: Session) -> None:
    payment = Payment(
        booking_id="booking-checkout-paid",
        tenant_id="test-tenant",
        amount_expected=5000,
        currency="usd",
        stripe_checkout_session_id="cs_paid",
    )
    db_session.add(payment)
    db_session.commit()

    fake_stripe = client.app.state.fake_stripe
    fake_stripe.checkout_sessions["cs_paid"] = {
        "id": "cs_paid",
        "status": "complete",
        "payment_status": "paid",
        "amount_total": 5000,
        "payment_intent": "pi_paid",
    }

    response = client.get("/payments/booking-checkout-paid")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "succeeded"
    assert body["amount_received"] == 5000
    assert body["stripe_checkout_session_id"] == "cs_paid"
    assert body["stripe_payment_intent_id"] == "pi_paid"

    db_session.refresh(payment)
    assert payment.status == PaymentStatus.succeeded
    assert payment.amount_received == 5000
    assert payment.stripe_payment_intent_id == "pi_paid"


def test_get_payment_keeps_open_unpaid_checkout_session_pending(client: TestClient, db_session: Session) -> None:
    payment = Payment(
        booking_id="booking-checkout-open",
        tenant_id="test-tenant",
        amount_expected=5000,
        currency="usd",
        stripe_checkout_session_id="cs_open",
    )
    db_session.add(payment)
    db_session.commit()

    fake_stripe = client.app.state.fake_stripe
    fake_stripe.checkout_sessions["cs_open"] = {
        "id": "cs_open",
        "status": "open",
        "payment_status": "unpaid",
        "amount_total": 5000,
        "payment_intent": None,
    }

    response = client.get("/payments/booking-checkout-open")
    assert response.status_code == 200
    assert response.json()["status"] == "pending"

    db_session.refresh(payment)
    assert payment.status == PaymentStatus.pending


def test_get_payment_maps_completed_unpaid_checkout_session_to_requires_action(
    client: TestClient,
    db_session: Session,
) -> None:
    payment = Payment(
        booking_id="booking-checkout-requires-action",
        tenant_id="test-tenant",
        amount_expected=5000,
        currency="usd",
        stripe_checkout_session_id="cs_requires_action",
    )
    db_session.add(payment)
    db_session.commit()

    fake_stripe = client.app.state.fake_stripe
    fake_stripe.checkout_sessions["cs_requires_action"] = {
        "id": "cs_requires_action",
        "status": "complete",
        "payment_status": "unpaid",
        "amount_total": 5000,
        "payment_intent": None,
    }

    response = client.get("/payments/booking-checkout-requires-action")
    assert response.status_code == 200
    assert response.json()["status"] == "requires_action"

    db_session.refresh(payment)
    assert payment.status == PaymentStatus.requires_action


def test_get_payment_marks_expired_checkout_session_failed(client: TestClient, db_session: Session) -> None:
    payment = Payment(
        booking_id="booking-checkout-expired",
        tenant_id="test-tenant",
        amount_expected=5000,
        currency="usd",
        stripe_checkout_session_id="cs_expired",
    )
    db_session.add(payment)
    db_session.commit()

    fake_stripe = client.app.state.fake_stripe
    fake_stripe.checkout_sessions["cs_expired"] = {
        "id": "cs_expired",
        "status": "expired",
        "payment_status": "unpaid",
        "amount_total": 5000,
        "payment_intent": None,
    }

    response = client.get("/payments/booking-checkout-expired")
    assert response.status_code == 200
    assert response.json()["status"] == "failed"

    db_session.refresh(payment)
    assert payment.status == PaymentStatus.failed


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


def test_checkout_session_completed_webhook_uses_paid_mapping(client: TestClient, db_session: Session) -> None:
    payment = Payment(
        booking_id="booking-session-webhook",
        tenant_id="test-tenant",
        amount_expected=5000,
        currency="usd",
        stripe_checkout_session_id="cs_webhook_paid",
    )
    db_session.add(payment)
    db_session.commit()

    event = {
        "id": "evt_checkout_completed",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_webhook_paid",
                "status": "complete",
                "payment_status": "paid",
                "amount_total": 5000,
                "payment_intent": "pi_checkout_paid",
            }
        },
    }

    _post_webhook(client, event)
    db_session.refresh(payment)
    assert payment.status == PaymentStatus.succeeded
    assert payment.amount_received == 5000
    assert payment.stripe_payment_intent_id == "pi_checkout_paid"


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
