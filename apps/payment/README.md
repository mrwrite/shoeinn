# ShoeInn Payment Service

`apps/payment` is optional for most local development.

You do not need this service for common backend/mobile flows such as provider appointment claiming and assignment, because the main API treats `PAYMENT_SERVICE_BASE_URL` as optional.

Current behavior in the main API:

- local/demo API config should default to `PAYMENT_MODE=mock`
- if `PAYMENT_MODE=service`, `PAYMENT_SERVICE_BASE_URL` must be configured
- if `PAYMENT_MODE=service`, configure a reachable non-placeholder mobile/frontend redirect base with `PAYMENT_MOBILE_REDIRECT_BASE`
- the payment sync worker only starts in `service` mode when `PAYMENT_SERVICE_BASE_URL` is configured

## Current documentation status

This service is currently underdocumented compared to `apps/api` and `apps/mobile`. The startup notes below are the minimum known local workflow inferred from the checked-in code.

## Local startup (Windows PowerShell)

```powershell
cd .\apps\payment
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
```

Required environment variables from `app/config.py`:

```powershell
$env:STRIPE_API_KEY="sk_test_..."
$env:STRIPE_WEBHOOK_SECRET="whsec_test_..."
```

Optional local defaults:

```powershell
$env:DATABASE_URL="sqlite:///./payment.db"
$env:TENANT_ID="public"
```

Start the service:

```powershell
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

If you want the main API to talk to this service locally, set in `apps/api/.env`:

```env
PAYMENT_MODE=service
PAYMENT_SERVICE_BASE_URL=http://localhost:8001
PAYMENT_MOBILE_REDIRECT_BASE=shoeinn://app
# Development or standalone build:
# PAYMENT_MOBILE_REDIRECT_BASE=shoeinn://app
# Expo Go fallback:
# PAYMENT_MOBILE_REDIRECT_BASE=exp://<YOUR-LAN-IP>:8081/--
```

If that redirect base is missing or still placeholder, booking confirmation will fail in `service` mode by design.

This is the smallest supported real demo path. The mobile app opens hosted Stripe Checkout, Stripe returns directly to the configured mobile/frontend redirect base, and ShoeInn verifies payment state from the returned `booking_id` plus optional `session_id`. Manual "Check payment status" remains available as fallback. Refunds, disputes, and payouts remain deferred.

## Saved payment method behavior

The payment service now creates or reuses a Stripe Customer when it has a customer email, and Checkout Sessions are created against that customer. This enables the closest Stripe-supported saved-card behavior for Checkout without building a full card-management UI.

Limits to be aware of:

- Stripe Checkout `payment` mode does not let ShoeInn force an arbitrary "default card" selection.
- Checkout can prefill saved cards for a returning customer when those cards are eligible for redisplay.
- New payment methods can be saved for future reuse through Checkout when the customer opts in.

## Local Stripe webhook forwarding

Manual payment refresh now reconciles the live Stripe Checkout Session even if webhook delivery is unavailable, but webhook forwarding is still the recommended local setup so successful payments update automatically.

Use the Stripe CLI in a separate shell:

```powershell
stripe listen --forward-to http://localhost:8001/payments/webhooks/stripe
```

Copy the emitted signing secret into `STRIPE_WEBHOOK_SECRET`, then keep `BOOKING_API_WEBHOOK_URL` pointed at the API callback if you want the payment service to push updates automatically:

```powershell
$env:BOOKING_API_WEBHOOK_URL="http://localhost:8000/webhooks/payments"
```

## Expo return-flow note

Per Expo's linking guidance, a stable custom scheme requires a development build or standalone app. Expo Go can still be used for local return-flow testing, but `PAYMENT_MOBILE_REDIRECT_BASE` should be set explicitly to an `exp://.../--` URL instead of a custom scheme.
