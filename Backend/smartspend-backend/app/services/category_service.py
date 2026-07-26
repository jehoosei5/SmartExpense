from sqlalchemy.orm import Session
from app.models.category import Category
from app.schemas.category import CategoryCreate
from typing import Optional


def get_categories(db: Session, user_id: str, type: Optional[str] = None):
    """
    Returns all categories available to the user:
    - System defaults (user_id IS NULL)
    - User's own custom categories (user_id = this user)
    """
    query = db.query(Category).filter(
        (Category.user_id == None) | (Category.user_id == user_id)
    )

    if type:
        query = query.filter(Category.type == type)

    return query.order_by(Category.is_default.desc(), Category.name).all()


def create_category(db: Session, data: CategoryCreate, user_id: str):
    # Validate type
    if data.type not in ["Expenses", "Income", "Savings"]:
        return None, "Type must be Expenses, Income, or Savings"

    # Check if this category already exists for this user
    existing = db.query(Category).filter(
        Category.user_id == user_id,
        Category.name == data.name,
        Category.type == data.type
    ).first()

    if existing:
        return None, f"You already have a '{data.name}' category under {data.type}"

    category = Category(
        user_id=user_id,
        name=data.name,
        type=data.type,
        is_default=0
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category, None


def delete_category(db: Session, category_id: int, user_id: str):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == user_id  # Can only delete own categories
    ).first()

    if not category:
        return False, "Category not found or you cannot delete a system default category"

    db.delete(category)
    db.commit()
    return True, None