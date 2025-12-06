from fastapi import FastAPI, Request, status
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.models import Base
from app.db import engine
from app.routers import auth, collections, product, users, order
import uvicorn

# Создаем таблицы в БД
Base.metadata.create_all(bind=engine)

app = FastAPI()


@app.middleware("http")
async def redirect_project_frontend(request: Request, call_next):
    if request.url.path.startswith("/project/frontend"):
        new_path = request.url.path.replace("/project/frontend", "/frontend", 1)
        return RedirectResponse(url=new_path, status_code=status.HTTP_301_MOVED_PERMANENTLY)
    response = await call_next(request)
    return response

# Настройка CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение статики
app.mount("/frontend", StaticFiles(directory="frontend"), name="static_frontend")

# Роутеры
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(product.router)
app.include_router(collections.router)
app.include_router(order.router)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5500, reload=True)