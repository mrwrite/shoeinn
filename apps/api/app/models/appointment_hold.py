"""Appointment hold model."""

from __future__ import annotations

from datetime import datetime, timezone
import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID

from app.core.db import Base


class HoldStatus(str, enum.Enum):
    """Lifecycle state for an appointment hold."""

    PENDING = "PENDING"
    EXPIRED = "EXPIRED"
    CONFIRMED = "CONFIRMED"


class AppointmentHold(Base):
    """Represents a temporary reservation for an appointment slot."""

    __tablename__ = "appointment_holds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False)
    customer_name = Column(String(255), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    customer_email = Column(String(255), nullable=True)
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    ttl_expires_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(HoldStatus, name="holdstatus"), nullable=False, default=HoldStatus.PENDING)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
