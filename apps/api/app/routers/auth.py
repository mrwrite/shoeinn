from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    rotate_refresh_token,
    revoke_refresh_token,
    verify_password,
)
from app.models.user import User
from app.models.company_user import CompanyUser
from app.schemas.auth import LoginRequest, LoginResponse, RefreshRequest, RegisterRequest, TokenPair
from app.schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter_by(email=payload.email).first():
        raise HTTPException(status_code=400, detail="Email exists")
    if not payload.full_name.strip():
        raise HTTPException(status_code=400, detail="full_name is required")
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    email = payload.email
    password = payload.password

    user = db.query(User).filter_by(email=email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    company_link = db.query(CompanyUser).filter(CompanyUser.user_id == user.id).first()

    token_payload = {"sub": str(user.id), "role": user.role}
    if company_link and user.role in {"company", "provider", "company_admin"}:
        token_payload["company_id"] = str(company_link.company_id)

    access_token = create_access_token(token_payload)
    refresh_token, _ = create_refresh_token(
        db,
        user_id=user.id,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "company_id": company_link.company_id if company_link else None,
        "full_name": user.full_name,
        "email": user.email,
    }


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    new_refresh_token, db_token = rotate_refresh_token(
        db,
        payload.refresh_token,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    user = db_token.user
    company_link = db.query(CompanyUser).filter(CompanyUser.user_id == user.id).first()
    token_payload = {"sub": str(user.id), "role": user.role}
    if company_link and user.role in {"company", "provider", "company_admin"}:
        token_payload["company_id"] = str(company_link.company_id)
    access_token = create_access_token(token_payload)
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: RefreshRequest, db: Session = Depends(get_db)):
    revoke_refresh_token(db, payload.refresh_token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
