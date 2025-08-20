from pydantic import BaseModel


class CompanyOut(BaseModel):
    id: str
    name: str
    description: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None

    class Config:
        from_attributes = True
