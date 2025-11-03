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
    payment_service_base_url: str | None = None
    payment_checkout_success_url: str = "https://example.com/payment/success"
    payment_checkout_cancel_url: str = "https://example.com/payment/cancel"
    payment_service_timeout_seconds: float = 10.0
    payment_currency: str = "usd"
    enable_payment_sync_worker: bool = True
    payment_sync_interval_seconds: int = 5

    class Config:
        env_file = ".env"


settings = Settings()
