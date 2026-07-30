from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.database import get_db
from app.utils.security import get_current_user
from app.models.user import User
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseListResponse
)
from app.services.expense_service import (
    create_expense,
    get_expenses,
    update_expense,
    delete_expense
)

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post("", response_model=ExpenseResponse, status_code=201)
def create(data: ExpenseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    expense, error = create_expense(db, data, current_user.id)
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    return expense


@router.get("", response_model=ExpenseListResponse)
def list_expenses(
    type:       Optional[str]  = Query(None),
    category:   Optional[str]  = Query(None),
    source:     Optional[str]  = Query(None),
    month:      Optional[int]  = Query(None),
    year:       Optional[int]  = Query(None),
    start_date: Optional[date] = Query(None),
    end_date:   Optional[date] = Query(None),
    search:     Optional[str]  = Query(None),
    db:         Session        = Depends(get_db),
    current_user: User         = Depends(get_current_user)
):
    expenses = get_expenses(
        db=db,
        user_id=current_user.id,
        type=type,
        category=category,
        source=source,
        month=month,
        year=year,
        start_date=start_date,
        end_date=end_date,
        search=search
    )
    return ExpenseListResponse(total=len(expenses), expenses=expenses)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update(
    expense_id: str,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense, error = update_expense(db, expense_id, current_user.id, data)
    if error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error
        )
    return expense


@router.delete("/{expense_id}", status_code=204)
def delete(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success, error = delete_expense(db, expense_id, current_user.id)
    if error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error
        )