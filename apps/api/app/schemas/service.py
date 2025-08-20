from pydantic import BaseModel


class ServiceOut(BaseModel):
    id: str
    name: str | None = None
    description: str | None = None
    price_cents: int | None = None
    duration_min: int | None = None

    class Config:
        from_attributes = True
