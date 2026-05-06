"""HTTP client for interacting with the payment service."""

from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlparse

import httpx

from app.core.config import settings


class PaymentGatewayError(RuntimeError):
    """Raised when the payment service interaction fails."""


@dataclass(slots=True)
class CheckoutSession:
    payment_id: str
    checkout_session_id: str
    checkout_url: str | None
    status: str


@dataclass(slots=True)
class PaymentRecord:
    payment_id: str
    booking_id: str
    status: str
    amount_expected: int | None = None
    amount_received: int | None = None
    currency: str | None = None


class PaymentGateway:
    """Simple wrapper around the payment service REST API."""

    def __init__(self, base_url: str | None = None, *, timeout: float | None = None) -> None:
        self._base_url = (base_url or settings.payment_service_base_url or "").rstrip("/")
        self._timeout = timeout or settings.payment_service_timeout_seconds

    @property
    def mode(self) -> str:
        return settings.payment_mode

    @property
    def enabled(self) -> bool:
        return self.mode == "service" and bool(self._base_url)

    def _client(self) -> httpx.Client:
        if self.mode != "service":
            raise PaymentGatewayError("Payment service client is unavailable outside service mode")
        if not self._base_url:
            raise PaymentGatewayError("PAYMENT_MODE=service requires PAYMENT_SERVICE_BASE_URL")
        return httpx.Client(base_url=self._base_url, timeout=self._timeout)

    @staticmethod
    def _is_placeholder_checkout_url(value: str) -> bool:
        lowered = value.strip().lower()
        return any(
            marker in lowered
            for marker in (
                "example.com",
                "<your-lan-ip>",
                "<your",
                "changeme",
                "replace-me",
            )
        )

    @classmethod
    def _is_valid_checkout_url(cls, value: str) -> bool:
        parsed = urlparse(value.strip())
        return bool(parsed.scheme in {"http", "https"} and parsed.netloc and not cls._is_placeholder_checkout_url(value))

    def _validate_service_checkout_urls(self) -> None:
        success_url = settings.payment_checkout_success_url.strip()
        cancel_url = settings.payment_checkout_cancel_url.strip()
        failures: list[str] = []

        def _check(value: str, *, primary_env: str, alias_env: str) -> None:
            env_names = f"{primary_env} (or {alias_env})"
            if not value:
                failures.append(f"{env_names} is missing")
                return
            if self._is_placeholder_checkout_url(value):
                failures.append(f"{env_names} is still placeholder: {value}")
                return
            if not self._is_valid_checkout_url(value):
                failures.append(f"{env_names} must be an absolute http(s) URL: {value}")

        _check(
            success_url,
            primary_env="PAYMENT_CHECKOUT_SUCCESS_URL",
            alias_env="PAYMENT_SUCCESS_URL",
        )
        _check(
            cancel_url,
            primary_env="PAYMENT_CHECKOUT_CANCEL_URL",
            alias_env="PAYMENT_CANCEL_URL",
        )

        if failures:
            raise PaymentGatewayError(
                "PAYMENT_MODE=service requires valid checkout return URLs. " + "; ".join(failures)
            )

    def create_checkout_session(
        self,
        *,
        booking_id: str,
        amount_cents: int,
        currency: str,
        customer_email: str | None,
    ) -> CheckoutSession:
        if self.mode == "mock":
            return CheckoutSession(
                payment_id=f"stub_{booking_id}",
                checkout_session_id=f"stub_session_{booking_id}",
                checkout_url=None,
                status="succeeded",
            )
        if self.mode != "service":
            raise PaymentGatewayError(f"Unsupported payment mode: {self.mode}")
        if not self._base_url:
            raise PaymentGatewayError("PAYMENT_MODE=service requires PAYMENT_SERVICE_BASE_URL")

        self._validate_service_checkout_urls()
        success_url = settings.payment_checkout_success_url
        cancel_url = settings.payment_checkout_cancel_url
        payload = {
            "booking_id": booking_id,
            "amount": amount_cents,
            "currency": currency,
            "success_url": success_url,
            "cancel_url": cancel_url,
            "customer_email": customer_email,
        }

        with self._client() as client:
            try:
                response = client.post("/payments/checkout-session", json=payload)
                response.raise_for_status()
            except httpx.HTTPError as exc:  # pragma: no cover - httpx handles specifics
                raise PaymentGatewayError(str(exc)) from exc

        data = response.json()
        return CheckoutSession(
            payment_id=data["payment_id"],
            checkout_session_id=data["checkout_session_id"],
            checkout_url=data["checkout_url"],
            status=data.get("status", "pending"),
        )

    def fetch_payment(self, *, booking_id: str) -> PaymentRecord:
        if self.mode != "service":
            raise PaymentGatewayError("Payment fetch is unavailable outside service mode")
        with self._client() as client:
            try:
                response = client.get(f"/payments/{booking_id}")
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 404:
                    raise PaymentGatewayError("Payment not found") from exc
                raise PaymentGatewayError(str(exc)) from exc
            except httpx.HTTPError as exc:  # pragma: no cover - httpx handles specifics
                raise PaymentGatewayError(str(exc)) from exc

        data = response.json()
        return PaymentRecord(
            payment_id=data["id"],
            booking_id=data["booking_id"],
            status=data.get("status", "pending"),
            amount_expected=data.get("amount_expected"),
            amount_received=data.get("amount_received"),
            currency=data.get("currency"),
        )


__all__ = ["CheckoutSession", "PaymentGateway", "PaymentGatewayError", "PaymentRecord"]
