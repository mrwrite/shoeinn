# Getting Started

This guide takes a new developer from a clean checkout to a seeded API and running mobile app.

## 1. Clone and Install Tools

Required:

- Git
- Python 3.11+
- Node.js 20 LTS recommended
- npm
- Docker Desktop
- Expo Go for quick phone testing, or Android Studio/Xcode simulator tooling

Optional:

- EAS CLI for mobile builds: `npm install -g eas-cli`
- Stripe CLI for real payment-service webhook testing

## 2. Start the API and Seed Demo Data

Windows PowerShell from the repository root:

```powershell
.\scripts\start-api.ps1
```

This starts Postgres, installs API dependencies, runs migrations, starts the API on `http://localhost:8000`, and seeds the Shelby demo market.

For Mt. Juliet:

```powershell
.\scripts\start-api.ps1 -DemoMarket mt_juliet
```

Manual API flow:

```powershell
cd .\apps\api
docker compose up -d
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r ..\..\requirements.txt
pip install -e .
Copy-Item .env.example .env
python -m alembic upgrade head
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

In another shell:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/dev/seed?reset=true"
```

## 3. Start the Mobile App

Install and run:

```powershell
cd .\apps\mobile
npm install
$env:EXPO_PUBLIC_API_BASE_URL="http://localhost:8000"
$env:EXPO_PUBLIC_API_URL=$env:EXPO_PUBLIC_API_BASE_URL
npx expo start
```

For Android emulator:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:8000"
$env:EXPO_PUBLIC_API_URL=$env:EXPO_PUBLIC_API_BASE_URL
npx expo start
```

For a physical phone:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://<YOUR-LAN-IP>:8000"
$env:EXPO_PUBLIC_API_URL=$env:EXPO_PUBLIC_API_BASE_URL
npx expo start --tunnel
```

The helper script can do the same setup:

```powershell
.\scripts\start-mobile.ps1 -ApiBaseUrl "http://<YOUR-LAN-IP>:8000" -Tunnel
```

## 4. Demo Logins

Shelby County demo, password `Password1!`:

- Customer: `customer@shoeinn.com`
- Provider: `pelham.driver1@shoeinn.com`
- Company admin: `pelham.admin@shoeinn.com`
- Global admin: `admin@shoeinn.com`

Mt. Juliet demo, password `Password123!`:

- Customer: `customer.mtjuliet@shoeinn.demo`
- Provider: `provider.mtjuliet@shoeinn.demo`
- Company admin: `admin.mtjuliet@shoeinn.demo`

To show demo login buttons:

```powershell
$env:EXPO_PUBLIC_ENABLE_DEMO_LOGINS="true"
$env:EXPO_PUBLIC_DEMO_MARKET="mt_juliet"
```

## 5. Complete a Booking Flow

1. Log in as a customer.
2. Browse companies/services.
3. Select a service.
4. Choose date and time.
5. Confirm booking.
6. In mock payment mode, the API completes the payment path without Stripe.
7. Open appointments and verify the new appointment appears.

## 6. Provider and Owner Flow

Provider:

1. Log in as a provider.
2. Open dashboard.
3. Claim or open assigned jobs.
4. Move status through pickup, in progress, ready, delivery, and completed states.

Company admin:

1. Log in as company admin.
2. Open owner/company dashboard.
3. Review appointment queue and assignment state.
4. Assign or inspect provider/job status where available.

## 7. Optional Real Stripe Checkout

1. Create `apps/payment/.env` with Stripe test keys.
2. Start payment service:

```powershell
.\scripts\start-payment.ps1
```

3. Start API in service mode:

```powershell
.\scripts\start-api.ps1 -PaymentMode service -MobileRedirectBase "shoeinn://app"
```

4. Start mobile with `EXPO_PUBLIC_MOBILE_REDIRECT_BASE=shoeinn://app` for a dev build, or an `exp://.../--` URL for Expo Go.

## 8. Validate Before Making Changes

API:

```powershell
cd .\apps\api
.\.venv\Scripts\Activate.ps1
python -m pytest tests -q
```

Mobile:

```powershell
cd .\apps\mobile
npm run typecheck
npm test -- --runInBand
```

Payment:

```powershell
cd .\apps\payment
.\.venv\Scripts\Activate.ps1
python -m pytest tests -q
```

