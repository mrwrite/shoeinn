# ShoeInn API

## Quickstart (Windows PowerShell)
```
Copy-Item .env.example .env
docker compose up -d
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r ..\..\requirements.txt
pip install -e .
alembic upgrade head
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **Postgres credentials**
>
> The local database created by `make up` uses the default Postgres credentials `postgres` / `postgres`. Update your `.env`
> file only if you have customised the database user or password, and make sure the value matches the connection string in
> `docker-compose.yml`. A mismatch (for example `DATABASE_URL=postgresql+psycopg://shoeinn:shoeinn@localhost:5432/shoeinn`
> while docker-compose still provisions `postgres` / `postgres`) will result in `password authentication failed for user` errors
> when running Alembic migrations.

For Windows host + Docker Postgres, use `localhost` in `DATABASE_URL`. The checked-in `.env.example` uses `db`, which only works from inside the Docker network.

If you've previously started the database with a different password, Postgres will keep that credential inside the persisted
volume. You can reset the local database (and remove all data) with:

```
docker compose down -v
docker compose up -d
```

The `Makefile` in this folder is useful as a reference, but do not assume `make` exists on Windows PowerShell.

Seed demo data:
```
Invoke-RestMethod -Method Post http://localhost:8000/dev/seed
```

### Availability projection

Confirmed bookings update the `available_slots` read model so clients can query `/slots` without hitting transactional tables. See [docs/cqrs.md](docs/cqrs.md) for an overview of the hold lifecycle, optimistic concurrency checks, and background cleanup that keeps inventory fresh.

## Curl examples
Register & login:
```
curl -X POST http://localhost:8000/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"a@a.com","password":"Password1!","role":"customer"}'

curl -X POST http://localhost:8000/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"a@a.com","password":"Password1!"}'
```
Browse companies:
```
curl http://localhost:8000/companies
```

Discover services across companies:
```
curl "http://localhost:8000/services?city=Austin&query=clean"
```
The endpoint aggregates active services and returns normalized pricing data:

```json
[
  {
    "id": "SERVICE_ID",
    "name": "Basic Clean",
    "description": "Quick refresh",
    "duration_min": 30,
    "price_cents": 1000,
    "price": 10.0,
    "company": {
      "id": "COMPANY_ID",
      "name": "Clean Kicks",
      "city": "Austin",
      "state": "TX",
      "postal_code": "73301"
    }
  }
]
```
Optional query parameters:

* `query` – fuzzy match against service or company name
* `city`/`state` – filter by company location
* `company_id` – scope to a specific provider

Book appointment:
```
curl -X POST http://localhost:8000/appointments -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' -d '{"company_id":"ID","type":"pickup",\
  "address":{"line1":"1 Main","city":"Austin","state":"TX","postal_code":"73301"},\
  "start_time_iso":"2025-08-18T15:30:00-05:00"}'
```
Claim appointment (company user):
```
curl -X POST http://localhost:8000/company/appointments/APP_ID/claim -H 'Authorization: Bearer TOKEN'
```

## Tests

Focused provider appointment claiming and assignment tests:

```powershell
.\venv\Scripts\python.exe -m pytest tests\test_assignment_claiming.py -q
```

These tests use in-memory SQLite through `tests/conftest.py`, so no external Postgres, migrations, or seed data are required.

## Workers

- `app.main` starts the payment sync worker only when `PAYMENT_SERVICE_BASE_URL` is configured.
- The notification worker is manual:

```powershell
python -m app.workers.notification_worker
```

- The current docs in `docs/cqrs.md` mention hold cleanup starting automatically, but `app.main` does not currently start that worker.
