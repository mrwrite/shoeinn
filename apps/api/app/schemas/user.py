from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: str

    class Config:
        from_attributes = True
