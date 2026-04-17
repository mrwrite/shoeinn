"""merge heads

Revision ID: 9cfb25042512
Revises: 8f9a2b7c1d4e, a1b2c3d4e5f6
Create Date: 2026-02-11 18:33:09.336216

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9cfb25042512'
down_revision: Union[str, Sequence[str], None] = ('8f9a2b7c1d4e', 'a1b2c3d4e5f6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
