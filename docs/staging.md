# Staging Runbook

This runbook defines the first supported staging slice for ShoeInn.

## Scope

Staging v1 supports:

- single FastAPI API instance
- one PostgreSQL database
- one notification worker process
- mobile clients pointed at the staging API
- payment in declared **mock mode**

Staging v1 does **not** support multi-instance websocket fanout. Live events in the current code are process-local, so staging must remain single-instance until a shared transport is introduced.

## Files

- API env template: [apps/api/.env.staging.example](/C:/Users/aquin/source/repos/shoeinn/apps/api/.env.staging.example:1)
- Mobile env template: [apps/mobile/.env.staging.example](/C:/Users/aquin/source/repos/shoeinn/apps/mobile/.env.staging.example:1)
- Staging compose file: [apps/api/docker-compose.staging.yml](/C:/Users/aquin/source/repos/shoeinn/apps/api/docker-compose.staging.yml:1)

## Startup

1. Create the API staging env file.

```powershell
cd .\apps\api
Copy-Item .env.staging.example .env.staging
```

2. Set a real staging JWT secret in `.env.staging`.

3. Start staging services.

```powershell
docker compose -f .\docker-compose.staging.yml up --build -d
```

This starts:

- `db`
- `api`
- `notification-worker`

The `api` container applies `alembic upgrade heads` before starting Uvicorn.

## Migration and readiness checks

The staging API exposes:

- `GET /health` for simple liveness
- `GET /ready` for dependency-aware readiness

`/ready` validates:

- database connectivity
- required `notification_outbox` table presence
- current Alembic head matches repo head
- current payment mode

Check readiness:

```powershell
Invoke-RestMethod http://localhost:8000/ready
```

Expected response shape:

```json
{
  "status": "ready",
  "database": "ok",
  "migrations": "ok",
  "notification_outbox": "ok",
  "payment_mode": "mock",
  "live_events_mode": "single_instance"
}
```

## Seed and reset

Staging v1 still uses the existing demo seed flow.

Reset and reseed:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/dev/seed?reset=true"
```

This is acceptable for staging demos and internal testing, but it should only be exposed to trusted operators.

## Notification worker

The notification worker is a first-class staging service in `docker-compose.staging.yml`.

It is responsible for draining `notification_outbox` and delivering:

- in-app notifications
- push notifications
- stubbed email/sms notifications

Check that the worker is running:

```powershell
docker compose -f .\docker-compose.staging.yml ps
```

You should see `notification-worker` in a running state.

## Mobile staging configuration

Create a staging env file or export a staging API URL before launching Expo or building a preview client:

```powershell
cd .\apps\mobile
Copy-Item .env.staging.example .env.staging
```

The critical value is:

```env
EXPO_PUBLIC_API_URL=https://api-staging.example.com
```

Do not point staging mobile builds at localhost.

## Validation checklist

Run these checks before calling staging usable:

1. `docker compose -f apps/api/docker-compose.staging.yml up --build -d` succeeds.
2. `GET /health` returns `200`.
3. `GET /ready` returns `200` with `status=ready`.
4. Fresh DB migrations apply automatically on API startup.
5. `notification-worker` is running.
6. `POST /dev/seed?reset=true` succeeds.
7. Demo logins work for owner, provider, and customer.
8. Owner command center loads seeded jobs.
9. Provider can claim/update an appointment.
10. Customer can see status and notifications.
11. Live websocket behavior is verified on the single API instance.

## Notes

- Payment remains intentionally simulated in staging v1 via `PAYMENT_MODE=mock`. If staging is later switched to `service`, `PAYMENT_SERVICE_BASE_URL` plus `PAYMENT_CHECKOUT_SUCCESS_URL` / `PAYMENT_CHECKOUT_CANCEL_URL` (or `PAYMENT_SUCCESS_URL` / `PAYMENT_CANCEL_URL`) must be set to real reachable return URLs.
- Live websocket fanout is **single-instance only** in staging v1.
- If staging later needs multiple API instances, live-event transport must move off in-memory process state.
