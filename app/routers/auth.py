from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.utils import authenticate_user, create_access_token
from app.db import get_db

router = APIRouter(tags=["Авторизация"])

# Pydantic модель для входа
class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/token", response_model=dict)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}