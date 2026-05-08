from __future__ import annotations

from fastapi import FastAPI

from .config import get_settings
from .database import Base, ensure_schema_compatibility, get_engine
from .routers import payments


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version="1.0.0")

    Base.metadata.create_all(bind=get_engine())
    ensure_schema_compatibility()

    app.include_router(payments.router)
    return app


app = create_app()
