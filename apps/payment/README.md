# ShoeInn Payment Service

Optional FastAPI service that owns Stripe Checkout/PaymentIntent integration, payment records, Stripe webhook reconciliation, and payment-domain outbox rows.

Most local development uses the main API in `PAYMENT_MODE=mock` and does not require this service. Start `apps/payment` only when validating real Stripe Checkout behavior.

## Requirements

- Python 3.11+ for local script workflow
- Python 3.12 base image for the Dockerfile
- Stripe test account and test keys
- Optional Stripe CLI for local webhook forwarding

## Architecture

The mobile app never calls this service directly. The flow is:

1. Mobile confirms a booking through the API.
2. API calls `POST /payments/checkout-session` on the payment service.
3. Payment service creates or reuses a Stripe Customer and creates a Stripe Checkout Session.
4. Mobile opens the returned Stripe Checkout URL.
5. Stripe redirects to the configured API/browser return URL.
6. API/mobile can manually refresh payment status by booking id.
7. Stripe webhooks sent to the payment service update payment records and optionally call the booking API webhook.

## Local Startup

Create `apps/payment/.env`:

```env
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=sqlite:///./payment.db
TENANT_ID=public
BOOKING_API_WEBHOOK_URL=http://localhost:8000/webhooks/payments
BOOKING_API_WEBHOOK_SECRET=
DEFAULT_CURRENCY=usd
PAYMENT_ALLOW_TEST_CLOCK=true
```

Start with the helper script:

```powershell
.\scripts\start-payment.ps1
```

Manual startup:

```powershell
cd .\apps\payment
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Health check:

```powershell
Invoke-RestMethod http://localhost:8001/health
```

## Connect the API

Set in `apps/api/.env`:

```env
PAYMENT_MODE=service
PAYMENT_SERVICE_BASE_URL=http://localhost:8001
PAYMENT_MOBILE_REDIRECT_BASE=shoeinn://app
```

For Expo Go:

```env
PAYMENT_MOBILE_REDIRECT_BASE=exp://<YOUR-LAN-IP>:8081/--
```

Then start the API:

```powershell
.\scripts\start-api.ps1 -PaymentMode service -MobileRedirectBase "shoeinn://app"
```

## Stripe Webhooks

Forward Stripe events locally:

```powershell
stripe listen --forward-to http://localhost:8001/payments/webhooks/stripe
```

Copy the emitted `whsec_...` into `STRIPE_WEBHOOK_SECRET` and restart the payment service.

Webhook handler:

- `POST /payments/webhooks/stripe`

Supported event handling includes Checkout completion/expiration, PaymentIntent success/failure, refunds, and disputes.

## Testing

```powershell
cd .\apps\payment
.\.venv\Scripts\Activate.ps1
python -m pytest tests -q
```

Payment tests set in-memory SQLite and test Stripe env defaults in `tests/conftest.py`.

## Current Limits

- The payment service creates tables at startup with SQLAlchemy metadata; there is no Alembic migration track in `apps/payment`.
- Outbox rows are persisted, but no local broker publisher is implemented in this repository.
- Checkout can reuse Stripe Customers and eligible saved cards, but ShoeInn does not provide a separate card-management UI.
- Refund/dispute side effects are represented through payment state and compensating-action events; production support workflows remain future work.

## More Documentation

- [Payment architecture](../../docs/architecture/payment.md)
- [Environment reference](../../docs/environment.md)
- [Payment event notes](docs/consuming-payment-events.md)
