import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
import logging
import socket
import requests

# Railway IPv6 Patch: Force Python to only use IPv4 (AF_INET) to prevent "Network is unreachable" errors
old_getaddrinfo = socket.getaddrinfo
def new_getaddrinfo(*args, **kwargs):
    responses = old_getaddrinfo(*args, **kwargs)
    return [response for response in responses if response[0] == socket.AF_INET]
socket.getaddrinfo = new_getaddrinfo

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, html_content: str):
    """
    Sends an email using Resend API (HTTP) if configured, bypassing SMTP blocks.
    Falls back to standard SMTP if no Resend key is found.
    """
    if settings.RESEND_API_KEY:
        try:
            # Resend Free Tier requires sending FROM onboarding@resend.dev 
            # if you haven't verified a custom domain yet.
            from_email = settings.SMTP_FROM_EMAIL
            if "gmail.com" in from_email.lower():
                from_email = "SmartSpend <onboarding@resend.dev>"

            headers = {
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "from": from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            
            response = requests.post("https://api.resend.com/emails", json=payload, headers=headers)
            
            if response.status_code in [200, 201]:
                logger.info(f"Successfully sent email to {to_email} via Resend API")
                return True
            else:
                logger.error(f"Resend API Error: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            logger.error(f"Failed to send email via Resend: {str(e)}")
            return False

    # ---------- FALLBACK TO SMTP ----------
    if not settings.SMTP_SERVER or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.warning(f"Email sending skipped for {to_email}. SMTP credentials not configured.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
        msg["To"] = to_email

        # Attach HTML part
        part = MIMEText(html_content, "html")
        msg.attach(part)

        # Connect to server
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_SERVER, settings.SMTP_PORT)
        else:
            server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
            server.starttls()
            
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        
        # Send and close
        server.sendmail(msg["From"], to_email, msg.as_string())
        server.quit()
        
        logger.info(f"Successfully sent email to {to_email} via SMTP")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email} via SMTP: {str(e)}")
        return False
