from uuid import UUID

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: UUID
    company_id: str
    appointment_id: UUID
    kind: str
    delivered: bool

    class Config:
        from_attributes = True
