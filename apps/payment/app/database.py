from __future__ import annotations

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
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
