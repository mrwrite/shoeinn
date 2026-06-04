import re
from sqlalchemy import func
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import CareCategory
from app.models.company import Company
from app.models.service import Service
from app.schemas.company import CompanyOut
from app.schemas.service import ServiceOut

router = APIRouter(prefix="/companies", tags=["companies"])

_CITY_ABBREV = [
    (r"\bmt\.?\b", "mount"),
    (r"\bst\.?\b", "saint"),
    (r"\bft\.?\b", "fort"),
]

def normalize_city(city: str) -> str:
    s = (city or "").strip().lower()
    # remove punctuation like '.' and commas
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    # collapse whitespace
    s = re.sub(r"\s+", " ", s).strip()
    for pattern, repl in _CITY_ABBREV:
        s = re.sub(pattern, repl, s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _attach_offered_categories(db: Session, companies: list[Company]) -> list[Company]:
    """Attach active category metadata derived from each company's active services."""

    company_ids = [company.id for company in companies]
    if not company_ids:
        return companies

    rows = (
        db.query(Service.company_id, CareCategory)
        .join(CareCategory, Service.category_id == CareCategory.id)
        .filter(
            Service.company_id.in_(company_ids),
            Service.is_active.is_(True),
            CareCategory.is_active.is_(True),
        )
        .order_by(CareCategory.sort_order.asc(), CareCategory.name.asc())
        .all()
    )
    categories_by_company: dict[UUID, list[CareCategory]] = {company.id: [] for company in companies}
    seen: dict[UUID, set[UUID]] = {company.id: set() for company in companies}
    for company_id, category in rows:
        if category.id in seen[company_id]:
            continue
        categories_by_company[company_id].append(category)
        seen[company_id].add(category.id)

    for company in companies:
        company.offered_categories = categories_by_company.get(company.id, [])
    return companies


@router.get("", response_model=list[CompanyOut])
def list_companies(
    query: str = "",
    city: str | None = None,
    state: str | None = None,
    category_slug: str | None = None,
    category_id: UUID | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Company).filter(Company.is_active.is_(True))

    if query:
        like = f"%{query.lower()}%"
        q = q.filter(Company.name.ilike(like))

    if city:
        norm_city = normalize_city(city)

        # Normalize DB city in SQL (Postgres)
        db_city = func.lower(func.trim(Company.city))
        db_city = func.regexp_replace(db_city, r"[^a-z0-9\s]", "", "g")  # remove punctuation
        db_city = func.regexp_replace(db_city, r"\s+", " ", "g")         # collapse spaces

        # IMPORTANT: Postgres word boundaries are \m and \M (NOT \b)
        db_city = func.regexp_replace(db_city, r"\mmt\M", "mount", "g")
        db_city = func.regexp_replace(db_city, r"\mst\M", "saint", "g")
        db_city = func.regexp_replace(db_city, r"\mft\M", "fort", "g")

        q = q.filter(db_city == norm_city)

    if state:
        q = q.filter(func.upper(func.trim(Company.state)) == state.strip().upper())

    if category_id or category_slug:
        q = q.join(Service, Service.company_id == Company.id).join(CareCategory, Service.category_id == CareCategory.id)
        q = q.filter(Service.is_active.is_(True), CareCategory.is_active.is_(True))
        if category_id:
            q = q.filter(Service.category_id == category_id)
        if category_slug:
            q = q.filter(CareCategory.slug == category_slug)
        q = q.distinct()

    return _attach_offered_categories(db, q.all())



@router.get("/{company_id}", response_model=CompanyOut)
def get_company(company_id: UUID, db: Session = Depends(get_db)):
    company = db.get(Company, company_id)
    if not company or not company.is_active:
        raise HTTPException(status_code=404, detail="Not found")
    _attach_offered_categories(db, [company])
    return company


@router.get("/{company_id}/services", response_model=list[ServiceOut])
def company_services(
    company_id: UUID,
    category_slug: str | None = None,
    category_id: UUID | None = None,
    db: Session = Depends(get_db),
):
    company = db.get(Company, company_id)
    if not company or not company.is_active:
        raise HTTPException(status_code=404, detail="Not found")
    q = db.query(Service).filter_by(company_id=company_id).filter(Service.is_active.is_(True))
    if category_id:
        q = q.filter(Service.category_id == category_id)
    if category_slug:
        q = q.join(Service.category).filter(
            CareCategory.slug == category_slug,
            CareCategory.is_active.is_(True),
        )
    return q.all()
