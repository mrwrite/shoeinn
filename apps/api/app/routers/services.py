from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.company import Company
from app.models.service import Service
from app.schemas.service import ServiceCompanyOut, ServiceOut

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=list[ServiceOut])
def list_services(
    query: str = "",
    city: str | None = None,
    state: str | None = None,
    company_id: str | None = None,
    db: Session = Depends(get_db),
):
    q = (
        db.query(Service, Company)
        .join(Company, Service.company_id == Company.id)
        .filter(Service.active.is_(True), Company.is_active.is_(True))
    )

    if query:
        like = f"%{query.lower()}%"
        q = q.filter(
            func.lower(Service.name).like(like) | func.lower(Company.name).like(like)
        )
    if city:
        q = q.filter(Company.city == city)
    if state:
        q = q.filter(Company.state == state)
    if company_id:
        q = q.filter(Service.company_id == company_id)

    services: list[ServiceOut] = []
    for service, company in q.order_by(Company.name, Service.name).all():
        services.append(
            ServiceOut(
                id=service.id,
                name=service.name,
                description=service.description,
                price_cents=service.price_cents,
                duration_min=service.duration_min,
                company=ServiceCompanyOut(
                    id=company.id,
                    name=company.name,
                    city=company.city,
                    state=company.state,
                    postal_code=company.postal_code,
                ),
            )
        )
    return services
