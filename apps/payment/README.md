# ShoeInn Payment Service

`apps/payment` is optional for most local development.

You do not need this service for common backend/mobile flows such as provider appointment claiming and assignment, because the main API treats `PAYMENT_SERVICE_BASE_URL` as optional.

Current behavior in the main API:

- if `PAYMENT_SERVICE_BASE_URL` is unset, the backend uses stub payment behavior
- the payment sync worker only starts when `PAYMENT_SERVICE_BASE_URL` is configured

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
PAYMENT_SERVICE_BASE_URL=http://localhost:8001
```
