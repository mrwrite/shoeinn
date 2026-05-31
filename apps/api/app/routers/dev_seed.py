from datetime import datetime, timedelta, timezone
from typing import Literal, TypedDict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import hash_password
from app.enums import AppointmentStatus
from app.models.appointment import Appointment
from app.models.appointment_assignment import AppointmentAssignment
from app.models.appointment_event import AppointmentEvent
from app.models.appointment_hold import AppointmentHold
from app.models.appointment_location_update import AppointmentLocationUpdate
from app.models.available_slot import AvailableSlot
from app.models.company import Company
from app.models.company_user import CompanyUser
from app.models.notification import Notification
from app.models.notification_event import NotificationEvent
from app.models.notification_outbox import NotificationOutbox
from app.models.push_token import PushToken
from app.models.refresh_token import RefreshToken
from app.models.service import Service
from app.models.user import User

router = APIRouter(prefix="/dev", tags=["dev"])


class SeedAddress(TypedDict):
    address_line1: str
    address_line2: str | None
    city: str
    state: str
    postal_code: str


class SeedUser(TypedDict):
    email: str
    role: str
    full_name: str


class SeedService(TypedDict):
    name: str
    slug: str
    price_cents: int
    duration_minutes: int


class SeedCompany(TypedDict):
    name: str
    admin: SeedUser
    providers: list[SeedUser]
    services: list[SeedService]


class SeedMarket(TypedDict):
    slug: str
    company_addresses: dict[str, SeedAddress]
    customer_job_addresses: list[SeedAddress]
    customer: SeedUser
    quick_demo_users: dict[str, SeedUser]
    companies: list[SeedCompany]
    appointment_address_offsets: dict[str, int]


DEMO_MARKETS: dict[str, SeedMarket] = {
    "shelby": {
        "slug": "shelby",
        "company_addresses": {
            "Pelham Pickup & Press": {
                "address_line1": "2181 Pelham Parkway",
                "address_line2": None,
                "city": "Pelham",
                "state": "AL",
                "postal_code": "35124",
            },
            "Helena Shoe & Dry Care": {
                "address_line1": "335 Helena Marketplace",
                "address_line2": None,
                "city": "Helena",
                "state": "AL",
                "postal_code": "35080",
            },
            "Alabaster Clean Run": {
                "address_line1": "200 Kent Stone Boulevard",
                "address_line2": None,
                "city": "Alabaster",
                "state": "AL",
                "postal_code": "35007",
            },
        },
        "customer_job_addresses": [
            {
                "address_line1": "230 Tucker Road",
                "address_line2": None,
                "city": "Helena",
                "state": "AL",
                "postal_code": "35080",
            },
            {
                "address_line1": "500 Amphitheater Road",
                "address_line2": None,
                "city": "Pelham",
                "state": "AL",
                "postal_code": "35124",
            },
            {
                "address_line1": "100 9th Street Northwest",
                "address_line2": None,
                "city": "Alabaster",
                "state": "AL",
                "postal_code": "35007",
            },
            {
                "address_line1": "816 Highway 52 East",
                "address_line2": None,
                "city": "Helena",
                "state": "AL",
                "postal_code": "35080",
            },
            {
                "address_line1": "3162 Pelham Parkway",
                "address_line2": None,
                "city": "Pelham",
                "state": "AL",
                "postal_code": "35124",
            },
            {
                "address_line1": "200 Depot Street",
                "address_line2": None,
                "city": "Alabaster",
                "state": "AL",
                "postal_code": "35007",
            },
        ],
        "customer": {
            "email": "customer@shoeinn.com",
            "role": "customer",
            "full_name": "Jordan Demo Customer",
        },
        "quick_demo_users": {},
        "companies": [
            {
                "name": "Pelham Pickup & Press",
                "admin": {
                    "email": "pelham.admin@shoeinn.com",
                    "role": "company_admin",
                    "full_name": "Pelham Owner Demo",
                },
                "providers": [
                    {
                        "email": "pelham.driver1@shoeinn.com",
                        "role": "provider",
                        "full_name": "Mason Route Lead",
                    },
                    {
                        "email": "pelham.driver2@shoeinn.com",
                        "role": "provider",
                        "full_name": "Ava Delivery Lead",
                    },
                ],
                "services": [
                    {
                        "name": "Pickup & Press Refresh",
                        "slug": "pelham-pickup-refresh",
                        "price_cents": 2200,
                        "duration_minutes": 45,
                    },
                    {
                        "name": "Delivery Ready Deep Clean",
                        "slug": "pelham-deep-clean",
                        "price_cents": 3600,
                        "duration_minutes": 75,
                    },
                ],
            },
            {
                "name": "Helena Shoe & Dry Care",
                "admin": {
                    "email": "helena.admin@shoeinn.com",
                    "role": "company_admin",
                    "full_name": "Helena Owner Demo",
                },
                "providers": [
                    {
                        "email": "helena.driver@shoeinn.com",
                        "role": "provider",
                        "full_name": "Noah Helena Driver",
                    },
                ],
                "services": [
                    {
                        "name": "Helena Everyday Clean",
                        "slug": "helena-everyday-clean",
                        "price_cents": 2400,
                        "duration_minutes": 45,
                    },
                    {
                        "name": "Helena Premium Restore",
                        "slug": "helena-premium-restore",
                        "price_cents": 4200,
                        "duration_minutes": 90,
                    },
                ],
            },
            {
                "name": "Alabaster Clean Run",
                "admin": {
                    "email": "alabaster.admin@shoeinn.com",
                    "role": "company_admin",
                    "full_name": "Alabaster Owner Demo",
                },
                "providers": [
                    {
                        "email": "alabaster.driver@shoeinn.com",
                        "role": "provider",
                        "full_name": "Liam Alabaster Driver",
                    },
                ],
                "services": [
                    {
                        "name": "Fast Turnaround Refresh",
                        "slug": "alabaster-fast-refresh",
                        "price_cents": 2100,
                        "duration_minutes": 40,
                    },
                    {
                        "name": "White Pair Recovery",
                        "slug": "alabaster-white-recovery",
                        "price_cents": 3800,
                        "duration_minutes": 70,
                    },
                ],
            },
        ],
        "appointment_address_offsets": {
            "Pelham Pickup & Press": 0,
            "Helena Shoe & Dry Care": 2,
            "Alabaster Clean Run": 4,
        },
    },
    "mt_juliet": {
        "slug": "mt_juliet",
        "company_addresses": {
            "Mt. Juliet Pickup & Press": {
                "address_line1": "401 S Mt Juliet Rd",
                "address_line2": None,
                "city": "Mt. Juliet",
                "state": "TN",
                "postal_code": "37122",
            },
            "Providence Shoe & Dry Care": {
                "address_line1": "1980 Providence Pkwy",
                "address_line2": None,
                "city": "Mt. Juliet",
                "state": "TN",
                "postal_code": "37122",
            },
            "Golden Bear Clean Run": {
                "address_line1": "11205 Lebanon Rd",
                "address_line2": None,
                "city": "Mt. Juliet",
                "state": "TN",
                "postal_code": "37122",
            },
        },
        "customer_job_addresses": [
            {
                "address_line1": "3005 Willow Bend Dr",
                "address_line2": None,
                "city": "Mt. Juliet",
                "state": "TN",
                "postal_code": "37122",
            },
            {
                "address_line1": "2100 Buckner Ln",
                "address_line2": None,
                "city": "Mt. Juliet",
                "state": "TN",
                "postal_code": "37122",
            },
            {
                "address_line1": "1000 Charlie Daniels Pkwy",
                "address_line2": None,
                "city": "Mt. Juliet",
                "state": "TN",
                "postal_code": "37122",
            },
            {
                "address_line1": "1805 Curd Rd",
                "address_line2": None,
                "city": "Mt. Juliet",
                "state": "TN",
                "postal_code": "37122",
            },
            {
                "address_line1": "500 Golden Bear Gateway",
                "address_line2": None,
                "city": "Mt. Juliet",
                "state": "TN",
                "postal_code": "37122",
            },
            {
                "address_line1": "1450 Central Pike",
                "address_line2": None,
                "city": "Mt. Juliet",
                "state": "TN",
                "postal_code": "37122",
            },
        ],
        "customer": {
            "email": "mtjuliet.customer@shoeinn.com",
            "role": "customer",
            "full_name": "Jordan Demo Customer",
        },
        "quick_demo_users": {
            "customer": {
                "email": "customer.mtjuliet@shoeinn.demo",
                "role": "customer",
                "full_name": "Avery Mt. Juliet Customer",
            },
            "provider": {
                "email": "provider.mtjuliet@shoeinn.demo",
                "role": "provider",
                "full_name": "Cameron Mt. Juliet Provider",
            },
            "company_admin": {
                "email": "admin.mtjuliet@shoeinn.demo",
                "role": "company_admin",
                "full_name": "Reese Mt. Juliet Company Admin",
            },
        },
        "companies": [
            {
                "name": "Mt. Juliet Pickup & Press",
                "admin": {
                    "email": "mtjuliet.admin@shoeinn.com",
                    "role": "company_admin",
                    "full_name": "Mt. Juliet Owner Demo",
                },
                "providers": [
                    {
                        "email": "mtjuliet.driver1@shoeinn.com",
                        "role": "provider",
                        "full_name": "Harper Route Lead",
                    },
                    {
                        "email": "mtjuliet.driver2@shoeinn.com",
                        "role": "provider",
                        "full_name": "Ethan Delivery Lead",
                    },
                ],
                "services": [
                    {
                        "name": "Pickup & Press Refresh",
                        "slug": "mtjuliet-pickup-refresh",
                        "price_cents": 2200,
                        "duration_minutes": 45,
                    },
                    {
                        "name": "Delivery Ready Deep Clean",
                        "slug": "mtjuliet-deep-clean",
                        "price_cents": 3600,
                        "duration_minutes": 75,
                    },
                ],
            },
            {
                "name": "Providence Shoe & Dry Care",
                "admin": {
                    "email": "providence.admin@shoeinn.com",
                    "role": "company_admin",
                    "full_name": "Providence Owner Demo",
                },
                "providers": [
                    {
                        "email": "providence.driver@shoeinn.com",
                        "role": "provider",
                        "full_name": "Lucas Providence Driver",
                    },
                ],
                "services": [
                    {
                        "name": "Providence Everyday Clean",
                        "slug": "providence-everyday-clean",
                        "price_cents": 2400,
                        "duration_minutes": 45,
                    },
                    {
                        "name": "Providence Premium Restore",
                        "slug": "providence-premium-restore",
                        "price_cents": 4200,
                        "duration_minutes": 90,
                    },
                ],
            },
            {
                "name": "Golden Bear Clean Run",
                "admin": {
                    "email": "goldenbear.admin@shoeinn.com",
                    "role": "company_admin",
                    "full_name": "Golden Bear Owner Demo",
                },
                "providers": [
                    {
                        "email": "goldenbear.driver@shoeinn.com",
                        "role": "provider",
                        "full_name": "Mia Golden Bear Driver",
                    },
                ],
                "services": [
                    {
                        "name": "Fast Turnaround Refresh",
                        "slug": "goldenbear-fast-refresh",
                        "price_cents": 2100,
                        "duration_minutes": 40,
                    },
                    {
                        "name": "White Pair Recovery",
                        "slug": "goldenbear-white-recovery",
                        "price_cents": 3800,
                        "duration_minutes": 70,
                    },
                ],
            },
        ],
        "appointment_address_offsets": {
            "Mt. Juliet Pickup & Press": 0,
            "Providence Shoe & Dry Care": 2,
            "Golden Bear Clean Run": 4,
        },
    },
}

DEFAULT_DEMO_MARKET = "shelby"


def _all_demo_company_names() -> set[str]:
    return {
        company["name"]
        for demo_market in DEMO_MARKETS.values()
        for company in demo_market["companies"]
    }


def _all_demo_emails() -> set[str]:
    emails = {"admin@shoeinn.com"}
    for demo_market in DEMO_MARKETS.values():
        emails.add(demo_market["customer"]["email"])
        emails.update(user["email"] for user in demo_market["quick_demo_users"].values())
        for company in demo_market["companies"]:
            emails.add(company["admin"]["email"])
            emails.update(provider["email"] for provider in company["providers"])
    return emails


def _select_cluster_address(market: SeedMarket, index: int) -> SeedAddress:
    addresses = market["customer_job_addresses"]
    return addresses[index % len(addresses)]


@router.post("/seed")
def seed(
    reset: bool = False,
    demo_market: Literal["shelby", "mt_juliet"] = DEFAULT_DEMO_MARKET,
    db: Session = Depends(get_db),
):
    if demo_market not in DEMO_MARKETS:
        raise HTTPException(status_code=400, detail="Unsupported demo_market")

    market = DEMO_MARKETS[demo_market]
    main_demo_customer_home = market["customer_job_addresses"][0]
    created = {
        "companies": 0,
        "services": 0,
        "slots": 0,
        "users": 0,
        "company_users": 0,
        "appointments": 0,
        "assignments": 0,
    }

    if reset:
        demo_company_names = _all_demo_company_names()
        demo_emails = _all_demo_emails()
        demo_users = db.query(User).filter(User.email.in_(demo_emails)).all()
        demo_user_ids = [user.id for user in demo_users]
        demo_companies = db.query(Company).filter(Company.name.in_(demo_company_names)).all()
        demo_company_ids = [company.id for company in demo_companies]

        if demo_company_ids:
            demo_appointment_ids = select(Appointment.id).where(Appointment.company_id.in_(demo_company_ids))
            db.query(NotificationEvent).filter(
                NotificationEvent.notification_id.in_(
                    select(Notification.id).where(Notification.company_id.in_(demo_company_ids))
                )
            ).delete(synchronize_session=False)
            db.query(NotificationOutbox).delete(synchronize_session=False)
            db.query(Notification).filter(Notification.company_id.in_(demo_company_ids)).delete(synchronize_session=False)
            db.query(AppointmentEvent).filter(
                AppointmentEvent.appointment_id.in_(demo_appointment_ids)
            ).delete(synchronize_session=False)
            db.query(AppointmentLocationUpdate).filter(
                AppointmentLocationUpdate.appointment_id.in_(demo_appointment_ids)
            ).delete(synchronize_session=False)
            db.query(AppointmentAssignment).filter(
                AppointmentAssignment.appointment_id.in_(demo_appointment_ids)
            ).delete(synchronize_session=False)
            db.query(Appointment).filter(Appointment.company_id.in_(demo_company_ids)).delete(synchronize_session=False)
            db.query(AvailableSlot).filter(AvailableSlot.company_id.in_(demo_company_ids)).delete(synchronize_session=False)
            db.query(AppointmentHold).delete(synchronize_session=False)
            db.query(Service).filter(Service.company_id.in_(demo_company_ids)).delete(synchronize_session=False)
            db.query(CompanyUser).filter(CompanyUser.company_id.in_(demo_company_ids)).delete(synchronize_session=False)
            db.query(Company).filter(Company.id.in_(demo_company_ids)).delete(synchronize_session=False)

        if demo_user_ids:
            db.query(PushToken).filter(PushToken.user_id.in_(demo_user_ids)).delete(synchronize_session=False)
            db.query(RefreshToken).filter(RefreshToken.user_id.in_(demo_user_ids)).delete(synchronize_session=False)
            db.query(User).filter(User.id.in_(demo_user_ids)).delete(synchronize_session=False)

        db.commit()

    def get_or_create_company(name: str) -> Company:
        address = market["company_addresses"][name]
        company = db.query(Company).filter(Company.name == name).first()
        if company:
            company.address_line1 = address["address_line1"]
            company.address_line2 = address["address_line2"]
            company.city = address["city"]
            company.state = address["state"]
            company.postal_code = address["postal_code"]
            return company
        company = Company(
            name=name,
            address_line1=address["address_line1"],
            address_line2=address["address_line2"],
            city=address["city"],
            state=address["state"],
            postal_code=address["postal_code"],
        )
        db.add(company)
        db.flush()
        created["companies"] += 1
        return company

    seeded_companies = {
        company_config["name"]: get_or_create_company(company_config["name"])
        for company_config in market["companies"]
    }

    def get_or_create_service(company_id, name, slug, price_cents, duration_minutes) -> Service:
        service = db.query(Service).filter(Service.slug == slug).first()
        if service:
            service.company_id = company_id
            service.name = name
            service.price_cents = price_cents
            service.duration_minutes = duration_minutes
            return service

        service = Service(
            company_id=company_id,
            name=name,
            slug=slug,
            price_cents=price_cents,
            duration_minutes=duration_minutes,
        )
        db.add(service)
        db.flush()
        created["services"] += 1
        return service

    seeded_services: dict[str, dict[str, Service]] = {}
    for company_config in market["companies"]:
        company = seeded_companies[company_config["name"]]
        seeded_services[company_config["name"]] = {}
        for service_config in company_config["services"]:
            seeded_services[company_config["name"]][service_config["slug"]] = get_or_create_service(
                company.id,
                service_config["name"],
                service_config["slug"],
                service_config["price_cents"],
                service_config["duration_minutes"],
            )

    slot_anchor = datetime.now(timezone.utc).replace(hour=13, minute=0, second=0, microsecond=0)

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

    primary_company_config, secondary_company_config, tertiary_company_config = market["companies"]
    primary_company = seeded_companies[primary_company_config["name"]]
    secondary_company = seeded_companies[secondary_company_config["name"]]
    tertiary_company = seeded_companies[tertiary_company_config["name"]]
    primary_service_one, primary_service_two = primary_company_config["services"]
    secondary_service_one, secondary_service_two = secondary_company_config["services"]
    tertiary_service_one, tertiary_service_two = tertiary_company_config["services"]

    get_or_create_slot(
        primary_company.id,
        seeded_services[primary_company.name][primary_service_one["slug"]].id,
        slot_anchor + timedelta(hours=1),
    )
    get_or_create_slot(
        primary_company.id,
        seeded_services[primary_company.name][primary_service_two["slug"]].id,
        slot_anchor + timedelta(hours=3),
    )
    get_or_create_slot(
        secondary_company.id,
        seeded_services[secondary_company.name][secondary_service_one["slug"]].id,
        slot_anchor + timedelta(hours=2),
    )
    get_or_create_slot(
        tertiary_company.id,
        seeded_services[tertiary_company.name][tertiary_service_one["slug"]].id,
        slot_anchor + timedelta(hours=4),
    )

    def get_or_create_user(email: str, role: str, full_name: str, *, password: str = "Password1!") -> User:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.role = role
            user.full_name = full_name
            user.password_hash = hash_password(password)
            return user

        user = User(
            email=email,
            password_hash=hash_password(password),
            role=role,
            full_name=full_name,
        )
        db.add(user)
        db.flush()
        created["users"] += 1
        return user

    global_admin = get_or_create_user("admin@shoeinn.com", "admin", "ShoeInn Global Admin")
    customer = get_or_create_user(
        market["customer"]["email"],
        market["customer"]["role"],
        market["customer"]["full_name"],
    )
    customer.address_line1 = main_demo_customer_home["address_line1"]
    customer.address_line2 = main_demo_customer_home["address_line2"]
    customer.city = main_demo_customer_home["city"]
    customer.state = main_demo_customer_home["state"]
    customer.postal_code = main_demo_customer_home["postal_code"]
    customer.country = "US"

    quick_demo_users: dict[str, User] = {}
    for key, user_config in market["quick_demo_users"].items():
        quick_demo_users[key] = get_or_create_user(
            user_config["email"],
            user_config["role"],
            user_config["full_name"],
            password="Password123!",
        )

    quick_demo_customer = quick_demo_users.get("customer")
    if quick_demo_customer is not None:
        quick_demo_customer.address_line1 = main_demo_customer_home["address_line1"]
        quick_demo_customer.address_line2 = main_demo_customer_home["address_line2"]
        quick_demo_customer.city = main_demo_customer_home["city"]
        quick_demo_customer.state = main_demo_customer_home["state"]
        quick_demo_customer.postal_code = main_demo_customer_home["postal_code"]
        quick_demo_customer.country = "US"

    company_admins: dict[str, User] = {}
    company_providers: dict[str, list[User]] = {}
    for company_config in market["companies"]:
        company_admins[company_config["name"]] = get_or_create_user(
            company_config["admin"]["email"],
            company_config["admin"]["role"],
            company_config["admin"]["full_name"],
        )
        company_providers[company_config["name"]] = [
            get_or_create_user(provider["email"], provider["role"], provider["full_name"])
            for provider in company_config["providers"]
        ]

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

    for company_config in market["companies"]:
        company = seeded_companies[company_config["name"]]
        ensure_company_user(company_admins[company.name].id, company.id)
        for provider in company_providers[company.name]:
            ensure_company_user(provider.id, company.id)

    primary_quick_demo_company = seeded_companies[market["companies"][0]["name"]]
    quick_demo_provider = quick_demo_users.get("provider")
    if quick_demo_provider is not None:
        ensure_company_user(quick_demo_provider.id, primary_quick_demo_company.id)
    quick_demo_admin = quick_demo_users.get("company_admin")
    if quick_demo_admin is not None:
        ensure_company_user(quick_demo_admin.id, primary_quick_demo_company.id)

    appointment_sequence = {"value": 0}

    def create_demo_appointment(company: Company, service: Service, start_time: datetime, status: AppointmentStatus):
        sequence = appointment_sequence["value"]
        appointment_sequence["value"] += 1
        address = _select_cluster_address(market, market["appointment_address_offsets"][company.name] + sequence)
        appointment = Appointment(
            company_id=company.id,
            service_id=service.id,
            customer_name="Jordan Demo Customer",
            customer_phone="205-555-0110",
            customer_email=customer.email,
            address_line1=address["address_line1"],
            address_line2=address["address_line2"],
            city=address["city"],
            state=address["state"],
            postal_code=address["postal_code"],
            start_time=start_time,
            confirmed_time=start_time - timedelta(hours=1),
            end_time=start_time + timedelta(minutes=service.duration_minutes),
            status=status,
            type="pickup",
        )
        db.add(appointment)
        db.flush()
        created["appointments"] += 1
        return appointment

    appointment_anchor = datetime.now(timezone.utc).replace(hour=9, minute=0, second=0, microsecond=0)

    create_demo_appointment(
        primary_company,
        seeded_services[primary_company.name][primary_service_one["slug"]],
        appointment_anchor + timedelta(hours=1),
        AppointmentStatus.confirmed,
    )
    primary_pickup = create_demo_appointment(
        primary_company,
        seeded_services[primary_company.name][primary_service_one["slug"]],
        appointment_anchor + timedelta(minutes=20),
        AppointmentStatus.en_route_pickup,
    )
    primary_cleaning = create_demo_appointment(
        primary_company,
        seeded_services[primary_company.name][primary_service_two["slug"]],
        appointment_anchor + timedelta(hours=2),
        AppointmentStatus.cleaning,
    )
    primary_ready = create_demo_appointment(
        primary_company,
        seeded_services[primary_company.name][primary_service_two["slug"]],
        appointment_anchor - timedelta(hours=1),
        AppointmentStatus.ready,
    )
    create_demo_appointment(
        secondary_company,
        seeded_services[secondary_company.name][secondary_service_one["slug"]],
        appointment_anchor + timedelta(hours=3),
        AppointmentStatus.confirmed,
    )
    create_demo_appointment(
        secondary_company,
        seeded_services[secondary_company.name][secondary_service_two["slug"]],
        appointment_anchor + timedelta(hours=4),
        AppointmentStatus.confirmed,
    )
    create_demo_appointment(
        tertiary_company,
        seeded_services[tertiary_company.name][tertiary_service_one["slug"]],
        appointment_anchor + timedelta(hours=5),
        AppointmentStatus.confirmed,
    )
    create_demo_appointment(
        tertiary_company,
        seeded_services[tertiary_company.name][tertiary_service_two["slug"]],
        appointment_anchor - timedelta(days=1, hours=2),
        AppointmentStatus.completed,
    )

    primary_providers = company_providers[primary_company.name]
    db.add_all(
        [
            AppointmentAssignment(
                appointment_id=primary_pickup.id,
                user_id=primary_providers[0].id,
                is_active=True,
            ),
            AppointmentAssignment(
                appointment_id=primary_cleaning.id,
                user_id=primary_providers[1].id,
                is_active=True,
            ),
            AppointmentAssignment(
                appointment_id=primary_ready.id,
                user_id=primary_providers[0].id,
                is_active=True,
            ),
        ]
    )
    created["assignments"] += 3

    db.commit()

    status = "ok" if any(v > 0 for v in created.values()) else "skipped"

    return {
        "status": status,
        "created": created,
        "demo_market": demo_market,
        "demo_logins": {
            "global_admin": {"email": global_admin.email, "password": "Password1!", "role": "admin"},
            "mt_juliet_quick_demo": (
                {
                    "customer": {
                        "email": quick_demo_users["customer"].email,
                        "password": "Password123!",
                        "role": quick_demo_users["customer"].role,
                    },
                    "provider": {
                        "email": quick_demo_users["provider"].email,
                        "password": "Password123!",
                        "role": quick_demo_users["provider"].role,
                    },
                    "company_admin": {
                        "email": quick_demo_users["company_admin"].email,
                        "password": "Password123!",
                        "role": quick_demo_users["company_admin"].role,
                    },
                }
                if quick_demo_users
                else None
            ),
            "companies": [
                {
                    "company": primary_company.name,
                    "company_id": str(primary_company.id),
                    "admin": {"email": company_admins[primary_company.name].email, "password": "Password1!"},
                    "providers": [
                        {"email": primary_providers[0].email, "password": "Password1!"},
                        {"email": primary_providers[1].email, "password": "Password1!"},
                    ],
                    "story": {
                        "attention_now": f"Assign {primary_service_one['name']}",
                        "in_progress": "One pickup is en route and one deep clean is already in progress.",
                        "almost_done": "One order is ready for delivery.",
                    },
                },
                {
                    "company": secondary_company.name,
                    "company_id": str(secondary_company.id),
                    "admin": {"email": company_admins[secondary_company.name].email, "password": "Password1!"},
                    "provider": {"email": company_providers[secondary_company.name][0].email, "password": "Password1!"},
                },
                {
                    "company": tertiary_company.name,
                    "company_id": str(tertiary_company.id),
                    "admin": {"email": company_admins[tertiary_company.name].email, "password": "Password1!"},
                    "provider": {"email": company_providers[tertiary_company.name][0].email, "password": "Password1!"},
                },
            ],
            "customer": {"email": customer.email, "password": "Password1!"},
        },
    }
