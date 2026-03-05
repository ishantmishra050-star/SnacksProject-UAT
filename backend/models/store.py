from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    region = Column(String(50), nullable=False)  # Gujarat / Maharashtra
    gstin = Column(String(15), nullable=True)    # For B2B/tax transparency
    address = Column(Text, nullable=False)
    story = Column(Text, nullable=True)  # The vintage history of the shop
    phone = Column(String(20), nullable=True)
    rating = Column(Float, default=0.0)
    image_url = Column(String(500), nullable=True)
    is_verified = Column(Boolean, default=False)
    established_year = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner = relationship("User", back_populates="stores")
    store_products = relationship("StoreProduct", back_populates="store", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="store")
