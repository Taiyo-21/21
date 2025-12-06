from datetime import date, datetime
from sqlalchemy.orm import Session
from app.models import User, Product, Collection, Order, OrderItem
from app.schemas import ProductCreate, UserCreate
from app.core.security import get_password_hash
from sqlalchemy.orm import joinedload

# Пользователи
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)

    db_user = User(
        username=user.username,
        hashed_password=hashed_password,
        role=user.role
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Товары
def get_product(db: Session, product_id: int):
    return db.query(Product).filter(Product.id == product_id).first()

def get_products(db: Session):
    return db.query(Product).all()

def create_product(db: Session, product: ProductCreate):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# Коллекции
def add_product_to_collection(db: Session, season: str, product_id: int):
    db_collection_item = Collection(season=season, product_id=product_id)
    db.add(db_collection_item)
    db.commit()
    db.refresh(db_collection_item)
    return db_collection_item

def get_collection_by_season(db: Session, season: str):
    if not season:
        return []

    return db.query(Collection).options(joinedload(Collection.product)).filter(Collection.season == season).all()

# Заказы
def create_order(db: Session, user_id: int, items: list):
    db_order = Order(user_id=user_id, date=date.today(), status="new")
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    for item in items:
        db_item = OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            size=item.size
        )
        db.add(db_item)
    db.commit()

    db_order = db.query(Order).options(joinedload(Order.items)).get(db_order.id)
    return db_order

def get_orders_by_user(db: Session, user_id: int):
    return db.query(Order).options(joinedload(Order.items)).filter(Order.user_id == user_id).all()

# Возвращает список всех товаров из базы данных
def get_all_products(db: Session):
    return db.query(Product).all()