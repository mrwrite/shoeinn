"""add customer notification preference fields

Revision ID: f2c4b9e8d123
Revises: dee02c1bc9c1
Create Date: 2026-04-13 14:10:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f2c4b9e8d123"
down_revision: Union[str, Sequence[str], None] = "dee02c1bc9c1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("customer_push_enabled", sa.Boolean(), nullable=False, server_default=sa.true()))
        batch_op.add_column(
            sa.Column("customer_push_assignment_updates", sa.Boolean(), nullable=False, server_default=sa.true())
        )
        batch_op.add_column(
            sa.Column("customer_push_milestone_updates", sa.Boolean(), nullable=False, server_default=sa.true())
        )


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("customer_push_milestone_updates")
        batch_op.drop_column("customer_push_assignment_updates")
        batch_op.drop_column("customer_push_enabled")
