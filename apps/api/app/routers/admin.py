from __future__ import annotations

import secrets
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_admin_user, hash_password
from app.models import Company, CompanyUser
from app.models.user import User
from app.schemas.admin import CompanyCreate, CompanyUserCreate, CompanyUserCreated
from app.schemas.company import CompanyOut

router = APIRouter(prefix="/admin", tags=["admin"])


def _generate_temp_password() -> str:
    return secrets.token_urlsafe(8)


@router.post("/companies", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(
    payload: CompanyCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin_user),
):
    existing = db.query(Company).filter(Company.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company name exists")
    company = Company(**payload.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.get("/companies", response_model=list[CompanyOut])
def list_companies(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin_user),
):
    return db.query(Company).order_by(Company.created_at.desc()).all()


@router.post("/company-users", response_model=CompanyUserCreated, status_code=status.HTTP_201_CREATED)
def create_company_user(
    payload: CompanyUserCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin_user),
):
    company = db.get(Company, payload.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email exists")

    temp_password = payload.password or _generate_temp_password()
    user = User(
        email=payload.email,
        password_hash=hash_password(temp_password),
        full_name=payload.full_name,
        role=payload.role or "company",
    )
    db.add(user)
    db.flush()

    company_user = CompanyUser(user_id=user.id, company_id=company.id)
    db.add(company_user)
    db.commit()
    db.refresh(user)

    return CompanyUserCreated(user=user, company_id=company.id, temp_password=temp_password if not payload.password else None)
