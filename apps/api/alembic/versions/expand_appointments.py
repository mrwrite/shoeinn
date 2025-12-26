"""Expand appointments for provider ops and events."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "expand_appointments"
down_revision = "4a1bcb0f1b8d"
branch_labels = None
depends_on = None


NEW_STATUS_VALUES = [
    "requested",
    "confirmed",
    "picked_up",
    "cleaning",
    "ready",
    "delivered",
    "completed",
    "cancelled",
]


def upgrade() -> None:
    # update status enum
    old_status = postgresql.ENUM("PENDING", "CONFIRMED", "CANCELLED", name="appointmentstatus")
    op.execute("ALTER TYPE appointmentstatus RENAME TO appointmentstatus_old")
    new_status = postgresql.ENUM(*NEW_STATUS_VALUES, name="appointmentstatus")
    new_status.create(op.get_bind(), checkfirst=False)
    op.alter_column(
        "appointments",
        "status",
        type_=new_status,
        postgresql_using=(
            "CASE "
            "WHEN status='PENDING' THEN 'requested' "
            "WHEN status='CONFIRMED' THEN 'confirmed' "
            "WHEN status='CANCELLED' THEN 'cancelled' "
            "ELSE lower(status::text) END::appointmentstatus"
        ),
        existing_type=old_status,
        existing_nullable=False,
    )
    op.alter_column(
        "appointments",
        "status",
        existing_type=new_status,
        server_default="requested",
    )
    op.execute("DROP TYPE appointmentstatus_old")

    op.add_column("appointments", sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("appointments", sa.Column("type", sa.String(length=50), nullable=False, server_default="pickup"))
    op.add_column("appointments", sa.Column("address_line1", sa.String(length=255), nullable=True))
    op.add_column("appointments", sa.Column("address_line2", sa.String(length=255), nullable=True))
    op.add_column("appointments", sa.Column("city", sa.String(length=100), nullable=True))
    op.add_column("appointments", sa.Column("state", sa.String(length=100), nullable=True))
    op.add_column("appointments", sa.Column("postal_code", sa.String(length=20), nullable=True))
    op.add_column("appointments", sa.Column("confirmed_time", sa.DateTime(timezone=True), nullable=True))
    op.alter_column("appointments", "end_time", existing_type=sa.DateTime(timezone=True), nullable=True)
    op.add_column(
        "appointments",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("timezone('utc', now())"),
        ),
    )
    op.create_foreign_key(
        "fk_appointments_company",
        "appointments",
        "companies",
        ["company_id"],
        ["id"],
    )
    op.create_index("ix_appointments_company_status", "appointments", ["company_id", "status"])
    op.create_index("ix_appointments_start_time", "appointments", ["start_time"])

    # backfill status and updated_at
    op.execute("UPDATE appointments SET status='requested' WHERE status IS NULL")
    op.execute("UPDATE appointments SET updated_at = created_at WHERE updated_at IS NULL")

    # service company relation
    op.add_column("services", sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index("ix_services_company", "services", ["company_id"])
    op.create_foreign_key(
        "fk_services_company",
        "services",
        "companies",
        ["company_id"],
        ["id"],
    )

    # appointment events table
    op.create_table(
        "appointment_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("appointment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("appointments.id"), nullable=False),
        sa.Column("kind", sa.String(length=50), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("timezone('utc', now())")),
    )


def downgrade() -> None:
    op.drop_table("appointment_events")

    op.drop_constraint("fk_services_company", "services", type_="foreignkey")
    op.drop_index("ix_services_company", table_name="services")
    op.drop_column("services", "company_id")

    op.drop_index("ix_appointments_start_time", table_name="appointments")
    op.drop_index("ix_appointments_company_status", table_name="appointments")
    op.drop_constraint("fk_appointments_company", "appointments", type_="foreignkey")
    op.drop_column("appointments", "updated_at")
    op.alter_column("appointments", "end_time", existing_type=sa.DateTime(timezone=True), nullable=False)
    op.drop_column("appointments", "confirmed_time")
    op.drop_column("appointments", "postal_code")
    op.drop_column("appointments", "state")
    op.drop_column("appointments", "city")
    op.drop_column("appointments", "address_line2")
    op.drop_column("appointments", "address_line1")
    op.drop_column("appointments", "type")
    op.drop_column("appointments", "company_id")

    # revert enum
    new_status = postgresql.ENUM(*NEW_STATUS_VALUES, name="appointmentstatus")
    op.execute("ALTER TYPE appointmentstatus RENAME TO appointmentstatus_new")
    old_status = postgresql.ENUM("PENDING", "CONFIRMED", "CANCELLED", name="appointmentstatus")
    old_status.create(op.get_bind())
    op.alter_column(
        "appointments",
        "status",
        type_=old_status,
        postgresql_using="upper(status::text)::appointmentstatus",
        existing_type=new_status,
        existing_nullable=False,
    )
    op.execute("DROP TYPE appointmentstatus_new")
