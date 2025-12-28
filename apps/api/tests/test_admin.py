from uuid import UUID, uuid4

from app.core.security import create_access_token, hash_password
from app.models import Appointment, AppointmentStatus, Company, CompanyUser, Notification
from app.models.user import User


def _auth_header_for(user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"Authorization": f"Bearer {token}"}


def test_admin_can_create_company(client, db_session):
    admin = User(email="admin@example.com", password_hash=hash_password("pass"), full_name="Admin", role="admin")
    db_session.add(admin)
    db_session.commit()

    payload = {"name": "New Company", "city": "Town", "state": "CA"}
    response = client.post("/admin/companies", json=payload, headers=_auth_header_for(admin))
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]


def test_admin_can_create_company_user(client, db_session):
    admin = User(email="admin2@example.com", password_hash=hash_password("pass"), full_name="Admin Two", role="admin")
    company = Company(name="TestCo")
    db_session.add_all([admin, company])
    db_session.commit()

    payload = {
        "company_id": str(company.id),
        "full_name": "Provider One",
        "email": "provider1@example.com",
    }
    response = client.post("/admin/company-users", json=payload, headers=_auth_header_for(admin))
    assert response.status_code == 201
    data = response.json()
    assert data["company_id"] == str(company.id)
    created_user = db_session.query(User).filter(User.email == payload["email"]).first()
    assert created_user is not None
    assert db_session.query(CompanyUser).filter(CompanyUser.user_id == created_user.id).first()


def test_confirm_creates_notifications(client, db_session):
    # fetch seed service
    services = client.get("/services").json()
    service_id = services[0]["id"]

    hold_payload = {
        "service_id": service_id,
        "customer_name": "Jane Doe",
        "customer_phone": "123",
        "customer_email": "jane@example.com",
        "start_time": "2025-01-01T10:00:00Z",
    }
    hold_resp = client.post("/appointments/holds", json=hold_payload)
    assert hold_resp.status_code == 201
    hold_id = hold_resp.json()["id"]

    confirm_payload = {
        "hold_id": hold_id,
        "company_id": services[0]["company_id"],
        "type": "standard",
        "customer_name": "Jane Doe",
        "customer_phone": "123",
        "customer_email": "jane@example.com",
        "address_line1": "123 Street",
        "city": "City",
        "state": "ST",
        "postal_code": "12345",
    }
    confirm_resp = client.post("/appointments/confirm", json=confirm_payload)
    assert confirm_resp.status_code == 200

    appt_id = UUID(confirm_resp.json()["id"])
    notifications = db_session.query(Notification).filter(Notification.appointment_id == appt_id).all()
    kinds = {n.kind for n in notifications}
    assert "APPOINTMENT_CONFIRMED" in kinds
    assert "APPOINTMENT_STATUS_CHANGED" in kinds
    # ensure at least one notification targets the customer email
    assert any(n.target == "jane@example.com" for n in notifications)
