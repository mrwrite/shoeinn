"""enable pgcrypto and uuid PKs for users/companies

Revision ID: 1f6f3b9139a1
Revises: c91a101b30b9
Create Date: 2024-06-15 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "1f6f3b9139a1"
down_revision: Union[str, Sequence[str], None] = "c91a101b30b9"
branch_labels = None
depends_on = None


def _drop_inbound_foreign_keys(bind, target_table: str) -> None:
    """Drop all foreign keys that reference the given table."""

    inspector = sa.inspect(bind)

    for table_name in inspector.get_table_names():
        for fk in inspector.get_foreign_keys(table_name):
            if fk.get("referred_table") == target_table:
                op.drop_constraint(fk["name"], table_name, type_="foreignkey")


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")

    bind = op.get_bind()

    for table in ("users", "companies"):
        op.add_column(table, sa.Column("id_uuid", postgresql.UUID(as_uuid=True), nullable=True))
        op.execute(sa.text(f"UPDATE {table} SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;"))

        pk = sa.inspect(bind).get_pk_constraint(table)
        pk_name = pk.get("name") if pk else None

        legacy_unique_name = f"uq_{table}_id_legacy"
        op.create_unique_constraint(legacy_unique_name, table, ["id"])

        _drop_inbound_foreign_keys(bind, table)

        if pk_name:
            op.drop_constraint(pk_name, table, type_="primary")

        op.create_primary_key(pk_name or f"{table}_pkey", table, ["id_uuid"])


def downgrade() -> None:
    pass
