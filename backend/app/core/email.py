import os
import smtplib
from email.message import EmailMessage

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465

# Load credentials from environment
SMTP_USERNAME = os.environ.get("SMTP_USERNAME")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")

def send_verification_email(to_email: str, token: str):
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print(f"Warning: SMTP credentials not configured. Would have sent verification email to {to_email} with token {token}")
        return

    # Assuming the frontend runs on port 5173
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    verify_link = f"{FRONTEND_URL}/verify?token={token}"

    msg = EmailMessage()
    msg["Subject"] = "Verify your CityTrail Account"
    msg["From"] = SMTP_USERNAME
    msg["To"] = to_email

    html_content = f"""
    <html>
      <body style="font-family: sans-serif; background-color: #0b1021; color: #ffffff; padding: 20px; text-align: center;">
        <h1 style="color: #fadb2a;">Welcome to CityTrail!</h1>
        <p>You're almost ready to start exploring. Please verify your email address by clicking the link below:</p>
        <a href="{verify_link}" style="display: inline-block; background-color: #4bd5e7; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; margin-top: 20px;">VERIFY MY EMAIL</a>
        <p style="margin-top: 30px; font-size: 12px; color: #aebfd1;">If you didn't request this, you can safely ignore this email.</p>
      </body>
    </html>
    """
    
    msg.set_content("Please enable HTML to view this email.")
    msg.add_alternative(html_content, subtype='html')

    try:
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            print(f"Verification email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {str(e)}")
