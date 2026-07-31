from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import extract, and_, or_
from datetime import datetime, timedelta
import calendar
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.utils.email import send_email
from app.config import settings
import logging

router = APIRouter(prefix="/api/reports", tags=["Reports"])
logger = logging.getLogger(__name__)

def generate_report_html(user: User, expenses: list, period_name: str, start_date: datetime, end_date: datetime) -> str:
    """Generates a beautiful HTML email for the spending report."""
    
    total_spent = sum(e.amount for e in expenses)
    currency = user.default_currency
    
    # Calculate top categories
    category_totals = {}
    for e in expenses:
        if e.type == "Expenses":
            category_totals[e.category] = category_totals.get(e.category, 0) + e.amount
            
    top_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:5]
    
    categories_html = ""
    for cat, amount in top_categories:
        categories_html += f"<li><strong>{cat}:</strong> {currency} {amount:,.2f}</li>"
        
    if not categories_html:
        categories_html = "<li>No expenses recorded in this period.</li>"

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f7f6; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #333333; text-align: center;">Your {period_name} SmartSpend Report</h2>
            <p style="color: #555555; text-align: center;">For the period: {start_date.strftime('%b %d, %Y')} to {end_date.strftime('%b %d, %Y')}</p>
            
            <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h3 style="margin: 0; color: #0284c7; font-size: 16px;">Total Spent</h3>
                <h1 style="margin: 10px 0 0 0; color: #0369a1; font-size: 32px;">{currency} {total_spent:,.2f}</h1>
            </div>
            
            <h3 style="color: #333333; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Top Spending Categories</h3>
            <ul style="color: #555555; line-height: 1.6; padding-left: 20px;">
                {categories_html}
            </ul>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                <p>You are receiving this because your report frequency is set to {user.report_frequency}.</p>
                <p>You can change this anytime in your SmartSpend settings.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return html

@router.post("/trigger")
def trigger_reports(x_cron_secret: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """
    Triggers sending of email reports.
    Should be called daily by an external cron job.
    """
    if x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized cron trigger")
        
    today = datetime.now()
    is_sunday = today.weekday() == 6
    is_first_of_month = today.day == 1
    
    logger.info("Starting report generation process...")
    sent_count = 0
    
    users = db.query(User).filter(User.report_frequency.in_(["WEEKLY", "MONTHLY"])).all()
    
    for user in users:
        # Check if already sent today to prevent duplicates
        if user.last_report_sent_at and user.last_report_sent_at.date() == today.date():
            continue
            
        should_send = False
        start_date = None
        period_name = ""
        
        if user.report_frequency == "WEEKLY": # and is_sunday:
            should_send = True
            start_date = today - timedelta(days=7)
            period_name = "Weekly"
        elif user.report_frequency == "MONTHLY": # and is_first_of_month:
            should_send = True
            # Calculate 1st of previous month
            last_month = today.month - 1 if today.month > 1 else 12
            year = today.year if today.month > 1 else today.year - 1
            start_date = datetime(year, last_month, 1)
            period_name = "Monthly"
            
        if should_send:
            # Fetch expenses
            expenses = db.query(Expense).filter(
                Expense.user_id == user.id,
                Expense.date >= start_date.date(),
                Expense.date < today.date()
            ).all()
            
            html_content = generate_report_html(user, expenses, period_name, start_date, today - timedelta(days=1))
            
            success = send_email(
                to_email=user.email,
                subject=f"Your {period_name} SmartSpend Report",
                html_content=html_content
            )
            
            if success:
                user.last_report_sent_at = today
                db.commit()
                sent_count += 1
                
    return {"message": f"Report job completed. Sent {sent_count} reports."}
