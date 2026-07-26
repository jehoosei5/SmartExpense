from pydantic import BaseModel
from typing import Optional

class MonthlySummary(BaseModel):
    month:          int
    month_name:     str
    year:           int
    income:         float
    expenses:       float
    savings:        float
    balance:        float

class CategoryBreakdown(BaseModel):
    category:       str
    type:           str
    total:          float
    count:          int
    percentage:     float

class TrendPoint(BaseModel):
    month:          int
    month_name:     str
    year:           int
    income:         float
    expenses:       float
    savings:        float
    balance:        float

class DashboardSummary(BaseModel):
    # Current month
    current_month_income:   float
    current_month_expenses: float
    current_month_savings:  float
    current_month_balance:  float

    # All time
    total_income:           float
    total_expenses:         float
    total_savings:          float
    total_balance:          float

    # Counts
    total_transactions:     int
    this_month_transactions:int

    # Top spending category this month
    top_category:           Optional[str] = None
    top_category_amount:    Optional[float] = None