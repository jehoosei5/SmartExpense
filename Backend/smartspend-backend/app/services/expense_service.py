from sqlalchemy.orm import Session
from sqlalchemy import extract, or_
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.utils.hashing import generate_sync_hash
from typing import Optional
from datetime import date
from dateutil.relativedelta import relativedelta
from sqlalchemy import func

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
        is_recurring=data.is_recurring,
        recurrence_period=data.recurrence_period.value if data.recurrence_period else None,
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
    search: Optional[str] = None,
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
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(or_(
            Expense.category.ilike(search_pattern),
            Expense.details.ilike(search_pattern),
            Expense.notes.ilike(search_pattern)
        ))

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
    if data.is_recurring is not None:
        expense.is_recurring = data.is_recurring
    if data.recurrence_period is not None:
        expense.recurrence_period = data.recurrence_period.value if data.recurrence_period else None

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


def process_recurring_expenses(db: Session, user_id: str):
    rows = db.query(
        Expense.type,
        Expense.category,
        Expense.amount,
        Expense.currency,
        Expense.details,
        Expense.payment_method,
        Expense.recurrence_period,
        func.max(Expense.date).label("latest_date")
    ).filter(
        Expense.user_id == user_id,
        Expense.is_recurring == True,
        Expense.recurrence_period.isnot(None)
    ).group_by(
        Expense.type,
        Expense.category,
        Expense.amount,
        Expense.currency,
        Expense.details,
        Expense.payment_method,
        Expense.recurrence_period
    ).all()

    today = date.today()
    created_count = 0

    for row in rows:
        latest_date = row.latest_date
        period = row.recurrence_period
        
        while True:
            if period == 'daily':
                next_date = latest_date + relativedelta(days=1)
            elif period == 'weekly':
                next_date = latest_date + relativedelta(weeks=1)
            elif period == 'monthly':
                next_date = latest_date + relativedelta(months=1)
            elif period == 'yearly':
                next_date = latest_date + relativedelta(years=1)
            else:
                break
                
            if next_date > today:
                break
                
            sync_hash = generate_sync_hash(
                user_id=user_id,
                date=str(next_date),
                type=row.type,
                category=row.category,
                amount=str(row.amount),
                details=row.details or ""
            )
            
            existing = db.query(Expense).filter(Expense.sync_hash == sync_hash).first()
            if not existing:
                new_exp = Expense(
                    user_id=user_id,
                    date=next_date,
                    type=row.type,
                    category=row.category,
                    amount=row.amount,
                    currency=row.currency,
                    details=row.details,
                    payment_method=row.payment_method,
                    source='form',
                    notes="Auto-generated recurring expense",
                    is_recurring=True,
                    recurrence_period=period,
                    sync_hash=sync_hash
                )
                db.add(new_exp)
                created_count += 1
                
            latest_date = next_date

    if created_count > 0:
        db.commit()
        
    return created_count