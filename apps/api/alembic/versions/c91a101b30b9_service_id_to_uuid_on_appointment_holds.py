"""service_id to UUID on appointment_holds

Revision ID: c91a101b30b9
Revises: 0002
Create Date: 2025-09-28 07:58:39.891269

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c91a101b30b9'
down_revision: Union[str, Sequence[str], None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.alter_column(
        "appointment_holds",
        "service_id",
        existing_type=sa.String(),
        type_=postgresql.UUID(as_uuid=True),
        postgresql_using="service_id::uuid",
        existing_nullable=True,
    )

def downgrade():
    op.alter_column(
        "appointment_holds",
        "service_id",
        existing_type=postgresql.UUID(as_uuid=True),
        type_=sa.String(),
        existing_nullable=True,
    )
