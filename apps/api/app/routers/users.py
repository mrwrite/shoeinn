from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.user import CustomerAddressUpdate, UserRead

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user, from_attributes=True)


@router.patch("/me/address", response_model=UserRead)
def update_my_address(
    payload: CustomerAddressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserRead:
    current_user.address_line1 = payload.address_line1
    current_user.address_line2 = payload.address_line2
    current_user.city = payload.city
    current_user.state = payload.state
    current_user.postal_code = payload.postal_code
    current_user.country = payload.country or "US"

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return UserRead.model_validate(current_user, from_attributes=True)
