import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from app.core.db import Base

class Service(Base):
    __tablename__ = "services"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = sa.Column(sa.String, unique=True, nullable=False)
    description = sa.Column(sa.Text)
    price_cents = sa.Column(sa.Integer, nullable=False)
    duration_min = sa.Column(sa.Integer, nullable=False)
    active = sa.Column(sa.Boolean, default=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
