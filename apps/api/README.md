# ShoeInn API

FastAPI backend for authentication, companies, premium care services, booking holds, appointments, provider/company operations, live updates, notifications, payment reconciliation, and demo seeding.

## Requirements

- Python 3.11+
- Docker Desktop with Compose v2
- PostgreSQL 15 locally through `docker compose`
- Optional: Stripe/payment service only when `PAYMENT_MODE=service`

## Quick Start

From the repository root, the easiest Windows workflow is:

```powershell
.\scripts\start-api.ps1
```

That script starts Postgres, creates `apps/api/.venv`, copies and normalizes `.env`, installs dependencies, runs Alembic migrations, starts Uvicorn on `http://localhost:8000`, and seeds demo data unless `-NoSeed` is passed.

Manual setup:

```powershell
cd .\apps\api
docker compose up -d
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r ..\..\requirements.txt
pip install -e .
Copy-Item .env.example .env
```

For a host-run API with Docker Postgres, set:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/shoeinn
PAYMENT_MODE=mock
```

Run migrations and start:

```powershell
python -m alembic upgrade head
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health checks:

```powershell
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/ready
```

`/health` checks process liveness. `/ready` checks database connectivity, migration head, required notification table, payment mode, and single-instance live-event mode.

## Database

`docker-compose.yml` runs only Postgres:

- Host port: `5432`
- Database: `shoeinn`
- User/password: `postgres` / `postgres`

If you previously used different credentials, reset the local volume:

```powershell
docker compose down -v
docker compose up -d
python -m alembic upgrade head
```

Use `localhost` in `DATABASE_URL` when the API runs on the host. Use `db` only from a container on the Compose network.

## Demo Seed

Default Shelby County market:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/dev/seed?reset=true"
```

Mt. Juliet market:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/dev/seed?reset=true&demo_market=mt_juliet"
```

`reset=true` clears known demo-market records before recreating the selected market.

Demo credentials are documented in [docs/getting-started.md](../../docs/getting-started.md).

## Key Endpoints

- `GET /health`
- `GET /ready`
- `POST /auth/login`
- `GET /companies`
- `GET /services`
- `POST /appointments`
- `GET /slots`
- `POST /company/appointments/{appointment_id}/claim`
- `WS /live/ws?token=...`
- `POST /push/tokens`
- `POST /webhooks/payments`
- `GET /payments/return/success`
- `GET /payments/return/cancel`

Example login:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"customer@shoeinn.com","password":"Password1!"}'
```

## Payment Modes

Local development defaults to mock payments:

```env
PAYMENT_MODE=mock
PAYMENT_SERVICE_BASE_URL=
PAYMENT_MOBILE_REDIRECT_BASE=
```

Use service mode only when `apps/payment` is running:

```env
PAYMENT_MODE=service
PAYMENT_SERVICE_BASE_URL=http://localhost:8001
PAYMENT_MOBILE_REDIRECT_BASE=shoeinn://app
```

For Expo Go return-flow testing:

```env
PAYMENT_MOBILE_REDIRECT_BASE=exp://<YOUR-LAN-IP>:8081/--
```

The API starts the payment sync worker only when service mode and `PAYMENT_SERVICE_BASE_URL` are configured and `ENABLE_PAYMENT_SYNC_WORKER` is enabled.

## Workers

Payment sync:

- Started from `app.main` on API startup.
- Active only in service payment mode with a configured payment service URL.

Notification worker:

```powershell
cd .\apps\api
.\.venv\Scripts\Activate.ps1
python -m app.workers.notification_worker
```

The API process can also run the in-process notification dispatcher when `ENABLE_NOTIFICATION_DISPATCHER=true`. In staging Compose, the API has that disabled and `notification-worker` runs as a separate service.

Expired booking holds are cleared by explicit utility/test paths; `app.main` does not currently start a dedicated hold cleanup worker.

## Tests

Run all backend tests:

```powershell
cd .\apps\api
.\.venv\Scripts\Activate.ps1
python -m pytest tests -q
```

Focused tests:

```powershell
python -m pytest tests\test_assignment_claiming.py -q
python -m pytest tests\test_dev_seed.py -q
python -m pytest tests\test_payment_gateway.py -q
```

The backend test suite uses in-memory SQLite through `tests/conftest.py`, so local Postgres, migrations, and seed data are not required for unit/integration tests.

## More Documentation

- [Central environment variable reference](../../docs/environment.md)
- [API architecture](../../docs/architecture/api.md)
- [Deployment architecture](../../docs/architecture/deployment.md)
- [Troubleshooting](../../docs/troubleshooting.md)
