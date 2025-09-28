"""service_id to UUID on appointment_holds

Revision ID: c91a101b30b9
Revises: 0002
Create Date: 2025-09-28 07:58:39.891269

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c91a101b30b9'
down_revision: Union[str, Sequence[str], None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Drop foreign keys that depend on the services.id column so we can
    # safely change the type across the related tables.
    op.drop_constraint(
        "appointment_holds_service_id_fkey",
        "appointment_holds",
        type_="foreignkey",
    )
    op.drop_constraint(
        "available_slots_service_id_fkey",
        "available_slots",
        type_="foreignkey",
    )
    op.drop_constraint(
        "appointments_service_id_fkey",
        "appointments",
        type_="foreignkey",
    )

    # Unique constraints referencing service_id need to be recreated after the
    # type change.
    op.drop_constraint(
        "uq_appointment_holds_company_service_time",
        "appointment_holds",
        type_="unique",
    )
    op.drop_constraint(
        "uq_available_slots_company_service_time",
        "available_slots",
        type_="unique",
    )

    # Convert services.id to a UUID column so all related foreign keys can
    # reference the UUID primary key.
    op.alter_column(
        "services",
        "id",
        existing_type=sa.String(),
        type_=postgresql.UUID(as_uuid=True),
        postgresql_using="id::uuid",
        existing_nullable=False,
    )

    # Update foreign key columns referencing services.id to UUID.
    op.alter_column(
        "appointment_holds",
        "service_id",
        existing_type=sa.String(),
        type_=postgresql.UUID(as_uuid=True),
        postgresql_using="service_id::uuid",
        existing_nullable=True,
    )
    op.alter_column(
        "available_slots",
        "service_id",
        existing_type=sa.String(),
        type_=postgresql.UUID(as_uuid=True),
        postgresql_using="service_id::uuid",
        existing_nullable=True,
    )
    op.alter_column(
        "appointments",
        "service_id",
        existing_type=sa.String(),
        type_=postgresql.UUID(as_uuid=True),
        postgresql_using="service_id::uuid",
        existing_nullable=True,
    )

    # Recreate the unique constraints and foreign keys with the new UUID types.
    op.create_unique_constraint(
        "uq_appointment_holds_company_service_time",
        "appointment_holds",
        ["company_id", "service_id", "start_time_utc"],
    )
    op.create_unique_constraint(
        "uq_available_slots_company_service_time",
        "available_slots",
        ["company_id", "service_id", "start_time_utc"],
    )
    op.create_foreign_key(
        "appointment_holds_service_id_fkey",
        "appointment_holds",
        "services",
        ["service_id"],
        ["id"],
    )
    op.create_foreign_key(
        "available_slots_service_id_fkey",
        "available_slots",
        "services",
        ["service_id"],
        ["id"],
    )
    op.create_foreign_key(
        "appointments_service_id_fkey",
        "appointments",
        "services",
        ["service_id"],
        ["id"],
    )

def downgrade():
    op.drop_constraint(
        "appointments_service_id_fkey",
        "appointments",
        type_="foreignkey",
    )
    op.drop_constraint(
        "available_slots_service_id_fkey",
        "available_slots",
        type_="foreignkey",
    )
    op.drop_constraint(
        "appointment_holds_service_id_fkey",
        "appointment_holds",
        type_="foreignkey",
    )

    op.drop_constraint(
        "uq_available_slots_company_service_time",
        "available_slots",
        type_="unique",
    )
    op.drop_constraint(
        "uq_appointment_holds_company_service_time",
        "appointment_holds",
        type_="unique",
    )

    op.alter_column(
        "appointments",
        "service_id",
        existing_type=postgresql.UUID(as_uuid=True),
        type_=sa.String(),
        postgresql_using="service_id::text",
        existing_nullable=True,
    )
    op.alter_column(
        "available_slots",
        "service_id",
        existing_type=postgresql.UUID(as_uuid=True),
        type_=sa.String(),
        postgresql_using="service_id::text",
        existing_nullable=True,
    )
    op.alter_column(
        "appointment_holds",
        "service_id",
        existing_type=postgresql.UUID(as_uuid=True),
        type_=sa.String(),
        postgresql_using="service_id::text",
        existing_nullable=True,
    )
    op.alter_column(
        "services",
        "id",
        existing_type=postgresql.UUID(as_uuid=True),
        type_=sa.String(),
        postgresql_using="id::text",
        existing_nullable=False,
    )

    op.create_unique_constraint(
        "uq_appointment_holds_company_service_time",
        "appointment_holds",
        ["company_id", "service_id", "start_time_utc"],
    )
    op.create_unique_constraint(
        "uq_available_slots_company_service_time",
        "available_slots",
        ["company_id", "service_id", "start_time_utc"],
    )
    op.create_foreign_key(
        "appointment_holds_service_id_fkey",
        "appointment_holds",
        "services",
        ["service_id"],
        ["id"],
    )
    op.create_foreign_key(
        "available_slots_service_id_fkey",
        "available_slots",
        "services",
        ["service_id"],
        ["id"],
    )
    op.create_foreign_key(
        "appointments_service_id_fkey",
        "appointments",
        "services",
        ["service_id"],
        ["id"],
    )
