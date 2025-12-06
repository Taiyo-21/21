from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.db import SessionLocal
from app.models import User
from app.schemas import TokenData
from app.utils import SECRET_KEY, ALGORITHM, verify_password  # Импортируем явно

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# Зависимость для получения сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Получение пользователя из БД по имени
def get_user(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


# Аутентификация пользователя 
def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not user.hashed_password:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


# Получение текущего пользователя из токена 
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")  # Явно указываем, что может быть None
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


# Проверка прав администратора 
async def get_current_active_admin(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user