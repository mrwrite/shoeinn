from datetime import datetime, timedelta, timezone
from typing import TypedDict

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import hash_password
from app.enums import AppointmentStatus
from app.models.appointment import Appointment
from app.models.appointment_assignment import AppointmentAssignment
from app.models.appointment_event import AppointmentEvent
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


DEMO_COMPANY_ADDRESSES: dict[str, SeedAddress] = {
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
}

DEMO_CUSTOMER_JOB_ADDRESSES: list[SeedAddress] = [
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
]

MAIN_DEMO_CUSTOMER_HOME: SeedAddress = DEMO_CUSTOMER_JOB_ADDRESSES[0]


def _select_cluster_address(index: int) -> SeedAddress:
    return DEMO_CUSTOMER_JOB_ADDRESSES[index % len(DEMO_CUSTOMER_JOB_ADDRESSES)]


@router.post("/seed")
def seed(reset: bool = False, db: Session = Depends(get_db)):
    created = {
        "companies": 0,
        "services": 0,
        "slots": 0,
        "users": 0,
        "company_users": 0,
        "appointments": 0,
        "assignments": 0,
    }

    demo_company_names = {
        "Pelham Pickup & Press",
        "Helena Shoe & Dry Care",
        "Alabaster Clean Run",
    }
    demo_emails = {
        "admin@shoeinn.com",
        "pelham.admin@shoeinn.com",
        "pelham.driver1@shoeinn.com",
        "pelham.driver2@shoeinn.com",
        "helena.admin@shoeinn.com",
        "helena.driver@shoeinn.com",
        "alabaster.admin@shoeinn.com",
        "alabaster.driver@shoeinn.com",
        "customer@shoeinn.com",
    }

    if reset:
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
            db.query(Service).filter(Service.company_id.in_(demo_company_ids)).delete(synchronize_session=False)
            db.query(CompanyUser).filter(CompanyUser.company_id.in_(demo_company_ids)).delete(synchronize_session=False)
            db.query(Company).filter(Company.id.in_(demo_company_ids)).delete(synchronize_session=False)

        if demo_user_ids:
            db.query(PushToken).filter(PushToken.user_id.in_(demo_user_ids)).delete(synchronize_session=False)
            db.query(RefreshToken).filter(RefreshToken.user_id.in_(demo_user_ids)).delete(synchronize_session=False)
            db.query(User).filter(User.id.in_(demo_user_ids)).delete(synchronize_session=False)

        db.commit()

    def get_or_create_company(name: str) -> Company:
        address = DEMO_COMPANY_ADDRESSES[name]
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

    pelham = get_or_create_company("Pelham Pickup & Press")
    helena = get_or_create_company("Helena Shoe & Dry Care")
    alabaster = get_or_create_company("Alabaster Clean Run")

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

    pelham_refresh = get_or_create_service(pelham.id, "Pickup & Press Refresh", "pelham-pickup-refresh", 2200, 45)
    pelham_deep = get_or_create_service(pelham.id, "Delivery Ready Deep Clean", "pelham-deep-clean", 3600, 75)
    helena_everyday = get_or_create_service(helena.id, "Helena Everyday Clean", "helena-everyday-clean", 2400, 45)
    helena_premium = get_or_create_service(helena.id, "Helena Premium Restore", "helena-premium-restore", 4200, 90)
    alabaster_fast = get_or_create_service(alabaster.id, "Fast Turnaround Refresh", "alabaster-fast-refresh", 2100, 40)
    alabaster_white = get_or_create_service(alabaster.id, "White Pair Recovery", "alabaster-white-recovery", 3800, 70)

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

    get_or_create_slot(pelham.id, pelham_refresh.id, slot_anchor + timedelta(hours=1))
    get_or_create_slot(pelham.id, pelham_deep.id, slot_anchor + timedelta(hours=3))
    get_or_create_slot(helena.id, helena_everyday.id, slot_anchor + timedelta(hours=2))
    get_or_create_slot(alabaster.id, alabaster_fast.id, slot_anchor + timedelta(hours=4))

    def get_or_create_user(email: str, role: str, full_name: str) -> User:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.role = role
            user.full_name = full_name
            return user

        user = User(
            email=email,
            password_hash=hash_password("Password1!"),
            role=role,
            full_name=full_name,
        )
        db.add(user)
        db.flush()
        created["users"] += 1
        return user

    global_admin = get_or_create_user("admin@shoeinn.com", "admin", "ShoeInn Global Admin")
    pelham_admin = get_or_create_user("pelham.admin@shoeinn.com", "company_admin", "Pelham Owner Demo")
    pelham_driver_one = get_or_create_user("pelham.driver1@shoeinn.com", "provider", "Mason Route Lead")
    pelham_driver_two = get_or_create_user("pelham.driver2@shoeinn.com", "provider", "Ava Delivery Lead")
    helena_admin = get_or_create_user("helena.admin@shoeinn.com", "company_admin", "Helena Owner Demo")
    helena_driver = get_or_create_user("helena.driver@shoeinn.com", "provider", "Noah Helena Driver")
    alabaster_admin = get_or_create_user("alabaster.admin@shoeinn.com", "company_admin", "Alabaster Owner Demo")
    alabaster_driver = get_or_create_user("alabaster.driver@shoeinn.com", "provider", "Liam Alabaster Driver")
    customer = get_or_create_user("customer@shoeinn.com", "customer", "Jordan Demo Customer")
    customer.address_line1 = MAIN_DEMO_CUSTOMER_HOME["address_line1"]
    customer.address_line2 = MAIN_DEMO_CUSTOMER_HOME["address_line2"]
    customer.city = MAIN_DEMO_CUSTOMER_HOME["city"]
    customer.state = MAIN_DEMO_CUSTOMER_HOME["state"]
    customer.postal_code = MAIN_DEMO_CUSTOMER_HOME["postal_code"]
    customer.country = "US"

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

    ensure_company_user(pelham_admin.id, pelham.id)
    ensure_company_user(pelham_driver_one.id, pelham.id)
    ensure_company_user(pelham_driver_two.id, pelham.id)
    ensure_company_user(helena_admin.id, helena.id)
    ensure_company_user(helena_driver.id, helena.id)
    ensure_company_user(alabaster_admin.id, alabaster.id)
    ensure_company_user(alabaster_driver.id, alabaster.id)

    appointment_address_offsets: dict[str, int] = {
        "Pelham Pickup & Press": 0,
        "Helena Shoe & Dry Care": 2,
        "Alabaster Clean Run": 4,
    }
    appointment_sequence = {"value": 0}

    def create_demo_appointment(company: Company, service: Service, start_time: datetime, status: AppointmentStatus):
        sequence = appointment_sequence["value"]
        appointment_sequence["value"] += 1
        address = _select_cluster_address(appointment_address_offsets[company.name] + sequence)
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

    pelham_unassigned = create_demo_appointment(
        pelham,
        pelham_refresh,
        appointment_anchor + timedelta(hours=1),
        AppointmentStatus.confirmed,
    )
    pelham_pickup = create_demo_appointment(
        pelham,
        pelham_refresh,
        appointment_anchor + timedelta(minutes=20),
        AppointmentStatus.en_route_pickup,
    )
    pelham_cleaning = create_demo_appointment(
        pelham,
        pelham_deep,
        appointment_anchor + timedelta(hours=2),
        AppointmentStatus.cleaning,
    )
    pelham_ready = create_demo_appointment(
        pelham,
        pelham_deep,
        appointment_anchor - timedelta(hours=1),
        AppointmentStatus.ready,
    )
    create_demo_appointment(
        helena,
        helena_everyday,
        appointment_anchor + timedelta(hours=3),
        AppointmentStatus.confirmed,
    )
    create_demo_appointment(
        helena,
        helena_premium,
        appointment_anchor + timedelta(hours=4),
        AppointmentStatus.confirmed,
    )
    create_demo_appointment(
        alabaster,
        alabaster_fast,
        appointment_anchor + timedelta(hours=5),
        AppointmentStatus.confirmed,
    )
    create_demo_appointment(
        alabaster,
        alabaster_white,
        appointment_anchor - timedelta(days=1, hours=2),
        AppointmentStatus.completed,
    )

    db.add_all(
        [
            AppointmentAssignment(
                appointment_id=pelham_pickup.id,
                user_id=pelham_driver_one.id,
                is_active=True,
            ),
            AppointmentAssignment(
                appointment_id=pelham_cleaning.id,
                user_id=pelham_driver_two.id,
                is_active=True,
            ),
            AppointmentAssignment(
                appointment_id=pelham_ready.id,
                user_id=pelham_driver_one.id,
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
        "demo_logins": {
            "global_admin": {"email": global_admin.email, "password": "Password1!", "role": "admin"},
            "companies": [
                {
                    "company": pelham.name,
                    "company_id": str(pelham.id),
                    "admin": {"email": pelham_admin.email, "password": "Password1!"},
                    "providers": [
                        {"email": pelham_driver_one.email, "password": "Password1!"},
                        {"email": pelham_driver_two.email, "password": "Password1!"},
                    ],
                    "story": {
                        "attention_now": f"Assign {pelham_refresh.name}",
                        "in_progress": "One pickup is en route and one deep clean is already in progress.",
                        "almost_done": "One order is ready for delivery.",
                    },
                },
                {
                    "company": helena.name,
                    "company_id": str(helena.id),
                    "admin": {"email": helena_admin.email, "password": "Password1!"},
                    "provider": {"email": helena_driver.email, "password": "Password1!"},
                },
                {
                    "company": alabaster.name,
                    "company_id": str(alabaster.id),
                    "admin": {"email": alabaster_admin.email, "password": "Password1!"},
                    "provider": {"email": alabaster_driver.email, "password": "Password1!"},
                },
            ],
            "customer": {"email": customer.email, "password": "Password1!"},
        },
    }
