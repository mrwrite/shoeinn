from __future__ import annotations

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON, TypeDecorator


class JSONBType(TypeDecorator):
    """JSONB on Postgres, JSON elsewhere (e.g., SQLite tests)."""

    impl = JSONB
    cache_ok = True

    def load_dialect_impl(self, dialect):  # pragma: no cover - sqlalchemy hook
        if dialect.name == "postgresql":
            return dialect.type_descriptor(JSONB())
        return dialect.type_descriptor(JSON())
