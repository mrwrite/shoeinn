from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import relationship

from app.core.db import Base


class NotificationEvent(Base):
    __tablename__ = "notification_events"

    id = Column(Uuid, primary_key=True, default=uuid4)
    notification_id = Column(Uuid, ForeignKey("notifications.id"), nullable=False, index=True)
    event_type = Column(String, nullable=False)
    payload_json = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    notification = relationship("Notification", back_populates="events")

