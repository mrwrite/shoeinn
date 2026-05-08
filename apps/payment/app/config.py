from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuration values for the payment service."""

    app_name: str = "payment-service"
    environment: str = Field(default="development", validation_alias="ENVIRONMENT")
    database_url: str = Field(default="sqlite:///./payment.db", validation_alias="DATABASE_URL")

    stripe_api_key: str = Field(..., validation_alias="STRIPE_API_KEY")
    stripe_webhook_secret: str = Field(..., validation_alias="STRIPE_WEBHOOK_SECRET")
    tenant_id: str = Field(default="public", validation_alias="TENANT_ID")
    event_bus_topic: str = Field(default="payments", validation_alias="PAYMENT_EVENT_TOPIC")
    booking_api_webhook_url: str | None = Field(default=None, validation_alias="BOOKING_API_WEBHOOK_URL")
    booking_api_webhook_secret: str | None = Field(default=None, validation_alias="BOOKING_API_WEBHOOK_SECRET")

    default_currency: str = Field(default="usd", validation_alias="DEFAULT_CURRENCY")
    allow_test_clock: bool = Field(default=True, validation_alias="PAYMENT_ALLOW_TEST_CLOCK")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""

    return Settings()
