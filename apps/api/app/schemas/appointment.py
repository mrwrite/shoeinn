"""Pydantic schemas for appointment workflows."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.appointment_hold import HoldStatus


class HoldCreate(BaseModel):
    """Request body for creating an appointment hold."""

    service_id: UUID
    start_time: datetime
    customer_name: str | None = Field(default=None, max_length=255)
    customer_phone: str | None = Field(default=None, max_length=50)
    customer_email: str | None = Field(default=None, max_length=255)


class HoldRead(BaseModel):
    """Serialized hold returned from the API."""

    id: UUID
    service_id: UUID
    customer_name: str | None
    customer_phone: str | None
    customer_email: str | None
    start_time: datetime
    end_time: datetime
    ttl_expires_at: datetime
    status: HoldStatus

    model_config = ConfigDict(from_attributes=True)


class AppointmentConfirm(BaseModel):
    """Request body for confirming an appointment hold."""

    hold_id: UUID
    customer_name: str = Field(max_length=255)
    customer_phone: str = Field(max_length=50)
    customer_email: str | None = Field(default=None, max_length=255)


class AppointmentRead(BaseModel):
    """Serialized appointment."""

    id: UUID
    service_id: UUID
    customer_name: str
    customer_phone: str
    customer_email: str | None
    start_time: datetime
    end_time: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
