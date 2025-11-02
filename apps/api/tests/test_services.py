from __future__ import annotations

from fastapi.testclient import TestClient


def test_services_seeded(client: TestClient) -> None:
    response = client.get("/services")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5

    names = [item["name"] for item in data]
    assert names == sorted(names)

    for item in data:
        assert set(
            [
                "id",
                "name",
                "slug",
                "description",
                "duration_minutes",
                "price_cents",
                "is_active",
                "created_at",
                "updated_at",
            ]
        ).issubset(item.keys())
