import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import Optional

load_dotenv()


class config(BaseSettings):
    # Email Configuration
    SENDER_EMAIL: str = os.getenv("SENDER_EMAIL", "")
    SENDER_PASSWORD: str = os.getenv("SENDER_PASSWORD", "")
    
    # JWT Configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "development-secret-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    
    # GCP Cloud SQL Configuration (Required)
    INSTANCE_CONNECTION_NAME: str = os.getenv("INSTANCE_CONNECTION_NAME", "")  # Format: project:region:instance
    DB_USER: str = os.getenv("DB_USER", "")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_NAME: str = os.getenv("DB_NAME", "")
    # Set to true if using Private IP (requires VPC access)
    USE_PRIVATE_IP: bool = os.getenv("USE_PRIVATE_IP", "false").lower() == "true"
    
    # GCP Cloud Storage Configuration
    GCP_BUCKET_NAME: str = os.getenv("GCP_BUCKET_NAME", "")
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "")
    GCP_STORAGE_KEY_FILE: str = os.getenv("GCP_STORAGE_KEY_FILE", "")  # Path to service account JSON key file
    # If key file path is not provided, will use default credentials
    USE_DEFAULT_CREDENTIALS: bool = os.getenv("USE_DEFAULT_CREDENTIALS", "false").lower() == "true"

    # Google OAuth / Calendar
    GOOGLE_OAUTH_CLIENT_ID: str = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "")
    GOOGLE_OAUTH_CLIENT_SECRET: str = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "")
    GOOGLE_OAUTH_REDIRECT_URI: str = os.getenv("GOOGLE_OAUTH_REDIRECT_URI", "")
    GOOGLE_OAUTH_DEV_REDIRECT_URI: str = os.getenv("GOOGLE_OAUTH_DEV_REDIRECT_URI", "")
    GOOGLE_OAUTH_SCOPES: str = os.getenv(
        "GOOGLE_OAUTH_SCOPES",
        "https://www.googleapis.com/auth/calendar.readonly",
    )
    GOOGLE_OAUTH_CREDENTIALS_PATH: str = os.getenv("GOOGLE_OAUTH_CREDENTIALS_PATH", "")
    GOOGLE_HOLIDAYS_CALENDAR_ID: str = os.getenv(
        "GOOGLE_HOLIDAYS_CALENDAR_ID",
        "en.usa#holiday@group.v.calendar.google.com",
    )
    GOOGLE_OAUTH_SUCCESS_REDIRECT: str = os.getenv(
        "GOOGLE_OAUTH_SUCCESS_REDIRECT",
        "/dashboard/doctor/appointments",
    )


config = config()
