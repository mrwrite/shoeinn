from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint, Index

from app.core.db import Base


class CompanyUser(Base):
    __tablename__ = "company_users"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), primary_key=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "company_id"),
        Index("ix_company_users_company_id", "company_id"),
    )
