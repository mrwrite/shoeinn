from __future__ import annotations

from dataclasses import dataclass

from app.models import Service


_DELIVERY_FEE_CENTS = 799
_SERVICE_FEE_RATE = 0.08
_MIN_SERVICE_FEE_CENTS = 199
_ESTIMATED_TAX_RATE = 0.0825


@dataclass(slots=True)
class PriceLineItem:
    code: str
    label: str
    amount: int
    kind: str


@dataclass(slots=True)
class BookingQuote:
    service_id: str
    service_name: str
    currency: str
    line_items: list[PriceLineItem]
    subtotal: int
    fees: int
    estimated_tax: int
    total: int


def calculate_booking_quote(*, service: Service, booking_type: str, currency: str) -> BookingQuote:
    base_price = int(service.price_cents or 0)
    normalized_type = (booking_type or "pickup").strip().lower()
    delivery_fee = _DELIVERY_FEE_CENTS if normalized_type in {"delivery", "pickup_delivery"} else 0
    service_fee = max(_MIN_SERVICE_FEE_CENTS, round(base_price * _SERVICE_FEE_RATE))

    line_items = [
        PriceLineItem(code="service_base", label=service.name, amount=base_price, kind="service"),
    ]
    if delivery_fee > 0:
        line_items.append(
            PriceLineItem(
                code="pickup_delivery_fee",
                label="Pickup & delivery fee",
                amount=delivery_fee,
                kind="fee",
            )
        )

    line_items.append(
        PriceLineItem(code="platform_fee", label="Service fee", amount=service_fee, kind="fee")
    )

    subtotal = base_price
    fees = delivery_fee + service_fee
    estimated_tax = round((subtotal + fees) * _ESTIMATED_TAX_RATE)
    total = subtotal + fees + estimated_tax

    return BookingQuote(
        service_id=str(service.id),
        service_name=service.name,
        currency=currency.lower(),
        line_items=line_items,
        subtotal=subtotal,
        fees=fees,
        estimated_tax=estimated_tax,
        total=total,
    )


__all__ = ["BookingQuote", "PriceLineItem", "calculate_booking_quote"]
