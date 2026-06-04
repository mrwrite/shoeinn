"""Optional company-to-care-category capability metadata."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.core.db import Base


class CompanyCareCategory(Base):
    """Represents categories a company can offer without changing service behavior."""

    __tablename__ = "company_care_categories"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), primary_key=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("care_categories.id"), primary_key=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("company_id", "category_id"),
        Index("ix_company_care_categories_category", "category_id", "is_active"),
    )
