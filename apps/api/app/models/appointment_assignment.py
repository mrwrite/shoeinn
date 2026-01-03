from datetime import datetime, timezone
import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, text
from sqlalchemy.dialects.postgresql import UUID

from app.core.db import Base


class AppointmentAssignment(Base):
    __tablename__ = "appointment_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("company_users.user_id"), nullable=False
    )
    assigned_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    unassigned_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        Index(
            "ix_appointment_assignments_active",
            "appointment_id",
            unique=True,
            postgresql_where=text("is_active"),
            sqlite_where=text("is_active = 1"),
        ),
    )
