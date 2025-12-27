"""Normalize services/appointments for provider lifecycle."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text


revision = "norm_services_and_appts"
down_revision = "dee02c1bc9c1"
branch_labels = None
depends_on = None

STATUS_VALUES = [
    "requested",
    "confirmed",
    "picked_up",
    "cleaning",
    "ready",
    "delivered",
    "completed",
    "cancelled",
]


# Helpers ------------------------------------------------------------

def _insp():
    return sa.inspect(op.get_bind())


def _table_exists(table: str) -> bool:
    return table in _insp().get_table_names()


def _column_exists(table: str, column: str) -> bool:
    return any(col["name"] == column for col in _insp().get_columns(table))


def _fk_exists(table: str, fk_name: str) -> bool:
    return any(fk["name"] == fk_name for fk in _insp().get_foreign_keys(table))


# Upgrade / Downgrade -----------------------------------------------

def upgrade() -> None:
    bind = op.get_bind()

    # Ensure services link to a company
    if _table_exists("services"):
        if not _column_exists("services", "company_id"):
            op.add_column("services", sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=True))

        # Only backfill if companies table exists AND has at least 1 row
        if _table_exists("companies"):
            has_company = bind.execute(text("SELECT EXISTS (SELECT 1 FROM companies LIMIT 1)")).scalar()
            if has_company:
                bind.execute(text("""
                    UPDATE services
                    SET company_id = (
                        SELECT id FROM companies ORDER BY created_at NULLS LAST LIMIT 1
                    )
                    WHERE company_id IS NULL
                """))

        # Only enforce NOT NULL if there are no NULLs remaining
        null_count = bind.execute(text("SELECT COUNT(*) FROM services WHERE company_id IS NULL")).scalar()
        if null_count == 0:
            op.alter_column(
                "services",
                "company_id",
                existing_type=postgresql.UUID(as_uuid=True),
                nullable=False,
                existing_nullable=True,
            )

        # FK + index can be created if companies exists (FK will fail if it doesn't)
        if _table_exists("companies") and not _fk_exists("services", "fk_services_company"):
            op.create_foreign_key(
                "fk_services_company",
                "services",
                "companies",
                ["company_id"],
                ["id"],
            )

        op.execute("CREATE INDEX IF NOT EXISTS ix_services_company ON services (company_id)")

    # Appointments lifecycle columns
    if _table_exists("appointments"):
        # status column / enum
        if not _column_exists("appointments", "status"):
            status_enum = postgresql.ENUM(*STATUS_VALUES, name="appointmentstatus")
            status_enum.create(bind, checkfirst=True)
            op.add_column(
                "appointments",
                sa.Column("status", status_enum, nullable=False, server_default="requested"),
            )
        # company + addressing
        if not _column_exists("appointments", "company_id"):
            op.add_column("appointments", sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=True))
        for col, type_ in [
            ("type", sa.String(length=50)),
            ("address_line1", sa.String(length=255)),
            ("address_line2", sa.String(length=255)),
            ("city", sa.String(length=100)),
            ("state", sa.String(length=100)),
            ("postal_code", sa.String(length=20)),
            ("confirmed_time", sa.DateTime(timezone=True)),
            ("updated_at", sa.DateTime(timezone=True)),
        ]:
            if not _column_exists("appointments", col):
                op.add_column("appointments", sa.Column(col, type_, nullable=True))

        op.execute(
            sa.text(
                """
                UPDATE appointments AS a
                SET company_id = COALESCE(a.company_id, s.company_id)
                FROM services s
                WHERE a.service_id = s.id
                  AND a.company_id IS NULL
                """
            )
        )
        op.execute("UPDATE appointments SET status='requested' WHERE status IS NULL")
        op.execute("UPDATE appointments SET updated_at = created_at WHERE updated_at IS NULL")

        null_appt_company = bind.execute(text("SELECT COUNT(*) FROM appointments WHERE company_id IS NULL")).scalar()
        if null_appt_company == 0:
            op.alter_column(
                "appointments",
                "company_id",
                existing_type=postgresql.UUID(as_uuid=True),
                nullable=False,
                existing_nullable=True,
            )

        op.alter_column(
            "appointments",
            "type",
            existing_type=sa.String(length=50),
            nullable=False,
            server_default="pickup",
            existing_nullable=True,
        )
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_appointments_company_status ON appointments (company_id, status)"
        )
        if _table_exists("companies") and not _fk_exists("appointments", "fk_appointments_company"):
            op.create_foreign_key(
                "fk_appointments_company",
                "appointments",
                "companies",
                ["company_id"],
                ["id"],
            )


def downgrade() -> None:
    if _table_exists("appointments"):
        if _fk_exists("appointments", "fk_appointments_company"):
            op.drop_constraint("fk_appointments_company", "appointments", type_="foreignkey")
        op.execute("DROP INDEX IF EXISTS ix_appointments_company_status")
        op.alter_column(
            "appointments",
            "company_id",
            existing_type=postgresql.UUID(as_uuid=True),
            nullable=True,
        )
        op.alter_column(
            "appointments",
            "type",
            existing_type=sa.String(length=50),
            nullable=True,
        )
    if _table_exists("services"):
        if _fk_exists("services", "fk_services_company"):
            op.drop_constraint("fk_services_company", "services", type_="foreignkey")
        op.execute("DROP INDEX IF EXISTS ix_services_company")
        op.alter_column(
            "services",
            "company_id",
            existing_type=postgresql.UUID(as_uuid=True),
            nullable=True,
        )
