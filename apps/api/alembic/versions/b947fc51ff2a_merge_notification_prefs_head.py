"""merge notification prefs head

Revision ID: b947fc51ff2a
Revises: 19836631c0f5, f2c4b9e8d123
Create Date: 2026-04-13 15:36:40.393270

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b947fc51ff2a'
down_revision: Union[str, Sequence[str], None] = ('19836631c0f5', 'f2c4b9e8d123')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
