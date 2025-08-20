from pydantic import BaseModel


class Address(BaseModel):
    line1: str
    line2: str | None = None
    city: str
    state: str
    postal_code: str


class AppointmentCreate(BaseModel):
    company_id: str | None = None
    service_id: str | None = None
    type: str
    address: Address
    start_time_iso: str
    notes: str | None = None


class AppointmentOut(BaseModel):
    id: str
    company_name: str | None = None
    service_name: str | None = None
    type: str
    start_time_iso: str
    status: str

    class Config:
        from_attributes = True
