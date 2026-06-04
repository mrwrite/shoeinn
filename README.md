# ShoeInn

Sneaker care scheduling, provider dispatch, notifications, and payment workflow demo.

This repository is a small monorepo. Run each app from its own folder:

- `apps/api` - FastAPI backend, Postgres schema, demo seed, workers
- `apps/mobile` - Expo React Native app
- `apps/payment` - optional Stripe-backed payment service

The local workflow below is Windows PowerShell first because that is the current development environment. macOS/Linux equivalents are mostly the same, except virtual environment activation paths and shell environment-variable syntax.

## Prerequisites

- Python 3.11+
- Node.js and npm
- Docker Desktop
- Expo Go for device testing, or an Android/iOS simulator
- Optional: Stripe CLI and Stripe test credentials for real payment-service testing
- Optional: Google Directions API key for route polylines and ETA cards

## Quick Start

The simplest local startup is:

```powershell
.\scripts\start-local.ps1
```

That command:

- starts Postgres with Docker Compose
- creates `apps/api/.venv` if needed
- creates and normalizes `apps/api/.env` for Windows host-to-Docker development
- installs API dependencies unless `-SkipInstall` is passed
- runs Alembic migrations
- starts the API in a separate PowerShell window
- seeds demo data
- starts Expo in the current window

Common variants:

```powershell
# Use the Mt. Juliet demo seed
.\scripts\start-local.ps1 -DemoMarket mt_juliet

# Use Expo tunnel for Metro connectivity
.\scripts\start-local.ps1 -Tunnel

# Skip dependency installation on repeat startups
.\scripts\start-local.ps1 -SkipInstall

# Use another API port if 8000 is already occupied
.\scripts\start-local.ps1 -Port 8002 -ApiBaseUrl "http://<YOUR-LAN-IP>:8002"

# Physical device on the same LAN
.\scripts\start-local.ps1 -ApiBaseUrl "http://<YOUR-LAN-IP>:8000"

# Physical device with Expo tunnel, matching npm start -- --tunnel
.\scripts\start-local.ps1 -ApiBaseUrl "http://192.168.1.14:8000" -Tunnel

# Service payment mode with local payment service and Expo Go return URL
.\scripts\start-local.ps1 `
  -ApiBaseUrl "http://192.168.1.14:8000" `
  -DemoMarket mt_juliet `
  -Tunnel `
  -PaymentMode service `
  -MobileRedirectBase "exp://192.168.1.14:8081/--"

# Same service-mode startup, but with API on port 8002
.\scripts\start-local.ps1 `
  -Port 8002 `
  -ApiBaseUrl "http://192.168.1.14:8002" `
  -DemoMarket mt_juliet `
  -Tunnel `
  -PaymentMode service `
  -MobileRedirectBase "exp://192.168.1.14:8081/--"
```

You can also start each side independently:

```powershell
.\scripts\start-api.ps1
.\scripts\start-mobile.ps1
```

For an Android emulator, point mobile at the emulator host bridge:

```powershell
.\scripts\start-mobile.ps1 -ApiBaseUrl "http://10.0.2.2:8000"
```

Manual setup commands are below for troubleshooting and non-Windows shells.

## Local Scripts

`scripts/start-api.ps1` prepares and runs the backend stack:

```powershell
.\scripts\start-api.ps1
```

Useful options:

- `-DemoMarket shelby` or `-DemoMarket mt_juliet`
- `-NoSeed` to skip the `POST /dev/seed` call
- `-ResetDb` to run `docker compose down -v` before starting Postgres
- `-SkipInstall` to skip `pip install`
- `-PaymentMode mock` or `-PaymentMode service`
- `-PaymentServiceBaseUrl "http://localhost:8001"` for service payment mode
- `-MobileRedirectBase "exp://<YOUR-LAN-IP>:8081/--"` for Expo Go returns, or `shoeinn://app` for a dev build
- `-Port 8000` to override the API port

If `apps/api/.env` already exists, the scripts preserve existing payment settings unless you explicitly pass `-PaymentMode`, `-PaymentServiceBaseUrl`, or `-MobileRedirectBase`.

`scripts/start-mobile.ps1` prepares Expo environment variables and starts the mobile app:

```powershell
.\scripts\start-mobile.ps1 -ApiBaseUrl "http://localhost:8000"
```

Useful options:

- `-ApiBaseUrl "http://10.0.2.2:8000"` for Android emulator
- `-ApiBaseUrl "http://<YOUR-LAN-IP>:8000"` for a physical device
- `-DemoMarket shelby` or `-DemoMarket mt_juliet` to choose which demo login buttons Expo displays
- `-ExpectedPaymentMode service` to fail fast if the API is not actually running in service payment mode
- `-Tunnel` to run `npm start -- --tunnel`
- `-SkipApiCheck` to skip the preflight `GET /health` check
- `-SkipInstall` to skip `npm install`

`scripts/start-payment.ps1` prepares and runs the optional Stripe payment service:

```powershell
.\scripts\start-payment.ps1
```

Useful options:

- `-Port 8001` to override the payment service port
- `-SkipInstall` to skip `pip install -e .`

The payment script expects `apps/payment/.env` to contain `STRIPE_API_KEY` and `STRIPE_WEBHOOK_SECRET`.

`scripts/start-local.ps1` opens the API script in a separate PowerShell window, waits briefly, then starts Expo in the current window.

When `-PaymentMode service` is passed, `start-local.ps1` also starts `apps/payment` in a separate PowerShell window before starting the API. The local payment service defaults to `http://localhost:8001`.

Useful options:

- `-Port 8002` to pass a non-default API port through to `start-api.ps1`
- `-ApiBaseUrl "http://<YOUR-LAN-IP>:8002"` to point Expo at that same API port on a physical device
- `-PaymentPort 8001` to override the local payment service port
- `-PaymentServiceBaseUrl "http://localhost:8001"` to point the API at a specific payment service URL
- `-SkipPaymentService` to use an already-running payment service without auto-starting one

## API Local Development

`apps/api/docker-compose.yml` runs Postgres only:

```powershell
cd .\apps\api
docker compose up -d
```

If your Docker install only supports the old command, use `docker-compose up -d`.

Create and install the backend environment:

```powershell
cd .\apps\api
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r ..\..\requirements.txt
pip install -e .
```

Create `.env`:

```powershell
Copy-Item .env.example .env
```

Important local database setting:

- Use `localhost` in `DATABASE_URL` when the API runs directly on Windows and Postgres runs in Docker.
- Use `db` only from another container on the same Docker network.

Known-good Windows host value:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/shoeinn
```

If you previously started Postgres with different credentials, the Docker volume keeps them. To reset the local DB and delete all local data:

```powershell
docker compose down -v
docker compose up -d
python -m alembic upgrade head
```

Start the API:

```powershell
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health checks:

```powershell
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/ready
```

`/health` only confirms the process is alive. `/ready` also checks the database, migration heads, and required notification table.

## Demo Seed

Seed the default Shelby County, Alabama demo:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/dev/seed?reset=true"
```

Seed the Mt. Juliet, Tennessee demo:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/dev/seed?reset=true&demo_market=mt_juliet"
```

Default demo logins all use `Password1!`:

- Global admin: `admin@shoeinn.com`
- Customer: `customer@shoeinn.com`
- Pelham owner: `pelham.admin@shoeinn.com`
- Pelham providers: `pelham.driver1@shoeinn.com`, `pelham.driver2@shoeinn.com`
- Helena owner: `helena.admin@shoeinn.com`
- Helena provider: `helena.driver@shoeinn.com`
- Alabaster owner: `alabaster.admin@shoeinn.com`
- Alabaster provider: `alabaster.driver@shoeinn.com`

Mt. Juliet quick-demo logins use `Password123!`:

- Customer: `customer.mtjuliet@shoeinn.demo`
- Provider: `provider.mtjuliet@shoeinn.demo`
- Company admin: `admin.mtjuliet@shoeinn.demo`

The seed response also returns the current login list and generated company IDs.

When `reset=true` is used, the seed endpoint clears all known demo markets before creating the requested market. That keeps Shelby/Helena records from showing up after reseeding Mt. Juliet.

## Mobile Local Development

Install dependencies:

```powershell
cd .\apps\mobile
npm install
```

Set the API base URL before starting Expo. Set both names for now: most code reads `EXPO_PUBLIC_API_BASE_URL`, while a service-admin helper still reads `EXPO_PUBLIC_API_URL`.

Windows host or iOS simulator:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://localhost:8000"
$env:EXPO_PUBLIC_API_URL=$env:EXPO_PUBLIC_API_BASE_URL
npm start
```

Android emulator:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:8000"
$env:EXPO_PUBLIC_API_URL=$env:EXPO_PUBLIC_API_BASE_URL
npm start
```

Physical device on the same LAN:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://<YOUR-LAN-IP>:8000"
$env:EXPO_PUBLIC_API_URL=$env:EXPO_PUBLIC_API_BASE_URL
npm start
```

Use Expo tunnel only for Metro connectivity if needed:

```powershell
npx expo start --tunnel
```

Tunnel mode does not automatically expose the backend API. A phone still needs an API URL it can reach.

Optional mobile environment values:

```powershell
$env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-directions-api-key"
$env:EXPO_PUBLIC_MOBILE_REDIRECT_BASE="exp://<YOUR-LAN-IP>:8081/--"
```

Use `EXPO_PUBLIC_MOBILE_REDIRECT_BASE="shoeinn://app"` for a dev build or standalone app that supports the custom scheme.

## Optional Payment Service

Most local development should keep the API in mock payment mode:

```env
PAYMENT_MODE=mock
PAYMENT_SERVICE_BASE_URL=
PAYMENT_MOBILE_REDIRECT_BASE=
```

Only start `apps/payment` when validating the Stripe-hosted checkout path.

Start the payment service:

```powershell
cd .\apps\payment
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
$env:STRIPE_API_KEY="sk_test_..."
$env:STRIPE_WEBHOOK_SECRET="whsec_..."
$env:DATABASE_URL="sqlite:///./payment.db"
$env:TENANT_ID="public"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Then set these API values in `apps/api/.env`:

```env
PAYMENT_MODE=service
PAYMENT_SERVICE_BASE_URL=http://localhost:8001
PAYMENT_MOBILE_REDIRECT_BASE=shoeinn://app
```

For Expo Go return-flow testing, use an explicit Expo URL instead:

```env
PAYMENT_MOBILE_REDIRECT_BASE=exp://<YOUR-LAN-IP>:8081/--
```

Forward Stripe webhooks in a separate shell when testing automatic reconciliation:

```powershell
stripe listen --forward-to http://localhost:8001/payments/webhooks/stripe
```

If you want the payment service to push status back to the booking API:

```powershell
$env:BOOKING_API_WEBHOOK_URL="http://localhost:8000/webhooks/payments"
```

### Service-mode booking validation

Use this path when validating real Stripe Checkout from mobile:

1. Start `apps/payment` with Stripe test keys.
2. Start `apps/api` with `PAYMENT_MODE=service`, `PAYMENT_SERVICE_BASE_URL`, and `PAYMENT_MOBILE_REDIRECT_BASE`.
3. Start mobile with the correct LAN API URL.
4. Select `Add new card in secure checkout`.
5. Tap `Place Booking` and verify Stripe Checkout opens immediately.
6. Cancel Checkout and verify the appointment remains visible as payment pending.
7. Reopen the appointment and use `Open secure checkout`, `Check payment status`, or `Cancel unpaid booking`.
8. Complete payment and verify return or `Check payment status` moves the appointment to paid/confirmed.

## Workers

The API process starts the payment sync worker only when:

- `PAYMENT_MODE=service`
- `PAYMENT_SERVICE_BASE_URL` is configured
- `ENABLE_PAYMENT_SYNC_WORKER` is not disabled

The notification worker is manual:

```powershell
cd .\apps\api
.\.venv\Scripts\Activate.ps1
python -m app.workers.notification_worker
```

Start it only when you need queued email, push, or in-app delivery validation.

## Testing

Run backend tests:

```powershell
cd .\apps\api
.\.venv\Scripts\Activate.ps1
python -m pytest tests -q
```

Run a focused backend test file:

```powershell
python -m pytest tests\test_assignment_claiming.py -q
```

The backend tests use in-memory SQLite through `apps/api/tests/conftest.py`, so they do not require local Postgres, migrations, or seeded data.

Run mobile tests and type checks:

```powershell
cd .\apps\mobile
npm test -- --runInBand
npm run typecheck
```

Run payment service tests:

```powershell
cd .\apps\payment
.\.venv\Scripts\Activate.ps1
python -m pytest tests -q
```

Recommended pre-demo validation:

```powershell
cd .\apps\api
python -m pytest tests\test_assignment_claiming.py tests\test_dev_seed.py tests\test_payment_gateway.py -q

cd ..\mobile
npm test -- --runInBand
npm run typecheck
```

## Troubleshooting

`password authentication failed for user`

The Postgres Docker volume likely has credentials from an older run. Reset it from `apps/api`:

```powershell
docker compose down -v
docker compose up -d
python -m alembic upgrade head
```

Mobile cannot reach the API

- Android emulator should use `http://10.0.2.2:8000`.
- Physical devices should use `http://<YOUR-LAN-IP>:8000`.
- Confirm the API is bound to `0.0.0.0`.
- Confirm Windows Firewall allows inbound traffic to port `8000` when using a physical device.
- If using `-Port 8002`, update both values: `-Port 8002 -ApiBaseUrl "http://<YOUR-LAN-IP>:8002"`.
- If `http://localhost:<PORT>/health` works but `http://<YOUR-LAN-IP>:<PORT>/health` does not work from the same machine, the issue is the LAN IP or Windows Firewall rule for that port.

Payment confirmation fails in service mode

- Confirm `PAYMENT_SERVICE_BASE_URL` is set.
- Confirm `PAYMENT_MOBILE_REDIRECT_BASE` is not blank or placeholder.
- Keep `PAYMENT_MODE=mock` if the payment service is not intentionally running.

Push warning: `No projectId found`

- Run `eas init` in `apps/mobile`.
- Ensure `extra.eas.projectId` is configured in the Expo app config.

Notifications are not sending

- Confirm the notification worker is running.
- Check `notification_outbox.status`.
- Verify push tokens exist for the target users.

## Useful Endpoints

- `GET /health` - process health
- `GET /ready` - database and migration readiness
- `POST /dev/seed?reset=true` - reset and seed default demo data
- `POST /dev/seed?reset=true&demo_market=mt_juliet` - reset and seed Mt. Juliet demo data
- `GET /companies` - list companies
- `GET /services` - list services
- `POST /auth/login` - login

Example login:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"customer@shoeinn.com","password":"Password1!"}'
```
