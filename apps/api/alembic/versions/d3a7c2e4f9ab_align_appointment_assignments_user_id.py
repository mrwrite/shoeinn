"""align appointment_assignments user_id column

Revision ID: d3a7c2e4f9ab
Revises: b947fc51ff2a
Create Date: 2026-04-14 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "d3a7c2e4f9ab"
down_revision = "b947fc51ff2a"
branch_labels = None
depends_on = None


def _column_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {column["name"] for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    columns = _column_names("appointment_assignments")
    if "company_user_id" in columns and "user_id" not in columns:
        op.alter_column("appointment_assignments", "company_user_id", new_column_name="user_id")


def downgrade() -> None:
    columns = _column_names("appointment_assignments")
    if "user_id" in columns and "company_user_id" not in columns:
        op.alter_column("appointment_assignments", "user_id", new_column_name="company_user_id")
