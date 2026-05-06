from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./dev.db"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    jwt_secret: str = "changeme"
    allowed_origins: str = "*"
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 30
    appointment_hold_minutes: int = 15
    hold_cleanup_interval_seconds: int = 60
    notification_dispatch_interval_seconds: int = 5
    notification_max_attempts: int = 5
    notification_backoff_seconds: int = 30
    enable_notification_dispatcher: bool = True
    db_auto_create: bool = False
    payment_mode: str = "mock"
    payment_service_base_url: str | None = None
    payment_checkout_success_url: str = Field(
        default="",
        validation_alias=AliasChoices("PAYMENT_CHECKOUT_SUCCESS_URL", "PAYMENT_SUCCESS_URL"),
    )
    payment_checkout_cancel_url: str = Field(
        default="",
        validation_alias=AliasChoices("PAYMENT_CHECKOUT_CANCEL_URL", "PAYMENT_CANCEL_URL"),
    )
    payment_service_timeout_seconds: float = 10.0
    payment_currency: str = "usd"
    enable_payment_sync_worker: bool = True
    payment_sync_interval_seconds: int = 5

    @field_validator("payment_mode", mode="before")
    @classmethod
    def normalize_payment_mode(cls, value: str | None) -> str:
        normalized = (value or "mock").strip().lower()
        if normalized == "stub":
            normalized = "mock"
        if normalized not in {"mock", "service"}:
            raise ValueError("payment_mode must be one of: mock, service, stub")
        return normalized

    class Config:
        env_file = ".env"


settings = Settings()
