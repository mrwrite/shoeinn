"""upgrade notification_outbox schema

Revision ID: 5211f498c75b
Revises: 908772b4e518
Create Date: 2025-12-29 07:44:12.109898

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5211f498c75b'
down_revision: Union[str, Sequence[str], None] = '908772b4e518'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 0) DEV CLEANUP (recommended): existing outbox rows can't be mapped to notification_id
    # Delete before enforcing NOT NULL.
    op.execute("DELETE FROM notification_outbox")

    with op.batch_alter_table("notification_outbox") as batch_op:
        # Rename old columns to match expected names (optional)
        # If you already renamed, you can remove these lines.
        if _has_column("notification_outbox", "type"):
            batch_op.alter_column("type", new_column_name="kind")
        if _has_column("notification_outbox", "payload"):
            batch_op.alter_column("payload", new_column_name="payload_json")

        # 1) Add notification_id as NULLABLE first
        batch_op.add_column(sa.Column("notification_id", postgresql.UUID(as_uuid=True), nullable=True))

        # 2) Add the other columns (give defaults where NOT NULL)
        batch_op.add_column(sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"))
        batch_op.add_column(sa.Column("channel", sa.String(length=32), nullable=False, server_default="email"))
        batch_op.add_column(sa.Column("target", sa.String(length=255), nullable=False, server_default=""))
        batch_op.add_column(sa.Column("available_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")))
        batch_op.add_column(sa.Column("locked_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("dead_letter_reason", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")))

        batch_op.create_foreign_key(
            "fk_notification_outbox_notification_id",
            "notifications",
            ["notification_id"],
            ["id"],
            ondelete="CASCADE",
        )

    # 3) Now enforce NOT NULL on notification_id (table is empty, so it's safe)
    with op.batch_alter_table("notification_outbox") as batch_op:
        batch_op.alter_column("notification_id", nullable=False)

        # drop server defaults that were only for migration
        batch_op.alter_column("status", server_default=None)
        batch_op.alter_column("channel", server_default=None)
        batch_op.alter_column("target", server_default=None)
        batch_op.alter_column("available_at", server_default=None)
        batch_op.alter_column("updated_at", server_default=None)


def downgrade():
    with op.batch_alter_table("notification_outbox") as batch_op:
        batch_op.drop_constraint("fk_notification_outbox_notification_id", type_="foreignkey")
        batch_op.drop_column("updated_at")
        batch_op.drop_column("dead_letter_reason")
        batch_op.drop_column("processed_at")
        batch_op.drop_column("locked_at")
        batch_op.drop_column("available_at")
        batch_op.drop_column("target")
        batch_op.drop_column("channel")
        batch_op.drop_column("status")
        batch_op.drop_column("notification_id")
        # optional rename back:
        # batch_op.alter_column("kind", new_column_name="type")
        # batch_op.alter_column("payload_json", new_column_name="payload")


def _has_column(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    res = bind.execute(sa.text("""
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = :t AND column_name = :c
        LIMIT 1
    """), {"t": table_name, "c": column_name}).first()
    return res is not None