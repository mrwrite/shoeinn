from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, Uuid, Index

from app.core.db import Base


class AppointmentHold(Base):
    __tablename__ = "appointment_holds"

    id = Column(Uuid, primary_key=True, default=uuid4)
    customer_id = Column(String, ForeignKey("users.id"), nullable=False)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    service_id = Column(String, ForeignKey("services.id"), nullable=True)
    start_time_utc = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    version = Column(Integer, nullable=False, default=0)
    active = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "service_id",
            "start_time_utc",
            name="uq_appointment_holds_company_service_time",
        ),
        Index("ix_appointment_holds_expires", "expires_at"),
    )

    def mark_consumed(self) -> None:
        self.active = False
        self.expires_at = datetime.now(timezone.utc)
        self.version += 1
