from uuid import UUID
from pydantic import BaseModel

class ServiceOut(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    price_cents: int
    duration_min: int

    class Config:
        from_attributes = True
