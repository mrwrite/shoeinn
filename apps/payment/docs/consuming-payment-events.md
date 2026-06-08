# Consuming payment domain events

The payment service persists outbound payment-domain notifications in the `payment_events_outbox` table. The current repository does not include a broker publisher for this outbox; rows are durable records for future asynchronous publishing or support tooling.

If a publisher is added later, `PAYMENT_EVENT_TOPIC` defaults to `payments` and should be used as the logical topic name.

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
  "reason": "refund",
  "failure_code": "card_declined",
  "dispute_id": "dp_123"
}
```

## Current consumers

- Booking API: receives direct HTTP callbacks when `BOOKING_API_WEBHOOK_URL` is set.
- Manual reconciliation: the API payment sync worker and mobile "Check payment status" path can re-query status by booking id.

## Future consumers

- Notifications: customer payment-settled and payment-failed delivery.
- Support tooling: refund and dispute queues.
- Event broker publisher: durable outbox publishing using `PAYMENT_EVENT_TOPIC`.

Future consumers should store the most recent processed event id to keep replay idempotent, mirroring the payment service's `processed_stripe_events` table.
