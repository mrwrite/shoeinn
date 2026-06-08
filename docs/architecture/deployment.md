# Deployment Architecture

## Staging

The current staging shape is defined by `apps/api/docker-compose.staging.yml`.

Services:

- `db` - PostgreSQL 15 on port `5432`
- `payment` - payment service on port `8001`
- `api` - FastAPI API on port `8000`
- `notification-worker` - drains notification work

Start staging from `apps/api`:

```powershell
Copy-Item .env.staging.example .env.staging
Copy-Item ..\payment\.env.staging.example ..\payment\.env.staging
docker compose -f .\docker-compose.staging.yml up --build -d
```

The API container runs:

```bash
python -m alembic upgrade heads
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Readiness:

```powershell
Invoke-RestMethod http://localhost:8000/ready
```

Seed:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/dev/seed?reset=true&demo_market=mt_juliet"
```

## Pi Deployment

For Raspberry Pi or small-host staging, use the staging Compose model:

1. Install Docker and Compose plugin.
2. Copy repository to the host.
3. Create `apps/api/.env.staging` and `apps/payment/.env.staging`.
4. Use reachable DNS/HTTPS endpoints for mobile builds; do not point mobile at `localhost`.
5. Run `docker compose -f apps/api/docker-compose.staging.yml up --build -d`.
6. Run readiness checks and seed demo data.

Live events are process-local, so keep one API instance on Pi/staging until shared fanout is implemented.

## Mobile Preview Builds

From `apps/mobile`:

```bash
npx eas build --profile preview --platform android
npx eas build --profile preview --platform ios
```

Preview profile uses internal distribution. Configure API URL, maps key, redirect base, demo login flag, and demo market through `eas.json` or EAS environment settings.

## Production

Current production architecture is not fully separated from staging in code. The expected production direction is:

- API container behind HTTPS ingress.
- PostgreSQL managed or separately backed up.
- Payment service behind private service networking where possible.
- Stripe webhooks delivered to payment service.
- Mobile production builds with demo logins disabled.
- Notification worker as a separate process.
- Seed routes protected or disabled at the edge.

Before multi-instance production, replace process-local live events with a shared transport such as Redis pub/sub, Postgres LISTEN/NOTIFY, or a managed event bus.

