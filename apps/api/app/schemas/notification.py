from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class NotificationRead(BaseModel):
    id: UUID
    company_id: UUID
    appointment_id: UUID
    kind: str
    channel: str
    target: str | None = None
    payload: dict[str, Any]
    status: str
    delivered: bool
    delivered_at: datetime | None = None
    read_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True
