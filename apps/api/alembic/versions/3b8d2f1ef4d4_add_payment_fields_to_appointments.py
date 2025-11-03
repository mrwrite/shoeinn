"""add payment metadata to appointments"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "3b8d2f1ef4d4"
down_revision = "2a4ddf5085d7"
branch_labels = None
depends_on = None


APPOINTMENT_STATUS_VALUES = ("PENDING", "CONFIRMED", "CANCELLED")
PAYMENT_STATUS_VALUES = (
    "pending",
    "requires_action",
    "succeeded",
    "failed",
    "refunded",
    "disputed",
)


def upgrade() -> None:
    bind = op.get_bind()

    appointment_status = postgresql.ENUM(
        *APPOINTMENT_STATUS_VALUES, name="appointmentstatus", create_type=False
    )
    appointment_status.create(bind, checkfirst=True)

    payment_status = postgresql.ENUM(
        *PAYMENT_STATUS_VALUES, name="appointmentpaymentstatus", create_type=False
    )
    payment_status.create(bind, checkfirst=True)

    op.add_column(
        "appointments",
        sa.Column("hold_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_unique_constraint("uq_appointments_hold_id", "appointments", ["hold_id"])
    op.create_foreign_key(
        "fk_appointments_hold_id",
        "appointments",
        "appointment_holds",
        ["hold_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column(
        "appointments",
        sa.Column(
            "status", appointment_status, nullable=False, server_default="CONFIRMED"
        ),
    )
    op.add_column(
        "appointments",
        sa.Column("payment_id", sa.String(length=64), nullable=True),
    )
    op.create_unique_constraint("uq_appointments_payment_id", "appointments", ["payment_id"])
    op.add_column(
        "appointments",
        sa.Column("payment_status", payment_status, nullable=True),
    )
    op.add_column(
        "appointments",
        sa.Column("payment_checkout_url", sa.String(length=2048), nullable=True),
    )
    op.add_column(
        "appointments",
        sa.Column("payment_amount_expected", sa.Integer(), nullable=True),
    )
    op.add_column(
        "appointments",
        sa.Column("payment_amount_received", sa.Integer(), nullable=True),
    )
    op.add_column(
        "appointments",
        sa.Column("payment_currency", sa.String(length=3), nullable=True),
    )

    op.execute("UPDATE appointments SET status='CONFIRMED' WHERE status IS NULL")
    op.alter_column("appointments", "status", server_default=None)


def downgrade() -> None:
    op.alter_column("appointments", "status", server_default=None)
    op.drop_column("appointments", "payment_currency")
    op.drop_column("appointments", "payment_amount_received")
    op.drop_column("appointments", "payment_amount_expected")
    op.drop_column("appointments", "payment_checkout_url")
    op.drop_column("appointments", "payment_status")
    op.drop_constraint("uq_appointments_payment_id", "appointments", type_="unique")
    op.drop_column("appointments", "payment_id")
    op.drop_column("appointments", "status")
    op.drop_constraint("fk_appointments_hold_id", "appointments", type_="foreignkey")
    op.drop_constraint("uq_appointments_hold_id", "appointments", type_="unique")
    op.drop_column("appointments", "hold_id")

    payment_status = postgresql.ENUM(
        *PAYMENT_STATUS_VALUES, name="appointmentpaymentstatus", create_type=False
    )
    payment_status.drop(op.get_bind(), checkfirst=True)

    appointment_status = postgresql.ENUM(
        *APPOINTMENT_STATUS_VALUES, name="appointmentstatus", create_type=False
    )
    appointment_status.drop(op.get_bind(), checkfirst=True)
