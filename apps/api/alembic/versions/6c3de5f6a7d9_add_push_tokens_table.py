"""add push tokens table

Revision ID: 6c3de5f6a7d9
Revises: 7d5b6e9d7c9c
Create Date: 2025-02-24 00:00:00.000000
"""

from __future__ import annotations

from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "6c3de5f6a7d9"
down_revision = "7d5b6e9d7c9c"
branch_labels = None
depends_on = None


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def upgrade():
    op.create_table(
        "push_tokens",
        sa.Column("id", sa.Uuid(), primary_key=True, default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("token", sa.String(), nullable=False),
        sa.Column("platform", sa.String(), nullable=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, default=_utcnow),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, default=_utcnow),
        sa.Column("last_seen_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("user_id", "token", name="uq_push_tokens_user_token"),
    )


def downgrade():
    op.drop_table("push_tokens")

