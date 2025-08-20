from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, String, Text, UniqueConstraint

from app.core.db import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)
    city = Column(String)
    state = Column(String)
    postal_code = Column(String)
    is_active = Column(Boolean, default=True)
    hours_json = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("name"),
    )
