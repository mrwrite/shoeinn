"""Pydantic schemas for care categories."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CareCategoryRead(BaseModel):
    """Active care category representation for marketplace discovery."""

    id: UUID
    slug: str
    name: str
    description: str | None = None
    icon_key: str | None = None
    display_order: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class CareCategorySummary(BaseModel):
    """Compact category representation embedded in discovery responses."""

    id: UUID
    slug: str
    name: str
    icon_key: str | None = None

    model_config = ConfigDict(from_attributes=True)
