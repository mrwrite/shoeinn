# API Architecture

The API lives in `apps/api` and is a FastAPI app with SQLAlchemy models and Alembic migrations.

## Main Responsibilities

- Authentication and JWT issuance
- User profile/address management
- Companies and company users
- Care categories and services
- Appointment holds, booking, and lifecycle
- Provider claiming and status updates
- Owner/company admin operational views
- Payment gateway orchestration
- Payment return endpoints
- Notification outbox and push token registration
- Live appointment events
- Demo seed data

## Request Flow

1. Mobile calls API over HTTP using bearer tokens.
2. Routers under `app/routers` validate and coordinate work.
3. SQLAlchemy models under `app/models` persist domain state.
4. Services under `app/services` handle pricing, payment gateway calls, notifications, and availability logic.
5. Notification and payment workers process asynchronous or polling work where enabled.

## Database

Local Compose runs PostgreSQL 15. API schema is managed by Alembic:

```powershell
cd .\apps\api
python -m alembic upgrade head
```

Tests use in-memory SQLite through `tests/conftest.py`.

## Payment Integration

The API supports:

- `PAYMENT_MODE=mock` for local/demo flows.
- `PAYMENT_MODE=service` for Stripe Checkout through `apps/payment`.

In service mode, the API calls the payment service, stores appointment payment state, exposes return endpoints, and can run the payment sync worker.

## Live Events

Live events are process-local. Staging and demos should run one API instance until a shared transport is added.

## Notification Architecture

Notifications are queued in API tables. Delivery can be drained by:

- In-process dispatcher when `ENABLE_NOTIFICATION_DISPATCHER=true`.
- Separate `notification-worker` service in staging Compose.

## Demo Seed

`POST /dev/seed?reset=true` seeds Shelby County.

`POST /dev/seed?reset=true&demo_market=mt_juliet` seeds Mt. Juliet.

The seed route is for local/staging demos and should be protected or disabled before public production exposure.

