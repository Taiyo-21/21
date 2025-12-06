from pydantic import BaseModel
from typing import List, Optional
from datetime import date

# Товары
class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    date_added: date

class ProductResponse(ProductCreate):
    id: int

    class Config:
        from_attributes = True

# Коллекции
class CollectionCreate(BaseModel):
    product_id: int
    season: str

class CollectionResponse(BaseModel):
    id: int
    season: str
    product_id: int
    name: str
    description: str
    price: float

    class Config:
        from_attributes = True

# Заказы
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    size: str

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]

class OrderItemResponse(OrderItemCreate):
    class Config:
        from_attributes = True

class OrderStatus:
    NEW = "new"
    IN_PROCESS = "in_process"
    COMPLETED = "completed"

class OrderResponse(BaseModel):
    id: int
    user_id: int
    date: date
    status: str
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

# Пользователи
class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "user"

class UserResponse(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True

# Авторизация
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

# Обновление статуса заказа
class OrderUpdateStatus(BaseModel):
    new_status: str