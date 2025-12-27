"""Pydantic schemas for services."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ServiceRead(BaseModel):
    """Service representation for API responses."""

    id: UUID
    company_id: UUID | None = None
    name: str
    slug: str
    description: str | None = None
    duration_minutes: int
    price_cents: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ServiceOut(BaseModel):
    id: UUID
    company_id: UUID | None = None
    name: str
    description: str | None = None
    duration_minutes: int
    price_cents: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
