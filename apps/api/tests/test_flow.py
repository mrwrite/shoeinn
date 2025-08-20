import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["JWT_SECRET"] = "testsecret"

if os.path.exists("test.db"):
    os.remove("test.db")

from fastapi.testclient import TestClient

from app.main import app
from app.core.db import Base, engine

Base.metadata.create_all(bind=engine)
client = TestClient(app)


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


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
