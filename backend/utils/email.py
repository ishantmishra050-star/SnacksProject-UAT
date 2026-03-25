import os
import smtplib
from email.message import EmailMessage
from email.utils import formataddr

# Email configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", SMTP_USERNAME)
SENDER_NAME = "Vintage Snacks Support"

def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """
    Sends a beautifully styled HTML password reset email using the configured SMTP server.
    """
    if not all([SMTP_SERVER, SMTP_USERNAME, SMTP_PASSWORD]):
        print(f"\n[WARNING] Email not sent to {to_email}. SMTP settings are missing in your environment variables.")
        print(f"To: {to_email}\nLink: {reset_link}\n")
        return False

    msg = EmailMessage()
    msg['Subject'] = "Password Reset Request - Vintage Snacks"
    msg['From'] = formataddr((SENDER_NAME, SENDER_EMAIL))
    msg['To'] = to_email

    # Beautiful HTML Email Payload
    html_content = f"""
    <html>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #e67e22; margin-top: 0;">🍘 Vintage Snacks</h2>
          <h3 style="color: #333333;">Password Reset Request</h3>
          <p style="color: #555555; text-align: left; line-height: 1.6;">
            We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
          </p>
          <p style="color: #555555; text-align: left; line-height: 1.6;">
            To reset your password, please click the secure button below:
          </p>
          <div style="margin: 35px 0;">
            <a href="{reset_link}" style="background-color: #e67e22; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #555555; text-align: left; line-height: 1.6; font-size: 13px;">
            Or copy and paste this link into your browser:<br/>
            <a href="{reset_link}" style="color: #e67e22; word-break: break-all;">{reset_link}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
          <p style="color: #999999; font-size: 12px; margin-bottom: 0;">
            This link will expire in 15 minutes.<br/>
            &copy; 2026 Vintage Snacks Showcase. All rights reserved.
          </p>
        </div>
      </body>
    </html>
    """
    
    msg.add_alternative(html_content, subtype='html')

    try:
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
        print(f"Password reset email sent successfully to {to_email}.")
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {str(e)}")
        return False
