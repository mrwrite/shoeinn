"""merge heads 9cfb25042512 and b71c2a9f4d11

Revision ID: 19836631c0f5
Revises: 9cfb25042512, b71c2a9f4d11
Create Date: 2026-03-01 16:32:29.868506

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '19836631c0f5'
down_revision: Union[str, Sequence[str], None] = ('9cfb25042512', 'b71c2a9f4d11')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
