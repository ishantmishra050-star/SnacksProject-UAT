from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    regional_name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)  # Festive, Savory, Sweet, Tea-Time
    region = Column(String(50), nullable=True)       # Gujarat / Maharashtra
    image_url = Column(String(500), nullable=True)
    gst_rate = Column(Float, default=12.0)            # GST % (5 or 12)

    # Relationships
    store_products = relationship("StoreProduct", back_populates="product")


class StoreProduct(Base):
    """Links a product to a specific store with price and availability."""
    __tablename__ = "store_products"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    price = Column(Float, nullable=False)  # in INR
    weight_grams = Column(Integer, default=250)
    in_stock = Column(Boolean, default=True)

    # Relationships
    store = relationship("Store", back_populates="store_products")
    product = relationship("Product", back_populates="store_products")
    order_items = relationship("OrderItem", back_populates="store_product")
