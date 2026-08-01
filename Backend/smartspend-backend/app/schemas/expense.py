from pydantic import BaseModel
from datetime import date as dt_date, datetime
from typing import Optional
from enum import Enum

class ExpenseType(str, Enum):
    expenses = "Expenses"
    income   = "Income"
    savings  = "Savings"

class PaymentMethod(str, Enum):
    cash          = "Cash"
    momo          = "MoMo"
    card          = "Card"
    bank_transfer = "Bank Transfer"

class Source(str, Enum):
    excel   = "excel"
    form    = "form"
    ai_chat = "ai_chat"

class RecurrencePeriod(str, Enum):
    daily   = "daily"
    weekly  = "weekly"
    monthly = "monthly"
    yearly  = "yearly"
    custom  = "custom"

# What the client sends to CREATE an expense
class ExpenseCreate(BaseModel):
    date:           dt_date
    type:           ExpenseType
    category:       str
    amount:         float
    currency:       str = "GHS"
    details:        Optional[str] = None
    payment_method: Optional[PaymentMethod] = None
    source:         Source = Source.form
    notes:          Optional[str] = None
    is_recurring:   bool = False
    recurrence_period: Optional[RecurrencePeriod] = None
    recurrence_days:   Optional[str] = None
    recurrence_end_date: Optional[dt_date] = None

# What the client sends to UPDATE an expense
# Everything is optional — only send what you want to change
class ExpenseUpdate(BaseModel):
    date:           Optional[dt_date] = None
    type:           Optional[ExpenseType] = None
    category:       Optional[str] = None
    amount:         Optional[float] = None
    currency:       Optional[str] = None
    details:        Optional[str] = None
    payment_method: Optional[PaymentMethod] = None
    notes:          Optional[str] = None
    is_recurring:   Optional[bool] = None
    recurrence_period: Optional[RecurrencePeriod] = None
    recurrence_days:   Optional[str] = None
    recurrence_end_date: Optional[dt_date] = None

# What the API returns when reading an expense
class ExpenseResponse(BaseModel):
    id:             str
    user_id:        str
    date:           dt_date
    type:           str
    category:       str
    amount:         float
    base_amount:    float
    exchange_rate:  float
    currency:       str
    details:        Optional[str]
    payment_method: Optional[str]
    source:         str
    notes:          Optional[str]
    is_recurring:   bool
    recurrence_period: Optional[str]
    recurrence_days:   Optional[str]
    recurrence_end_date: Optional[dt_date]
    created_at:     datetime
    alert_triggered: bool = False

    class Config:
        from_attributes = True

# What the API returns for a list of expenses
class ExpenseListResponse(BaseModel):
    total:    int
    expenses: list[ExpenseResponse]