from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

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


def get_payment_service(db: Session = Depends(get_db)) -> PaymentService:
    return PaymentService(db)


def get_stripe_client() -> StripeClient:
    return StripeClient()


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
    )

    session = stripe_client.create_checkout_session(
        mode="payment",
        line_items=[
            {
                "price_data": {
                    "currency": request.currency,
                    "unit_amount": request.amount,
                    "product_data": {"name": f"Booking {request.booking_id}"},
                },
                "quantity": 1,
            }
        ],
        metadata={
            "booking_id": request.booking_id,
        },
        success_url=request.success_url,
        cancel_url=request.cancel_url,
        customer_email=request.customer_email,
    )

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
async def get_payment(booking_id: str, service: PaymentService = Depends(get_payment_service)) -> PaymentRecord:
    payment = service.db.scalar(select(Payment).where(Payment.booking_id == booking_id))
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
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
            payment_service.transition_payment(
                payment,
                status=PaymentStatus.succeeded,
                event_cls=events.PaymentSucceeded,
                amount_received=data_object.get("amount_total"),
                stripe_event_id=event.id,
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

    payment_service.mark_event_processed(event.id)
    db.commit()

    return WebhookResponse(received=True)
