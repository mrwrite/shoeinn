"""align appointment_location_updates user_id column

Revision ID: e4f6a1b2c3d4
Revises: d3a7c2e4f9ab
Create Date: 2026-04-16 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "e4f6a1b2c3d4"
down_revision = "d3a7c2e4f9ab"
branch_labels = None
depends_on = None


def _column_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {column["name"] for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    columns = _column_names("appointment_location_updates")
    if "company_user_id" in columns and "user_id" not in columns:
        op.alter_column("appointment_location_updates", "company_user_id", new_column_name="user_id")


def downgrade() -> None:
    columns = _column_names("appointment_location_updates")
    if "user_id" in columns and "company_user_id" not in columns:
        op.alter_column("appointment_location_updates", "user_id", new_column_name="company_user_id")
