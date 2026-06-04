"""Care category models and baseline marketplace categories."""

from __future__ import annotations

from datetime import datetime, timezone
import uuid

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, Index
from sqlalchemy.dialects.postgresql import UUID

from app.core.db import Base


# Baseline categories are shared by migrations and seed helpers so fresh,
# test, and upgraded databases agree on stable marketplace slugs.
BASELINE_CARE_CATEGORIES: tuple[dict[str, object], ...] = (
    {
        "slug": "shoes",
        "name": "Shoes",
        "description": "Premium cleaning, restoration, and pickup care for sneakers and footwear.",
        "sort_order": 10,
        "icon_key": "footprints",
    },
    {
        "slug": "laundry",
        "name": "Laundry",
        "description": "Wash, fold, pickup, and delivery care for everyday garments and linens.",
        "sort_order": 20,
        "icon_key": "shirt",
    },
    {
        "slug": "dry-cleaning",
        "name": "Dry Cleaning",
        "description": "Professional care for delicate garments, suits, dresses, and formal wear.",
        "sort_order": 30,
        "icon_key": "sparkles",
    },
    {
        "slug": "handbags-leather",
        "name": "Handbags & Leather",
        "description": "Specialist cleaning and conditioning for handbags, leather goods, and accessories.",
        "sort_order": 40,
        "icon_key": "briefcase",
    },
    {
        "slug": "rugs-textiles",
        "name": "Rugs & Textiles",
        "description": "Premium care for rugs, home textiles, and delicate fabric items.",
        "sort_order": 50,
        "icon_key": "layout-grid",
    },
    {
        "slug": "alterations",
        "name": "Alterations",
        "description": "Tailoring, fit adjustments, repairs, and garment finishing services.",
        "sort_order": 60,
        "icon_key": "scissors",
    },
)


class CareCategory(Base):
    """Represents a premium care marketplace category."""

    __tablename__ = "care_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(100), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    icon_key = Column(String(100), nullable=True)
    hero_image_url = Column(String(1024), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("ix_care_categories_slug", "slug", unique=True),
        Index("ix_care_categories_active_sort", "is_active", "sort_order"),
    )

    @property
    def display_order(self) -> int:
        """Expose API-facing display order while keeping the DB column stable."""

        return int(self.sort_order or 0)
