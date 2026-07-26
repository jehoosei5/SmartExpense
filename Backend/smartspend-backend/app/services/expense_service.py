from sqlalchemy.orm import Session
from sqlalchemy import extract
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.utils.hashing import generate_sync_hash
from typing import Optional
from datetime import date

def create_expense(db: Session, data: ExpenseCreate, user_id: str):
    # Generate sync hash for duplicate prevention
    sync_hash = generate_sync_hash(
    user_id=user_id,
    date=str(data.date),
    type=data.type.value,
    category=data.category,
    amount=str(data.amount),
    details=data.details or ""
)

    # Check if this exact expense already exists
    existing = db.query(Expense).filter(Expense.sync_hash == sync_hash).first()
    if existing:
        return None, "Expense already exists"

    expense = Expense(
        user_id=user_id,
        date=data.date,
        type=data.type.value,
        category=data.category,
        amount=data.amount,
        currency=data.currency,
        details=data.details,
        payment_method=data.payment_method.value if data.payment_method else None,
        source=data.source.value,
        notes=data.notes,
        sync_hash=sync_hash
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense, None


def get_expenses(
    db: Session,
    user_id: str,
    type: Optional[str] = None,
    category: Optional[str] = None,
    source: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    query = db.query(Expense).filter(Expense.user_id == user_id)

    # Apply filters if provided
    if type:
        query = query.filter(Expense.type == type)
    if category:
        query = query.filter(Expense.category == category)
    if source:
        query = query.filter(Expense.source == source)
    if month:
        query = query.filter(extract("month", Expense.date) == month)
    if year:
        query = query.filter(extract("year", Expense.date) == year)
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)

    expenses = query.order_by(Expense.date.desc()).all()
    return expenses


def update_expense(db: Session, expense_id: str, user_id: str, data: ExpenseUpdate):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == user_id
    ).first()

    if not expense:
        return None, "Expense not found"

    # Only update fields that were actually sent
    if data.date is not None:
        expense.date = data.date
    if data.type is not None:
        expense.type = data.type.value
    if data.category is not None:
        expense.category = data.category
    if data.amount is not None:
        expense.amount = data.amount
    if data.currency is not None:
        expense.currency = data.currency
    if data.details is not None:
        expense.details = data.details
    if data.payment_method is not None:
        expense.payment_method = data.payment_method.value
    if data.notes is not None:
        expense.notes = data.notes

    db.commit()
    db.refresh(expense)
    return expense, None


def delete_expense(db: Session, expense_id: str, user_id: str):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == user_id
    ).first()

    if not expense:
        return False, "Expense not found"

    db.delete(expense)
    db.commit()
    return True, None