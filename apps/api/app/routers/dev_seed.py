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
    created = {
        "companies": 0,
        "services": 0,
        "slots": 0,
        "users": 0,
        "company_users": 0,
    }

    # ---- Companies (upsert by name) ----
    def get_or_create_company(name: str, city: str, state: str, postal_code: str) -> Company:
        c = db.query(Company).filter(Company.name == name).first()
        if c:
            return c
        c = Company(name=name, city=city, state=state, postal_code=postal_code)
        db.add(c)
        db.flush()
        created["companies"] += 1
        return c

    c1 = get_or_create_company("Clean Kicks", "Austin", "TX", "73301")
    c2 = get_or_create_company("Fresh Soles", "Austin", "TX", "78701")
    c3 = get_or_create_company("Sole Spa", "Denver", "CO", "80014")

    # ---- Services (upsert by slug) ----
    def get_or_create_service(company_id, name, slug, price_cents, duration_minutes) -> Service:
        s = db.query(Service).filter(Service.slug == slug).first()
        if s:
            # Ensure it is linked to the right company if it existed from earlier seeds
            if getattr(s, "company_id", None) != company_id:
                s.company_id = company_id
            return s
        s = Service(
            company_id=company_id,
            name=name,
            slug=slug,
            price_cents=price_cents,
            duration_minutes=duration_minutes,
        )
        db.add(s)
        db.flush()
        created["services"] += 1
        return s

    s1 = get_or_create_service(c1.id, "Basic Clean", "clean-kicks-basic", 1500, 30)
    s2 = get_or_create_service(c1.id, "Deep Refresh", "clean-kicks-deep", 2800, 60)
    s3 = get_or_create_service(c2.id, "Essential Detail", "fresh-soles-essential", 1800, 45)
    s4 = get_or_create_service(c2.id, "Premium Detail", "fresh-soles-premium", 3200, 75)
    s5 = get_or_create_service(c3.id, "Mountain Mud Cleanup", "sole-spa-mud", 2600, 50)
    s6 = get_or_create_service(c3.id, "Snow Salt Rescue", "sole-spa-salt", 2400, 40)

    # ---- Available slots (upsert by company_id + service_id + start_time_utc) ----
    tomorrow = datetime.now(timezone.utc).replace(hour=13, minute=0, second=0, microsecond=0) + timedelta(days=1)

    def get_or_create_slot(company_id, service_id, start_time_utc) -> AvailableSlot:
        slot = (
            db.query(AvailableSlot)
            .filter(
                AvailableSlot.company_id == company_id,
                AvailableSlot.service_id == service_id,
                AvailableSlot.start_time_utc == start_time_utc,
            )
            .first()
        )
        if slot:
            # make sure it's available for demo
            slot.is_available = True
            return slot

        slot = AvailableSlot(
            company_id=company_id,
            service_id=service_id,
            start_time_utc=start_time_utc,
            is_available=True,
        )
        db.add(slot)
        db.flush()
        created["slots"] += 1
        return slot

    get_or_create_slot(c1.id, s1.id, tomorrow)
    get_or_create_slot(c1.id, s1.id, tomorrow + timedelta(minutes=30))
    get_or_create_slot(c2.id, s3.id, tomorrow)
    get_or_create_slot(c3.id, s5.id, tomorrow + timedelta(minutes=45))

    # ---- Users (upsert by email) ----
    def get_or_create_user(email: str, role: str) -> User:
        u = db.query(User).filter(User.email == email).first()
        if u:
            # ensure role matches
            if u.role != role:
                u.role = role
            return u
        u = User(email=email, password_hash=hash_password("Password1!"), role=role)
        db.add(u)
        db.flush()
        created["users"] += 1
        return u

    u1 = get_or_create_user("c1@test.com", "company")
    u2 = get_or_create_user("c2@test.com", "company")
    u3 = get_or_create_user("c3@test.com", "company")
    customer = get_or_create_user("customer@test.com", "customer")

    # ---- CompanyUser links (upsert) ----
    def ensure_company_user(user_id, company_id):
        link = (
            db.query(CompanyUser)
            .filter(CompanyUser.user_id == user_id, CompanyUser.company_id == company_id)
            .first()
        )
        if link:
            return
        db.add(CompanyUser(user_id=user_id, company_id=company_id))
        created["company_users"] += 1

    ensure_company_user(u1.id, c1.id)
    ensure_company_user(u2.id, c2.id)
    ensure_company_user(u3.id, c3.id)

    db.commit()

    status = "ok" if any(v > 0 for v in created.values()) else "skipped"

    return {
        "status": status,
        "created": created,
        "demo_logins": {
            "companies": [
                {"email": "c1@test.com", "password": "Password1!", "company": "Clean Kicks"},
                {"email": "c2@test.com", "password": "Password1!", "company": "Fresh Soles"},
                {"email": "c3@test.com", "password": "Password1!", "company": "Sole Spa"},
            ],
            "customer": {"email": "customer@test.com", "password": "Password1!"},
        },
    }

