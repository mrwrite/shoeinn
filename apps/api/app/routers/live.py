from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import decode_token
from app.models import CompanyUser, User
from app.services.live_events import live_event_manager

router = APIRouter(prefix="/live", tags=["live"])


def _resolve_socket_user(db: Session, token: str | None) -> tuple[User, str | None]:
    if not token:
        raise ValueError("Missing token")

    payload = decode_token(token)
    user_id_value = payload.get("sub")
    if not user_id_value:
        raise ValueError("Invalid token")

    user = db.get(User, UUID(str(user_id_value)))
    if user is None:
        raise ValueError("Invalid user")

    company_id_value = payload.get("company_id")
    company_id: str | None = None
    if user.role in {"company", "provider", "company_admin"}:
        company_user = None
        if company_id_value:
            try:
                company_user = (
                    db.query(CompanyUser)
                    .filter(
                        CompanyUser.user_id == user.id,
                        CompanyUser.company_id == UUID(str(company_id_value)),
                    )
                    .first()
                )
            except ValueError:
                company_user = None
        if company_user is None:
            company_user = db.query(CompanyUser).filter(CompanyUser.user_id == user.id).first()
        if company_user is None:
            raise ValueError("No company")
        company_id = str(company_user.company_id)

    return user, company_id


@router.websocket("/ws")
async def live_events_socket(websocket: WebSocket, db: Session = Depends(get_db)) -> None:
    token = websocket.query_params.get("token")
    try:
        user, company_id = _resolve_socket_user(db, token)
    except (ValueError, HTTPException) as exc:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason=str(exc))
        return

    connection_id = await live_event_manager.connect(
        websocket,
        user_id=str(user.id),
        role=user.role,
        company_id=company_id,
    )
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        live_event_manager.disconnect(connection_id)
