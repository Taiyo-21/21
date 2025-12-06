from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.schemas import OrderCreate, OrderResponse, OrderUpdateStatus
from app.repositories import create_order
from app.dependencies import get_current_user
from app.db import get_db
from app.models import Order
from typing import List, Optional



router = APIRouter(prefix="/orders", tags=["Заказы"])

# Допустимые статусы
VALID_STATUSES = {"new", "pending", "in_process", "completed", "cancelled"}

# Создание нового заказа
@router.post("/", response_model=OrderResponse)
def create_order_router(order: OrderCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return create_order(db, user_id=current_user.id, items=order.items)

# Получение списка заказов текущего пользователя 
@router.get("/", response_model=List[OrderResponse])
def read_orders(
    status: Optional[str] = Query(None, description="Фильтр по статусу (pending, in_process, completed, cancelled)"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(Order)

    if current_user.role != "admin":
        query = query.filter(Order.user_id == current_user.id)

    if status:
        normalized_status = status.strip().lower()
        if normalized_status != "all":
            if normalized_status not in VALID_STATUSES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Недопустимый статус: {normalized_status}. "
                           f"Допустимые значения: {', '.join(VALID_STATUSES)}"
                )
            query = query.filter(Order.status == normalized_status)

    orders = query.all()
    return orders

# Обновление статуса заказа (только для администратора)
@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderUpdateStatus,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    new_status = status_update.new_status.strip().lower()
    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Недопустимый статус: {new_status}. "
                   f"Допустимые значения: {', '.join(VALID_STATUSES)}"
        )

    order.status = new_status
    db.commit()
    db.refresh(order)
    return order