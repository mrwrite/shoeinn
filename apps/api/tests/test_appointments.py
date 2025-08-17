import pytest
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager
from app.main import app

@pytest.mark.asyncio
async def test_appointment_flow():
    async with LifespanManager(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            await ac.post("/services/seed")
            services = (await ac.get("/services")).json()
            service_id = services[0]["id"]
            payload = {
                "service_id": service_id,
                "type": "pickup",
                "address": {
                    "line1": "123 Main",
                    "line2": "",
                    "city": "Town",
                    "state": "TX",
                    "postal_code": "75001",
                },
                "start_time_iso": "2025-08-18T15:30:00-05:00",
                "customer": {"name": "Joe", "email": "joe@example.com", "phone": "123"},
            }
            res = await ac.post("/appointments", json=payload)
            assert res.status_code == 200
            appt_id = res.json()["id"]
            res = await ac.get("/appointments/me", params={"email": "joe@example.com"})
            data = res.json()
            assert any(a["id"] == appt_id for a in data)
