from sqlalchemy.orm import Session
from .repositories import create_product

def create_product_service(db: Session, product_data):
    return create_product(db=db, product=product_data)