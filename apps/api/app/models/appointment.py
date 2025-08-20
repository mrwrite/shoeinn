from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Index, Uuid

from app.core.db import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Uuid, primary_key=True, default=uuid4)
    customer_id = Column(String, ForeignKey("users.id"), nullable=False)
    company_id = Column(String, ForeignKey("companies.id"))
    service_id = Column(String, ForeignKey("services.id"))
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
    )
