import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["JWT_SECRET"] = "testsecret"

if os.path.exists("test.db"):
    os.remove("test.db")

from fastapi.testclient import TestClient

from app.main import app
from app.core.db import Base, SessionLocal, engine
from app.models.company import Company
from app.models.service import Service

Base.metadata.create_all(bind=engine)
client = TestClient(app)


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed_services():
    with SessionLocal() as db:
        c1 = Company(name="Clean Kicks", city="Austin", state="TX")
        c2 = Company(name="Fresh Soles", city="Dallas", state="TX")
        c3 = Company(name="Dusty Boots", city="Austin", state="TX", is_active=False)
        db.add_all([c1, c2, c3])
        db.flush()

        s1 = Service(
            company_id=c1.id,
            name="Basic Clean",
            description="Quick refresh",
            price_cents=1000,
            duration_min=30,
            active=True,
        )
        s2 = Service(
            company_id=c2.id,
            name="Deep Clean",
            description="Premium service",
            price_cents=2500,
            duration_min=60,
            active=True,
        )
        s3 = Service(
            company_id=c1.id,
            name="Retired Service",
            price_cents=9999,
            duration_min=45,
            active=False,
        )
        s4 = Service(
            company_id=c3.id,
            name="Inactive Company Service",
            price_cents=5000,
            duration_min=40,
            active=True,
        )
        db.add_all([s1, s2, s3, s4])
        db.commit()
        return {"clean_kicks": c1.id, "fresh_soles": c2.id}


def test_flow():
    # seed
    client.post("/dev/seed")

    # register customer
    r = client.post(
        "/auth/register",
        json={"email": "new@user.com", "password": "Password1!", "full_name": "New User", "role": "customer"},
    )
    assert r.status_code == 201

    # login customer
    r = client.post("/auth/login", json={"email": "new@user.com", "password": "Password1!"})
    token = r.json()["access_token"]

    # browse companies
    r = client.get("/companies")
    companies = r.json()
    assert companies
    company_id = companies[0]["id"]

    r = client.get(f"/companies/{company_id}/services")
    service_id = r.json()[0]["id"]

    # book appointment
    payload = {
        "company_id": company_id,
        "service_id": service_id,
        "type": "pickup",
        "address": {
            "line1": "1 Main",
            "line2": None,
            "city": "Austin",
            "state": "TX",
            "postal_code": "73301",
        },
        "start_time_iso": "2025-08-18T15:30:00-05:00",
    }
    r = client.post("/appointments", json=payload, headers=auth_headers(token))
    appt_id = r.json()["id"]

    # login company user
    r = client.post("/auth/login", json={"email": "c1@test.com", "password": "Password1!"})
    ctoken = r.json()["access_token"]

    # open appointments
    r = client.get("/company/appointments/open", headers=auth_headers(ctoken))
    assert any(a["id"] == appt_id for a in r.json())

    # claim
    r = client.post(f"/company/appointments/{appt_id}/claim", headers=auth_headers(ctoken))
    assert r.json()["status"] == "claimed"


def test_services_happy_path():
    reset_db()
    try:
        seed_services()

        r = client.get("/services")
        assert r.status_code == 200
        services = r.json()
        assert len(services) == 2

        names = {s["name"] for s in services}
        assert names == {"Basic Clean", "Deep Clean"}

        basic = next(s for s in services if s["name"] == "Basic Clean")
        assert basic["price"] == 10.0
        assert basic["price_cents"] == 1000
        assert basic["company"]["name"] == "Clean Kicks"
        assert basic["company"]["city"] == "Austin"
    finally:
        reset_db()


def test_services_filters():
    reset_db()
    try:
        ids = seed_services()

        r = client.get("/services", params={"city": "Austin"})
        assert r.status_code == 200
        services = r.json()
        assert len(services) == 1
        assert services[0]["company"]["city"] == "Austin"

        r = client.get("/services", params={"query": "deep"})
        assert len(r.json()) == 1
        assert r.json()[0]["name"] == "Deep Clean"

        r = client.get("/services", params={"company_id": ids["clean_kicks"]})
        filtered = r.json()
        assert len(filtered) == 1
        assert filtered[0]["company"]["id"] == ids["clean_kicks"]
    finally:
        reset_db()
