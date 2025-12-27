import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("full_name", sa.String()),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "companies",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("city", sa.String()),
        sa.Column("state", sa.String()),
        sa.Column("postal_code", sa.String()),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("hours_json", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "services",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("company_id", sa.String(), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("name", sa.String()),
        sa.Column("description", sa.Text()),
        sa.Column("price_cents", sa.Integer()),
        sa.Column("duration_min", sa.Integer()),
        sa.Column("active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_services_company_active", "services", ["company_id", "active"])

    op.create_table(
        "user_refresh_tokens",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("user_agent", sa.String()),
        sa.Column("ip_address", sa.String()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_rotated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("ix_user_refresh_tokens_id", "user_refresh_tokens", ["id"])

    op.create_table(
        "company_users",
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("company_id", sa.String(), sa.ForeignKey("companies.id"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("user_id", "company_id"),
    )
    op.create_index("ix_company_users_company_id", "company_users", ["company_id"])

    op.create_table(
        "appointments",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("customer_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("company_id", sa.String(), sa.ForeignKey("companies.id")),
        sa.Column("service_id", sa.String(), sa.ForeignKey("services.id")),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("address_line1", sa.String()),
        sa.Column("address_line2", sa.String()),
        sa.Column("city", sa.String()),
        sa.Column("state", sa.String()),
        sa.Column("postal_code", sa.String()),
        sa.Column("start_time_utc", sa.DateTime(timezone=True), nullable=False),
        sa.Column("tz_offset_min", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("status", sa.String(), server_default=sa.text("'requested'")),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("company_id", "start_time_utc", name="uq_appointments_company_start_time"),
    )
    op.create_index("ix_appointments_start_time_utc", "appointments", ["start_time_utc"])

    op.create_table(
        "notifications",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("company_id", sa.String(), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("appointment_id", sa.Uuid(), sa.ForeignKey("appointments.id"), nullable=False),
        sa.Column("kind", sa.String(), nullable=False),
        sa.Column("channel", sa.String(), server_default=sa.text("'email'"), nullable=False),
        sa.Column("target", sa.String()),
        sa.Column("payload_json", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.Column("status", sa.String(), server_default=sa.text("'pending'"), nullable=False),
        sa.Column("delivered", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("delivered_at", sa.DateTime(timezone=True)),
        sa.Column("provider_message_id", sa.String()),
        sa.Column("delivery_attempts", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("last_attempt_at", sa.DateTime(timezone=True)),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True)),
        sa.Column("last_error_code", sa.String()),
        sa.Column("last_error_message", sa.Text()),
        sa.Column("last_error_at", sa.DateTime(timezone=True)),
        sa.Column("dead_lettered", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("metadata_json", sa.Text()),
    )
    op.create_index("ix_notifications_company_status", "notifications", ["company_id", "status"])

    op.create_table(
        "notification_outbox",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("notification_id", sa.Uuid(), sa.ForeignKey("notifications.id"), nullable=False),
        sa.Column("status", sa.String(), server_default=sa.text("'pending'"), nullable=False),
        sa.Column("channel", sa.String(), nullable=False),
        sa.Column("target", sa.String()),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.Column("available_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("locked_at", sa.DateTime(timezone=True)),
        sa.Column("processed_at", sa.DateTime(timezone=True)),
        sa.Column("dead_letter_reason", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_notification_outbox_notification_id", "notification_outbox", ["notification_id"])

    op.create_table(
        "notification_events",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("notification_id", sa.Uuid(), sa.ForeignKey("notifications.id"), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("payload_json", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_notification_events_notification_id", "notification_events", ["notification_id"])


def downgrade():
    op.drop_index("ix_notification_events_notification_id", table_name="notification_events")
    op.drop_table("notification_events")

    op.drop_index("ix_notification_outbox_notification_id", table_name="notification_outbox")
    op.drop_table("notification_outbox")

    op.drop_index("ix_notifications_company_status", table_name="notifications")
    op.drop_table("notifications")

    op.drop_index("ix_appointments_start_time_utc", table_name="appointments")
    op.drop_table("appointments")

    op.drop_index("ix_company_users_company_id", table_name="company_users")
    op.drop_table("company_users")

    op.drop_index("ix_user_refresh_tokens_id", table_name="user_refresh_tokens")
    op.drop_table("user_refresh_tokens")

    op.drop_index("ix_services_company_active", table_name="services")
    op.drop_table("services")

    op.drop_table("companies")

    op.drop_table("users")
