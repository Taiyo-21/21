from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    date_added = Column(Date)

class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True)
    season = Column(String, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"))
    product = relationship("Product")
    
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date)
    status = Column(String, default="new")
    user = relationship("User")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    size = Column(String)
    order = relationship("Order", back_populates="items")
    product = relationship("Product")