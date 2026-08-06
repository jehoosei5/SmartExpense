from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import io
import csv
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
    delete_expense,
    get_recurring_suggestions
)

from pydantic import BaseModel
from app.models.snoozed_recurrence import SnoozedRecurrence

class SnoozeRequest(BaseModel):
    sync_hash: str
    remind_date: Optional[date] = None
    is_dismissed: bool = False

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post("", response_model=ExpenseResponse, status_code=201)
def create(data: ExpenseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    expense, alert_triggered, alert_percentage, error = create_expense(db, data, current_user.id)
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    expense.alert_triggered = alert_triggered
    expense.alert_percentage = alert_percentage
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


@router.get("/export")
def export_expenses(
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
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    incomes = [e for e in expenses if e.type == 'Income']
    expenses_list = [e for e in expenses if e.type == 'Expenses']
    
    total_income = sum(e.amount for e in incomes)
    total_expense = sum(e.amount for e in expenses_list)
    net_amount = total_income - total_expense
    
    headers = ['Date', 'Category', 'Description', 'Vendor', 'Original Amount', 'Converted Currency']
    
    # --- INCOME SECTION ---
    if incomes:
        writer.writerow(['=== INCOME TRANSACTIONS ==='])
        writer.writerow(headers)
        for e in incomes:
            writer.writerow([
                e.date.strftime('%d-%b-%y') if e.date else '',
                e.category or '',
                e.details or '',
                e.source or '',
                f"{e.amount} {e.currency}",
                f"{e.amount} {e.currency}"
            ])
        writer.writerow(['', 'Total Income', str(total_income)])
        writer.writerow([])
        writer.writerow([])
        
    # --- EXPENSE SECTION ---
    if expenses_list:
        writer.writerow(['=== EXPENSE TRANSACTIONS ==='])
        writer.writerow(headers)
        for e in expenses_list:
            writer.writerow([
                e.date.strftime('%d-%b-%y') if e.date else '',
                e.category or '',
                e.details or '',
                e.source or '',
                f"{e.amount} {e.currency}",
                f"{e.amount} {e.currency}"
            ])
        writer.writerow(['', 'Total Expense', str(total_expense)])
        writer.writerow([])
        writer.writerow([])
        
    # --- SUMMARY SECTION ---
    writer.writerow(['=== SUMMARY ==='])
    writer.writerow(['Metric', 'Value'])
    writer.writerow(['Total Income', str(total_income)])
    writer.writerow(['Total Expense', str(total_expense)])
    writer.writerow(['Net Amount', str(net_amount)])
    writer.writerow([])
    writer.writerow([])
    
    # --- CATEGORY BREAKDOWN ---
    writer.writerow(['=== CATEGORY BREAKDOWN ==='])
    writer.writerow(['Category', 'Total'])
    
    category_totals = {}
    for e in expenses:
        cat = e.category or 'Uncategorized'
        category_totals[cat] = category_totals.get(cat, 0) + e.amount
        
    for cat, total in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
        writer.writerow([cat, str(total)])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses_detailed_export.csv"}
    )


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update(expense_id: str, data: ExpenseUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    expense, alert_triggered, error = update_expense(db, expense_id, current_user.id, data)
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    expense.alert_triggered = alert_triggered
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

@router.get("/suggestions")
def get_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    suggestions = get_recurring_suggestions(db, current_user.id)
    return {"suggestions": suggestions}

@router.post("/suggestions/snooze")
def snooze_suggestion(
    data: SnoozeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    snoozed = db.query(SnoozedRecurrence).filter(
        SnoozedRecurrence.sync_hash == data.sync_hash,
        SnoozedRecurrence.user_id == current_user.id
    ).first()
    
    if not snoozed:
        snoozed = SnoozedRecurrence(
            user_id=current_user.id,
            sync_hash=data.sync_hash,
            remind_date=data.remind_date,
            is_dismissed=data.is_dismissed
        )
        db.add(snoozed)
    else:
        snoozed.remind_date = data.remind_date
        snoozed.is_dismissed = data.is_dismissed
        
    db.commit()
    return {"message": "Suggestion updated successfully"}