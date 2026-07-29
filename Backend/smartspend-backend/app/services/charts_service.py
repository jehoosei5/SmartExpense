from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from app.models.expense import Expense
from app.models.budget import Budget
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

    # Get budgets for this year
    budget_rows = db.query(
        Budget.month,
        Budget.type,
        func.sum(Budget.amount).label("amount")
    ).filter(
        Budget.user_id == user_id,
        Budget.year == year
    ).group_by(
        Budget.month,
        Budget.type
    ).all()

    # Organize into a dict per month
    months = {}
    for m in range(1, 13):
        months[m] = {
            "month":      m,
            "month_name": month_name[m],
            "year":       year,
            "income":     0.0,
            "expenses":   0.0,
            "savings":    0.0,
            "balance":    0.0,
            "income_budget": 0.0,
            "expenses_budget": 0.0,
            "savings_budget": 0.0
        }

    for row in rows:
        m = int(row.month)
        if row.type == "Income":
            months[m]["income"] = float(row.total)
        elif row.type == "Expenses":
            months[m]["expenses"] = float(row.total)
        elif row.type == "Savings":
            months[m]["savings"] = float(row.total)

    for row in budget_rows:
        m = int(row.month)
        if row.type == "Income":
            months[m]["income_budget"] = float(row.amount)
        elif row.type == "Expenses":
            months[m]["expenses_budget"] = float(row.amount)
        elif row.type == "Savings":
            months[m]["savings_budget"] = float(row.amount)
    # Remove empty months if there's no data and no budget, 
    # but to be safe we can just leave it or filter. The original code only added months that had expense data.
    # We will filter out months that have 0 expenses and 0 budget so we don't show blank months unnecessarily,
    # unless they are up to the current month.
    current_month = date.today().month if year == date.today().year else 12
    active_months = {k: v for k, v in months.items() if k <= current_month or v["income"] > 0 or v["expenses"] > 0 or v["savings"] > 0 or v["income_budget"] > 0 or v["expenses_budget"] > 0 or v["savings_budget"] > 0}

    # Calculate balance per month
    for m in active_months:
        active_months[m]["balance"] = (
            active_months[m]["income"] -
            active_months[m]["expenses"] -
            active_months[m]["savings"]
        )

    # Return sorted by month
    return sorted(active_months.values(), key=lambda x: x["month"])


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
    ).all()

    budgets_query = db.query(
        Budget.type, Budget.category, func.sum(Budget.amount).label("amount")
    ).filter(Budget.user_id == user_id)
    
    if month:
        budgets_query = budgets_query.filter(Budget.month == month)
    if year:
        budgets_query = budgets_query.filter(Budget.year == year)
    if start_date:
        start_val = start_date.year * 12 + start_date.month
        budgets_query = budgets_query.filter(Budget.year * 12 + Budget.month >= start_val)
    if end_date:
        end_val = end_date.year * 12 + end_date.month
        budgets_query = budgets_query.filter(Budget.year * 12 + Budget.month <= end_val)
        
    budgets = budgets_query.group_by(Budget.type, Budget.category).all()
    budget_map = {(b.type, b.category): float(b.amount) for b in budgets}

    tracked = {}
    for row in rows:
        tracked[(row.type, row.category)] = {
            "total": float(row.total),
            "count": row.count
        }

    all_keys = set(tracked.keys()).union(set(budget_map.keys()))
    
    # Filter by type if provided (since budget_map might bring in other types)
    if type:
        all_keys = {k for k in all_keys if k[0] == type}

    grand_total = sum(t["total"] for t in tracked.values()) or 1.0

    result = []
    for k in all_keys:
        ctype, cname = k
        tot = tracked.get(k, {}).get("total", 0.0)
        cnt = tracked.get(k, {}).get("count", 0)
        bud = budget_map.get(k, 0.0)
        result.append({
            "category": cname,
            "type": ctype,
            "total": tot,
            "count": cnt,
            "percentage": round((tot / grand_total) * 100, 2),
            "budgeted": bud
        })
    
    result.sort(key=lambda x: x["total"], reverse=True)
    return result


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