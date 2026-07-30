from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from app.models.expense import Expense
from app.models.budget import Budget
from datetime import date
from calendar import month_name
from typing import Optional


def get_monthly_summary(
    db: Session, 
    user_id: str, 
    year: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):

    # Base query for expenses
    exp_query = db.query(
        extract("year", Expense.date).label("year"),
        extract("month", Expense.date).label("month"),
        Expense.type,
        func.sum(Expense.amount).label("total")
    ).filter(Expense.user_id == user_id)
    
    if year:
        exp_query = exp_query.filter(extract("year", Expense.date) == year)
    if start_date:
        exp_query = exp_query.filter(Expense.date >= start_date)
    if end_date:
        exp_query = exp_query.filter(Expense.date <= end_date)
        
    rows = exp_query.group_by(
        extract("year", Expense.date),
        extract("month", Expense.date),
        Expense.type
    ).all()

    # Base query for budgets
    bud_query = db.query(
        Budget.year,
        Budget.month,
        Budget.type,
        func.sum(Budget.amount).label("amount")
    ).filter(Budget.user_id == user_id)
    
    if year:
        bud_query = bud_query.filter(Budget.year == year)
    if start_date:
        start_val = start_date.year * 12 + start_date.month
        bud_query = bud_query.filter(Budget.year * 12 + Budget.month >= start_val)
    if end_date:
        end_val = end_date.year * 12 + end_date.month
        bud_query = bud_query.filter(Budget.year * 12 + Budget.month <= end_val)
        
    budget_rows = bud_query.group_by(
        Budget.year,
        Budget.month,
        Budget.type
    ).all()

    # Organize into a dict per year-month
    months = {}
    
    # If no filters at all, default to current year
    if not start_date and not end_date and not year:
        year = date.today().year
        for m in range(1, 13):
            key = f"{year}-{m:02d}"
            months[key] = {
                "month": m,
                "month_name": month_name[m],
                "year": year,
                "income": 0.0, "expenses": 0.0, "savings": 0.0, "balance": 0.0,
                "income_budget": 0.0, "expenses_budget": 0.0, "savings_budget": 0.0
            }

    for row in rows:
        y, m = int(row.year), int(row.month)
        key = f"{y}-{m:02d}"
        if key not in months:
            months[key] = {
                "month": m, "month_name": f"{month_name[m][:3]} '{str(y)[-2:]}", "year": y,
                "income": 0.0, "expenses": 0.0, "savings": 0.0, "balance": 0.0,
                "income_budget": 0.0, "expenses_budget": 0.0, "savings_budget": 0.0
            }
        if row.type == "Income": months[key]["income"] = float(row.total)
        elif row.type == "Expenses": months[key]["expenses"] = float(row.total)
        elif row.type == "Savings": months[key]["savings"] = float(row.total)

    for row in budget_rows:
        y, m = int(row.year), int(row.month)
        key = f"{y}-{m:02d}"
        if key not in months:
            months[key] = {
                "month": m, "month_name": f"{month_name[m][:3]} '{str(y)[-2:]}", "year": y,
                "income": 0.0, "expenses": 0.0, "savings": 0.0, "balance": 0.0,
                "income_budget": 0.0, "expenses_budget": 0.0, "savings_budget": 0.0
            }
        if row.type == "Income": months[key]["income_budget"] = float(row.amount)
        elif row.type == "Expenses": months[key]["expenses_budget"] = float(row.amount)
        elif row.type == "Savings": months[key]["savings_budget"] = float(row.amount)

    # Filter out empty months unless we specifically generated them for the current year
    active_months = {}
    for k, v in months.items():
        if (not start_date and not end_date) or v["income"] > 0 or v["expenses"] > 0 or v["savings"] > 0 or v["income_budget"] > 0 or v["expenses_budget"] > 0 or v["savings_budget"] > 0:
            v["balance"] = v["income"] - v["expenses"] - v["savings"]
            active_months[k] = v

    # Return sorted by year then month
    return sorted(active_months.values(), key=lambda x: (x["year"], x["month"]))


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