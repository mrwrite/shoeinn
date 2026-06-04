"""add care categories

Revision ID: a9d8f2c6b1e4
Revises: f7c1e2d3a4b5
Create Date: 2026-06-03 00:00:00.000000
"""

from __future__ import annotations

import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "a9d8f2c6b1e4"
down_revision = "f7c1e2d3a4b5"
branch_labels = None
depends_on = None


SHOES_CATEGORY_ID = uuid.UUID("11111111-1111-4111-8111-111111111111")
BASELINE_CATEGORIES = (
    {
        "id": SHOES_CATEGORY_ID,
        "slug": "shoes",
        "name": "Shoes",
        "description": "Premium cleaning, restoration, and pickup care for sneakers and footwear.",
        "sort_order": 10,
        "icon_key": "footprints",
        "hero_image_url": None,
        "is_active": True,
    },
    {
        "id": uuid.UUID("22222222-2222-4222-8222-222222222222"),
        "slug": "laundry",
        "name": "Laundry",
        "description": "Wash, fold, pickup, and delivery care for everyday garments and linens.",
        "sort_order": 20,
        "icon_key": "shirt",
        "hero_image_url": None,
        "is_active": True,
    },
    {
        "id": uuid.UUID("33333333-3333-4333-8333-333333333333"),
        "slug": "dry-cleaning",
        "name": "Dry Cleaning",
        "description": "Professional care for delicate garments, suits, dresses, and formal wear.",
        "sort_order": 30,
        "icon_key": "sparkles",
        "hero_image_url": None,
        "is_active": True,
    },
    {
        "id": uuid.UUID("44444444-4444-4444-8444-444444444444"),
        "slug": "handbags-leather",
        "name": "Handbags & Leather",
        "description": "Specialist cleaning and conditioning for handbags, leather goods, and accessories.",
        "sort_order": 40,
        "icon_key": "briefcase",
        "hero_image_url": None,
        "is_active": True,
    },
    {
        "id": uuid.UUID("55555555-5555-4555-8555-555555555555"),
        "slug": "rugs-textiles",
        "name": "Rugs & Textiles",
        "description": "Premium care for rugs, home textiles, and delicate fabric items.",
        "sort_order": 50,
        "icon_key": "layout-grid",
        "hero_image_url": None,
        "is_active": True,
    },
    {
        "id": uuid.UUID("66666666-6666-4666-8666-666666666666"),
        "slug": "alterations",
        "name": "Alterations",
        "description": "Tailoring, fit adjustments, repairs, and garment finishing services.",
        "sort_order": 60,
        "icon_key": "scissors",
        "hero_image_url": None,
        "is_active": True,
    },
)


def _table_exists(table_name: str) -> bool:
    return table_name in sa.inspect(op.get_bind()).get_table_names()


def _column_exists(table_name: str, column_name: str) -> bool:
    if not _table_exists(table_name):
        return False
    return any(column["name"] == column_name for column in sa.inspect(op.get_bind()).get_columns(table_name))


def _index_exists(table_name: str, index_name: str) -> bool:
    if not _table_exists(table_name):
        return False
    return any(index["name"] == index_name for index in sa.inspect(op.get_bind()).get_indexes(table_name))


def _fk_exists(table_name: str, fk_name: str) -> bool:
    if not _table_exists(table_name):
        return False
    return any(fk["name"] == fk_name for fk in sa.inspect(op.get_bind()).get_foreign_keys(table_name))


def _uuid_type() -> sa.types.TypeEngine:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return postgresql.UUID(as_uuid=True)
    return sa.String(length=36)


def _seed_categories() -> None:
    care_categories = sa.table(
        "care_categories",
        sa.column("id", _uuid_type()),
        sa.column("slug", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.Text),
        sa.column("sort_order", sa.Integer),
        sa.column("icon_key", sa.String),
        sa.column("hero_image_url", sa.String),
        sa.column("is_active", sa.Boolean),
    )
    bind = op.get_bind()
    existing_slugs = {
        row[0]
        for row in bind.execute(sa.text("SELECT slug FROM care_categories WHERE slug IN :slugs").bindparams(
            sa.bindparam("slugs", expanding=True),
        ), {"slugs": [category["slug"] for category in BASELINE_CATEGORIES]})
    }
    missing = [category for category in BASELINE_CATEGORIES if category["slug"] not in existing_slugs]
    if missing:
        op.bulk_insert(care_categories, missing)


def upgrade() -> None:
    uuid_type = _uuid_type()

    if not _table_exists("care_categories"):
        op.create_table(
            "care_categories",
            sa.Column("id", uuid_type, primary_key=True),
            sa.Column("slug", sa.String(length=100), nullable=False, unique=True),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("icon_key", sa.String(length=100), nullable=True),
            sa.Column("hero_image_url", sa.String(length=1024), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
    if not _index_exists("care_categories", "ix_care_categories_slug"):
        op.create_index("ix_care_categories_slug", "care_categories", ["slug"], unique=True)
    if not _index_exists("care_categories", "ix_care_categories_active_sort"):
        op.create_index("ix_care_categories_active_sort", "care_categories", ["is_active", "sort_order"])

    _seed_categories()

    if not _column_exists("services", "category_id"):
        op.add_column("services", sa.Column("category_id", uuid_type, nullable=True))
    if not _fk_exists("services", "fk_services_category_id_care_categories"):
        op.create_foreign_key(
            "fk_services_category_id_care_categories",
            "services",
            "care_categories",
            ["category_id"],
            ["id"],
        )
    if not _index_exists("services", "ix_services_category_active"):
        op.create_index("ix_services_category_active", "services", ["category_id", "is_active"])

    op.execute(
        """
        UPDATE services
        SET category_id = (
            SELECT id
            FROM care_categories
            WHERE slug = 'shoes'
            LIMIT 1
        )
        WHERE category_id IS NULL
        """
    )

    if not _table_exists("company_care_categories"):
        op.create_table(
            "company_care_categories",
            sa.Column("company_id", uuid_type, sa.ForeignKey("companies.id"), primary_key=True),
            sa.Column("category_id", uuid_type, sa.ForeignKey("care_categories.id"), primary_key=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.UniqueConstraint("company_id", "category_id"),
        )
    if not _index_exists("company_care_categories", "ix_company_care_categories_category"):
        op.create_index(
            "ix_company_care_categories_category",
            "company_care_categories",
            ["category_id", "is_active"],
        )

    if not _table_exists("provider_care_categories"):
        op.create_table(
            "provider_care_categories",
            sa.Column("provider_id", uuid_type, sa.ForeignKey("users.id"), primary_key=True),
            sa.Column("category_id", uuid_type, sa.ForeignKey("care_categories.id"), primary_key=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.UniqueConstraint("provider_id", "category_id"),
        )
    if not _index_exists("provider_care_categories", "ix_provider_care_categories_category"):
        op.create_index(
            "ix_provider_care_categories_category",
            "provider_care_categories",
            ["category_id", "is_active"],
        )

    op.execute(
        """
        INSERT INTO company_care_categories (company_id, category_id, is_active, created_at)
        SELECT DISTINCT company_id, category_id, TRUE, NOW()
        FROM services
        WHERE category_id IS NOT NULL
          AND company_id IS NOT NULL
        ON CONFLICT (company_id, category_id) DO NOTHING
        """
    )


def downgrade() -> None:
    bind = op.get_bind()

    if _table_exists("provider_care_categories"):
        op.drop_table("provider_care_categories")
    if _table_exists("company_care_categories"):
        op.drop_table("company_care_categories")

    if _index_exists("services", "ix_services_category_active"):
        op.drop_index("ix_services_category_active", table_name="services")
    if _fk_exists("services", "fk_services_category_id_care_categories"):
        op.drop_constraint("fk_services_category_id_care_categories", "services", type_="foreignkey")
    if _column_exists("services", "category_id"):
        op.drop_column("services", "category_id")

    if _table_exists("care_categories"):
        if bind.dialect.name != "sqlite":
            if _index_exists("care_categories", "ix_care_categories_active_sort"):
                op.drop_index("ix_care_categories_active_sort", table_name="care_categories")
            if _index_exists("care_categories", "ix_care_categories_slug"):
                op.drop_index("ix_care_categories_slug", table_name="care_categories")
        op.drop_table("care_categories")
