from pydantic import BaseModel
from typing import Optional
from datetime import date

class ParseRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ParsedExpense(BaseModel):
    date:           date
    type:           str
    category:       str
    amount:         float
    currency:       str = "GHS"
    details:        Optional[str] = None
    payment_method: Optional[str] = None
    notes:          Optional[str] = None
    confidence:     str  # "high", "medium", "low"

class ParseResponse(BaseModel):
    parsed:  ParsedExpense
    message: str  # human readable summary of what was parsed

class QueryRequest(BaseModel):
    message:    str
    session_id: Optional[str] = None

class QueryResponse(BaseModel):
    answer:      str
    data:        Optional[list] = None
    total:       Optional[float] = None
    chart_hint:  Optional[str] = None  # "bar", "pie", "line" — suggests a chart type