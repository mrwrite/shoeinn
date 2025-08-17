.PHONY: up down migrate revision dev seed

up:
	docker compose up -d

down:
	docker compose down -v

migrate:
	alembic upgrade head

revision:
	alembic revision -m "auto" --autogenerate

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

seed:
	curl -X POST http://localhost:8000/services/seed
