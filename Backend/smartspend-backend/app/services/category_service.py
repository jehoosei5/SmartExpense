from sqlalchemy.orm import Session
from app.models.category import Category
from app.models.user_category_preference import UserCategoryPreference
from app.schemas.category import CategoryCreate
from typing import Optional


def _get_pref(db: Session, user_id: str, category_id: int) -> Optional[UserCategoryPreference]:
    return db.query(UserCategoryPreference).filter(
        UserCategoryPreference.user_id == user_id,
        UserCategoryPreference.category_id == category_id,
    ).first()


def _get_or_create_pref(db: Session, user_id: str, category_id: int) -> UserCategoryPreference:
    pref = _get_pref(db, user_id, category_id)
    if pref:
        return pref
    pref = UserCategoryPreference(user_id=user_id, category_id=category_id)
    db.add(pref)
    return pref


def get_categories(db: Session, user_id: str, type: Optional[str] = None):
    """
    Returns categories visible to this user:
    - System defaults (user_id IS NULL), excluding ones the user hid
    - User's own custom categories
    Positions use per-user overrides when set.
    """
    query = db.query(Category).filter(
        (Category.user_id == None) | (Category.user_id == user_id)
    )

    if type:
        query = query.filter(Category.type == type)

    categories = query.all()

    prefs = {
        p.category_id: p
        for p in db.query(UserCategoryPreference).filter(
            UserCategoryPreference.user_id == user_id
        ).all()
    }

    visible = []
    for cat in categories:
        pref = prefs.get(cat.id)
        if pref and pref.is_hidden:
            continue

        effective_position = (
            pref.position if pref is not None and pref.position is not None else cat.position
        )
        # Detach so applying per-user position cannot leak into a shared Category row
        db.expunge(cat)
        cat.position = effective_position
        visible.append(cat)

    visible.sort(key=lambda c: (c.type, c.position, c.name))
    return visible


def create_category(db: Session, data: CategoryCreate, user_id: str):
    if data.type not in ["Expenses", "Income", "Savings"]:
        return None, "Type must be Expenses, Income, or Savings"

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
    """
    Custom category: hard-delete (only that user's row).
    System default: hide for this user only via preference — other users unaffected.
    """
    category = db.query(Category).filter(
        Category.id == category_id,
        (Category.user_id == user_id) | (Category.user_id == None)
    ).first()

    if not category:
        return False, "Category not found"

    if category.user_id is None:
        # Shared default — hide for this user only
        pref = _get_or_create_pref(db, user_id, category.id)
        pref.is_hidden = True
        db.commit()
        return True, None

    # User-owned custom category — hard delete
    db.query(UserCategoryPreference).filter(
        UserCategoryPreference.category_id == category.id
    ).delete()
    db.delete(category)
    db.commit()
    return True, None


def reorder_categories(db: Session, categories: list, user_id: str):
    """
    Saves sort order as per-user preferences.
    Never mutates shared Category.position for system defaults.
    """
    for item in categories:
        category = db.query(Category).filter(
            Category.id == item.id,
            (Category.user_id == user_id) | (Category.user_id == None)
        ).first()
        if not category:
            continue

        pref = _get_or_create_pref(db, user_id, category.id)
        pref.position = item.position

    db.commit()
    return True, None
