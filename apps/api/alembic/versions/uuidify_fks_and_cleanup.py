"""uuidify foreign keys and cleanup legacy identifiers

Revision ID: 2a4ddf5085d7
Revises: 1f6f3b9139a1
Create Date: 2024-06-15 00:05:00
"""

from typing import List, Optional, Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "2a4ddf5085d7"
down_revision: Union[str, Sequence[str], None] = "1f6f3b9139a1"
branch_labels = None
depends_on = None


def _drop_fk(table: str, columns: List[str]) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    for fk in inspector.get_foreign_keys(table):
        if fk.get("constrained_columns") == columns:
            op.drop_constraint(fk["name"], table, type_="foreignkey")
            break


def _drop_unique(
    table: str, columns: List[str], *, name: Optional[str] = None
) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    for constraint in inspector.get_unique_constraints(table):
        if constraint.get("column_names") == columns or (
            name and constraint.get("name") == name
        ):
            op.drop_constraint(constraint["name"], table, type_="unique")
            return

    if name:
        # Fallback to dropping by the provided name if the inspector didn't return it.
        op.drop_constraint(name, table, type_="unique")


def upgrade() -> None:
    # appointment_holds adjustments
    op.add_column(
        "appointment_holds",
        sa.Column("customer_id_uuid", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "appointment_holds",
        sa.Column("company_id_uuid", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.execute(
        sa.text(
            """
            UPDATE appointment_holds AS ah
            SET customer_id_uuid = u.id_uuid
            FROM users AS u
            WHERE ah.customer_id = u.id
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE appointment_holds AS ah
            SET company_id_uuid = c.id_uuid
            FROM companies AS c
            WHERE ah.company_id = c.id
            """
        )
    )
    op.alter_column("appointment_holds", "customer_id_uuid", nullable=False)
    op.alter_column("appointment_holds", "company_id_uuid", nullable=False)
    op.drop_constraint(
        "uq_appointment_holds_company_service_time",
        "appointment_holds",
        type_="unique",
    )
    _drop_fk("appointment_holds", ["customer_id"])
    _drop_fk("appointment_holds", ["company_id"])
    op.drop_column("appointment_holds", "customer_id")
    op.drop_column("appointment_holds", "company_id")
    op.alter_column("appointment_holds", "customer_id_uuid", new_column_name="customer_id")
    op.alter_column("appointment_holds", "company_id_uuid", new_column_name="company_id")
    op.create_unique_constraint(
        "uq_appointment_holds_company_service_time",
        "appointment_holds",
        ["company_id", "service_id", "start_time_utc"],
    )

    # available_slots adjustments
    op.add_column(
        "available_slots",
        sa.Column("company_id_uuid", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.execute(
        sa.text(
            """
            UPDATE available_slots AS s
            SET company_id_uuid = c.id_uuid
            FROM companies AS c
            WHERE s.company_id = c.id
            """
        )
    )
    op.alter_column("available_slots", "company_id_uuid", nullable=False)
    op.drop_constraint(
        "uq_available_slots_company_service_time",
        "available_slots",
        type_="unique",
    )
    op.drop_index("ix_available_slots_company_time", table_name="available_slots")
    _drop_fk("available_slots", ["company_id"])
    op.drop_column("available_slots", "company_id")
    op.alter_column("available_slots", "company_id_uuid", new_column_name="company_id")
    op.create_unique_constraint(
        "uq_available_slots_company_service_time",
        "available_slots",
        ["company_id", "service_id", "start_time_utc"],
    )
    op.create_index(
        "ix_available_slots_company_time",
        "available_slots",
        ["company_id", "start_time_utc"],
    )
    op.execute("ALTER TABLE available_slots ALTER COLUMN is_available SET DEFAULT true;")

    # services.company_id
    op.add_column(
        "services",
        sa.Column("company_id_uuid", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.execute(
        sa.text(
            """
            UPDATE services AS s
            SET company_id_uuid = c.id_uuid
            FROM companies AS c
            WHERE s.company_id = c.id
            """
        )
    )
    op.alter_column("services", "company_id_uuid", nullable=False)
    op.drop_index("ix_services_company_active", table_name="services")
    _drop_fk("services", ["company_id"])
    op.drop_column("services", "company_id")
    op.alter_column("services", "company_id_uuid", new_column_name="company_id")
    op.create_index(
        "ix_services_company_active",
        "services",
        ["company_id", "active"],
    )

    # appointments adjustments
    op.add_column(
        "appointments",
        sa.Column("customer_id_uuid", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "appointments",
        sa.Column("company_id_uuid", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.execute(
        sa.text(
            """
            UPDATE appointments AS a
            SET customer_id_uuid = u.id_uuid
            FROM users AS u
            WHERE a.customer_id = u.id
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE appointments AS a
            SET company_id_uuid = c.id_uuid
            FROM companies AS c
            WHERE a.company_id = c.id
            """
        )
    )
    op.alter_column("appointments", "customer_id_uuid", nullable=False)
    op.drop_constraint(
        "uq_appointments_company_start_time",
        "appointments",
        type_="unique",
    )
    _drop_fk("appointments", ["customer_id"])
    _drop_fk("appointments", ["company_id"])
    op.drop_column("appointments", "customer_id")
    op.drop_column("appointments", "company_id")
    op.alter_column("appointments", "customer_id_uuid", new_column_name="customer_id")
    op.alter_column("appointments", "company_id_uuid", new_column_name="company_id")
    op.create_unique_constraint(
        "uq_appointments_company_start_time",
        "appointments",
        ["company_id", "start_time_utc"],
    )

    # company_users adjustments
    op.add_column(
        "company_users",
        sa.Column("user_id_uuid", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "company_users",
        sa.Column("company_id_uuid", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.execute(
        sa.text(
            """
            UPDATE company_users AS cu
            SET user_id_uuid = u.id_uuid
            FROM users AS u
            WHERE cu.user_id = u.id
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE company_users AS cu
            SET company_id_uuid = c.id_uuid
            FROM companies AS c
            WHERE cu.company_id = c.id
            """
        )
    )
    op.alter_column("company_users", "user_id_uuid", nullable=False)
    op.alter_column("company_users", "company_id_uuid", nullable=False)
    _drop_fk("company_users", ["user_id"])
    _drop_fk("company_users", ["company_id"])
    op.drop_constraint("company_users_pkey", "company_users", type_="primary")
    _drop_unique(
        "company_users",
        ["user_id", "company_id"],
        name="company_users_user_id_company_id_key",
    )
    op.drop_index("ix_company_users_company_id", table_name="company_users")
    op.drop_column("company_users", "user_id")
    op.drop_column("company_users", "company_id")
    op.alter_column("company_users", "user_id_uuid", new_column_name="user_id")
    op.alter_column("company_users", "company_id_uuid", new_column_name="company_id")
    op.create_primary_key("company_users_pkey", "company_users", ["user_id", "company_id"])
    op.create_unique_constraint(
        "company_users_user_id_company_id_key",
        "company_users",
        ["user_id", "company_id"],
    )
    op.create_index("ix_company_users_company_id", "company_users", ["company_id"])

    # user_refresh_tokens adjustments
    op.add_column(
        "user_refresh_tokens",
        sa.Column("user_id_uuid", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.execute(
        sa.text(
            """
            UPDATE user_refresh_tokens AS t
            SET user_id_uuid = u.id_uuid
            FROM users AS u
            WHERE t.user_id = u.id
            """
        )
    )
    op.alter_column("user_refresh_tokens", "user_id_uuid", nullable=False)
    _drop_fk("user_refresh_tokens", ["user_id"])
    op.drop_column("user_refresh_tokens", "user_id")
    op.alter_column("user_refresh_tokens", "user_id_uuid", new_column_name="user_id")

    # notifications.company_id adjustments
    op.add_column(
        "notifications",
        sa.Column("company_id_uuid", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.execute(
        sa.text(
            """
            UPDATE notifications AS n
            SET company_id_uuid = c.id_uuid
            FROM companies AS c
            WHERE n.company_id = c.id
            """
        )
    )
    op.alter_column("notifications", "company_id_uuid", nullable=False)
    op.drop_index("ix_notifications_company_status", table_name="notifications")
    _drop_fk("notifications", ["company_id"])
    op.drop_column("notifications", "company_id")
    op.alter_column("notifications", "company_id_uuid", new_column_name="company_id")
    op.create_index(
        "ix_notifications_company_status",
        "notifications",
        ["company_id", "status"],
    )

    # drop legacy id columns and rename new PKs
    op.drop_constraint("uq_users_id_legacy", "users", type_="unique")
    op.drop_column("users", "id")
    op.alter_column("users", "id_uuid", new_column_name="id")

    op.drop_constraint("uq_companies_id_legacy", "companies", type_="unique")
    op.drop_column("companies", "id")
    op.alter_column("companies", "id_uuid", new_column_name="id")

    # recreate foreign keys with new UUID identifiers
    op.create_foreign_key(None, "appointment_holds", "users", ["customer_id"], ["id"])
    op.create_foreign_key(None, "appointment_holds", "companies", ["company_id"], ["id"])
    op.create_foreign_key(None, "available_slots", "companies", ["company_id"], ["id"])
    op.create_foreign_key(None, "services", "companies", ["company_id"], ["id"])
    op.create_foreign_key(None, "appointments", "users", ["customer_id"], ["id"])
    op.create_foreign_key(None, "appointments", "companies", ["company_id"], ["id"])
    op.create_foreign_key(None, "company_users", "users", ["user_id"], ["id"])
    op.create_foreign_key(None, "company_users", "companies", ["company_id"], ["id"])
    op.create_foreign_key(None, "user_refresh_tokens", "users", ["user_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key(None, "notifications", "companies", ["company_id"], ["id"])


def downgrade() -> None:
    pass
