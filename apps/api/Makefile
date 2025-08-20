.PHONY: up down migrate revision dev seed

up:
	docker-compose up -d

down:
	docker-compose down

migrate:
	alembic upgrade head

revision:
	alembic revision --autogenerate -m "update"

dev:
	uvicorn app.main:app --reload --host $${API_HOST:-0.0.0.0} --port $${API_PORT:-8000}

seed:
	curl -X POST http://localhost:$${API_PORT:-8000}/dev/seed
