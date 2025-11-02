"""Pydantic schemas for services."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ServiceRead(BaseModel):
    """Service representation for API responses."""

    id: UUID
    name: str
    slug: str
    description: str | None = None
    duration_minutes: int
    price_cents: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
