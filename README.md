# shoeinn

## Project overview

Shoeinn is a full-stack demo composed of a FastAPI backend and an Expo React Native mobile client. The source code lives under `apps`:

- `apps/api` – backend service implemented with FastAPI, SQLAlchemy and Alembic.
- `apps/mobile` – Expo application built with React Native.

## Run the API locally

```bash
cd apps/api
cp .env.example .env
make up
python -m venv .venv && source .venv/bin/activate
pip install -e .
alembic upgrade head
make dev
make seed
```

### Curl examples

```bash
curl http://localhost:8000/health
curl http://localhost:8000/services
curl "http://localhost:8000/slots?date=2025-08-18&type=pickup"
curl -X POST http://localhost:8000/appointments \
  -H "Content-Type: application/json" \
  -d '{"service_id":"<uuid>","type":"pickup","address":{"line1":"123","line2":"","city":"Town","state":"TX","postal_code":"75001"},"start_time_iso":"2025-08-18T15:30:00-05:00","customer":{"name":"Joe","email":"joe@example.com","phone":"123"}}'
curl "http://localhost:8000/appointments/me?email=joe@example.com&phone=123"
```

### Authentication and token refresh

- Access tokens now expire after approximately 15 minutes by default. You can change the window by setting `ACCESS_TOKEN_TTL_MINUTES` in the API environment.
- `POST /auth/login` returns both an `access_token` and a long-lived `refresh_token`. Persist the refresh token securely on the client.
- When the API responds with `401` due to an expired access token, call `POST /auth/refresh` with the stored refresh token to receive a rotated token pair. Each refresh invalidates the previous refresh token, so always replace the stored value with the latest one.
- Call `POST /auth/logout` with the current refresh token when the user signs out or you detect compromise so the server revokes the session immediately.
- The mobile app should follow the same pattern—refresh quietly when the access token expires and fall back to login if refresh fails (e.g., after logout or suspected compromise).

## Run the mobile app locally

```bash
cd apps/mobile
npm start
```

## Running tests

Backend tests:

```bash
cd apps/api
pytest
```

Mobile tests:

```bash
cd apps/mobile
npm test
```

## Mobile offline behavior

The Expo client now layers TanStack Query over the REST API to provide caching and offline resilience:

- Service lists are hydrated from AsyncStorage on launch so previously viewed data is available immediately.
- Network reads and writes use a retry strategy with exponential backoff, and mutations optimistically update the UI.
- When offline, service status changes are queued on disk and replayed once connectivity returns; a banner surfaces the offline state and pending work.
- During synchronization the app disables destructive actions until all queued writes have been flushed.
- Run `npm test` from `apps/mobile` to execute Jest suites that cover cache hydration and offline queue processing.
