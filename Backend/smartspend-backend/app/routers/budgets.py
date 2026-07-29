from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.utils.security import get_current_user
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetBulkCreate, BudgetResponse
from app.services.budget_service import get_budgets, set_budget, set_budget_bulk
from typing import Optional

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("", response_model=List[BudgetResponse])
def list_budgets(year: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_budgets(db, current_user.id, year)

@router.post("", response_model=BudgetResponse, status_code=200)
def upsert_budget(data: BudgetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.type not in ["Expenses", "Income", "Savings"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid budget type")
    
    return set_budget(db, current_user.id, data)

@router.post("/bulk", response_model=List[BudgetResponse], status_code=200)
def upsert_budget_bulk(data: BudgetBulkCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.type not in ["Expenses", "Income", "Savings"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid budget type")
    
    return set_budget_bulk(db, current_user.id, data)
