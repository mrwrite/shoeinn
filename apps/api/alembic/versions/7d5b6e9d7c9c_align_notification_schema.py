"""Align notification and outbox schema with current models.

Revision ID: 7d5b6e9d7c9c
Revises: 5211f498c75b
Create Date: 2025-02-01 00:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "7d5b6e9d7c9c"
down_revision: str = "5211f498c75b"
branch_labels = None
depends_on = None


def _table_exists(inspector: sa.Inspector, table_name: str) -> bool:
    return table_name in inspector.get_table_names()


def _has_column(inspector: sa.Inspector, table_name: str, column_name: str) -> bool:
    return any(col["name"] == column_name for col in inspector.get_columns(table_name))


def _column_type(inspector: sa.Inspector, table_name: str, column_name: str):
    for col in inspector.get_columns(table_name):
        if col["name"] == column_name:
            return col["type"]
    return None


def _has_fk(inspector: sa.Inspector, table_name: str, constraint_name: str) -> bool:
    for fk in inspector.get_foreign_keys(table_name):
        if fk.get("name") == constraint_name:
            return True
    return False


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    _upgrade_notifications(inspector)
    _upgrade_notification_outbox(inspector)


def _upgrade_notifications(inspector: sa.Inspector) -> None:
    table = "notifications"
    if not _table_exists(inspector, table):
        return

    # Ensure payload_json is JSONB and not null.
    if _has_column(inspector, table, "payload_json"):
        col_type = _column_type(inspector, table, "payload_json")
        if not isinstance(col_type, postgresql.JSONB):
            op.execute(
                sa.text(
                    """
                    ALTER TABLE notifications
                    ALTER COLUMN payload_json TYPE jsonb
                    USING CASE
                        WHEN payload_json IS NULL OR payload_json = '' THEN '{}'::jsonb
                        ELSE payload_json::jsonb
                    END
                    """
                )
            )
    else:
        op.add_column(
            table,
            sa.Column(
                "payload_json",
                postgresql.JSONB,
                nullable=False,
                server_default=sa.text("'{}'::jsonb"),
            ),
        )

    op.execute(
        sa.text(
            "UPDATE notifications SET payload_json = '{}'::jsonb WHERE payload_json IS NULL"
        )
    )
    op.alter_column(
        table,
        "payload_json",
        existing_type=postgresql.JSONB,
        nullable=False,
        server_default=sa.text("'{}'::jsonb"),
    )

    # Appointment can be optional.
    if _has_column(inspector, table, "appointment_id"):
        op.alter_column(table, "appointment_id", nullable=True)

    # Core not-null fields
    op.execute(sa.text("UPDATE notifications SET channel = 'email' WHERE channel IS NULL"))
    op.execute(sa.text("UPDATE notifications SET target = '' WHERE target IS NULL"))
    op.execute(
        sa.text(
            "UPDATE notifications SET created_at = now() WHERE created_at IS NULL"
        )
    )
    op.execute(
        sa.text(
            "UPDATE notifications SET updated_at = now() WHERE updated_at IS NULL"
        )
    )

    with op.batch_alter_table(table) as batch_op:
        batch_op.alter_column(
            "channel",
            existing_type=sa.String(),
            server_default=sa.text("'email'"),
            nullable=False,
        )
        batch_op.alter_column(
            "target",
            existing_type=sa.String(),
            server_default=sa.text("''"),
            nullable=False,
        )
        batch_op.alter_column(
            "created_at",
            existing_type=sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        )
        batch_op.alter_column(
            "updated_at",
            existing_type=sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        )

    # Add delivery tracking columns if missing.
    new_columns: list[sa.Column] = [
        sa.Column("delivery_attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_attempt_at", sa.DateTime(timezone=True)),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True)),
        sa.Column("last_error_code", sa.String(length=255)),
        sa.Column("last_error_message", sa.String(length=1024)),
        sa.Column("last_error_at", sa.DateTime(timezone=True)),
        sa.Column("dead_lettered", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=True),
    ]

    for column in new_columns:
        if not _has_column(inspector, table, column.name):
            op.add_column(table, column)

    # Ensure metadata_json is JSONB if it already existed as text.
    if _has_column(inspector, table, "metadata_json"):
        col_type = _column_type(inspector, table, "metadata_json")
        if col_type and not isinstance(col_type, postgresql.JSONB):
            op.execute(
                sa.text(
                    """
                    ALTER TABLE notifications
                    ALTER COLUMN metadata_json TYPE jsonb
                    USING CASE
                        WHEN metadata_json IS NULL THEN NULL
                        ELSE metadata_json::jsonb
                    END
                    """
                )
            )


def _upgrade_notification_outbox(inspector: sa.Inspector) -> None:
    table = "notification_outbox"
    if not _table_exists(inspector, table):
        return

    # Rename legacy columns if present.
    if _has_column(inspector, table, "type") and not _has_column(
        inspector, table, "kind"
    ):
        with op.batch_alter_table(table) as batch_op:
            batch_op.alter_column("type", new_column_name="kind")
        inspector = sa.inspect(op.get_bind())

    if _has_column(inspector, table, "payload") and not _has_column(
        inspector, table, "payload_json"
    ):
        with op.batch_alter_table(table) as batch_op:
            batch_op.alter_column("payload", new_column_name="payload_json")
        inspector = sa.inspect(op.get_bind())

    # Add required columns if missing.
    with op.batch_alter_table(table) as batch_op:
        if not _has_column(inspector, table, "notification_id"):
            batch_op.add_column(
                sa.Column(
                    "notification_id", postgresql.UUID(as_uuid=True), nullable=True
                )
            )
        if not _has_fk(inspector, table, "fk_notification_outbox_notification_id"):
            batch_op.create_foreign_key(
                "fk_notification_outbox_notification_id",
                "notifications",
                ["notification_id"],
                ["id"],
                ondelete="CASCADE",
            )
        if not _has_column(inspector, table, "status"):
            batch_op.add_column(
                sa.Column("status", sa.String(length=64), server_default="pending", nullable=False)
            )
        if not _has_column(inspector, table, "channel"):
            batch_op.add_column(
                sa.Column("channel", sa.String(length=64), server_default="email", nullable=False)
            )
        if not _has_column(inspector, table, "target"):
            batch_op.add_column(
                sa.Column("target", sa.String(length=255), server_default="", nullable=False)
            )
        if not _has_column(inspector, table, "available_at"):
            batch_op.add_column(
                sa.Column(
                    "available_at",
                    sa.DateTime(timezone=True),
                    server_default=sa.text("now()"),
                    nullable=False,
                )
            )
        if not _has_column(inspector, table, "locked_at"):
            batch_op.add_column(sa.Column("locked_at", sa.DateTime(timezone=True)))
        if not _has_column(inspector, table, "processed_at"):
            batch_op.add_column(sa.Column("processed_at", sa.DateTime(timezone=True)))
        if not _has_column(inspector, table, "dead_letter_reason"):
            batch_op.add_column(sa.Column("dead_letter_reason", sa.Text()))
        if not _has_column(inspector, table, "updated_at"):
            batch_op.add_column(
                sa.Column(
                    "updated_at",
                    sa.DateTime(timezone=True),
                    server_default=sa.text("now()"),
                    nullable=False,
                )
            )
        if not _has_column(inspector, table, "created_at"):
            batch_op.add_column(
                sa.Column(
                    "created_at",
                    sa.DateTime(timezone=True),
                    server_default=sa.text("now()"),
                    nullable=False,
                )
            )
        if not _has_column(inspector, table, "kind"):
            batch_op.add_column(
                sa.Column("kind", sa.String(length=64), server_default="legacy", nullable=False)
            )

    # Ensure payload_json uses JSONB.
    if _has_column(inspector, table, "payload_json"):
        col_type = _column_type(inspector, table, "payload_json")
        if not isinstance(col_type, postgresql.JSONB):
            op.execute(
                sa.text(
                    """
                    ALTER TABLE notification_outbox
                    ALTER COLUMN payload_json TYPE jsonb
                    USING CASE
                        WHEN payload_json IS NULL THEN '{}'::jsonb
                        WHEN pg_typeof(payload_json)::text = 'json' THEN payload_json::jsonb
                        ELSE payload_json::jsonb
                    END
                    """
                )
            )

    op.execute(
        sa.text(
            "UPDATE notification_outbox SET payload_json = '{}'::jsonb WHERE payload_json IS NULL"
        )
    )

    op.execute(
        sa.text(
            """
            UPDATE notification_outbox
            SET
                status = COALESCE(status, 'pending'),
                channel = COALESCE(channel, payload_json->>'channel', 'email'),
                target = COALESCE(target, payload_json->>'target', ''),
                kind = COALESCE(kind, 'legacy'),
                available_at = COALESCE(available_at, created_at, now()),
                created_at = COALESCE(created_at, now()),
                updated_at = COALESCE(updated_at, created_at, now())
            """
        )
    )

    with op.batch_alter_table(table) as batch_op:
        batch_op.alter_column(
            "payload_json",
            existing_type=postgresql.JSONB,
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        )
        batch_op.alter_column(
            "status",
            existing_type=sa.String(length=64),
            nullable=False,
            server_default=sa.text("'pending'"),
        )
        batch_op.alter_column(
            "channel",
            existing_type=sa.String(length=64),
            nullable=False,
            server_default=sa.text("'email'"),
        )
        batch_op.alter_column(
            "target",
            existing_type=sa.String(length=255),
            nullable=False,
            server_default=sa.text("''"),
        )
        batch_op.alter_column(
            "available_at",
            existing_type=sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        )
        batch_op.alter_column(
            "created_at",
            existing_type=sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        )
        batch_op.alter_column(
            "updated_at",
            existing_type=sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        )
        batch_op.alter_column(
            "kind",
            existing_type=sa.String(length=64),
            nullable=False,
            server_default=sa.text("'legacy'"),
        )


def downgrade() -> None:
    # Best-effort downgrade: revert payload columns to text and drop added tracking fields.
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _table_exists(inspector, "notification_outbox"):
        with op.batch_alter_table("notification_outbox") as batch_op:
            for column in [
                "updated_at",
                "dead_letter_reason",
                "processed_at",
                "locked_at",
                "available_at",
                "target",
                "channel",
                "status",
                "notification_id",
            ]:
                if _has_column(inspector, "notification_outbox", column):
                    batch_op.drop_column(column)
            if _has_column(inspector, "notification_outbox", "payload_json"):
                batch_op.alter_column(
                    "payload_json",
                    existing_type=postgresql.JSONB,
                    type_=sa.Text(),
                    nullable=True,
                )
            if _has_column(inspector, "notification_outbox", "kind"):
                batch_op.alter_column("kind", new_column_name="type")

    if _table_exists(inspector, "notifications"):
        with op.batch_alter_table("notifications") as batch_op:
            for column in [
                "metadata_json",
                "dead_lettered",
                "last_error_at",
                "last_error_message",
                "last_error_code",
                "next_attempt_at",
                "last_attempt_at",
                "delivery_attempts",
            ]:
                if _has_column(inspector, "notifications", column):
                    batch_op.drop_column(column)
            if _has_column(inspector, "notifications", "payload_json"):
                batch_op.alter_column(
                    "payload_json",
                    existing_type=postgresql.JSONB,
                    type_=sa.Text(),
                    nullable=True,
                )

