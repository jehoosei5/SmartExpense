from pydantic import BaseModel, Field
from typing import Optional

class BudgetBase(BaseModel):
    category: str = Field(..., max_length=100)
    type: str = Field(..., description="Must be Income, Expenses, or Savings")
    year: int = Field(..., ge=2000, le=2100)
    month: int = Field(..., ge=1, le=12)
    amount: float = Field(..., ge=0)

class BudgetCreate(BudgetBase):
    pass

class BudgetBulkCreate(BaseModel):
    category: str
    type: str
    year: int
    months: dict[int, float] = Field(..., description="Map of month (1-12) to amount")

class BudgetResponse(BudgetBase):
    id: str

    class Config:
        from_attributes = True
