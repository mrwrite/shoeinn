from __future__ import annotations

import os
import sys
from collections.abc import Generator
from pathlib import Path
from types import SimpleNamespace
from typing import Any
from uuid import uuid4

import pytest
import stripe
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

os.environ.setdefault("STRIPE_API_KEY", "sk_test_123")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_test_123")
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("TENANT_ID", "test-tenant")

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.config import get_settings
from app.database import Base, SessionLocal, get_engine, get_db
from app.main import create_app
from app.routers.payments import get_stripe_client


class FakeStripeClient:
    def __init__(self) -> None:
        self.checkout_sessions: dict[str, Any] = {}
        self.payment_intents: dict[str, Any] = {}

    def create_checkout_session(self, **kwargs: Any) -> Any:
        session_id = f"cs_test_{uuid4().hex}"
        session = SimpleNamespace(id=session_id, url=f"https://stripe.test/checkout/{session_id}")
        self.checkout_sessions[session_id] = {"kwargs": kwargs}
        return session

    def create_payment_intent(self, **kwargs: Any) -> Any:
        intent_id = f"pi_test_{uuid4().hex}"
        client_secret = f"{intent_id}_secret"
        intent = SimpleNamespace(id=intent_id, client_secret=client_secret)
        self.payment_intents[intent_id] = {"kwargs": kwargs}
        return intent

    def verify_signature(self, payload: str, sig_header: str) -> stripe.Event:
        settings = get_settings()
        return stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)


@pytest.fixture(scope="session", autouse=True)
def configure_settings() -> None:
    get_settings.cache_clear()
    get_settings()
    engine = get_engine()
    Base.metadata.create_all(bind=engine)


@pytest.fixture(autouse=True)
def clean_database() -> Generator[None, None, None]:
    engine = get_engine()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    SessionLocal.remove()


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    finally:
        session.close()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    app = create_app()
    fake_client = FakeStripeClient()
    app.state.fake_stripe = fake_client

    def _get_db_override() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _get_db_override
    app.dependency_overrides[get_stripe_client] = lambda: fake_client

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
