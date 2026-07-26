from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from openai import AzureOpenAI
from app.config import settings
from app.models.expense import Expense
from app.models.chat import AIChatSession, AIChatMessage
from app.schemas.ai import ParsedExpense
from datetime import date, datetime
import json

client = AzureOpenAI(
    api_key=settings.AZURE_OPENAI_API_KEY,
    azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
    api_version= settings.AZURE_OPENAI_API_VERSION
)


# =============================================================================
# HELPER: Get or create a chat session
# =============================================================================
def get_or_create_session(db: Session, user_id: str, session_id: str = None):
    if session_id:
        session = db.query(AIChatSession).filter(
            AIChatSession.id == session_id,
            AIChatSession.user_id == user_id
        ).first()
        if session:
            return session

    # Create new session
    session = AIChatSession(user_id=user_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


# =============================================================================
# HELPER: Save a message to chat history
# =============================================================================
def save_message(db: Session, session_id: str, role: str, content: str, expense_id: str = None):
    message = AIChatMessage(
        session_id=session_id,
        role=role,
        content=content,
        expense_id=expense_id
    )
    db.add(message)
    db.commit()


# =============================================================================
# FEATURE 1: Parse natural language into expense fields
# =============================================================================
def parse_expense(db: Session, message: str, user_id: str, session_id: str = None):
    session = get_or_create_session(db, user_id, session_id)

    # Save user message
    save_message(db, session.id, "user", message)

    today = date.today().strftime("%Y-%m-%d")

    system_prompt = f"""
You are a financial data extraction assistant for SmartSpend AI, an expense tracker used in Ghana.
Today's date is {today}. The default currency is GHS (Ghanaian Cedi).

Your job is to extract expense information from the user's message and return ONLY a valid JSON object.
No explanation, no extra text — just the JSON.

Extract these fields:
- date: in YYYY-MM-DD format. Use today if not specified.
- type: must be exactly one of: "Expenses", "Income", "Savings"
- category: best matching category from: Food, Transportation, Utilities, Clothing, Body Care & Medicine, Entertainment, Media, Education, Employment (NSS), Side Hustle, Dividend, Freelance, Emergency Fund, Mini Business, Future Account, Investment, Other
- amount: numeric value only, no currency symbols
- currency: default "GHS" unless specified
- details: short description of the expense (null if not mentioned)
- payment_method: one of "Cash", "MoMo", "Card", "Bank Transfer" or null if not mentioned
- notes: any extra information (null if not mentioned)
- confidence: "high" if all fields are clear, "medium" if some assumptions were made, "low" if very unclear

Example input: "I spent GH₵45 on food today"
Example output:
{{
  "date": "{today}",
  "type": "Expenses",
  "category": "Food",
  "amount": 45.00,
  "currency": "GHS",
  "details": null,
  "payment_method": null,
  "notes": null,
  "confidence": "high"
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

        # Parse the JSON response
        parsed_data = json.loads(raw)

        # Build ParsedExpense object
        parsed = ParsedExpense(
            date=parsed_data["date"],
            type=parsed_data["type"],
            category=parsed_data["category"],
            amount=parsed_data["amount"],
            currency=parsed_data.get("currency", "GHS"),
            details=parsed_data.get("details"),
            payment_method=parsed_data.get("payment_method"),
            notes=parsed_data.get("notes"),
            confidence=parsed_data.get("confidence", "medium")
        )

        # Build human readable summary
        summary = (
            f"Got it — GH₵{parsed.amount} on {parsed.category} "
            f"on {parsed.date}"
            f"{f', paid by {parsed.payment_method}' if parsed.payment_method else ''}."
            f" Confidence: {parsed.confidence}."
        )

        # Save assistant response
        save_message(db, session.id, "assistant", summary)

        return parsed, summary, session.id, None

    except json.JSONDecodeError:
        error = "Could not parse the expense from your message. Please try again with more details."
        save_message(db, session.id, "assistant", error)
        return None, None, session.id, error

    except Exception as e:
        error = f"Something went wrong: {str(e)}"
        save_message(db, session.id, "assistant", error)
        return None, None, session.id, error


# =============================================================================
# FEATURE 2: Natural language querying
# =============================================================================
def query_expenses(db: Session, message: str, user_id: str, session_id: str = None):
    session = get_or_create_session(db, user_id, session_id)

    # Save user message
    save_message(db, session.id, "user", message)

    today = date.today().strftime("%Y-%m-%d")
    current_month = date.today().month
    current_year = date.today().year

    # Get summary of user's data to give GPT-4 context
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
You are a financial query assistant for SmartSpend AI.
Today's date is {today}. Current month: {current_month}, Current year: {current_year}.

The user's expense summary is:
{summary_text}

Your job is to answer the user's question about their expenses and return ONLY a valid JSON object.
No explanation, no extra text — just the JSON.

Return this structure:
{{
  "answer": "human readable answer to the question",
  "filter": {{
    "type": "Expenses" or "Income" or "Savings" or null,
    "category": category name or null,
    "month": month number or null,
    "year": year number or null
  }},
  "total": numeric total amount or null,
  "chart_hint": "bar" or "pie" or "line" or null
}}

Example input: "How much did I spend on food last month?"
Example output:
{{
  "answer": "You spent GH₵400 on Food last month across 2 transactions.",
  "filter": {{"type": "Expenses", "category": "Food", "month": 1, "year": 2026}},
  "total": 400.00,
  "chart_hint": "bar"
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

        # Run the actual database query using GPT's suggested filters
        filters = result.get("filter", {})
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

        # Calculate real total from database
        real_total = sum(float(e.amount) for e in expenses)

        # Format expenses for response
        data = [
            {
                "date":     str(e.date),
                "category": e.category,
                "amount":   float(e.amount),
                "details":  e.details
            }
            for e in expenses
        ]

        # Build answer from real database results instead of GPT's guess
        # Run separate totals per type for comparison questions
        expenses_total = sum(float(e.amount) for e in expenses if e.type == "Expenses")
        income_total   = sum(float(e.amount) for e in expenses if e.type == "Income")
        savings_total  = sum(float(e.amount) for e in expenses if e.type == "Savings")

        count = len(expenses)
        if count == 0:
            answer = "No transactions found for that query."
        else:
            # Check if multiple types are present — build comparison answer
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

        # Save assistant response
        save_message(db, session.id, "assistant", answer)

        return {
            "answer":     answer,
            "data":       data,
            "total":      real_total,
            "chart_hint": result.get("chart_hint")
        }, session.id, None

    except json.JSONDecodeError:
        error = "Could not understand your question. Please try rephrasing it."
        save_message(db, session.id, "assistant", error)
        return None, session.id, error

    except Exception as e:
        error = f"Something went wrong: {str(e)}"
        save_message(db, session.id, "assistant", error)
        return None, session.id, error