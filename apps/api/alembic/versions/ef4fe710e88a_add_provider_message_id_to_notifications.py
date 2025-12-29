"""add provider_message_id to notifications

Revision ID: ef4fe710e88a
Revises: add_full_name_and_ntf_read
Create Date: 2025-12-29 07:35:37.244935

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ef4fe710e88a'
down_revision: Union[str, Sequence[str], None] = 'add_full_name_and_ntf_read'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    with op.batch_alter_table("notifications") as batch_op:
        batch_op.add_column(sa.Column("provider_message_id", sa.String(length=255), nullable=True))

def downgrade():
    with op.batch_alter_table("notifications") as batch_op:
        batch_op.drop_column("provider_message_id")
