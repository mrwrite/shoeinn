from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: str
    company_id: str
    appointment_id: str
    kind: str
    delivered: bool

    class Config:
        from_attributes = True
