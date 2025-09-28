from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from typing import Optional, Tuple

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import bcrypt
from sqlalchemy.orm import Session

from .config import settings
import os
from uuid import UUID

os.environ.setdefault("BCRYPT_NO_LIMIT", "1")
from .db import get_db
from app.models.refresh_token import RefreshToken
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    ttl = expires_delta or timedelta(minutes=settings.access_token_ttl_minutes)
    expire = datetime.now(timezone.utc) + ttl
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    user_id_value = payload.get("sub")
    if not user_id_value:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    try:
        user_id = UUID(str(user_id_value))
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")
    from app.models.user import User

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")
    return user


def get_current_customer(current_user=Depends(get_current_user)):
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Forbidden")
    return current_user


def get_current_company_user(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "company":
        raise HTTPException(status_code=403, detail="Forbidden")
    from app.models.company_user import CompanyUser

    cu = db.query(CompanyUser).filter_by(user_id=current_user.id).first()
    if not cu:
        raise HTTPException(status_code=403, detail="No company")
    return current_user, cu.company_id


def _hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _refresh_token_error() -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def create_refresh_token(
    db: Session,
    *,
    user_id: UUID,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Tuple[str, RefreshToken]:
    token = secrets.token_urlsafe(48)
    now = datetime.now(timezone.utc)
    db_token = RefreshToken(
        user_id=user_id,
        token_hash=_hash_refresh_token(token),
        user_agent=user_agent,
        ip_address=ip_address,
        created_at=now,
        last_rotated_at=now,
        expires_at=now + timedelta(days=settings.refresh_token_ttl_days),
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return token, db_token


def verify_refresh_token(db: Session, token: str) -> RefreshToken:
    token_hash = _hash_refresh_token(token)
    db_token = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if not db_token:
        raise _refresh_token_error()
    if db_token.revoked_at is not None:
        raise _refresh_token_error()
    expires_at = _ensure_utc(db_token.expires_at)
    if expires_at <= datetime.now(timezone.utc):
        raise _refresh_token_error()
    return db_token


def rotate_refresh_token(
    db: Session,
    token: str,
    *,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Tuple[str, RefreshToken]:
    db_token = verify_refresh_token(db, token)
    new_token = secrets.token_urlsafe(48)
    db_token.token_hash = _hash_refresh_token(new_token)
    db_token.last_rotated_at = datetime.now(timezone.utc)
    if user_agent:
        db_token.user_agent = user_agent
    if ip_address:
        db_token.ip_address = ip_address
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return new_token, db_token


def revoke_refresh_token(db: Session, token: str) -> RefreshToken:
    db_token = verify_refresh_token(db, token)
    db_token.revoked_at = datetime.now(timezone.utc)
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token
