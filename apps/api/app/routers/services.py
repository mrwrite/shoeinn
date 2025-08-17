from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.db import get_session
from app.models.service import Service
from app.schemas.service import ServiceOut

router = APIRouter()

DEFAULTS = [
    {"name": "Basic Clean", "description": "", "price_cents": 2500, "duration_min": 45},
    {"name": "Deep Clean", "description": "", "price_cents": 4500, "duration_min": 75},
    {"name": "Sole Repaint", "description": "", "price_cents": 7000, "duration_min": 90},
]

@router.get("/services", response_model=list[ServiceOut])
def get_services(session: Session = Depends(get_session)):
    return (
        session.query(Service)
        .filter(Service.active == True)
        .order_by(Service.name)
        .all()
    )

@router.post("/services/seed")
def seed_services(session: Session = Depends(get_session)):
    inserted = 0
    existing = 0
    for data in DEFAULTS:
        if session.query(Service).filter_by(name=data["name"]).first():
            existing += 1
            continue
        session.add(Service(**data))
        inserted += 1
    session.commit()
    return {"inserted": inserted, "existing": existing}
