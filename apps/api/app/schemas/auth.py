from uuid import UUID

from pydantic import BaseModel, EmailStr, constr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: constr(min_length=1)
    role: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginResponse(TokenPair):
    role: str
    user_id: UUID
    company_id: UUID | None = None
    full_name: str


class RefreshRequest(BaseModel):
    refresh_token: str
