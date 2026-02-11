"""add address fields to appointment_holds

Revision ID: a1b2c3d4e5f6
Revises: 3f2c7f8a9b10
Create Date: 2026-02-10 00:00:00
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "3f2c7f8a9b10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("appointment_holds") as batch_op:
        batch_op.add_column(sa.Column("address_line1", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("address_line2", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("city", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("state", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("postal_code", sa.String(length=20), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("appointment_holds") as batch_op:
        batch_op.drop_column("postal_code")
        batch_op.drop_column("state")
        batch_op.drop_column("city")
        batch_op.drop_column("address_line2")
        batch_op.drop_column("address_line1")
