from uuid import UUID
from pydantic import BaseModel
from typing import Literal

class AddressIn(BaseModel):
    line1: str
    line2: str | None = None
    city: str
    state: str
    postal_code: str

class CustomerIn(BaseModel):
    name: str
    email: str
    phone: str

class AppointmentCreate(BaseModel):
    service_id: UUID
    type: Literal["pickup", "dropoff"]
    address: AddressIn
    start_time_iso: str
    notes: str | None = None
    customer: CustomerIn

class AppointmentOut(BaseModel):
    id: UUID
    service_name: str
    type: str
    start_time_iso: str
    status: str
