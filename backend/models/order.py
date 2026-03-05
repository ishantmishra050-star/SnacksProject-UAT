from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    preparing = "preparing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class PaymentMethod(str, enum.Enum):
    cod = "cod"
    upi = "upi"
    card = "card"
    razorpay = "razorpay"
    paypal = "paypal"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    status = Column(SAEnum(OrderStatus), default=OrderStatus.pending)
    subtotal = Column(Float, nullable=False, default=0)
    discount_amount = Column(Float, nullable=False, default=0)
    gst_amount = Column(Float, nullable=False, default=0)
    cgst_amount = Column(Float, nullable=False, default=0)
    sgst_amount = Column(Float, nullable=False, default=0)
    igst_amount = Column(Float, nullable=False, default=0)
    total_amount = Column(Float, nullable=False)
    delivery_address = Column(Text, nullable=False)
    is_gift = Column(Boolean, default=False)
    gift_message = Column(Text, nullable=True)
    payment_method = Column(SAEnum(PaymentMethod), nullable=False)
    payment_status = Column(SAEnum(PaymentStatus), default=PaymentStatus.pending)
    payment_reference = Column(String(255), nullable=True)  # Razorpay/PayPal txn ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="orders")
    store = relationship("Store", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    store_product_id = Column(Integer, ForeignKey("store_products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    store_product = relationship("StoreProduct", back_populates="order_items")
