from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas import ProductCreate, ProductResponse
from app.repositories import create_product, add_product_to_collection, get_all_products
from app.dependencies import get_current_active_admin

router = APIRouter(prefix="/products", tags=["Товары"])

# Добавление нового товара
@router.post("/", response_model=ProductResponse)
def add_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_admin)
):
    # Создаём товар
    new_product = create_product(db=db, product=product)
    # Добавляем в коллекцию, если указан сезон
    if hasattr(product, 'season') and product.season:
        try:
            add_product_to_collection(db=db, season=product.season, product_id=new_product.id)
        except Exception as e:
            raise HTTPException(status_code=500, detail="Не удалось добавить товар в коллекцию")

    return new_product


# Получение всех товаров 
@router.get("/", response_model=list[ProductResponse])
def read_products(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_admin)
):
    products = get_all_products(db=db)
    if not products:
        raise HTTPException(status_code=404, detail="Товары не найдены")
    return products