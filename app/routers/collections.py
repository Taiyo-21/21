from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.repositories import get_collection_by_season, get_product
from app.schemas import CollectionResponse
from app.dependencies import get_current_user, get_db

router = APIRouter(prefix="/collections", tags=["Коллекции"])

@router.get("/", response_model=list[CollectionResponse])
def read_collection(
    season_filter: str = Query(None, alias="season"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    collection_items = get_collection_by_season(db, season_filter)

    if not collection_items:
        print("Коллекция пустая")
        return []

    result = []
    for item in collection_items:
        if item.product:
            result.append({
                "id": item.id,
                "season": item.season,
                "product_id": item.product_id,
                "name": item.product.name,
                "description": item.product.description,
                "price": item.product.price
            })

    return result