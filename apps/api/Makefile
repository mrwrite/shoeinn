PYTHON ?= python
API_HOST ?= 127.0.0.1
API_PORT ?= 8000

.PHONY: up down reset-db migrate revision dev seed

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
	$(PYTHON) -m uvicorn app.main:app --reload --host $(API_HOST) --port $(API_PORT)

seed:
	curl -X POST http://localhost:$(API_PORT)/dev/seed
