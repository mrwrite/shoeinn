"""add company_id to appointment_location_updates

Revision ID: 3f2c7f8a9b10
Revises: bf4bf39c2de6
Create Date: 2026-02-10 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "3f2c7f8a9b10"
down_revision = "bf4bf39c2de6"
branch_labels = None
depends_on = None


def _column_exists(bind: sa.engine.Connection, table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(bind)
    columns = inspector.get_columns(table_name)
    return any(column["name"] == column_name for column in columns)


def upgrade() -> None:
    bind = op.get_bind()

    if not _column_exists(bind, "appointment_location_updates", "company_id"):
        op.add_column(
            "appointment_location_updates",
            sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=True),
        )

    op.execute(
        """
        UPDATE appointment_location_updates AS alu
        SET company_id = a.company_id
        FROM appointments AS a
        WHERE alu.appointment_id = a.id
          AND alu.company_id IS NULL
        """
    )

    op.alter_column("appointment_location_updates", "company_id", nullable=False)

    fk_names = {
        fk["name"]
        for fk in sa.inspect(bind).get_foreign_keys("appointment_location_updates")
        if fk.get("name")
    }
    if "fk_appointment_location_updates_company_id" not in fk_names:
        op.create_foreign_key(
            "fk_appointment_location_updates_company_id",
            "appointment_location_updates",
            "companies",
            ["company_id"],
            ["id"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    fk_names = {
        fk["name"]
        for fk in sa.inspect(bind).get_foreign_keys("appointment_location_updates")
        if fk.get("name")
    }
    if "fk_appointment_location_updates_company_id" in fk_names:
        op.drop_constraint(
            "fk_appointment_location_updates_company_id",
            "appointment_location_updates",
            type_="foreignkey",
        )

    if _column_exists(bind, "appointment_location_updates", "company_id"):
        op.drop_column("appointment_location_updates", "company_id")
