# Staging Runbook

This runbook describes the current Docker Compose staging slice for ShoeInn.

## Scope

Staging supports:

- one PostgreSQL database
- one FastAPI API instance
- one payment service instance
- one notification worker process
- mobile preview clients pointed at the staging API
- Stripe Checkout service payment mode when Stripe env values are configured

Staging does not support multi-instance websocket fanout. Live events are process-local, so keep a single API instance until shared live-event transport is introduced.

## Files

- API staging env template: `apps/api/.env.staging.example`
- Payment staging env template: `apps/payment/.env.staging.example`
- Mobile staging env template: `apps/mobile/.env.staging.example`
- Compose file: `apps/api/docker-compose.staging.yml`

## Startup

Create env files:

```powershell
cd .\apps\api
Copy-Item .env.staging.example .env.staging
Copy-Item ..\payment\.env.staging.example ..\payment\.env.staging
```

Edit both files:

- Replace `JWT_SECRET`.
- Replace Stripe keys and webhook secret.
- Set payment return URLs to real staging URLs.
- Set `BOOKING_API_WEBHOOK_URL` appropriately for the Compose network or public staging host.

Start:

```powershell
docker compose -f .\docker-compose.staging.yml up --build -d
```

This starts:

- `db`
- `payment`
- `api`
- `notification-worker`

The API container applies Alembic migrations before starting Uvicorn.

## Readiness Checks

```powershell
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/ready
Invoke-RestMethod http://localhost:8001/health
docker compose -f .\docker-compose.staging.yml ps
```

`/ready` validates database connectivity, migration head, notification table, payment mode, and live-event mode.

## Seed and Reset

Shelby:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/dev/seed?reset=true"
```

Mt. Juliet:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/dev/seed?reset=true&demo_market=mt_juliet"
```

Seed endpoints are for trusted staging/demo operators only and should be protected before public exposure.

## Mobile Staging Configuration

Create or export:

```powershell
cd .\apps\mobile
Copy-Item .env.staging.example .env.staging
```

Critical values:

```env
EXPO_PUBLIC_API_URL=https://api-staging.example.com
EXPO_PUBLIC_API_BASE_URL=https://api-staging.example.com
EXPO_PUBLIC_ENABLE_DEMO_LOGINS=true
EXPO_PUBLIC_MOBILE_REDIRECT_BASE=shoeinn://payment-return
```

Do not point staging mobile builds at localhost.

## Validation Checklist

1. `docker compose -f apps/api/docker-compose.staging.yml up --build -d` succeeds.
2. API `/health` and `/ready` return success.
3. Payment `/health` returns success.
4. `notification-worker` is running.
5. Fresh DB migrations apply automatically on API startup.
6. Seed endpoint succeeds for the selected demo market.
7. Customer, provider, and company admin demo logins work.
8. Customer can browse, book, review/pay, and view appointment detail.
9. Provider can claim/update a job.
10. Company admin can view dashboard and job details.
11. Live updates are verified on the single API instance.
12. Stripe Checkout opens and payment status reconciles when service mode is enabled.

## Notes

- For Pi/small-host deployment, use the same Compose file and keep one API instance.
- If staging later needs multiple API instances, live-event transport must move off in-memory process state.
- See [architecture/deployment.md](architecture/deployment.md) for broader deployment notes.
