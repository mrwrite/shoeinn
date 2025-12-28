"""Ensure cancelled status exists on appointmentstatus enum

"""Ensure cancelled status exists on appointmentstatus enum.

Revision ID: add_cancelled_status
Revises: dee02c1bc9c1
Create Date: 2024-01-01 00:00:00
"""
from typing import Union

from alembic import op

revision: str = "add_cancelled_status"
down_revision: Union[str, None] = "dee02c1bc9c1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE appointmentstatus ADD VALUE IF NOT EXISTS 'cancelled'")


def downgrade() -> None:
    # Cannot easily remove enum values in Postgres
    pass
