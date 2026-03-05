from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from ..database import get_db
from ..models.product import Product, StoreProduct
from ..schemas.schemas import ProductOut, StoreProductOut

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("/", response_model=List[ProductOut])
def list_products(
    region: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Product)
    if region:
        query = query.filter(Product.region == region)
    if category:
        query = query.filter(Product.category == category)
    return query.all()


@router.get("/store/{store_id}", response_model=List[StoreProductOut])
def list_store_products(store_id: int, db: Session = Depends(get_db)):
    items = (
        db.query(StoreProduct)
        .options(joinedload(StoreProduct.product))
        .filter(StoreProduct.store_id == store_id)
        .all()
    )
    return items
