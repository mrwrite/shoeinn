from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "services",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column("description", sa.Text()),
        sa.Column("price_cents", sa.Integer(), nullable=False),
        sa.Column("duration_min", sa.Integer(), nullable=False),
        sa.Column("active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "appointments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("service_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("services.id"), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("address_line1", sa.String(), nullable=False),
        sa.Column("address_line2", sa.String()),
        sa.Column("city", sa.String(), nullable=False),
        sa.Column("state", sa.String(), nullable=False),
        sa.Column("postal_code", sa.String(), nullable=False),
        sa.Column("start_time_utc", sa.DateTime(timezone=True), nullable=False),
        sa.Column("tz_offset_min", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(), server_default="requested", nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("customer_name", sa.String()),
        sa.Column("customer_email", sa.String()),
        sa.Column("customer_phone", sa.String()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_appointments_start_time_utc", "appointments", ["start_time_utc"])

def downgrade():
    op.drop_index("ix_appointments_start_time_utc", table_name="appointments")
    op.drop_table("appointments")
    op.drop_table("services")
