"""add pending payment statuses to appointmentstatus enum

Revision ID: f7c1e2d3a4b5
Revises: e4f6a1b2c3d4
Create Date: 2026-05-05 10:30:00.000000
"""

from alembic import op


revision = "f7c1e2d3a4b5"
down_revision = "e4f6a1b2c3d4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    op.execute("ALTER TYPE appointmentstatus ADD VALUE IF NOT EXISTS 'pending_payment'")
    op.execute("ALTER TYPE appointmentstatus ADD VALUE IF NOT EXISTS 'payment_failed'")


def downgrade() -> None:
    # PostgreSQL enum value removal is intentionally omitted.
    pass
