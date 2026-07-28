from pydantic import BaseModel
from typing import Optional, Any
from datetime import date

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

class UnifiedChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class UnifiedChatResponse(BaseModel):
    type:        str  # "text", "parse", "query"
    content:     str  # human readable response
    session_id:  Optional[str] = None
    parsed_list: Optional[list[ParsedExpense]] = None
    data:        Optional[list] = None
    total:       Optional[float] = None
    chart_hint:  Optional[str] = None