import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "appointment_holds",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("customer_id", sa.String(), nullable=False),
        sa.Column("company_id", sa.String(), nullable=False),
        sa.Column("service_id", sa.String(), nullable=True),
        sa.Column("start_time_utc", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"]),
        sa.UniqueConstraint("company_id", "service_id", "start_time_utc", name="uq_appointment_holds_company_service_time"),
    )
    op.create_index("ix_appointment_holds_expires", "appointment_holds", ["expires_at"])

    op.create_table(
        "available_slots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("company_id", sa.String(), nullable=False),
        sa.Column("service_id", sa.String(), nullable=True),
        sa.Column("start_time_utc", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_available", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_booked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"]),
        sa.UniqueConstraint("company_id", "service_id", "start_time_utc", name="uq_available_slots_company_service_time"),
    )
    op.create_index("ix_available_slots_company_time", "available_slots", ["company_id", "start_time_utc"])

    op.create_unique_constraint("uq_appointments_company_start_time", "appointments", ["company_id", "start_time_utc"])


def downgrade():
    op.drop_constraint("uq_appointments_company_start_time", "appointments", type_="unique")
    op.drop_index("ix_available_slots_company_time", table_name="available_slots")
    op.drop_table("available_slots")
    op.drop_index("ix_appointment_holds_expires", table_name="appointment_holds")
    op.drop_table("appointment_holds")
