from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Appointment, AppointmentAssignment, Company, User


EXPECTED_COMPANY_ADDRESSES = {
    "Pelham Pickup & Press": ("2181 Pelham Parkway", "Pelham", "AL", "35124"),
    "Helena Shoe & Dry Care": ("335 Helena Marketplace", "Helena", "AL", "35080"),
    "Alabaster Clean Run": ("200 Kent Stone Boulevard", "Alabaster", "AL", "35007"),
}

EXPECTED_CUSTOMER_JOB_ADDRESSES = {
    ("230 Tucker Road", "Helena", "AL", "35080"),
    ("500 Amphitheater Road", "Pelham", "AL", "35124"),
    ("100 9th Street Northwest", "Alabaster", "AL", "35007"),
    ("816 Highway 52 East", "Helena", "AL", "35080"),
    ("3162 Pelham Parkway", "Pelham", "AL", "35124"),
    ("200 Depot Street", "Alabaster", "AL", "35007"),
}

EXPECTED_MT_JULIET_COMPANY_ADDRESSES = {
    "Mt. Juliet Pickup & Press": ("401 S Mt Juliet Rd", "Mt. Juliet", "TN", "37122"),
    "Providence Shoe & Dry Care": ("1980 Providence Pkwy", "Mt. Juliet", "TN", "37122"),
    "Golden Bear Clean Run": ("11205 Lebanon Rd", "Mt. Juliet", "TN", "37122"),
}

EXPECTED_MT_JULIET_CUSTOMER_JOB_ADDRESSES = {
    ("3005 Willow Bend Dr", "Mt. Juliet", "TN", "37122"),
    ("2100 Buckner Ln", "Mt. Juliet", "TN", "37122"),
    ("1000 Charlie Daniels Pkwy", "Mt. Juliet", "TN", "37122"),
    ("1805 Curd Rd", "Mt. Juliet", "TN", "37122"),
    ("500 Golden Bear Gateway", "Mt. Juliet", "TN", "37122"),
    ("1450 Central Pike", "Mt. Juliet", "TN", "37122"),
}


def test_dev_seed_creates_assignments_without_company_id_and_reset_reseeds(
    db_session: Session,
    client: TestClient,
) -> None:
    assert not hasattr(AppointmentAssignment, "company_id")

    first = client.post("/dev/seed")
    assert first.status_code == 200, first.text
    assert first.json()["status"] == "ok"
    assert first.json()["created"]["assignments"] == 3

    assignments = db_session.query(AppointmentAssignment).all()
    assert len(assignments) == 3
    assert all(assignment.is_active for assignment in assignments)
    assert all(assignment.user_id is not None for assignment in assignments)

    appointment_ids = [assignment.appointment_id for assignment in assignments]
    appointments = (
        db_session.query(Appointment)
        .filter(Appointment.id.in_(appointment_ids))
        .all()
    )
    assert len(appointments) == 3
    assert all(appointment.company_id is not None for appointment in appointments)

    second = client.post("/dev/seed?reset=true")
    assert second.status_code == 200, second.text
    assert second.json()["status"] == "ok"
    assert second.json()["demo_market"] == "shelby"
    assert second.json()["created"]["assignments"] == 3
    assert db_session.query(AppointmentAssignment).count() == 3


def test_dev_seed_populates_realistic_city_aligned_addresses(
    db_session: Session,
    client: TestClient,
) -> None:
    response = client.post("/dev/seed?reset=true")
    assert response.status_code == 200, response.text
    assert response.json()["demo_market"] == "shelby"

    customer = db_session.query(User).filter(User.email == "customer@shoeinn.com").one()
    assert customer.address_line1 == "230 Tucker Road"
    assert customer.address_line2 is None
    assert customer.city == "Helena"
    assert customer.state == "AL"
    assert customer.postal_code == "35080"
    assert customer.country == "US"

    companies = db_session.query(Company).filter(Company.name.in_(
        [
            "Pelham Pickup & Press",
            "Helena Shoe & Dry Care",
            "Alabaster Clean Run",
        ]
    )).all()
    assert len(companies) == 3
    assert all(company.address_line1 for company in companies)
    assert all(company.city and company.state and company.postal_code for company in companies)
    assert {
        company.name: (company.address_line1, company.city, company.state, company.postal_code)
        for company in companies
    } == EXPECTED_COMPANY_ADDRESSES

    company_by_id = {company.id: company for company in companies}
    appointments = (
        db_session.query(Appointment)
        .filter(Appointment.company_id.in_(company_by_id))
        .all()
    )
    assert len(appointments) == 8
    assert all(appointment.address_line1 for appointment in appointments)
    assert all(appointment.city and appointment.state and appointment.postal_code for appointment in appointments)
    cluster_cities = {"Pelham", "Helena", "Alabaster"}
    assert all(
        appointment.city in cluster_cities
        and appointment.state == "AL"
        for appointment in appointments
    )
    assert all(
        appointment.city in cluster_cities
        and company_by_id[appointment.company_id].city in cluster_cities
        for appointment in appointments
    )
    assert {
        (appointment.address_line1, appointment.city, appointment.state, appointment.postal_code)
        for appointment in appointments
    }.issubset(EXPECTED_CUSTOMER_JOB_ADDRESSES)

    distinct_company_addresses = {company.address_line1 for company in companies}
    distinct_appointment_addresses = {appointment.address_line1 for appointment in appointments}
    assert len(distinct_company_addresses) == 3
    assert len(distinct_appointment_addresses) == len(EXPECTED_CUSTOMER_JOB_ADDRESSES)
    assert customer.address_line1 in distinct_appointment_addresses


def test_dev_seed_mt_juliet_selector_preserves_default_market_and_rotates_selected_pool(
    db_session: Session,
    client: TestClient,
) -> None:
    default_response = client.post("/dev/seed?reset=true")
    assert default_response.status_code == 200, default_response.text
    assert default_response.json()["demo_market"] == "shelby"

    mt_juliet_response = client.post("/dev/seed?reset=true&demo_market=mt_juliet")
    assert mt_juliet_response.status_code == 200, mt_juliet_response.text
    assert mt_juliet_response.json()["demo_market"] == "mt_juliet"

    default_companies = db_session.query(Company).filter(
        Company.name.in_(EXPECTED_COMPANY_ADDRESSES.keys())
    ).all()
    assert len(default_companies) == 3
    assert {
        company.name: (company.address_line1, company.city, company.state, company.postal_code)
        for company in default_companies
    } == EXPECTED_COMPANY_ADDRESSES

    customer = db_session.query(User).filter(User.email == "mtjuliet.customer@shoeinn.com").one()
    assert customer.address_line1 == "3005 Willow Bend Dr"
    assert customer.address_line2 is None
    assert customer.city == "Mt. Juliet"
    assert customer.state == "TN"
    assert customer.postal_code == "37122"
    assert customer.country == "US"

    companies = db_session.query(Company).filter(
        Company.name.in_(EXPECTED_MT_JULIET_COMPANY_ADDRESSES.keys())
    ).all()
    assert len(companies) == 3
    assert all(company.address_line1 for company in companies)
    assert all(company.city and company.state and company.postal_code for company in companies)
    assert {
        company.name: (company.address_line1, company.city, company.state, company.postal_code)
        for company in companies
    } == EXPECTED_MT_JULIET_COMPANY_ADDRESSES

    company_by_id = {company.id: company for company in companies}
    appointments = (
        db_session.query(Appointment)
        .filter(Appointment.company_id.in_(company_by_id))
        .all()
    )
    assert len(appointments) == 8
    assert all(appointment.address_line1 for appointment in appointments)
    assert all(appointment.city == "Mt. Juliet" for appointment in appointments)
    assert all(appointment.state == "TN" for appointment in appointments)
    assert all(appointment.postal_code == "37122" for appointment in appointments)
    assert {
        (appointment.address_line1, appointment.city, appointment.state, appointment.postal_code)
        for appointment in appointments
    } == EXPECTED_MT_JULIET_CUSTOMER_JOB_ADDRESSES


def test_dev_seed_mt_juliet_quick_demo_users_have_expected_roles(
    db_session: Session,
    client: TestClient,
) -> None:
    response = client.post("/dev/seed?reset=true&demo_market=mt_juliet")
    assert response.status_code == 200, response.text

    users = {
        user.email: user
        for user in db_session.query(User).filter(
            User.email.in_(
                [
                    "customer.mtjuliet@shoeinn.demo",
                    "provider.mtjuliet@shoeinn.demo",
                    "admin.mtjuliet@shoeinn.demo",
                ]
            )
        )
    }

    assert users["customer.mtjuliet@shoeinn.demo"].role == "customer"
    assert users["provider.mtjuliet@shoeinn.demo"].role == "provider"
    assert users["admin.mtjuliet@shoeinn.demo"].role == "company_admin"
