"""Service model definition."""

from __future__ import annotations

from datetime import datetime, timezone
import uuid

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.db import Base


class Service(Base):
    """Represents a bookable care service."""

    __tablename__ = "services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("care_categories.id"), nullable=True)
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
        Index("ix_services_category_active", "category_id", "is_active"),
    )

    category = relationship("CareCategory")

    @property
    def category_slug(self) -> str | None:
        """Expose optional category slug in service read models."""

        return self.category.slug if self.category is not None else None

    @property
    def category_name(self) -> str | None:
        """Expose optional category name in service read models."""

        return self.category.name if self.category is not None else None

    @property
    def category_icon_key(self) -> str | None:
        """Expose optional category display icon in service read models."""

        return self.category.icon_key if self.category is not None else None
