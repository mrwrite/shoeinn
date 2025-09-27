from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import PaymentEventOutbox, Payment


def enqueue_event(db: Session, payment: Payment, event_type: str, payload: dict) -> PaymentEventOutbox:
    """Persist an event into the outbox for asynchronous processing."""

    outbox = PaymentEventOutbox(payment_id=payment.id, event_type=event_type, payload=payload)
    db.add(outbox)
    return outbox
