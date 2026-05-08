from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, CheckConstraint, DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from .database import Base


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    requires_action = "requires_action"
    succeeded = "succeeded"
    failed = "failed"
    refunded = "refunded"
    disputed = "disputed"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    amount_expected: Mapped[int] = mapped_column(Integer, nullable=False)
    amount_received: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    customer_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    stripe_checkout_session_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, unique=True)
    stripe_payment_intent_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, unique=True)
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.pending)
    last_stripe_event_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    outbox_events: Mapped[list[PaymentEventOutbox]] = relationship("PaymentEventOutbox", back_populates="payment")

    __table_args__ = (
        CheckConstraint("amount_expected >= 0", name="payments_amount_expected_positive"),
        CheckConstraint("amount_received IS NULL OR amount_received >= 0", name="payments_amount_received_positive"),
    )


class ProcessedStripeEvent(Base):
    __tablename__ = "processed_stripe_events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class PaymentCustomer(Base):
    __tablename__ = "payment_customers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    customer_email: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    stripe_customer_id: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "customer_email", name="uq_payment_customers_tenant_email"),
    )


class PaymentEventOutbox(Base):
    __tablename__ = "payment_events_outbox"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    payment_id: Mapped[str] = mapped_column(String, ForeignKey("payments.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    payload: Mapped[dict] = mapped_column(MutableDict.as_mutable(JSON), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    processed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    payment: Mapped[Payment] = relationship("Payment", back_populates="outbox_events")


__all__ = [
    "Payment",
    "PaymentCustomer",
    "PaymentStatus",
    "ProcessedStripeEvent",
    "PaymentEventOutbox",
]
