from __future__ import annotations

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, declarative_base, scoped_session, sessionmaker
from sqlalchemy.pool import StaticPool

from .config import get_settings


Base = declarative_base()


_ENGINE = None


def _create_engine():
    settings = get_settings()
    connect_args = {}
    if settings.database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        if ":memory:" in settings.database_url:
            return create_engine(
                settings.database_url,
                connect_args=connect_args,
                future=True,
                poolclass=StaticPool,
            )
    return create_engine(settings.database_url, connect_args=connect_args, future=True)


def get_engine():
    """Return the configured SQLAlchemy engine."""

    global _ENGINE
    if _ENGINE is None:
        _ENGINE = _create_engine()
    return _ENGINE


def ensure_schema_compatibility() -> None:
    engine = get_engine()
    inspector = inspect(engine)
    if "payments" not in inspector.get_table_names():
        return

    payment_columns = {column["name"] for column in inspector.get_columns("payments")}
    statements: list[str] = []
    if "customer_email" not in payment_columns:
        statements.append("ALTER TABLE payments ADD COLUMN customer_email VARCHAR(255)")
    if "stripe_customer_id" not in payment_columns:
        statements.append("ALTER TABLE payments ADD COLUMN stripe_customer_id VARCHAR")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_payments_customer_email ON payments (customer_email)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_payments_stripe_customer_id ON payments (stripe_customer_id)"))


SessionLocal = scoped_session(
    sessionmaker(bind=get_engine(), autocommit=False, autoflush=False, expire_on_commit=False)
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def db_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
