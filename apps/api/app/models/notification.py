from datetime import datetime
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.db import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=False)
    kind = Column(String, nullable=False)
    channel = Column(String, default="email", nullable=False)
    target = Column(String)
    payload_json = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    read_at = Column(DateTime(timezone=True))

    # Delivery lifecycle metadata
    status = Column(String, default="pending", nullable=False)
    delivered = Column(Boolean, default=False, nullable=False)
    delivered_at = Column(DateTime(timezone=True))
    provider_message_id = Column(String)
    delivery_attempts = Column(Integer, default=0, nullable=False)
    last_attempt_at = Column(DateTime(timezone=True))
    next_attempt_at = Column(DateTime(timezone=True))
    last_error_code = Column(String)
    last_error_message = Column(Text)
    last_error_at = Column(DateTime(timezone=True))
    dead_lettered = Column(Boolean, default=False, nullable=False)
    metadata_json = Column(Text)

    """ outbox_entry = relationship(
        "NotificationOutbox",
        back_populates="notification",
        uselist=False,
        cascade="all, delete-orphan",
    ) """
    events = relationship(
        "NotificationEvent",
        back_populates="notification",
        cascade="all, delete-orphan",
        order_by="NotificationEvent.created_at",
    )
    outbox_entry = relationship(
        "NotificationOutbox",
        back_populates="notification",
        uselist=False,
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_notifications_company_status", "company_id", "status"),
    )
