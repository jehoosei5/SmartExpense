from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CategoryCreate(BaseModel):
    name: str
    type: str  # "Expenses", "Income", or "Savings"

class CategoryResponse(BaseModel):
    id:         int
    user_id:    Optional[str]
    name:       str
    type:       str
    is_default: int
    position:   int
    created_at: datetime

    class Config:
        from_attributes = True

class CategoryReorder(BaseModel):
    id: int
    position: int

class CategoryReorderRequest(BaseModel):
    categories: list[CategoryReorder]