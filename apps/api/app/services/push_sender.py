"""Expo push notification sender."""

from __future__ import annotations

from dataclasses import dataclass
import httpx


EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


@dataclass
class ExpoPushResult:
    invalid_tokens: list[str]
    temporary_failure: bool
    error_message: str | None = None


def send_expo_push(
    tokens: list[str], title: str, body: str, data: dict | None = None
) -> ExpoPushResult:
    messages = [
        {
            "to": token,
            "sound": "default",
            "title": title,
            "body": body,
            "data": data or {},
        }
        for token in tokens
    ]

    try:
        response = httpx.post(EXPO_PUSH_URL, json=messages, timeout=10)
        response.raise_for_status()
    except httpx.HTTPError as exc:  # pragma: no cover - network failure path
        return ExpoPushResult(invalid_tokens=[], temporary_failure=True, error_message=str(exc))

    payload = response.json()
    results = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(results, list):
        return ExpoPushResult(
            invalid_tokens=[], temporary_failure=True, error_message="Invalid Expo response"
        )

    invalid_tokens: list[str] = []
    temporary_failure = False
    error_message: str | None = None

    for message, ticket in zip(messages, results):
        if not isinstance(ticket, dict):
            temporary_failure = True
            error_message = error_message or "Malformed Expo ticket"
            continue

        status = ticket.get("status")
        details = ticket.get("details") or {}
        detail_error = details.get("error") if isinstance(details, dict) else None

        if status == "error" and detail_error == "DeviceNotRegistered":
            invalid_tokens.append(message["to"])
        elif status != "ok":
            temporary_failure = True
            error_message = ticket.get("message") or error_message

    return ExpoPushResult(
        invalid_tokens=invalid_tokens, temporary_failure=temporary_failure, error_message=error_message
    )

