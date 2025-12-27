"""merge migration heads

Revision ID: dee02c1bc9c1
Revises: 3b8d2f1ef4d4, expand_appointments
Create Date: 2025-12-26 22:07:45.957448

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dee02c1bc9c1'
down_revision: Union[str, Sequence[str], None] = ('3b8d2f1ef4d4', 'expand_appointments')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
