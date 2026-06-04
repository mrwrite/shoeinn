"""Seed the services table with initial data."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.models import BASELINE_CARE_CATEGORIES, CareCategory, Company, Service

SEED_SERVICES: list[dict[str, object]] = [
    {
        "name": "Signature Sneaker Deep Clean",
        "slug": "basic-clean",
        "category_slug": "shoes",
        "description": "Exterior wipe, lace wash, deodorize.",
        "duration_minutes": 60,
        "price_cents": 3600,
    },
    {
        "name": "Wash & Fold Essentials",
        "slug": "deep-clean",
        "category_slug": "laundry",
        "description": "Everyday wash, fold, pickup, and delivery care.",
        "duration_minutes": 75,
        "price_cents": 2800,
    },
    {
        "name": "Executive Dry Cleaning",
        "slug": "whiten",
        "category_slug": "dry-cleaning",
        "description": "Professional care for suits, dresses, and delicate garments.",
        "duration_minutes": 90,
        "price_cents": 4200,
    },
    {
        "name": "Designer Handbag Refresh",
        "slug": "premium-restore",
        "category_slug": "handbags-leather",
        "description": "Specialist cleaning and conditioning for handbags and leather goods.",
        "duration_minutes": 90,
        "price_cents": 5200,
    },
    {
        "name": "Area Rug Refresh",
        "slug": "express",
        "category_slug": "rugs-textiles",
        "description": "Premium refresh care for rugs and home textiles.",
        "duration_minutes": 45,
        "price_cents": 6800,
    },
    {
        "name": "Hemming & Minor Alterations",
        "slug": "alterations",
        "category_slug": "alterations",
        "description": "Tailoring, small repairs, and fit adjustments.",
        "duration_minutes": 60,
        "price_cents": 3000,
    },
]


def ensure_baseline_care_categories(session: Session) -> dict[str, CareCategory]:
    """Ensure baseline care categories exist for local, test, and upgraded databases."""

    existing = {
        category.slug: category
        for category in session.execute(select(CareCategory)).scalars().all()
    }
    for payload in BASELINE_CARE_CATEGORIES:
        slug = str(payload["slug"])
        category = existing.get(slug)
        if category is None:
            category = CareCategory(**payload)
            session.add(category)
            existing[slug] = category
        else:
            category.name = str(payload["name"])
            category.description = payload.get("description")
            category.sort_order = int(payload["sort_order"])
            category.icon_key = payload.get("icon_key")
            category.is_active = True
    session.flush()
    return existing


def seed_services(session: Session) -> int:
    """Insert default services if empty and backfill legacy services to shoes."""

    categories = ensure_baseline_care_categories(session)
    shoes_category = categories["shoes"]

    session.query(Service).filter(Service.category_id.is_(None)).update(
        {Service.category_id: shoes_category.id},
        synchronize_session=False,
    )

    existing = session.execute(select(Service.id)).first()
    if existing is not None:
        session.commit()
        return 0

    company = session.execute(select(Company).limit(1)).scalar_one_or_none()
    if company is None:
        company = Company(name="ShoeInn", city="Anywhere", state="CA")
        session.add(company)
        session.flush()

    for payload in SEED_SERVICES:
        category_slug = str(payload["category_slug"])
        service_payload = {key: value for key, value in payload.items() if key != "category_slug"}
        session.add(Service(company_id=company.id, category_id=categories[category_slug].id, **service_payload))
    session.commit()
    return len(SEED_SERVICES)


def main() -> None:
    session = SessionLocal()
    try:
        created = seed_services(session)
        print(f"Seeded {created} services" if created else "Services already seeded")
    except OperationalError as exc:  # pragma: no cover - runtime convenience
        print(f"Failed to seed services: {exc}")
    finally:
        session.close()


if __name__ == "__main__":  # pragma: no cover
    main()
