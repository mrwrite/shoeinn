from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, EmailStr, constr

from app.schemas.user import UserOut


class CompanyCreate(BaseModel):
    name: str
    phone: str | None = None
    email: EmailStr | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    description: str | None = None


class CompanyUserCreate(BaseModel):
    company_id: UUID
    full_name: constr(min_length=1)
    email: EmailStr
    phone: str | None = None
    password: str | None = None
    role: str = "company"


class CompanyUserCreated(BaseModel):
    user: UserOut
    company_id: UUID
    temp_password: str | None = None
