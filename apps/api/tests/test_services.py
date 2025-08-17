import pytest
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager

from app.main import app


@pytest.mark.asyncio
async def test_get_service_by_id():
    async with LifespanManager(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            await ac.post("/services/seed")
            services = (await ac.get("/services")).json()
            service_id = services[0]["id"]
            res = await ac.get(f"/services/{service_id}")
            assert res.status_code == 200
            data = res.json()
            assert data["id"] == service_id
