from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from openai import AzureOpenAI
from app.config import settings
from app.models.expense import Expense
from app.models.chat import AIChatSession, AIChatMessage
from app.schemas.ai import ParsedExpense
from datetime import date
import json
from pydantic import ValidationError

client = AzureOpenAI(
    api_key=settings.AZURE_OPENAI_API_KEY,
    azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
    api_version=settings.AZURE_OPENAI_API_VERSION
)

def get_or_create_session(db: Session, user_id: str, session_id: str = None):
    if session_id:
        session = db.query(AIChatSession).filter(
            AIChatSession.id == session_id,
            AIChatSession.user_id == user_id
        ).first()
        if session:
            return session
    session = AIChatSession(user_id=user_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

def save_message(db: Session, session_id: str, role: str, content: str, expense_id: str = None):
    message = AIChatMessage(
        session_id=session_id,
        role=role,
        content=content,
        expense_id=expense_id
    )
    db.add(message)
    db.commit()

def handle_chat_message(db: Session, message: str, user_id: str, session_id: str = None):
    session = get_or_create_session(db, user_id, session_id)
    save_message(db, session.id, "user", message)

    today = date.today().strftime("%Y-%m-%d")
    current_month = date.today().month
    current_year = date.today().year

    # Get summary for context
    expense_summary = db.query(
        Expense.type,
        Expense.category,
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count")
    ).filter(
        Expense.user_id == user_id
    ).group_by(Expense.type, Expense.category).all()

    summary_text = "\n".join([
        f"{row.type} | {row.category} | Total: GH₵{row.total} | {row.count} transactions"
        for row in expense_summary
    ])

    system_prompt = f"""
You are SmartSpend AI, a financial assistant used in Ghana.
Today's date is {today}. Current month: {current_month}, Current year: {current_year}.
The default currency is GHS.

The user's expense summary is:
{summary_text}

Determine the user's intent from their message:
- "add_expense": if they are stating they spent/received money and want to log it.
- "query": if they are asking a question about their past expenses/income.
- "general": if it's just a greeting, general conversation, or unclear.

Return ONLY a valid JSON object matching this structure:
{{
  "intent": "add_expense" | "query" | "general",
  
  "general_response": "Your conversational reply here (only if intent is general)",
  
  "expenses_data": [
    {{
       "date": "YYYY-MM-DD (use today if not specified)",
       "type": "Expenses" | "Income" | "Savings",
       "category": "Food" | "Transportation" | "Utilities" | "Clothing" | "Body Care & Medicine" | "Entertainment" | "Media" | "Education" | "Employment (NSS)" | "Side Hustle" | "Dividend" | "Freelance" | "Emergency Fund" | "Mini Business" | "Future Account" | "Investment" | "Other",
       "amount": 100.50,
       "currency": "GHS",
       "details": "short description or null",
       "payment_method": "Cash" | "MoMo" | "Card" | "Bank Transfer" | null,
       "notes": "extra info or null",
       "confidence": "high" | "medium" | "low"
    }}
  ],
  
  "query_filter": {{
     "type": "Expenses" | "Income" | "Savings" | null,
     "category": "category name" | null,
     "month": 1 | null,
     "year": 2026 | null
  }},
  "chart_hint": "bar" | "pie" | "line" | null
}}
"""

    try:
        response = client.chat.completions.create(
            model=settings.AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0
        )

        raw = response.choices[0].message.content.strip()
        result = json.loads(raw)
        intent = result.get("intent", "general")

        if intent == "general":
            answer = result.get("general_response", "I'm not sure how to respond to that.")
            save_message(db, session.id, "assistant", answer)
            return {
                "type": "text",
                "content": answer,
                "session_id": session.id
            }, None

        elif intent == "add_expense":
            raw_expenses = result.get("expenses_data", [])
            if not isinstance(raw_expenses, list):
                # Fallback if AI somehow returns a dict
                raw_expenses = [raw_expenses]
                
            parsed_list = []
            try:
                for parsed_data in raw_expenses:
                    parsed = ParsedExpense(
                        date=parsed_data.get("date", today),
                        type=parsed_data.get("type", "Expenses"),
                        category=parsed_data.get("category", "Other"),
                        amount=parsed_data.get("amount", 0.0),
                        currency=parsed_data.get("currency", "GHS"),
                        details=parsed_data.get("details"),
                        payment_method=parsed_data.get("payment_method"),
                        notes=parsed_data.get("notes"),
                        confidence=parsed_data.get("confidence", "medium")
                    )
                    
                    # Check for bad extraction
                    if parsed.amount <= 0:
                        raise ValidationError("Amount missing", ParsedExpense)
                        
                    parsed_list.append(parsed)

                if not parsed_list:
                    raise ValueError("No valid expenses extracted")

                total_amount = sum(p.amount for p in parsed_list)
                if len(parsed_list) == 1:
                    summary = (
                        f"Got it — GH₵{parsed_list[0].amount} on {parsed_list[0].category} "
                        f"on {parsed_list[0].date}"
                        f"{f', paid by {parsed_list[0].payment_method}' if parsed_list[0].payment_method else ''}."
                    )
                else:
                    summary = f"Got it — extracted {len(parsed_list)} expenses totaling GH₵{total_amount}."

                save_message(db, session.id, "assistant", summary)
                return {
                    "type": "parse",
                    "content": summary,
                    "parsed_list": parsed_list,
                    "session_id": session.id
                }, None
            except (ValidationError, TypeError, ValueError):
                error = "I think you want to add an expense, but I couldn't understand all the details (like amounts or categories). Please provide more info."
                save_message(db, session.id, "assistant", error)
                return {
                    "type": "text",
                    "content": error,
                    "session_id": session.id
                }, None

        elif intent == "query":
            filters = result.get("query_filter", {})
            query = db.query(Expense).filter(Expense.user_id == user_id)

            if filters.get("type"):
                query = query.filter(Expense.type == filters["type"])
            if filters.get("category"):
                query = query.filter(Expense.category == filters["category"])
            if filters.get("month"):
                query = query.filter(extract("month", Expense.date) == filters["month"])
            if filters.get("year"):
                query = query.filter(extract("year", Expense.date) == filters["year"])

            expenses = query.order_by(Expense.date.desc()).all()
            real_total = sum(float(e.amount) for e in expenses)

            data = [
                {
                    "date": str(e.date),
                    "category": e.category,
                    "amount": float(e.amount),
                    "details": e.details
                }
                for e in expenses
            ]

            expenses_total = sum(float(e.amount) for e in expenses if e.type == "Expenses")
            income_total   = sum(float(e.amount) for e in expenses if e.type == "Income")
            savings_total  = sum(float(e.amount) for e in expenses if e.type == "Savings")

            count = len(expenses)
            if count == 0:
                answer = "No transactions found for that query."
            else:
                types_present = set(e.type for e in expenses)
                if len(types_present) > 1:
                    parts = []
                    if income_total > 0:
                        parts.append(f"Income: GH₵{income_total:,.2f}")
                    if expenses_total > 0:
                        parts.append(f"Expenses: GH₵{expenses_total:,.2f}")
                    if savings_total > 0:
                        parts.append(f"Savings: GH₵{savings_total:,.2f}")
                    if income_total > 0 and expenses_total > 0:
                        balance = income_total - expenses_total - savings_total
                        parts.append(f"Balance: GH₵{balance:,.2f}")
                    answer = " | ".join(parts) + f" across {count} transactions."
                else:
                    filters_desc = []
                    if filters.get("category"):
                        filters_desc.append(filters["category"])
                    if filters.get("type"):
                        filters_desc.append(filters["type"])
                    if filters.get("month") and filters.get("year"):
                        from calendar import month_name
                        filters_desc.append(f"{month_name[filters['month']]} {filters['year']}")
                    elif filters.get("year"):
                        filters_desc.append(str(filters["year"]))
                    desc = " | ".join(filters_desc) if filters_desc else "all categories"
                    answer = f"You spent GH₵{real_total:,.2f} on {desc} across {count} transaction{'s' if count > 1 else ''}."

            save_message(db, session.id, "assistant", answer)
            return {
                "type": "query",
                "content": answer,
                "data": data,
                "total": real_total,
                "chart_hint": result.get("chart_hint"),
                "session_id": session.id
            }, None

    except json.JSONDecodeError:
        error = "Could not understand your question. Please try rephrasing it."
        save_message(db, session.id, "assistant", error)
        return {"type": "text", "content": error, "session_id": session.id}, None

    except Exception as e:
        error = f"Something went wrong: {str(e)}"
        save_message(db, session.id, "assistant", error)
        return {"type": "text", "content": error, "session_id": session.id}, None