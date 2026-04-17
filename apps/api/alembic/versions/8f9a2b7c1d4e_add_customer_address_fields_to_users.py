"""add customer address fields to users

Revision ID: 8f9a2b7c1d4e
Revises: 3f2c7f8a9b10
Create Date: 2026-02-11 23:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8f9a2b7c1d4e"
down_revision: Union[str, Sequence[str], None] = "3f2c7f8a9b10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("address_line1", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("address_line2", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("city", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("state", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("postal_code", sa.String(length=20), nullable=True))
    op.add_column("users", sa.Column("country", sa.String(length=2), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "country")
    op.drop_column("users", "postal_code")
    op.drop_column("users", "state")
    op.drop_column("users", "city")
    op.drop_column("users", "address_line2")
    op.drop_column("users", "address_line1")
