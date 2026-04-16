"""Add tracking models and travel statuses

Revision ID: bf4bf39c2de6
Revises: 6c3de5f6a7d9
Create Date: 2026-01-01 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "bf4bf39c2de6"
down_revision = "6c3de5f6a7d9"
branch_labels = None
depends_on = None

NEW_STATUSES = [
    "requested",
    "confirmed",
    "en_route_pickup",
    "picked_up",
    "cleaning",
    "ready",
    "out_for_delivery",
    "delivered",
    "completed",
    "cancelled",
]


OLD_STATUSES = [
    "requested",
    "confirmed",
    "picked_up",
    "cleaning",
    "ready",
    "delivered",
    "completed",
    "cancelled",
]


def upgrade():
    bind = op.get_bind()

    if bind.dialect.name == "postgresql":
        op.execute("ALTER TYPE appointmentstatus RENAME TO appointmentstatus_old")
        new_enum = postgresql.ENUM(*NEW_STATUSES, name="appointmentstatus")
        new_enum.create(bind, checkfirst=False)
        op.execute("""
        ALTER TABLE appointments
        ALTER COLUMN status DROP DEFAULT
        """)

        op.execute("""
        ALTER TABLE appointments
        ALTER COLUMN status TYPE appointmentstatus
        USING status::text::appointmentstatus
        """)

        op.execute("""
        ALTER TABLE appointments
        ALTER COLUMN status SET DEFAULT 'requested'
        """)
        op.execute("DROP TYPE appointmentstatus_old")
    else:
        appointmentstatus = sa.Enum(*NEW_STATUSES, name="appointmentstatus")
        appointmentstatus.create(bind, checkfirst=True)

    op.create_table(
        "appointment_assignments",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("appointment_id", sa.Uuid(), sa.ForeignKey("appointments.id"), nullable=False),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("timezone('utc', now())")),
        sa.Column("unassigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )

    op.create_index(
        "ix_appointment_assignments_active",
        "appointment_assignments",
        ["appointment_id"],
        unique=True,
        postgresql_where=sa.text("is_active"),
        sqlite_where=sa.text("is_active = 1"),
    )

    op.create_table(
        "appointment_location_updates",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("appointment_id", sa.Uuid(), sa.ForeignKey("appointments.id"), nullable=False),
        sa.Column("company_user_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("heading", sa.Float(), nullable=True),
        sa.Column("speed", sa.Float(), nullable=True),
        sa.Column("accuracy", sa.Float(), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("timezone('utc', now())")),
    )
    op.create_index(
        "ix_location_updates_appt_time",
        "appointment_location_updates",
        ["appointment_id", sa.text("recorded_at DESC")],
    )


def downgrade():
    op.drop_index("ix_location_updates_appt_time", table_name="appointment_location_updates")
    op.drop_table("appointment_location_updates")

    op.drop_index("ix_appointment_assignments_active", table_name="appointment_assignments")
    op.drop_table("appointment_assignments")

    bind = op.get_bind()

    if bind.dialect.name == "postgresql":
        op.execute("ALTER TYPE appointmentstatus RENAME TO appointmentstatus_new")
        old_enum = postgresql.ENUM(*OLD_STATUSES, name="appointmentstatus")
        old_enum.create(bind, checkfirst=False)
        op.execute(
            """
            ALTER TABLE appointments
            ALTER COLUMN status TYPE appointmentstatus
            USING status::text::appointmentstatus
            """
        )
        op.execute("DROP TYPE appointmentstatus_new")
    else:
        appointmentstatus = sa.Enum(*NEW_STATUSES, name="appointmentstatus")
        appointmentstatus.drop(bind, checkfirst=True)
        old_enum = sa.Enum(*OLD_STATUSES, name="appointmentstatus")
        old_enum.create(bind, checkfirst=True)
