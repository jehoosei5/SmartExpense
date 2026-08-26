from pydantic import ValidationError
from app.schemas.expense import ExpenseUpdate

payload = {
  "date": "2026-07-28",
  "type": "Income",
  "category": "Family",
  "amount": "30",
  "currency": "GHS",
  "details": None,
  "payment_method": "Cash",
  "notes": None,
  "source": "form"
}

try:
    obj = ExpenseUpdate(**payload)
    print("Success:", obj.model_dump())
except ValidationError as e:
    print("ValidationError:")
    for err in e.errors():
        print(err)
