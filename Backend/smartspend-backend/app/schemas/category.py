from pydantic import BaseModel
from typing import Optional

class CategoryCreate(BaseModel):
    name: str
    type: str  # "Expenses", "Income", or "Savings"

class CategoryResponse(BaseModel):
    id:         int
    name:       str
    type:       str
    is_default: int
    user_id:    Optional[str] = None

    class Config:
        from_attributes = True