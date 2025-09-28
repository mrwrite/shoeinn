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
	uvicorn app.main:app --reload --host $(API_HOST) --port $(API_PORT)

seed:
	curl -X POST http://localhost:$(API_PORT)/dev/seed
