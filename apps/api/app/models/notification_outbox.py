from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import relationship

from app.core.db import Base


class NotificationOutbox(Base):
    __tablename__ = "notification_outbox"

    id = Column(Uuid, primary_key=True, default=uuid4)
    notification_id = Column(Uuid, ForeignKey("notifications.id"), nullable=False, index=True)
    status = Column(String, default="pending", nullable=False)
    channel = Column(String, nullable=False)
    target = Column(String)
    payload_json = Column(Text, nullable=False)
    available_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    locked_at = Column(DateTime(timezone=True))
    processed_at = Column(DateTime(timezone=True))
    dead_letter_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    notification = relationship("Notification", back_populates="outbox_entry")

