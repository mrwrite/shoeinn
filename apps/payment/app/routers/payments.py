from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
import httpx
from sqlalchemy.orm import Session
import stripe

from ..config import get_settings
from ..database import get_db
from sqlalchemy import select

from ..events import domain as events
from ..models import Payment, PaymentStatus
from ..schemas import (
    CreateCheckoutSessionRequest,
    CreateCheckoutSessionResponse,
    CreatePaymentIntentRequest,
    CreatePaymentIntentResponse,
    PaymentRecord,
    WebhookResponse,
)
from ..services.payments import PaymentService
from ..stripe_client import StripeClient

router = APIRouter(prefix="/payments", tags=["payments"])
logger = logging.getLogger(__name__)


def get_payment_service(db: Session = Depends(get_db)) -> PaymentService:
    return PaymentService(db)


def get_stripe_client() -> StripeClient:
    return StripeClient()


def _normalize_email(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip().lower()
    return cleaned or None


def _extract_stripe_id(value: Any) -> str | None:
    if isinstance(value, str):
        cleaned = value.strip()
        return cleaned or None
    if isinstance(value, dict):
        return _extract_stripe_id(value.get("id"))
    candidate = getattr(value, "id", None)
    if isinstance(candidate, str):
        cleaned = candidate.strip()
        return cleaned or None
    return None


def _stripe_value(obj: Any, key: str, default: Any = None) -> Any:
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _map_payment_intent_status(intent: Any) -> tuple[PaymentStatus, int | None]:
    raw_status = str(_stripe_value(intent, "status", "") or "").strip().lower()
    amount_received = _stripe_value(intent, "amount_received")

    if raw_status == "succeeded":
        return PaymentStatus.succeeded, amount_received
    if raw_status in {"requires_action", "requires_confirmation", "processing", "requires_capture"}:
        return PaymentStatus.requires_action, amount_received
    if raw_status in {"requires_payment_method", "requires_source", "requires_source_action"}:
        return PaymentStatus.pending, amount_received
    if raw_status in {"canceled", "cancelled"}:
        return PaymentStatus.failed, amount_received
    return PaymentStatus.pending, amount_received


def _map_checkout_session_status(session: Any) -> tuple[PaymentStatus, int | None]:
    raw_session_status = str(_stripe_value(session, "status", "") or "").strip().lower()
    raw_payment_status = str(_stripe_value(session, "payment_status", "") or "").strip().lower()
    amount_total = _stripe_value(session, "amount_total")

    if raw_payment_status in {"paid", "no_payment_required"}:
        return PaymentStatus.succeeded, amount_total
    if raw_session_status == "expired":
        return PaymentStatus.failed, None
    if raw_session_status == "complete":
        return PaymentStatus.requires_action, None
    return PaymentStatus.pending, None


def _apply_reconciled_status(
    payment_service: PaymentService,
    payment: Payment,
    *,
    status: PaymentStatus,
    amount_received: int | None,
    stripe_event_id: str | None = None,
) -> None:
    if status == PaymentStatus.succeeded:
        if payment.status == PaymentStatus.succeeded and payment.amount_received == amount_received:
            if stripe_event_id:
                payment.last_stripe_event_id = stripe_event_id
            return
        payment_service.transition_payment(
            payment,
            status=PaymentStatus.succeeded,
            event_cls=events.PaymentSucceeded,
            amount_received=amount_received,
            stripe_event_id=stripe_event_id,
        )
        _notify_booking_service(payment)
        return
    if status == PaymentStatus.failed:
        if payment.status == PaymentStatus.failed and payment.amount_received == amount_received:
            if stripe_event_id:
                payment.last_stripe_event_id = stripe_event_id
            return
        payment_service.transition_payment(
            payment,
            status=PaymentStatus.failed,
            event_cls=events.PaymentFailed,
            amount_received=amount_received,
            stripe_event_id=stripe_event_id,
        )
        _notify_booking_service(payment)
        return

    payment.status = status
    payment.amount_received = amount_received
    if stripe_event_id:
        payment.last_stripe_event_id = stripe_event_id


def _reconcile_payment_with_stripe(
    payment_service: PaymentService,
    payment: Payment,
    stripe_client: StripeClient,
    *,
    event_id: str | None = None,
    checkout_session: Any | None = None,
) -> Payment:
    if checkout_session is None and payment.stripe_checkout_session_id:
        checkout_session = stripe_client.retrieve_checkout_session(
            payment.stripe_checkout_session_id,
            expand=["payment_intent"],
        )

    if checkout_session is not None:
        payment_intent_id = _extract_stripe_id(_stripe_value(checkout_session, "payment_intent"))
        if payment_intent_id:
            payment_service.update_payment_intent(payment, payment_intent_id=payment_intent_id)
        stripe_customer_id = _extract_stripe_id(_stripe_value(checkout_session, "customer"))
        if stripe_customer_id:
            payment_service.update_customer(payment, stripe_customer_id=stripe_customer_id)
            if payment.customer_email:
                payment_service.upsert_customer_mapping(
                    tenant_id=payment.tenant_id,
                    customer_email=payment.customer_email,
                    stripe_customer_id=stripe_customer_id,
                )
        status_value, amount_received = _map_checkout_session_status(checkout_session)
        _apply_reconciled_status(
            payment_service,
            payment,
            status=status_value,
            amount_received=amount_received,
            stripe_event_id=event_id,
        )
        return payment

    if payment.stripe_payment_intent_id:
        intent = stripe_client.retrieve_payment_intent(payment.stripe_payment_intent_id)
        status_value, amount_received = _map_payment_intent_status(intent)
        _apply_reconciled_status(
            payment_service,
            payment,
            status=status_value,
            amount_received=amount_received,
            stripe_event_id=event_id,
        )
    return payment


def _notify_booking_service(payment: Payment) -> None:
    settings = get_settings()
    if not settings.booking_api_webhook_url:
        return

    headers: dict[str, str] = {}
    if settings.booking_api_webhook_secret:
        headers["X-Payment-Webhook-Secret"] = settings.booking_api_webhook_secret

    payload = {
        "booking_id": payment.booking_id,
        "status": payment.status.value,
        "amount_expected": payment.amount_expected,
        "amount_received": payment.amount_received,
        "currency": payment.currency,
    }
    try:
        with httpx.Client(timeout=5.0) as client:
            client.post(settings.booking_api_webhook_url, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        logger.warning("Booking API payment webhook callback failed: %s", exc)


def _resolve_stripe_customer(
    payment_service: PaymentService,
    stripe_client: StripeClient,
    *,
    tenant_id: str,
    customer_email: str | None,
    customer_name: str | None,
) -> str | None:
    normalized_email = _normalize_email(customer_email)
    if not normalized_email:
        return None

    mapping = payment_service.find_customer_by_email(tenant_id=tenant_id, customer_email=normalized_email)
    if mapping:
        return mapping.stripe_customer_id

    stripe_customer = stripe_client.create_customer(
        email=normalized_email,
        name=customer_name,
        metadata={"tenant_id": tenant_id},
    )
    payment_service.upsert_customer_mapping(
        tenant_id=tenant_id,
        customer_email=normalized_email,
        stripe_customer_id=stripe_customer.id,
        customer_name=customer_name,
    )
    return stripe_customer.id


@router.post("/checkout-session", response_model=CreateCheckoutSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    db: Session = Depends(get_db),
    stripe_client: StripeClient = Depends(get_stripe_client),
) -> CreateCheckoutSessionResponse:
    settings = get_settings()
    payment_service = PaymentService(db)

    payment = payment_service.get_or_create_payment(
        booking_id=request.booking_id,
        tenant_id=settings.tenant_id,
        amount_expected=request.amount,
        currency=request.currency or settings.default_currency,
        customer_email=_normalize_email(request.customer_email),
    )
    stripe_customer_id = payment.stripe_customer_id or _resolve_stripe_customer(
        payment_service,
        stripe_client,
        tenant_id=settings.tenant_id,
        customer_email=request.customer_email,
        customer_name=request.customer_name,
    )
    payment_service.update_customer(
        payment,
        customer_email=request.customer_email,
        stripe_customer_id=stripe_customer_id,
    )

    session_kwargs: dict[str, Any] = {
        "mode": "payment",
        "line_items": [
            {
                "price_data": {
                    "currency": request.currency,
                    "unit_amount": request.amount,
                    "product_data": {"name": f"Booking {request.booking_id}"},
                },
                "quantity": 1,
            }
        ],
        "metadata": {
            "booking_id": request.booking_id,
        },
        "success_url": request.success_url,
        "cancel_url": request.cancel_url,
    }
    if stripe_customer_id:
        session_kwargs["customer"] = stripe_customer_id
        session_kwargs["customer_update"] = {"name": "auto", "address": "auto"}
        session_kwargs["saved_payment_method_options"] = {
            "payment_method_save": "enabled",
            "allow_redisplay_filters": ["always", "limited", "unspecified"],
        }
    elif request.customer_email:
        session_kwargs["customer_email"] = request.customer_email

    logger.info(
        "Creating Stripe Checkout Session for booking %s: success_url=%s cancel_url=%s has_customer=%s",
        request.booking_id,
        session_kwargs["success_url"],
        session_kwargs["cancel_url"],
        bool(session_kwargs.get("customer")),
    )

    session = stripe_client.create_checkout_session(**session_kwargs)

    payment_service.update_checkout_session(payment, checkout_session_id=session.id)
    db.commit()

    return CreateCheckoutSessionResponse(
        checkout_session_id=session.id,
        checkout_url=session.url,
        payment_id=payment.id,
        status=payment.status,
    )


@router.post("/payment-intent", response_model=CreatePaymentIntentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_intent(
    request: CreatePaymentIntentRequest,
    db: Session = Depends(get_db),
    stripe_client: StripeClient = Depends(get_stripe_client),
) -> CreatePaymentIntentResponse:
    settings = get_settings()
    payment_service = PaymentService(db)

    payment = payment_service.get_or_create_payment(
        booking_id=request.booking_id,
        tenant_id=settings.tenant_id,
        amount_expected=request.amount,
        currency=request.currency or settings.default_currency,
    )

    intent = stripe_client.create_payment_intent(
        amount=request.amount,
        currency=request.currency,
        payment_method_types=request.payment_method_types,
        metadata={"booking_id": request.booking_id},
        customer=request.customer_id,
    )

    payment_service.update_payment_intent(payment, payment_intent_id=intent.id)
    db.commit()

    return CreatePaymentIntentResponse(
        payment_intent_id=intent.id,
        client_secret=intent.client_secret,
        payment_id=payment.id,
        status=payment.status,
    )


@router.get("/{booking_id}", response_model=PaymentRecord)
async def get_payment(
    booking_id: str,
    service: PaymentService = Depends(get_payment_service),
    stripe_client: StripeClient = Depends(get_stripe_client),
) -> PaymentRecord:
    payment = service.db.scalar(select(Payment).where(Payment.booking_id == booking_id))
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    try:
        _reconcile_payment_with_stripe(service, payment, stripe_client)
    except stripe.StripeError as exc:
        logger.warning("Stripe payment reconciliation failed for %s: %s", booking_id, exc)
    service.db.commit()
    service.db.refresh(payment)
    return PaymentRecord.model_validate(payment)


@router.post("/webhooks/stripe", response_model=WebhookResponse)
async def handle_stripe_webhook(
    request: Request,
    stripe_signature: str = Header(..., alias="Stripe-Signature"),
    db: Session = Depends(get_db),
    stripe_client: StripeClient = Depends(get_stripe_client),
) -> WebhookResponse:
    payload = await request.body()
    try:
        event = stripe_client.verify_signature(payload.decode(), stripe_signature)
    except Exception as exc:  # pragma: no cover - delegated to stripe SDK
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    payment_service = PaymentService(db)

    if payment_service.has_processed_event(event.id):
        return WebhookResponse(received=True)

    event_type = event["type"]
    data_object: dict[str, Any] = event["data"]["object"]

    if event_type == "checkout.session.completed":
        payment = payment_service.find_payment_by_checkout_session(data_object["id"])
        if payment:
            _reconcile_payment_with_stripe(
                payment_service,
                payment,
                stripe_client,
                event_id=event.id,
                checkout_session=data_object,
            )
    elif event_type == "checkout.session.expired":
        payment = payment_service.find_payment_by_checkout_session(data_object["id"])
        if payment:
            _reconcile_payment_with_stripe(
                payment_service,
                payment,
                stripe_client,
                event_id=event.id,
                checkout_session=data_object,
            )
    elif event_type == "payment_intent.succeeded":
        payment = payment_service.find_payment_by_payment_intent(data_object["id"])
        if payment:
            payment_service.transition_payment(
                payment,
                status=PaymentStatus.succeeded,
                event_cls=events.PaymentSucceeded,
                amount_received=data_object.get("amount_received"),
                stripe_event_id=event.id,
            )
            _notify_booking_service(payment)
    elif event_type == "payment_intent.payment_failed":
        payment = payment_service.find_payment_by_payment_intent(data_object["id"])
        if payment:
            payment_service.transition_payment(
                payment,
                status=PaymentStatus.failed,
                event_cls=events.PaymentFailed,
                stripe_event_id=event.id,
                payload={"failure_code": data_object.get("last_payment_error", {}).get("code")},
            )
            _notify_booking_service(payment)
    elif event_type == "charge.refunded":
        payment = payment_service.find_payment_by_payment_intent(data_object.get("payment_intent"))
        if payment:
            payment_service.transition_payment(
                payment,
                status=PaymentStatus.refunded,
                event_cls=events.PaymentRefunded,
                amount_received=data_object.get("amount_refunded"),
                stripe_event_id=event.id,
            )
            payment_service.trigger_compensating_action(payment, reason="refund")
            _notify_booking_service(payment)
    elif event_type == "charge.dispute.created":
        payment = payment_service.find_payment_by_payment_intent(data_object.get("payment_intent"))
        if payment:
            payment_service.transition_payment(
                payment,
                status=PaymentStatus.disputed,
                event_cls=events.PaymentDisputed,
                stripe_event_id=event.id,
                payload={"dispute_id": data_object.get("id")},
            )
            payment_service.trigger_compensating_action(payment, reason="dispute")
            _notify_booking_service(payment)

    payment_service.mark_event_processed(event.id)
    db.commit()

    return WebhookResponse(received=True)
