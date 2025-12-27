"""Service catalogue and availability endpoints."""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import Service
from app.schemas.service import ServiceRead
from app.services.availability import get_daily_availability

router = APIRouter(tags=["services"])


@router.get("/services", response_model=list[ServiceRead])
def list_services(company_id: UUID | None = None, db: Session = Depends(get_db)) -> list[ServiceRead]:
    """Return all active services ordered by name."""

    q = db.query(Service).filter(Service.is_active.is_(True))
    if company_id:
        q = q.filter(Service.company_id == company_id)
    services = q.order_by(Service.name.asc()).all()
    return services


@router.get("/availability")
def get_availability(
    service_id: UUID = Query(..., description="Service identifier"),
    date_str: str = Query(..., alias="date", description="ISO date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
) -> list[datetime]:
    """Return available start times for the given service and date."""

    try:
        target_date = date.fromisoformat(date_str)
    except ValueError as exc:  # pragma: no cover - fast validation path
        raise HTTPException(status_code=400, detail="Invalid date format") from exc

    service = db.query(Service).filter(Service.id == service_id, Service.is_active.is_(True)).one_or_none()
    if service is None:
        raise HTTPException(status_code=400, detail="Service not found")

    slots = get_daily_availability(db, service, target_date)
    return slots
