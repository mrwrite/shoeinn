from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..events import domain as events
from ..events.outbox import enqueue_event
from ..models import Payment, PaymentCustomer, PaymentEventOutbox, PaymentStatus, ProcessedStripeEvent


class PaymentService:
    """Domain logic for managing payment records and associated events."""

    def __init__(self, db: Session) -> None:
        self.db = db

    # Creation helpers -------------------------------------------------
    def get_or_create_payment(
        self,
        *,
        booking_id: str,
        tenant_id: str,
        amount_expected: int,
        currency: str,
        customer_email: Optional[str] = None,
        stripe_customer_id: Optional[str] = None,
        stripe_checkout_session_id: Optional[str] = None,
        stripe_payment_intent_id: Optional[str] = None,
    ) -> Payment:
        payment = self.db.scalar(select(Payment).where(Payment.booking_id == booking_id))
        if payment:
            return payment

        payment = Payment(
            booking_id=booking_id,
            tenant_id=tenant_id,
            amount_expected=amount_expected,
            currency=currency,
            customer_email=customer_email,
            stripe_customer_id=stripe_customer_id,
            stripe_checkout_session_id=stripe_checkout_session_id,
            stripe_payment_intent_id=stripe_payment_intent_id,
        )
        self.db.add(payment)
        self.db.flush()
        return payment

    def find_customer_by_email(self, *, tenant_id: str, customer_email: str) -> Optional[PaymentCustomer]:
        normalized_email = customer_email.strip().lower()
        return self.db.scalar(
            select(PaymentCustomer).where(
                PaymentCustomer.tenant_id == tenant_id,
                PaymentCustomer.customer_email == normalized_email,
            )
        )

    def upsert_customer_mapping(
        self,
        *,
        tenant_id: str,
        customer_email: str,
        stripe_customer_id: str,
        customer_name: Optional[str] = None,
    ) -> PaymentCustomer:
        normalized_email = customer_email.strip().lower()
        mapping = self.find_customer_by_email(tenant_id=tenant_id, customer_email=normalized_email)
        if mapping is None:
            mapping = PaymentCustomer(
                tenant_id=tenant_id,
                customer_email=normalized_email,
                customer_name=customer_name,
                stripe_customer_id=stripe_customer_id,
            )
            self.db.add(mapping)
            self.db.flush()
            return mapping

        mapping.stripe_customer_id = stripe_customer_id
        if customer_name:
            mapping.customer_name = customer_name
        return mapping

    def update_checkout_session(self, payment: Payment, *, checkout_session_id: str) -> Payment:
        payment.stripe_checkout_session_id = checkout_session_id
        return payment

    def update_customer(
        self,
        payment: Payment,
        *,
        customer_email: Optional[str] = None,
        stripe_customer_id: Optional[str] = None,
    ) -> Payment:
        if customer_email:
            payment.customer_email = customer_email.strip().lower()
        if stripe_customer_id:
            payment.stripe_customer_id = stripe_customer_id
        return payment

    def update_payment_intent(self, payment: Payment, *, payment_intent_id: str) -> Payment:
        payment.stripe_payment_intent_id = payment_intent_id
        return payment

    # Stripe event handling --------------------------------------------
    def has_processed_event(self, event_id: str) -> bool:
        return self.db.get(ProcessedStripeEvent, event_id) is not None

    def mark_event_processed(self, event_id: str) -> ProcessedStripeEvent:
        processed = ProcessedStripeEvent(id=event_id)
        self.db.add(processed)
        return processed

    def transition_payment(
        self,
        payment: Payment,
        *,
        status: PaymentStatus,
        event_cls: type[events.PaymentEvent],
        payload: Optional[dict] = None,
        amount_received: Optional[int] = None,
        stripe_event_id: Optional[str] = None,
    ) -> PaymentEventOutbox:
        payment.status = status
        if amount_received is not None:
            payment.amount_received = amount_received
        if stripe_event_id:
            payment.last_stripe_event_id = stripe_event_id

        payload = payload or {}
        payload.update(
            {
                "payment_id": payment.id,
                "booking_id": payment.booking_id,
                "tenant_id": payment.tenant_id,
                "status": payment.status.value,
                "amount_expected": payment.amount_expected,
                "amount_received": payment.amount_received,
            }
        )

        event = event_cls(
            payment_id=payment.id,
            booking_id=payment.booking_id,
            tenant_id=payment.tenant_id,
            payload=payload,
        )
        outbox_entry = enqueue_event(self.db, payment, event.event_type, event.payload)
        return outbox_entry

    def find_payment_by_checkout_session(self, session_id: str) -> Optional[Payment]:
        return self.db.scalar(
            select(Payment).where(Payment.stripe_checkout_session_id == session_id)
        )

    def find_payment_by_payment_intent(self, intent_id: str) -> Optional[Payment]:
        return self.db.scalar(select(Payment).where(Payment.stripe_payment_intent_id == intent_id))

    def trigger_compensating_action(self, payment: Payment, reason: str) -> None:
        """Placeholder for booking cancellation and other compensations."""

        payload = {
            "payment_id": payment.id,
            "booking_id": payment.booking_id,
            "tenant_id": payment.tenant_id,
            "reason": reason,
        }
        enqueue_event(self.db, payment, "CompensatingActionRequested", payload)
