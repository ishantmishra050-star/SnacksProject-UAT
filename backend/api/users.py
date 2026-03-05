from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User, UserAddress
from ..schemas.schemas import AddressCreate, AddressOut
from .auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/me/addresses", response_model=List[AddressOut])
def get_my_addresses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    addresses = db.query(UserAddress).filter(UserAddress.user_id == current_user.id).all()
    return addresses

@router.post("/me/addresses", response_model=AddressOut, status_code=201)
def create_address(
    data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # If this is the first address, or marked as default, unset other defaults
    if data.is_default:
        db.query(UserAddress).filter(UserAddress.user_id == current_user.id).update({"is_default": False})

    address_dict = data.dict()
    address = UserAddress(user_id=current_user.id, **address_dict)
    
    # Auto default if no addresses exist
    total_addresses = db.query(UserAddress).filter(UserAddress.user_id == current_user.id).count()
    if total_addresses == 0:
        address.is_default = True

    db.add(address)
    db.commit()
    db.refresh(address)
    return address

@router.delete("/me/addresses/{address_id}", status_code=204)
def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = db.query(UserAddress).filter(UserAddress.id == address_id, UserAddress.user_id == current_user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    db.delete(address)
    db.commit()
    return None
