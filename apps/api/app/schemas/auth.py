from uuid import UUID

from pydantic import BaseModel, constr


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: constr(min_length=1)
    role: str


class LoginRequest(BaseModel):
    email: str
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
    email: str


class RefreshRequest(BaseModel):
    refresh_token: str
