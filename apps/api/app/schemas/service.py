from uuid import UUID

from pydantic import BaseModel, computed_field


class ServiceCompanyOut(BaseModel):
    id: UUID
    name: str
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None


class ServiceOut(BaseModel):
    id: UUID
    name: str | None = None
    description: str | None = None
    price_cents: int | None = None
    duration_min: int | None = None
    company: ServiceCompanyOut | None = None

    @computed_field  # type: ignore[misc]
    @property
    def price(self) -> float | None:
        if self.price_cents is None:
            return None
        return self.price_cents / 100

    class Config:
        from_attributes = True
