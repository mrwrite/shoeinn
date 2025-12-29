from pydantic import BaseModel, Field


class PushRegisterRequest(BaseModel):
    token: str = Field(..., min_length=1)
    platform: str | None = Field(default=None, pattern="^(ios|android)$")


class PushUnregisterRequest(BaseModel):
    token: str = Field(..., min_length=1)

