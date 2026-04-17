from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import WebSocket
from sqlalchemy.orm import Session

from app.models import Appointment, CompanyUser, User
from app.services.notifications import resolve_customer_user_id

logger = logging.getLogger(__name__)


@dataclass
class LiveConnection:
    websocket: WebSocket
    user_id: str
    role: str
    company_id: str | None


class LiveEventManager:
    def __init__(self) -> None:
        self._connections: dict[int, LiveConnection] = {}
        self._loop: asyncio.AbstractEventLoop | None = None

    async def connect(self, websocket: WebSocket, *, user_id: str, role: str, company_id: str | None) -> int:
        await websocket.accept()
        self._loop = asyncio.get_running_loop()
        connection_id = id(websocket)
        self._connections[connection_id] = LiveConnection(
            websocket=websocket,
            user_id=user_id,
            role=role,
            company_id=company_id,
        )
        return connection_id

    def disconnect(self, connection_id: int) -> None:
        self._connections.pop(connection_id, None)

    def publish(self, event: dict[str, Any], *, user_ids: set[str] | None = None, company_id: str | None = None) -> None:
        loop = self._loop
        if loop is None or not loop.is_running():
            return
        future = asyncio.run_coroutine_threadsafe(
            self._publish(event=event, user_ids=user_ids or set(), company_id=company_id),
            loop,
        )
        future.add_done_callback(self._log_publish_failure)

    async def _publish(self, event: dict[str, Any], *, user_ids: set[str], company_id: str | None) -> None:
        stale_ids: list[int] = []
        for connection_id, connection in list(self._connections.items()):
            if not self._matches(connection, user_ids=user_ids, company_id=company_id):
                continue
            try:
                await connection.websocket.send_json(event)
            except Exception:
                stale_ids.append(connection_id)
        for connection_id in stale_ids:
            self.disconnect(connection_id)

    @staticmethod
    def _matches(connection: LiveConnection, *, user_ids: set[str], company_id: str | None) -> bool:
        if connection.user_id in user_ids:
            return True
        if company_id and connection.company_id == company_id:
            return True
        return False

    @staticmethod
    def _log_publish_failure(future: asyncio.Future[None]) -> None:
        exc = future.exception()
        if exc:
            logger.warning("Failed to publish live event: %s", exc)


live_event_manager = LiveEventManager()


def _base_event(
    *,
    event_type: str,
    event_kind: str,
    appointment: Appointment,
) -> dict[str, Any]:
    return {
        "type": event_type,
        "event_kind": event_kind,
        "appointment_id": str(appointment.id),
        "company_id": str(appointment.company_id) if appointment.company_id else None,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
    }


def publish_assignment_changed(
    db: Session,
    *,
    appointment: Appointment,
    event_kind: str,
    assignment_action: str,
    old_provider: User | None,
    new_provider: User | None,
) -> None:
    user_ids = {
        str(company_user.user_id)
        for company_user in db.query(CompanyUser).filter(CompanyUser.company_id == appointment.company_id).all()
    }
    customer_user_id = resolve_customer_user_id(db, appointment)
    if customer_user_id is not None:
        user_ids.add(str(customer_user_id))

    event = _base_event(
        event_type="assignment_changed",
        event_kind=event_kind,
        appointment=appointment,
    )
    event.update(
        {
            "assignment_action": assignment_action,
            "old_provider_user_id": str(old_provider.id) if old_provider else None,
            "old_provider_name": old_provider.full_name if old_provider else None,
            "new_provider_user_id": str(new_provider.id) if new_provider else None,
            "new_provider_name": new_provider.full_name if new_provider else None,
        }
    )
    live_event_manager.publish(event, user_ids=user_ids, company_id=str(appointment.company_id))


def publish_status_changed(
    db: Session,
    *,
    appointment: Appointment,
    previous_status: str | None,
) -> None:
    user_ids = {
        str(company_user.user_id)
        for company_user in db.query(CompanyUser).filter(CompanyUser.company_id == appointment.company_id).all()
    }
    customer_user_id = resolve_customer_user_id(db, appointment)
    if customer_user_id is not None:
        user_ids.add(str(customer_user_id))

    event = _base_event(
        event_type="appointment_status_changed",
        event_kind="status_change",
        appointment=appointment,
    )
    event.update(
        {
            "status": appointment.status.value,
            "previous_status": previous_status,
        }
    )
    live_event_manager.publish(event, user_ids=user_ids, company_id=str(appointment.company_id))
