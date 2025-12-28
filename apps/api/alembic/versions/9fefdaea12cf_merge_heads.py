"""merge heads

Revision ID: 9fefdaea12cf
Revises: add_cancelled_status, 9f3a1c2d4e5f
Create Date: 2025-12-28 07:19:34.955439

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9fefdaea12cf'
down_revision: Union[str, Sequence[str], None] = ('add_cancelled_status', '9f3a1c2d4e5f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
