import logging
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.alert import Alert
from app.models.user import User
from app.utils.email import send_email

logger = logging.getLogger(__name__)

def check_and_trigger_budget_alert(db: Session, expense: Expense, user: User) -> bool:
    """
    Checks if the given expense causes the user to exceed 90% of their budget
    for that category in the expense's month. If so, creates an in-app Alert
    and sends an email warning.
    
    Returns True if an alert was newly triggered, False otherwise.
    """
    if expense.type != "Expenses":
        return False
        
    year = expense.date.year
    month = expense.date.month
    
    # Find the budget for this category and month
    budget = db.query(Budget).filter(
        Budget.user_id == user.id,
        Budget.type == "Expenses",
        Budget.category == expense.category,
        Budget.year == year,
        Budget.month == month
    ).first()
    
    if not budget or budget.amount <= 0:
        return False
        
    # Calculate total spent in this category for the month
    total_spent = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == user.id,
        Expense.type == "Expenses",
        Expense.category == expense.category,
        func.extract('year', Expense.date) == year,
        func.extract('month', Expense.date) == month
    ).scalar() or 0
    
    total_spent = float(total_spent)
    budget_limit = float(budget.amount)
    
    if total_spent >= (budget_limit * 0.9):
        # The user has reached 90% of their budget!
        # Check if we already alerted them for this category/month
        reference_key = f"budget_alert_{expense.category}_{year}_{month}"
        
        existing_alert = db.query(Alert).filter(
            Alert.user_id == user.id,
            Alert.reference_key == reference_key
        ).first()
        
        if not existing_alert:
            percentage = int((total_spent / budget_limit) * 100)
            title = f"Budget Alert: {expense.category}"
            message = f"You have reached {percentage}% of your {user.default_currency} {budget_limit:,.2f} budget for {expense.category} this month. You have spent {user.default_currency} {total_spent:,.2f} so far."
            
            # Create In-App Alert
            new_alert = Alert(
                user_id=user.id,
                title=title,
                message=message,
                reference_key=reference_key
            )
            db.add(new_alert)
            db.commit()
            
            # Send Email Alert
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; background-color: #f4f7f6; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <h2 style="color: #ef4444; text-align: center;">🚨 Budget Warning</h2>
                    <p style="color: #374151; font-size: 16px; text-align: center;">
                        You are dangerously close to exceeding your <strong>{expense.category}</strong> budget for the month!
                    </p>
                    <div style="background-color: #fee2e2; border: 1px solid #fca5a5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <h3 style="margin: 0; color: #b91c1c; font-size: 14px; text-transform: uppercase;">Amount Spent</h3>
                        <h1 style="margin: 10px 0 0 0; color: #991b1b; font-size: 32px;">{user.default_currency} {total_spent:,.2f}</h1>
                        <p style="margin: 5px 0 0 0; color: #b91c1c; font-size: 14px;">out of {user.default_currency} {budget_limit:,.2f} ({percentage}%)</p>
                    </div>
                    <p style="color: #6b7280; text-align: center; font-size: 14px;">
                        Try to cut back on {expense.category} expenses for the rest of the month to stay on track.
                    </p>
                </div>
            </body>
            </html>
            """
            
            send_email(
                to_email=user.email,
                subject=f"🚨 SmartSpend Alert: {expense.category} budget at {percentage}%",
                html_content=html_content
            )
            
            return True
            
    return False
