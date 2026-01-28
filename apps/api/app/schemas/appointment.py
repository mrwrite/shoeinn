"""Pydantic schemas for appointment workflows."""

from __future__ import annotations

from datetime import datetime
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.appointment import AppointmentStatus, PaymentStatus
from app.models.appointment_hold import HoldStatus


class Address(BaseModel):
    address_line1: str | None = Field(default=None, max_length=255)
    address_line2: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)


class HoldCreate(BaseModel):
    """Request body for creating an appointment hold."""

    service_id: UUID
    start_time: datetime
    type: str = Field(default="pickup")
    customer_name: str | None = Field(default=None, max_length=255)
    customer_phone: str | None = Field(default=None, max_length=50)
    customer_email: str | None = Field(default=None, max_length=255)
    address_line1: str | None = Field(default=None, max_length=255)
    address_line2: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)


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
    company_id: UUID
    customer_name: str = Field(max_length=255)
    customer_phone: str = Field(max_length=50)
    customer_email: str | None = Field(default=None, max_length=255)
    type: str = Field(default="pickup")
    address_line1: str | None = Field(default=None, max_length=255)
    address_line2: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)


class AppointmentRead(BaseModel):
    """Serialized appointment."""

    id: UUID
    company_id: UUID
    service_id: UUID
    hold_id: UUID | None = None
    type: str
    customer_name: str
    customer_phone: str
    customer_email: str | None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    start_time: datetime
    confirmed_time: datetime | None = None
    end_time: datetime | None = None
    status: AppointmentStatus
    payment_id: str | None = None
    payment_status: PaymentStatus | None = None
    payment_checkout_url: str | None = None
    payment_amount_expected: int | None = None
    payment_amount_received: int | None = None
    payment_currency: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AppointmentListItem(BaseModel):
    id: UUID
    company_id: UUID | None = None
    service_name: str | None = None
    start_time: datetime
    status: AppointmentStatus

    model_config = ConfigDict(from_attributes=True)


class AppointmentEventRead(BaseModel):
    id: UUID
    appointment_id: UUID
    kind: str
    payload: dict | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AppointmentAssignmentRead(BaseModel):
    id: UUID
    appointment_id: UUID
    user_id: UUID
    assigned_at: datetime
    unassigned_at: datetime | None = None
    is_active: bool
    provider_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class LocationUpdateCreate(BaseModel):
    lat: float
    lng: float
    heading: float | None = None
    speed: float | None = None
    accuracy: float | None = None


class LocationUpdateRead(BaseModel):
    appointment_id: UUID
    user_id: UUID
    lat: float
    lng: float
    heading: float | None = None
    speed: float | None = None
    accuracy: float | None = None
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AppointmentTrackingRead(BaseModel):
    appointment_id: UUID
    status: AppointmentStatus
    is_travel_state: bool
    latest_location: LocationUpdateRead | None
    recent_locations: list[LocationUpdateRead]
