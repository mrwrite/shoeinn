from datetime import datetime, timezone
import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID

from app.core.db import Base


class AppointmentLocationUpdate(Base):
    __tablename__ = "appointment_location_updates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=False)
    company_user_id = Column(UUID(as_uuid=True), ForeignKey("company_users.user_id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    heading = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    recorded_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_location_updates_appt_time", "appointment_id", recorded_at.desc()),
    )
