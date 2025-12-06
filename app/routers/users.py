from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.repositories import get_user_by_username
from app.schemas import UserCreate, UserResponse
from app.db import get_db
from app.dependencies import get_current_user
from app.models import User
from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["Пользователи"])


@router.post("/signup/", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    if len(user.username) < 3:
        raise HTTPException(status_code=422, detail="Имя должно быть не менее 3 символов")

    if len(user.password) < 8:
        raise HTTPException(status_code=422, detail="Пароль должен быть не менее 8 символов")

    if get_user_by_username(db, username=user.username):
        raise HTTPException(status_code=400, detail="Пользователь уже существует")

    try:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")


@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user