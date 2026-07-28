from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from app.models.expense import Expense
from datetime import date
from calendar import month_name
from typing import Optional


def get_monthly_summary(db: Session, user_id: str, year: Optional[int] = None):
    year = year or date.today().year

    # Query grouped by month and type
    rows = db.query(
        extract("month", Expense.date).label("month"),
        Expense.type,
        func.sum(Expense.amount).label("total")
    ).filter(
        Expense.user_id == user_id,
        extract("year", Expense.date) == year
    ).group_by(
        extract("month", Expense.date),
        Expense.type
    ).all()

    # Organize into a dict per month
    months = {}
    for row in rows:
        m = int(row.month)
        if m not in months:
            months[m] = {
                "month":      m,
                "month_name": month_name[m],
                "year":       year,
                "income":     0.0,
                "expenses":   0.0,
                "savings":    0.0,
                "balance":    0.0
            }
        if row.type == "Income":
            months[m]["income"] = float(row.total)
        elif row.type == "Expenses":
            months[m]["expenses"] = float(row.total)
        elif row.type == "Savings":
            months[m]["savings"] = float(row.total)

    # Calculate balance per month
    for m in months:
        months[m]["balance"] = (
            months[m]["income"] -
            months[m]["expenses"] -
            months[m]["savings"]
        )

    # Return sorted by month
    return sorted(months.values(), key=lambda x: x["month"])


def get_category_breakdown(
    db: Session,
    user_id: str,
    type: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    query = db.query(
        Expense.category,
        Expense.type,
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count")
    ).filter(Expense.user_id == user_id)

    if type:
        query = query.filter(Expense.type == type)
    if month:
        query = query.filter(extract("month", Expense.date) == month)
    if year:
        query = query.filter(extract("year", Expense.date) == year)
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)

    rows = query.group_by(
        Expense.category,
        Expense.type
    ).order_by(func.sum(Expense.amount).desc()).all()

    if not rows:
        return []

    # Calculate grand total for percentages
    grand_total = sum(float(row.total) for row in rows)

    return [
        {
            "category":   row.category,
            "type":       row.type,
            "total":      float(row.total),
            "count":      row.count,
            "percentage": round((float(row.total) / grand_total) * 100, 2)
        }
        for row in rows
    ]


def get_trend(db: Session, user_id: str, months: int = 6):
    # Get last N months of data
    today = date.today()

    rows = db.query(
        extract("year", Expense.date).label("year"),
        extract("month", Expense.date).label("month"),
        Expense.type,
        func.sum(Expense.amount).label("total")
    ).filter(
        Expense.user_id == user_id
    ).group_by(
        extract("year", Expense.date),
        extract("month", Expense.date),
        Expense.type
    ).order_by(
        extract("year", Expense.date),
        extract("month", Expense.date)
    ).all()

    # Organize into dict per year-month
    periods = {}
    for row in rows:
        key = f"{int(row.year)}-{int(row.month):02d}"
        if key not in periods:
            periods[key] = {
                "month":      int(row.month),
                "month_name": month_name[int(row.month)],
                "year":       int(row.year),
                "income":     0.0,
                "expenses":   0.0,
                "savings":    0.0,
                "balance":    0.0
            }
        if row.type == "Income":
            periods[key]["income"] = float(row.total)
        elif row.type == "Expenses":
            periods[key]["expenses"] = float(row.total)
        elif row.type == "Savings":
            periods[key]["savings"] = float(row.total)

    # Calculate balance
    for key in periods:
        periods[key]["balance"] = (
            periods[key]["income"] -
            periods[key]["expenses"] -
            periods[key]["savings"]
        )

    # Return last N months sorted
    sorted_periods = sorted(periods.values(), key=lambda x: (x["year"], x["month"]))
    return sorted_periods[-months:]


def get_dashboard_summary(
    db: Session, 
    user_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    query = db.query(
        Expense.type,
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count")
    ).filter(Expense.user_id == user_id)

    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)

    stats = query.group_by(Expense.type).all()

    income   = 0.0
    expenses = 0.0
    savings  = 0.0
    transactions = 0

    for row in stats:
        transactions += row.count
        if row.type == "Income":
            income = float(row.total)
        elif row.type == "Expenses":
            expenses = float(row.total)
        elif row.type == "Savings":
            savings = float(row.total)

    # Top spending category in this range
    top_query = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total")
    ).filter(
        Expense.user_id == user_id,
        Expense.type == "Expenses"
    )

    if start_date:
        top_query = top_query.filter(Expense.date >= start_date)
    if end_date:
        top_query = top_query.filter(Expense.date <= end_date)

    top = top_query.group_by(
        Expense.category
    ).order_by(
        func.sum(Expense.amount).desc()
    ).first()

    return {
        "income":       income,
        "expenses":     expenses,
        "savings":      savings,
        "balance":      income - expenses - savings,
        "transactions": transactions,
        "top_category":        top.category if top else None,
        "top_category_amount": float(top.total) if top else None
    }