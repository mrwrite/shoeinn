"""Service model definition."""

from __future__ import annotations

from datetime import datetime, timezone
import uuid

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.core.db import Base


class Service(Base):
    """Represents a bookable sneaker service."""

    __tablename__ = "services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=False)
    price_cents = Column(Integer, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("ix_services_slug", "slug", unique=True),
        Index("ix_services_active_name", "is_active", "name"),
        Index("ix_services_company", "company_id"),
    )
