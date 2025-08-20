from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import hash_password
from app.models.company import Company
from app.models.company_user import CompanyUser
from app.models.service import Service
from app.models.user import User

router = APIRouter(prefix="/dev", tags=["dev"])


@router.post("/seed")
def seed(db: Session = Depends(get_db)):
    if db.query(Company).first():
        return {"status": "skipped"}

    c1 = Company(name="Clean Kicks", city="Austin", state="TX")
    c2 = Company(name="Fresh Soles", city="Austin", state="TX")
    db.add_all([c1, c2])
    db.flush()

    s1 = Service(company_id=c1.id, name="Basic Clean", price_cents=1000, duration_min=30)
    s2 = Service(company_id=c2.id, name="Deep Clean", price_cents=2000, duration_min=60)
    db.add_all([s1, s2])

    u1 = User(email="c1@test.com", password_hash=hash_password("Password1!"), role="company")
    u2 = User(email="c2@test.com", password_hash=hash_password("Password1!"), role="company")
    customer = User(email="customer@test.com", password_hash=hash_password("Password1!"), role="customer")
    db.add_all([u1, u2, customer])
    db.flush()

    db.add_all([CompanyUser(user_id=u1.id, company_id=c1.id), CompanyUser(user_id=u2.id, company_id=c2.id)])
    db.commit()
    return {"status": "ok"}
