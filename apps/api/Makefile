PYTHON ?= python
API_HOST ?= 127.0.0.1
API_PORT ?= 8000

.PHONY: up down reset-db migrate revision dev seed expire_holds

up:
	docker-compose up -d

down:
	docker-compose down

reset-db:
	docker-compose down -v

migrate:
	alembic upgrade head

revision:
	alembic revision --autogenerate -m "update"

dev:
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

seed:
python -m scripts.seed_services

expire_holds:
curl -X POST http://localhost:$(API_PORT)/appointments/holds/expire
