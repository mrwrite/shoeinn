"""Seed the services table with initial data."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.models import Company, Service

SEED_SERVICES: list[dict[str, object]] = [
    {
        "name": "Basic Clean",
        "slug": "basic-clean",
        "description": "Exterior wipe, lace wash, deodorize.",
        "duration_minutes": 30,
        "price_cents": 2000,
    },
    {
        "name": "Deep Clean",
        "slug": "deep-clean",
        "description": "Deep outsole, midsole, insole, full deodorize.",
        "duration_minutes": 60,
        "price_cents": 3500,
    },
    {
        "name": "Whitening & Brighten",
        "slug": "whiten",
        "description": "Oxidation treatment for midsoles.",
        "duration_minutes": 45,
        "price_cents": 3000,
    },
    {
        "name": "Premium Restore",
        "slug": "premium-restore",
        "description": "Deep clean + scuffs + crease care.",
        "duration_minutes": 90,
        "price_cents": 6000,
    },
    {
        "name": "Express Add-On",
        "slug": "express",
        "description": "Rush the job (addon).",
        "duration_minutes": 0,
        "price_cents": 1000,
    },
]


def seed_services(session: Session) -> int:
    """Insert default services if the table is empty."""

    existing = session.execute(select(Service.id)).first()
    if existing is not None:
        return 0

    company = session.execute(select(Company).limit(1)).scalar_one_or_none()
    if company is None:
        company = Company(name="ShoeInn", city="Anywhere", state="CA")
        session.add(company)
        session.flush()

    for payload in SEED_SERVICES:
        session.add(Service(company_id=company.id, **payload))
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
