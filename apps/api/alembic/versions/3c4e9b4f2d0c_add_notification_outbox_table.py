"""create notification outbox table

Revision ID: 3c4e9b4f2d0c
Revises: 2a4ddf5085d7
Create Date: 2024-07-05 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "3c4e9b4f2d0c"
down_revision = "2a4ddf5085d7"
branch_labels = None
depends_on = None


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    if _table_exists("notification_outbox"):
        return

    op.create_table(
        "notification_outbox",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "notification_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("notifications.id"),
            nullable=False,
        ),
        sa.Column("status", sa.String(), server_default=sa.text("'pending'"), nullable=False),
        sa.Column("channel", sa.String(), nullable=False),
        sa.Column("target", sa.String()),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.Column("available_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("locked_at", sa.DateTime(timezone=True)),
        sa.Column("processed_at", sa.DateTime(timezone=True)),
        sa.Column("dead_letter_reason", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index(
        "ix_notification_outbox_notification_id",
        "notification_outbox",
        ["notification_id"],
    )


def downgrade() -> None:
    if not _table_exists("notification_outbox"):
        return

    op.drop_index("ix_notification_outbox_notification_id", table_name="notification_outbox")
    op.drop_table("notification_outbox")
