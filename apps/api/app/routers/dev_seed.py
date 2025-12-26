from datetime import datetime, timedelta, timezone

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import hash_password
from app.models.available_slot import AvailableSlot
from app.models.company import Company
from app.models.company_user import CompanyUser
from app.models.service import Service
from app.models.user import User

router = APIRouter(prefix="/dev", tags=["dev"])


@router.post("/seed")
def seed(db: Session = Depends(get_db)):
    if db.query(Company).first():
        return {"status": "skipped"}

    c1 = Company(name="Clean Kicks", city="Austin", state="TX", postal_code="73301")
    c2 = Company(name="Fresh Soles", city="Austin", state="TX", postal_code="78701")
    c3 = Company(name="Sole Spa", city="Denver", state="CO", postal_code="80014")
    db.add_all([c1, c2, c3])
    db.flush()

    services = [
        Service(
            company_id=c1.id,
            name="Basic Clean",
            slug="clean-kicks-basic",
            price_cents=1500,
            duration_minutes=30,
        ),
        Service(
            company_id=c1.id,
            name="Deep Refresh",
            slug="clean-kicks-deep",
            price_cents=2800,
            duration_minutes=60,
        ),
        Service(
            company_id=c2.id,
            name="Essential Detail",
            slug="fresh-soles-essential",
            price_cents=1800,
            duration_minutes=45,
        ),
        Service(
            company_id=c2.id,
            name="Premium Detail",
            slug="fresh-soles-premium",
            price_cents=3200,
            duration_minutes=75,
        ),
        Service(
            company_id=c3.id,
            name="Mountain Mud Cleanup",
            slug="sole-spa-mud",
            price_cents=2600,
            duration_minutes=50,
        ),
        Service(
            company_id=c3.id,
            name="Snow Salt Rescue",
            slug="sole-spa-salt",
            price_cents=2400,
            duration_minutes=40,
        ),
    ]
    db.add_all(services)

    tomorrow = datetime.now(timezone.utc).replace(hour=13, minute=0, second=0, microsecond=0) + timedelta(days=1)
    slots = [
        AvailableSlot(company_id=c1.id, service_id=services[0].id, start_time_utc=tomorrow, is_available=True),
        AvailableSlot(company_id=c1.id, service_id=services[0].id, start_time_utc=tomorrow + timedelta(minutes=30), is_available=True),
        AvailableSlot(company_id=c2.id, service_id=services[2].id, start_time_utc=tomorrow, is_available=True),
        AvailableSlot(company_id=c3.id, service_id=services[4].id, start_time_utc=tomorrow + timedelta(minutes=45), is_available=True),
    ]
    db.add_all(slots)

    u1 = User(email="c1@test.com", password_hash=hash_password("Password1!"), role="company")
    u2 = User(email="c2@test.com", password_hash=hash_password("Password1!"), role="company")
    u3 = User(email="c3@test.com", password_hash=hash_password("Password1!"), role="company")
    customer = User(email="customer@test.com", password_hash=hash_password("Password1!"), role="customer")
    db.add_all([u1, u2, u3, customer])
    db.flush()

    db.add_all(
        [
            CompanyUser(user_id=u1.id, company_id=c1.id),
            CompanyUser(user_id=u2.id, company_id=c2.id),
            CompanyUser(user_id=u3.id, company_id=c3.id),
        ]
    )
    db.commit()
    return {"status": "ok"}
