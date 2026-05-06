from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi.testclient import TestClient


def _pick_service(client: TestClient) -> tuple[UUID, str]:
    res = client.get("/services")
    assert res.status_code == 200
    data = res.json()
    return UUID(data[0]["id"]), data[0]["name"]


def test_quote_returns_backend_payment_summary(client: TestClient) -> None:
    service_id, service_name = _pick_service(client)
    start_time = datetime.now(timezone.utc).replace(hour=15, minute=0, second=0, microsecond=0) + timedelta(days=1)

    response = client.post(
        "/appointments/quote",
        json={
            "service_id": str(service_id),
            "start_time": start_time.isoformat(),
            "type": "pickup",
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()

    assert payload["service_id"] == str(service_id)
    assert payload["service_name"] == service_name
    assert payload["currency"] == "usd"
    assert payload["subtotal"] > 0
    assert payload["fees"] > 0
    assert payload["estimated_tax"] > 0
    assert payload["total"] == payload["subtotal"] + payload["fees"] + payload["estimated_tax"]

    labels = {item["label"] for item in payload["line_items"]}
    assert service_name in labels
    assert "Service fee" in labels
