from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from .models import PaymentStatus


class CreateCheckoutSessionRequest(BaseModel):
    booking_id: str = Field(..., description="Unique booking identifier")
    amount: int = Field(..., ge=0, description="Amount to collect in the smallest currency unit")
    currency: str = Field(default="usd", min_length=3, max_length=3)
    success_url: str
    cancel_url: str
    customer_email: Optional[str] = None


class CreateCheckoutSessionResponse(BaseModel):
    checkout_session_id: str
    checkout_url: str
    payment_id: str
    status: PaymentStatus


class CreatePaymentIntentRequest(BaseModel):
    booking_id: str
    amount: int = Field(..., ge=0)
    currency: str = Field(default="usd", min_length=3, max_length=3)
    customer_id: Optional[str] = None
    payment_method_types: list[str] = Field(default_factory=lambda: ["card"])


class CreatePaymentIntentResponse(BaseModel):
    payment_intent_id: str
    client_secret: str
    payment_id: str
    status: PaymentStatus


class WebhookResponse(BaseModel):
    received: bool


class PaymentRecord(BaseModel):
    id: str
    booking_id: str
    tenant_id: str
    currency: str
    amount_expected: int
    amount_received: Optional[int]
    stripe_checkout_session_id: Optional[str]
    stripe_payment_intent_id: Optional[str]
    status: PaymentStatus

    class Config:
        from_attributes = True
