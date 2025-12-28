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

    REQUESTED = "requested"
    CONFIRMED = "confirmed"
    PICKED_UP = "picked_up"
    CLEANING = "cleaning"
    READY = "ready"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


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
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False)
    hold_id = Column(UUID(as_uuid=True), ForeignKey("appointment_holds.id"), nullable=True, unique=True)
    type = Column(String(50), nullable=False, default="pickup")
    status = Column(
        Enum(AppointmentStatus, name="appointmentstatus", native_enum=True),
        nullable=False,
        default=AppointmentStatus.REQUESTED,
    )
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(50), nullable=False)
    customer_email = Column(String(255), nullable=True)
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    confirmed_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    payment_id = Column(String(64), nullable=True, unique=True)
    payment_status = Column(
        Enum(PaymentStatus, name="appointmentpaymentstatus", native_enum=True),
        nullable=True,
    )
    payment_checkout_url = Column(String(2048), nullable=True)
    payment_amount_expected = Column(Integer, nullable=True)
    payment_amount_received = Column(Integer, nullable=True)
    payment_currency = Column(String(3), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
