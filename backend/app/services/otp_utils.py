import smtplib  # Standard library for sending emails
import ssl  # For secure connection
from email.message import EmailMessage  # For composing the email
import asyncio
import os

# --- EMAIL CONFIGURATION (LOADED FROM .env) ---
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
# FIX: Load credentials from environment variables set in .env
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")

print("SENDER_EMAIL:", SENDER_EMAIL)
print("SENDER_PASSWORD set? ", bool(SENDER_PASSWORD))


async def send_otp_email(recipient: str, code: str):

    if not SENDER_EMAIL or not SENDER_PASSWORD:
        print("ERROR: SENDER_EMAIL or SENDER_PASSWORD not configured. Using mock send.")
        return await asyncio.sleep(0.5)

    msg = EmailMessage()
    msg["Subject"] = "Your One-Time Verification Code"
    msg["From"] = SENDER_EMAIL
    msg["To"] = recipient

    msg.set_content(
        f"""Your verification code is: {code}
        This code will expire in 5 minutes. Please enter it immediately to complete your login.
        """
    )

    def send_sync_email():
        """Synchronous SMTP logic to run in the thread pool."""
        context = ssl.create_default_context()
        try:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls(context=context)
                server.login(SENDER_EMAIL, SENDER_PASSWORD)
                server.send_message(msg)
            print(f"SMTP Success: OTP sent to {recipient}")
        except Exception as e:
            print(f"SMTP Error: Failed to send email to {recipient}. Error: {e}")
            # Re-raise error so FastAPI handles the 500 properly
            raise RuntimeError(f"Failed to send verification email: {e}")

    await asyncio.to_thread(send_sync_email)
