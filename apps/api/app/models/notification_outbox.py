"""Notification outbox model used for async delivery."""

from __future__ import annotations

from datetime import datetime, timezone
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.db import Base
from app.models._types import JSONBType


class NotificationOutbox(Base):
    """Stores pending notifications for later dispatch."""

    __tablename__ = "notification_outbox"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    notification_id = Column(UUID(as_uuid=True), ForeignKey("notifications.id"), nullable=True)
    status = Column(String, default="pending", nullable=False)
    channel = Column(String, nullable=False)
    target = Column(String, nullable=False)
    payload_json = Column(JSONBType, nullable=False)
    available_at = Column(DateTime(timezone=True), nullable=False)
    kind = Column(String(64), nullable=False)
    locked_at = Column(DateTime(timezone=True))
    processed_at = Column(DateTime(timezone=True))
    dead_letter_reason = Column(Text)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    notification = relationship(
        "Notification",
        back_populates="outbox_entry",
    )

