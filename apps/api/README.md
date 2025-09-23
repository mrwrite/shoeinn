# ShoeInn API

## Quickstart
```
cp .env.example .env
make up
python -m venv .venv && source .venv/bin/activate
pip install -e .
alembic upgrade head
make dev
```
Seed demo data:
```
curl -X POST http://localhost:8000/dev/seed
```

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
