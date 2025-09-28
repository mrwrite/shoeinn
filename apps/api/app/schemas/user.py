from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str | None = None
    role: str

    class Config:
        from_attributes = True
