# shoeinn

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
