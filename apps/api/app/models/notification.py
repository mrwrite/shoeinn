from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text, Index

from app.core.db import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    appointment_id = Column(String, ForeignKey("appointments.id"), nullable=False)
    kind = Column(String, nullable=False)
    delivered = Column(Boolean, default=False)
    channel = Column(String, default="in_app")
    payload_json = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("ix_notifications_company_delivered", "company_id", "delivered"),
    )
