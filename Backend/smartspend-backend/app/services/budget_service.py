from sqlalchemy.orm import Session
from app.models.budget import Budget
from app.schemas.budget import BudgetCreate, BudgetBulkCreate
from typing import List, Optional

def get_budgets(db: Session, user_id: str, year: Optional[int] = None) -> List[Budget]:
    query = db.query(Budget).filter(Budget.user_id == user_id)
    if year:
        query = query.filter(Budget.year == year)
    return query.all()

def set_budget(db: Session, user_id: str, data: BudgetCreate) -> Budget:
    # Check if budget for this type, category, year, and month already exists
    budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.type == data.type,
        Budget.category == data.category,
        Budget.year == data.year,
        Budget.month == data.month
    ).first()

    if budget:
        # Update existing
        budget.amount = data.amount
    else:
        # Create new
        budget = Budget(
            user_id=user_id,
            type=data.type,
            category=data.category,
            year=data.year,
            month=data.month,
            amount=data.amount
        )
        db.add(budget)

    db.commit()
    db.refresh(budget)
    return budget

def set_budget_bulk(db: Session, user_id: str, data: BudgetBulkCreate) -> List[Budget]:
    results = []
    for month_str, amount in data.months.items():
        month = int(month_str)
        budget = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.type == data.type,
            Budget.category == data.category,
            Budget.year == data.year,
            Budget.month == month
        ).first()

        if budget:
            budget.amount = amount
        else:
            budget = Budget(
                user_id=user_id,
                type=data.type,
                category=data.category,
                year=data.year,
                month=month,
                amount=amount
            )
            db.add(budget)
        results.append(budget)
    
    db.commit()
    for b in results:
        db.refresh(b)
    return results
