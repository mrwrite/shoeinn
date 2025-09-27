from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(slots=True)
class PaymentEvent:
    event_type: str
    payment_id: str
    booking_id: str
    tenant_id: str
    payload: dict


@dataclass(slots=True)
class PaymentSucceeded(PaymentEvent):
    event_type: str = field(default="PaymentSucceeded", init=False)


@dataclass(slots=True)
class PaymentFailed(PaymentEvent):
    event_type: str = field(default="PaymentFailed", init=False)


@dataclass(slots=True)
class PaymentRefunded(PaymentEvent):
    event_type: str = field(default="PaymentRefunded", init=False)


@dataclass(slots=True)
class PaymentDisputed(PaymentEvent):
    event_type: str = field(default="PaymentDisputed", init=False)
