from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.store import Store
from ..models.user import User, UserRole
from ..schemas.schemas import StoreCreate, StoreOut
from .auth import get_current_user

router = APIRouter(prefix="/api/stores", tags=["Stores"])


@router.get("/", response_model=List[StoreOut])
def list_stores(
    city: Optional[str] = None,
    region: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Store)
    if city:
        query = query.filter(Store.city.ilike(f"%{city}%"))
    if region:
        query = query.filter(Store.region == region)
    if search:
        query = query.filter(Store.name.ilike(f"%{search}%"))
    return query.order_by(Store.rating.desc()).all()


@router.get("/{store_id}", response_model=StoreOut)
def get_store(store_id: int, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store


@router.post("/", response_model=StoreOut, status_code=201)
def create_store(
    data: StoreCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import html
    def _sanitize(val: str) -> str:
        return html.escape(val.strip()) if val else val

    # Restrict store creation to admins or existing store_owners
    if current_user.role == UserRole.customer:
        raise HTTPException(
            status_code=403, 
            detail="Customers cannot create stores directly. Please apply for a store owner account."
        )

    store = Store(
        owner_id=current_user.id,
        name=_sanitize(data.name)[:255],
        city=_sanitize(data.city)[:100],
        region=_sanitize(data.region)[:50],
        address=_sanitize(data.address),
        story=_sanitize(data.story),
        phone=_sanitize(data.phone)[:20] if data.phone else None,
        established_year=data.established_year
    )
    db.add(store)
    db.commit()
    db.refresh(store)
    return store
