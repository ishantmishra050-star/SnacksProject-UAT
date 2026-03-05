from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum


class UserRole(str, enum.Enum):
    customer = "customer"
    store_owner = "store_owner"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    country = Column(String(100), default="India")
    role = Column(SAEnum(UserRole), default=UserRole.customer, nullable=False)
    gstin = Column(String(15), nullable=True)  # Added for B2B/Market Winner edge
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    stores = relationship("Store", back_populates="owner")
    orders = relationship("Order", back_populates="user")
    addresses = relationship("UserAddress", back_populates="user", cascade="all, delete-orphan")


class UserAddress(Base):
    __tablename__ = "user_addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    full_name = Column(String(255), nullable=False)
    mobile = Column(String(20), nullable=False)
    pincode = Column(String(10), nullable=False)
    flat_building = Column(String(255), nullable=False)
    area_street = Column(String(255), nullable=False)
    landmark = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="addresses")
