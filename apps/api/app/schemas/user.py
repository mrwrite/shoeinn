from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class CustomerAddressUpdate(BaseModel):
    address_line1: str = Field(min_length=1, max_length=255)
    address_line2: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(min_length=1, max_length=20)
    country: str | None = Field(default="US", max_length=2)

    @field_validator("address_line1", "city", "state", "postal_code", mode="before")
    @classmethod
    def strip_required(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("Must be a string")
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field is required")
        return cleaned

    @field_validator("address_line2", "country", mode="before")
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class UserRead(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: str
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    country: str | None = None
    customer_push_enabled: bool = True
    customer_push_assignment_updates: bool = True
    customer_push_milestone_updates: bool = True

    class Config:
        from_attributes = True


class UserOut(UserRead):
    pass


class NotificationPreferencesRead(BaseModel):
    customer_push_enabled: bool
    customer_push_assignment_updates: bool
    customer_push_milestone_updates: bool


class NotificationPreferencesUpdate(BaseModel):
    customer_push_enabled: bool
    customer_push_assignment_updates: bool
    customer_push_milestone_updates: bool
