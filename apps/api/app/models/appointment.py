from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.core.db import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"))
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"))
    type = Column(String, nullable=False)
    address_line1 = Column(String)
    address_line2 = Column(String)
    city = Column(String)
    state = Column(String)
    postal_code = Column(String)
    start_time_utc = Column(DateTime(timezone=True), nullable=False)
    tz_offset_min = Column(Integer, nullable=False, default=0)
    status = Column(String, default="requested")
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("ix_appointments_start_time", "start_time_utc"),
        UniqueConstraint("company_id", "start_time_utc", name="uq_appointments_company_start_time"),
    )
