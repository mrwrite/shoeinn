from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text


# --- fill these in with the new generated values Alembic put at the top ---
revision = "<new_revision_id>"
down_revision = "norm_services_and_appts"
branch_labels = None
depends_on = None


def _table_exists(name: str) -> bool:
    insp = sa.inspect(op.get_bind())
    return name in insp.get_table_names()


def upgrade() -> None:
    bind = op.get_bind()

    # Ensure pgcrypto exists (needed for gen_random_uuid)
    bind.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto;"))

    # -------------------------
    # companies
    # -------------------------
    if not _table_exists("companies"):
        op.create_table(
            "companies",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("name", sa.String(), nullable=False, unique=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("city", sa.String(), nullable=True),
            sa.Column("state", sa.String(), nullable=True),
            sa.Column("postal_code", sa.String(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("hours_json", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        )

    # -------------------------
    # users
    # -------------------------
    if not _table_exists("users"):
        op.create_table(
            "users",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("email", sa.String(), nullable=False, unique=True),
            sa.Column("password_hash", sa.String(), nullable=False),
            sa.Column("full_name", sa.String(), nullable=True),
            sa.Column("role", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        )

    # -------------------------
    # user_refresh_tokens
    # -------------------------
    if not _table_exists("user_refresh_tokens"):
        op.create_table(
            "user_refresh_tokens",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("token_hash", sa.String(128), nullable=False, unique=True),
            sa.Column("user_agent", sa.String(), nullable=True),
            sa.Column("ip_address", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.Column("last_rotated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_user_refresh_tokens_user_id", "user_refresh_tokens", ["user_id"])

    # -------------------------
    # company_users (join)
    # -------------------------
    if not _table_exists("company_users"):
        op.create_table(
            "company_users",
            sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
            sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), primary_key=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.UniqueConstraint("user_id", "company_id", name="uq_company_users_user_company"),
        )
        op.create_index("ix_company_users_company_id", "company_users", ["company_id"])

    # -------------------------
    # notifications
    # -------------------------
    if not _table_exists("notifications"):
        op.create_table(
            "notifications",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
            sa.Column("appointment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("appointments.id"), nullable=False),
            sa.Column("kind", sa.String(), nullable=False),
            sa.Column("channel", sa.String(), nullable=False, server_default="email"),
            sa.Column("target", sa.String(), nullable=True),
            sa.Column("payload_json", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.Column("status", sa.String(), nullable=False, server_default="pending"),
            sa.Column("delivered", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_notifications_company_status", "notifications", ["company_id", "status"])

    # -------------------------
    # notification_events
    # -------------------------
    if not _table_exists("notification_events"):
        op.create_table(
            "notification_events",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("notification_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("notifications.id"), nullable=False),
            sa.Column("event_type", sa.String(), nullable=False),
            sa.Column("payload_json", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        )
        op.create_index("ix_notification_events_notification_id", "notification_events", ["notification_id"])

    # -------------------------
    # available_slots
    # -------------------------
    if not _table_exists("available_slots"):
        op.create_table(
            "available_slots",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
            sa.Column("service_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("services.id"), nullable=True),
            sa.Column("start_time_utc", sa.DateTime(timezone=True), nullable=False),
            sa.Column("is_available", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("last_booked_at", sa.DateTime(timezone=True), nullable=True),
            sa.UniqueConstraint("company_id", "service_id", "start_time_utc", name="uq_available_slots_company_service_time"),
        )
        op.create_index("ix_available_slots_company_time", "available_slots", ["company_id", "start_time_utc"])

    # -------------------------
    # Backfill a demo company + assign services.company_id if null
    # -------------------------
    if _table_exists("companies") and _table_exists("services"):
        bind.execute(text("""
            INSERT INTO companies (name, city, state, is_active, created_at)
            SELECT 'ShoeInn Demo Cleaners', 'McDonough', 'GA', true, now()
            WHERE NOT EXISTS (SELECT 1 FROM companies);
        """))

        bind.execute(text("""
            UPDATE services
            SET company_id = (SELECT id FROM companies ORDER BY created_at DESC LIMIT 1)
            WHERE company_id IS NULL;
        """))


def downgrade() -> None:
    # Typically fine to no-op in dev migrations,
    # or drop in reverse order if you need it.
    pass
