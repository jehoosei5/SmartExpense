from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.utils.security import get_current_user
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryReorderRequest
from app.services.category_service import get_categories, create_category, delete_category, reorder_categories

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_categories(db, current_user.id, type)


@router.post("", response_model=CategoryResponse, status_code=201)
def create(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category, error = create_category(db, data, current_user.id)
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    return category


# Static path must be registered before /{category_id}
@router.put("/reorder", status_code=200)
def reorder(
    data: CategoryReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success, error = reorder_categories(db, data.categories, current_user.id)
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    return {"message": "Categories reordered successfully"}


@router.delete("/{category_id}", status_code=204)
def delete(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success, error = delete_category(db, category_id, current_user.id)
    if error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error
        )
