import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from app.core.db import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    service_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("services.id"), nullable=False)
    type = sa.Column(sa.String, nullable=False)
    address_line1 = sa.Column(sa.String, nullable=False)
    address_line2 = sa.Column(sa.String)
    city = sa.Column(sa.String, nullable=False)
    state = sa.Column(sa.String, nullable=False)
    postal_code = sa.Column(sa.String, nullable=False)
    start_time_utc = sa.Column(sa.DateTime(timezone=True), nullable=False)
    tz_offset_min = sa.Column(sa.Integer, nullable=False)
    status = sa.Column(sa.String, default="requested", nullable=False)
    notes = sa.Column(sa.Text)
    customer_name = sa.Column(sa.String)
    customer_email = sa.Column(sa.String)
    customer_phone = sa.Column(sa.String)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)

    __table_args__ = (sa.Index("ix_appointments_start_time_utc", "start_time_utc"),)
