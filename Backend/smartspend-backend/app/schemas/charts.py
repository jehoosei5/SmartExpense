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
    income:           float
    expenses:         float
    savings:          float
    balance:          float
    transactions:     int
    top_category:     Optional[str] = None
    top_category_amount: Optional[float] = None