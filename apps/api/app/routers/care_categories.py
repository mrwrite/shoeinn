"""Read-only care category marketplace endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import CareCategory
from app.schemas.care_category import CareCategoryRead

router = APIRouter(prefix="/care-categories", tags=["care-categories"])


@router.get("", response_model=list[CareCategoryRead])
def list_care_categories(db: Session = Depends(get_db)) -> list[CareCategory]:
    """Return active care categories ordered for marketplace display."""

    return (
        db.query(CareCategory)
        .filter(CareCategory.is_active.is_(True))
        .order_by(CareCategory.sort_order.asc(), CareCategory.name.asc())
        .all()
    )
