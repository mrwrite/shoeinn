from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.company import Company
from app.models.service import Service
from app.schemas.company import CompanyOut
from app.schemas.service import ServiceOut

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=list[CompanyOut])
def list_companies(query: str = "", city: str | None = None, state: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Company).filter(Company.is_active.is_(True))
    if query:
        like = f"%{query.lower()}%"
        q = q.filter(Company.name.ilike(like))
    if city:
        q = q.filter(Company.city == city)
    if state:
        q = q.filter(Company.state == state)
    return q.all()


@router.get("/{company_id}", response_model=CompanyOut)
def get_company(company_id: str, db: Session = Depends(get_db)):
    company = db.get(Company, company_id)
    if not company or not company.is_active:
        raise HTTPException(status_code=404, detail="Not found")
    return company


@router.get("/{company_id}/services", response_model=list[ServiceOut])
def company_services(company_id: str, db: Session = Depends(get_db)):
    q = db.query(Service).filter_by(company_id=company_id, active=True)
    return q.all()
