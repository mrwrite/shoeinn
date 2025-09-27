from __future__ import annotations

from typing import Any

import stripe

from .config import get_settings


class StripeClient:
    """Wrapper around the Stripe SDK so it can be mocked in tests."""

    def __init__(self, api_key: str | None = None) -> None:
        settings = get_settings()
        stripe.api_key = api_key or settings.stripe_api_key
        self.tenant_id = settings.tenant_id

    def create_checkout_session(self, **kwargs: Any) -> stripe.checkout.Session:
        metadata = kwargs.pop("metadata", {})
        metadata.setdefault("tenant_id", self.tenant_id)
        return stripe.checkout.Session.create(metadata=metadata, **kwargs)

    def create_payment_intent(self, **kwargs: Any) -> stripe.PaymentIntent:
        metadata = kwargs.pop("metadata", {})
        metadata.setdefault("tenant_id", self.tenant_id)
        return stripe.PaymentIntent.create(metadata=metadata, **kwargs)

    def verify_signature(self, payload: str, sig_header: str) -> stripe.Event:
        settings = get_settings()
        return stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)


stripe_client = StripeClient
