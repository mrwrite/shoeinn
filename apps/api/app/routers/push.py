from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_user
from app.models import PushToken
from app.schemas.push import PushRegisterRequest, PushUnregisterRequest

router = APIRouter(prefix="/push", tags=["push"])


@router.post("/register", status_code=204)
def register_push_token(
    payload: PushRegisterRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> None:
    now = datetime.now(timezone.utc)
    existing = (
        db.query(PushToken)
        .filter(PushToken.user_id == current_user.id, PushToken.token == payload.token)
        .first()
    )

    if existing:
        existing.platform = payload.platform or existing.platform
        existing.enabled = True
        existing.last_seen_at = now
        db.add(existing)
    else:
        token = PushToken(
            user_id=current_user.id,
            token=payload.token,
            platform=payload.platform,
            enabled=True,
            created_at=now,
            updated_at=now,
            last_seen_at=now,
        )
        db.add(token)

    db.commit()


@router.post("/unregister", status_code=204)
def unregister_push_token(
    payload: PushUnregisterRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> None:
    token = (
        db.query(PushToken)
        .filter(PushToken.user_id == current_user.id, PushToken.token == payload.token)
        .first()
    )
    if token:
        token.enabled = False
        token.last_seen_at = datetime.now(timezone.utc)
        db.add(token)
        db.commit()

