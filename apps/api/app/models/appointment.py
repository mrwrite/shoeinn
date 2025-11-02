"""Appointment model."""

from __future__ import annotations

from datetime import datetime, timezone
import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID

from app.core.db import Base


class AppointmentStatus(str, enum.Enum):
    """Lifecycle state for an appointment."""

    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, enum.Enum):
    """Shadow of the payment service status values."""

    PENDING = "pending"
    REQUIRES_ACTION = "requires_action"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"
    DISPUTED = "disputed"


class Appointment(Base):
    """Represents a confirmed customer booking."""

    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False)
    hold_id = Column(UUID(as_uuid=True), ForeignKey("appointment_holds.id"), nullable=True, unique=True)
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(50), nullable=False)
    customer_email = Column(String(255), nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(
        Enum(AppointmentStatus, name="appointmentstatus"),
        nullable=False,
        default=AppointmentStatus.CONFIRMED,
    )
    payment_id = Column(String(64), nullable=True, unique=True)
    payment_status = Column(
        Enum(PaymentStatus, name="appointmentpaymentstatus"),
        nullable=True,
    )
    payment_checkout_url = Column(String(2048), nullable=True)
    payment_amount_expected = Column(Integer, nullable=True)
    payment_amount_received = Column(Integer, nullable=True)
    payment_currency = Column(String(3), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
