from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.db import Base, engine
from app.routers import (
    appointments,
    auth,
    companies,
    company_ops,
    dev_seed,
    health,
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


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(services.router)
app.include_router(slots.router)
app.include_router(appointments.router)
app.include_router(company_ops.router)
app.include_router(dev_seed.router)
