from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import BASELINE_CARE_CATEGORIES, CareCategory, Company, Service
from scripts.seed_services import seed_services


BASELINE_CATEGORY_SLUGS = {str(category["slug"]) for category in BASELINE_CARE_CATEGORIES}


def test_services_seeded(client: TestClient) -> None:
    response = client.get("/services")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5

    names = [item["name"] for item in data]
    assert names == sorted(names)

    category_slugs = {item["category_slug"] for item in data}
    assert category_slugs == BASELINE_CATEGORY_SLUGS

    for item in data:
        assert set(
            [
                "id",
                "category_id",
                "category_slug",
                "category_name",
                "category_icon_key",
                "name",
                "slug",
                "description",
                "duration_minutes",
                "price_cents",
                "is_active",
                "created_at",
                "updated_at",
            ]
        ).issubset(item.keys())
        assert item["category_id"]
        assert item["category_slug"] in BASELINE_CATEGORY_SLUGS
        assert item["category_name"]


def test_baseline_care_categories_seeded(client: TestClient, db_session: Session) -> None:
    response = client.get("/services")
    assert response.status_code == 200

    categories = db_session.query(CareCategory).order_by(CareCategory.sort_order.asc()).all()
    assert {category.slug for category in categories} == BASELINE_CATEGORY_SLUGS
    assert [category.slug for category in categories][:2] == ["shoes", "laundry"]
    assert all(category.is_active for category in categories)


def test_care_categories_endpoint_returns_active_categories(client: TestClient, db_session: Session) -> None:
    inactive = db_session.query(CareCategory).filter(CareCategory.slug == "alterations").one()
    inactive.is_active = False
    db_session.commit()

    response = client.get("/care-categories")

    assert response.status_code == 200
    data = response.json()
    slugs = [category["slug"] for category in data]
    assert "alterations" not in slugs
    assert {"shoes", "laundry", "dry-cleaning", "handbags-leather", "rugs-textiles"}.issubset(slugs)
    assert slugs[:2] == ["shoes", "laundry"]
    assert set(["id", "slug", "name", "description", "icon_key", "display_order", "is_active"]).issubset(
        data[0].keys()
    )
    assert "sort_order" not in data[0]


def test_seeded_services_have_category_metadata(client: TestClient, db_session: Session) -> None:
    response = client.get("/services")
    assert response.status_code == 200

    services = db_session.query(Service).all()
    assert services
    assert all(service.category_id is not None for service in services)
    assert {service.category.slug for service in services} == BASELINE_CATEGORY_SLUGS


def test_services_can_filter_by_category_slug(client: TestClient) -> None:
    response = client.get("/services", params={"category_slug": "shoes"})

    assert response.status_code == 200
    data = response.json()
    assert data
    assert {item["category_slug"] for item in data} == {"shoes"}


def test_services_can_filter_by_category_id(client: TestClient, db_session: Session) -> None:
    shoes = db_session.query(CareCategory).filter(CareCategory.slug == "shoes").one()

    response = client.get("/services", params={"category_id": str(shoes.id)})

    assert response.status_code == 200
    data = response.json()
    assert data
    assert {item["category_id"] for item in data} == {str(shoes.id)}


def test_services_unknown_category_filter_returns_empty(client: TestClient) -> None:
    response = client.get("/services", params={"category_slug": "not-a-category"})

    assert response.status_code == 200
    assert response.json() == []


def test_service_filters_preserve_company_filter(client: TestClient, db_session: Session) -> None:
    company = db_session.query(Company).first()
    assert company is not None

    response = client.get(
        "/services",
        params={
            "company_id": str(company.id),
            "category_slug": "shoes",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data
    assert {item["company_id"] for item in data} == {str(company.id)}
    assert {item["category_slug"] for item in data} == {"shoes"}


def test_company_discovery_can_filter_by_category(client: TestClient, db_session: Session) -> None:
    company = db_session.query(Company).first()
    laundry = db_session.query(CareCategory).filter(CareCategory.slug == "laundry").one()
    assert company is not None
    db_session.add(
        Service(
            company_id=company.id,
            category_id=laundry.id,
            name="Laundry Care Test",
            slug="laundry-care-test",
            description="Phase 3 category filter test service.",
            duration_minutes=45,
            price_cents=2500,
        )
    )
    db_session.commit()

    response = client.get("/companies", params={"category_slug": "laundry"})

    assert response.status_code == 200
    data = response.json()
    assert [item["id"] for item in data] == [str(company.id)]
    offered_slugs = {category["slug"] for category in data[0]["offered_categories"]}
    assert {"shoes", "laundry"}.issubset(offered_slugs)


def test_company_services_can_filter_by_category(client: TestClient, db_session: Session) -> None:
    company = db_session.query(Company).first()
    laundry = db_session.query(CareCategory).filter(CareCategory.slug == "laundry").one()
    assert company is not None
    db_session.add(
        Service(
            company_id=company.id,
            category_id=laundry.id,
            name="Laundry Detail Test",
            slug="laundry-detail-test",
            description="Phase 3 company service category filter test.",
            duration_minutes=45,
            price_cents=2500,
        )
    )
    db_session.commit()

    response = client.get(f"/companies/{company.id}/services", params={"category_id": str(laundry.id)})

    assert response.status_code == 200
    data = response.json()
    assert data
    assert {item["category_slug"] for item in data} == {"laundry"}


def test_seed_services_backfills_existing_uncategorized_services(db_session: Session) -> None:
    company = Company(name="Legacy ShoeInn", city="Mt. Juliet", state="TN")
    db_session.add(company)
    db_session.flush()
    service = Service(
        company_id=company.id,
        name="Legacy Premium Restore",
        slug="legacy-premium-restore",
        description="Existing shoe-care service without category metadata.",
        duration_minutes=60,
        price_cents=4500,
    )
    db_session.add(service)
    db_session.commit()

    created = seed_services(db_session)

    assert created == 0
    db_session.refresh(service)
    assert service.category_id is not None
    assert service.category.slug == "shoes"
