from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, UniqueConstraint, Uuid, Index
from sqlalchemy.dialects.postgresql import UUID
from app.core.db import Base


class AvailableSlot(Base):
    __tablename__ = "available_slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=True)
    start_time_utc = Column(DateTime(timezone=True), nullable=False)
    is_available = Column(Boolean, nullable=False, default=True)
    last_booked_at = Column(DateTime(timezone=True))

    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "service_id",
            "start_time_utc",
            name="uq_available_slots_company_service_time",
        ),
        Index("ix_available_slots_company_time", "company_id", "start_time_utc"),
    )

    def mark_booked(self, when: datetime) -> None:
        self.is_available = False
        self.last_booked_at = when


