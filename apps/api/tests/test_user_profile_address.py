from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.core.security import create_access_token, hash_password
from app.models import User


def _auth_header_for(user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"Authorization": f"Bearer {token}"}


def _pick_service(client) -> tuple[str, str]:
    res = client.get("/services")
    assert res.status_code == 200
    data = res.json()
    return data[0]["id"], data[0]["company_id"]


def test_get_me_and_patch_address(client, db_session):
    user = User(
        email="customer-profile@example.com",
        password_hash=hash_password("pass"),
        full_name="Customer Profile",
        role="customer",
    )
    db_session.add(user)
    db_session.commit()

    me_res = client.get("/me", headers=_auth_header_for(user))
    assert me_res.status_code == 200
    assert me_res.json()["email"] == user.email
    assert me_res.json()["address_line1"] is None

    patch_res = client.patch(
        "/me/address",
        headers=_auth_header_for(user),
        json={
            "address_line1": "10 Main St",
            "address_line2": "Apt 2",
            "city": "Atlanta",
            "state": "GA",
            "postal_code": "30301",
            "country": "US",
        },
    )
    assert patch_res.status_code == 200, patch_res.text
    body = patch_res.json()
    assert body["address_line1"] == "10 Main St"
    assert body["city"] == "Atlanta"

    db_session.refresh(user)
    assert user.address_line1 == "10 Main St"
    assert user.city == "Atlanta"


def test_hold_and_confirm_can_fallback_to_saved_customer_address(client, db_session):
    user = User(
        email="customer-fallback@example.com",
        password_hash=hash_password("pass"),
        full_name="Customer Fallback",
        role="customer",
        address_line1="44 Elm St",
        city="Macon",
        state="GA",
        postal_code="31201",
        country="US",
    )
    db_session.add(user)
    db_session.commit()

    service_id, company_id = _pick_service(client)
    start_time = datetime.now(timezone.utc).replace(hour=11, minute=0, second=0, microsecond=0) + timedelta(days=1)

    hold_res = client.post(
        "/appointments/holds",
        json={
            "service_id": service_id,
            "start_time": start_time.isoformat(),
            "customer_email": user.email,
            "customer_name": "Fallback Name",
            "customer_phone": "5551234",
        },
    )
    assert hold_res.status_code == 201, hold_res.text
    hold_body = hold_res.json()
    assert hold_body["address_line1"] == "44 Elm St"
    assert hold_body["city"] == "Macon"

    confirm_res = client.post(
        "/appointments/confirm",
        json={
            "hold_id": hold_body["id"],
            "company_id": company_id,
            "customer_name": "Fallback Name",
            "customer_phone": "5551234",
            "customer_email": user.email,
        },
    )
    assert confirm_res.status_code == 200, confirm_res.text
    appointment = confirm_res.json()
    assert appointment["address_line1"] == "44 Elm St"
    assert appointment["city"] == "Macon"
    assert appointment["state"] == "GA"
    assert appointment["postal_code"] == "31201"
