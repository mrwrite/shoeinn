"""Reset schema for booking MVP and seed services."""

from __future__ import annotations

from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "4a1bcb0f1b8d"
down_revision = "3c4e9b4f2d0c"
branch_labels = None
depends_on = None


SEED_SERVICES = [
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


TABLES_TO_DROP = [
    "notification_events",
    "notification_outbox",
    "notifications",
    "available_slots",
    "appointment_holds",
    "appointments",
    "company_users",
    "user_refresh_tokens",
    "services",
    "companies",
    "users",
]


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    for table in TABLES_TO_DROP:
        if _table_exists(table):
            op.drop_table(table)

    hold_status = postgresql.ENUM(
        "PENDING", "EXPIRED", "CONFIRMED", name="holdstatus", create_type=False
    )
    hold_status.create(op.get_bind(), checkfirst=True)

    timestamp_default = sa.text("timezone('utc', now())")

    op.create_table(
        "services",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("price_cents", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=timestamp_default),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=timestamp_default),
    )
    op.create_index("ix_services_active_name", "services", ["is_active", "name"])
    op.create_index("ix_services_slug", "services", ["slug"], unique=True)

    op.create_table(
        "appointment_holds",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("service_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("services.id"), nullable=False),
        sa.Column("customer_name", sa.String(length=255), nullable=True),
        sa.Column("customer_phone", sa.String(length=50), nullable=True),
        sa.Column("customer_email", sa.String(length=255), nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ttl_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", hold_status, nullable=False, server_default="PENDING"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=timestamp_default),
    )

    op.create_table(
        "appointments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("service_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("services.id"), nullable=False),
        sa.Column("customer_name", sa.String(length=255), nullable=False),
        sa.Column("customer_phone", sa.String(length=50), nullable=False),
        sa.Column("customer_email", sa.String(length=255), nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=timestamp_default),
    )
    op.create_index("ix_appointments_start_time", "appointments", ["start_time"])

    op.create_table(
        "notification_outbox",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("type", sa.String(length=255), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=timestamp_default),
    )

    services_table = sa.table(
        "services",
        sa.column("name", sa.String(length=255)),
        sa.column("slug", sa.String(length=255)),
        sa.column("description", sa.Text()),
        sa.column("duration_minutes", sa.Integer()),
        sa.column("price_cents", sa.Integer()),
        sa.column("is_active", sa.Boolean()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )

    bind = op.get_bind()
    count = bind.execute(sa.text("SELECT COUNT(*) FROM services")).scalar()
    if not count:
        now = datetime.now(timezone.utc)
        op.bulk_insert(
            services_table,
            [
                {
                    **service,
                    "is_active": True,
                    "created_at": now,
                    "updated_at": now,
                }
                for service in SEED_SERVICES
            ],
        )


def downgrade() -> None:
    op.drop_table("notification_outbox")
    op.drop_index("ix_appointments_start_time", table_name="appointments")
    op.drop_table("appointments")
    op.drop_table("appointment_holds")
    op.drop_index("ix_services_slug", table_name="services")
    op.drop_index("ix_services_active_name", table_name="services")
    op.drop_table("services")

    hold_status = postgresql.ENUM(name="holdstatus")
    hold_status.drop(op.get_bind(), checkfirst=True)
