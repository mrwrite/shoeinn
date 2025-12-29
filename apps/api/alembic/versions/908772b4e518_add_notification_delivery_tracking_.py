"""add notification delivery tracking columns

Revision ID: 908772b4e518
Revises: ef4fe710e88a
Create Date: 2025-12-29 07:39:46.387678

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '908772b4e518'
down_revision: Union[str, Sequence[str], None] = 'ef4fe710e88a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    with op.batch_alter_table("notifications") as batch_op:
        # retry / delivery tracking
        batch_op.add_column(sa.Column("delivery_attempts", sa.Integer(), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("last_attempt_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=True))

        # failure tracking
        batch_op.add_column(sa.Column("last_error_code", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("last_error_message", sa.String(length=1024), nullable=True))
        batch_op.add_column(sa.Column("last_error_at", sa.DateTime(timezone=True), nullable=True))

        # dead letter + metadata
        batch_op.add_column(sa.Column("dead_lettered", sa.Boolean(), nullable=False, server_default=sa.text("false")))
        batch_op.add_column(sa.Column("metadata_json", sa.Text(), nullable=True))

    # Optional: remove server defaults after backfill so app logic owns defaults going forward
    with op.batch_alter_table("notifications") as batch_op:
        batch_op.alter_column("delivery_attempts", server_default=None)
        batch_op.alter_column("dead_lettered", server_default=None)


def downgrade():
    with op.batch_alter_table("notifications") as batch_op:
        batch_op.drop_column("metadata_json")
        batch_op.drop_column("dead_lettered")
        batch_op.drop_column("last_error_at")
        batch_op.drop_column("last_error_message")
        batch_op.drop_column("last_error_code")
        batch_op.drop_column("next_attempt_at")
        batch_op.drop_column("last_attempt_at")
        batch_op.drop_column("delivery_attempts")
