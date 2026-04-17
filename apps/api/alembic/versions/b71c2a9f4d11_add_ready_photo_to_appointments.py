"""add ready photo fields to appointments

Revision ID: b71c2a9f4d11
Revises: 3f2c7f8a9b10
Create Date: 2026-03-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "b71c2a9f4d11"
down_revision = "3f2c7f8a9b10"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("appointments", sa.Column("ready_photo_url", sa.String(length=2048), nullable=True))
    op.add_column("appointments", sa.Column("ready_photo_uploaded_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "appointments",
        sa.Column("ready_photo_uploaded_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_appointments_ready_photo_uploaded_by_user",
        "appointments",
        "users",
        ["ready_photo_uploaded_by_user_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_appointments_ready_photo_uploaded_by_user", "appointments", type_="foreignkey")
    op.drop_column("appointments", "ready_photo_uploaded_by_user_id")
    op.drop_column("appointments", "ready_photo_uploaded_at")
    op.drop_column("appointments", "ready_photo_url")
