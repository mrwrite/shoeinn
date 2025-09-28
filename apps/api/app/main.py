from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.engine import make_url

from app.core.config import settings
from app.core.db import Base, engine
from app.utils.holds import hold_cleanup_worker
from app.utils.notification_dispatcher import notification_dispatcher
from app.routers import (
    appointments,
    auth,
    companies,
    company_ops,
    dev_seed,
    health,
    webhooks,
    services,
    slots,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"] ,
)


def _should_auto_create() -> bool:
    """Determine whether the ORM should auto-create tables on startup."""

    if settings.db_auto_create:
        return True

    try:
        url = make_url(settings.database_url)
    except Exception:  # pragma: no cover - defensive fallback
        return False

    return url.get_backend_name() == "sqlite"


@app.on_event("startup")
def startup():
    if _should_auto_create():
        Base.metadata.create_all(bind=engine)
    hold_cleanup_worker.start()
    notification_dispatcher.start()


@app.on_event("shutdown")
def shutdown():
    hold_cleanup_worker.stop()
    notification_dispatcher.stop()


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(services.router)
app.include_router(slots.router)
app.include_router(appointments.router)
app.include_router(company_ops.router)
app.include_router(dev_seed.router)
app.include_router(webhooks.router)
