"""upgrade notification_outbox schema

Revision ID: 5211f498c75b
Revises: 908772b4e518
Create Date: 2025-12-29 07:44:12.109898

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5211f498c75b'
down_revision: Union[str, Sequence[str], None] = '908772b4e518'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    """Legacy migration superseded by later revisions.

    The original implementation attempted to reshape the notification_outbox schema in
    a way that was incompatible with existing production data. To avoid destructive
    behavior (e.g., deleting rows), this revision is now a no-op. The follow-up
    migration aligns the schema safely.
    """
    if not _table_exists("notification_outbox"):
        return


def downgrade():
    if not _table_exists("notification_outbox"):
        return


def _has_column(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    res = bind.execute(
        sa.text(
            """
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = :t AND column_name = :c
        LIMIT 1
    """
        ),
        {"t": table_name, "c": column_name},
    ).first()
    return res is not None


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()