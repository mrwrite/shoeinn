from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import settings


def _normalize_db_url(url: str) -> str:
    # psycopg v3 (installed via psycopg[binary]) requires the
    # "postgresql+psycopg://" scheme. SQLAlchemy defaults the bare
    # "postgresql://"/"postgres://" scheme to psycopg2, which is not installed.
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


engine = create_engine(_normalize_db_url(settings.database_url), future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
