"""Require full name and add notification read timestamp

Revision ID: add_full_name_and_ntf_read
Revises: 9fefdaea12cf
Create Date: 2025-01-01 00:00:00
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "add_full_name_and_ntf_read"
down_revision: Union[str, Sequence[str], None] = "9fefdaea12cf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column("full_name", existing_type=sa.String(), nullable=False, server_default="")
    op.execute("UPDATE users SET full_name = '' WHERE full_name IS NULL")

    with op.batch_alter_table("notifications") as batch_op:
        batch_op.add_column(sa.Column("read_at", sa.DateTime(timezone=True)))

    with op.batch_alter_table("companies") as batch_op:
        batch_op.add_column(sa.Column("phone", sa.String()))
        batch_op.add_column(sa.Column("email", sa.String()))
        batch_op.add_column(sa.Column("address_line1", sa.String()))
        batch_op.add_column(sa.Column("address_line2", sa.String()))


def downgrade() -> None:
    with op.batch_alter_table("notifications") as batch_op:
        batch_op.drop_column("read_at")

    with op.batch_alter_table("companies") as batch_op:
        batch_op.drop_column("address_line2")
        batch_op.drop_column("address_line1")
        batch_op.drop_column("email")
        batch_op.drop_column("phone")

    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column("full_name", existing_type=sa.String(), nullable=True, server_default=None)
