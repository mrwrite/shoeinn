# Consuming payment domain events

The payment service persists all outbound notifications in the `payment_events_outbox` table. A
background worker (or the shared outbox processor) should publish these rows to the platform event
bus using the topic provided by `PAYMENT_EVENT_TOPIC` (defaults to `payments`).

Each record contains:

| Column | Description |
| --- | --- |
| `event_type` | One of `PaymentSucceeded`, `PaymentFailed`, `PaymentRefunded`, `PaymentDisputed`, or `CompensatingActionRequested`. |
| `payload` | JSON document containing the payment identifiers and contextual data. |
| `payment_id` | Internal identifier for the payment record. |

The payload schema is consistent across events:

```json
{
  "payment_id": "<uuid>",
  "booking_id": "<booking-id>",
  "tenant_id": "<tenant>",
  "status": "succeeded",
  "amount_expected": 5000,
  "amount_received": 5000,
  "reason": "refund",             // only for CompensatingActionRequested
  "failure_code": "card_declined", // only for PaymentFailed
  "dispute_id": "dp_123"           // only for PaymentDisputed
}
```

## Authenticating payment events

Downstream services should authenticate messages by verifying the signature applied by the outbox
publisher. When events are delivered over HTTP, use standard HMAC verification with a shared secret
managed by the platform IAM team. For consumers pulling events from the broker directly, attach an
API token issued by the tenancy service. Tokens are scoped to the tenant found in the payload and
must be validated before taking any action.

## Suggested consumers

* **Booking service** – listens for `PaymentSucceeded` and `PaymentFailed` to confirm or release
  reservations. When `CompensatingActionRequested` is emitted (after refunds or disputes), the
  booking service should cancel any outstanding reservations tied to the booking ID.
* **Notifications** – sends customer emails/SMS when payments settle or fail.
* **Support tooling** – monitors `PaymentRefunded` and `PaymentDisputed` to surface action items for
  customer support agents. Consumers should reconcile the dispute status with Stripe using the
  `dispute_id` provided in the payload.

Services must store the most recent processed event ID to preserve idempotency, mirroring the
payment service's own `processed_stripe_events` table. This allows the platform to replay events
without creating duplicate side effects.
