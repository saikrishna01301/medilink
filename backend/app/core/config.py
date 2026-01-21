import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import Optional

load_dotenv()

# Get the backend directory (where this config file is located)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent


class config(BaseSettings):
    # Email Configuration
    SENDER_EMAIL: str = os.getenv("SENDER_EMAIL", "")
    SENDER_PASSWORD: str = os.getenv("SENDER_PASSWORD", "")

    # JWT Configuration
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY", "development-secret-key-change-in-production"
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

    # GCP Cloud SQL Configuration (Required)
    INSTANCE_CONNECTION_NAME: str = os.getenv(
        "INSTANCE_CONNECTION_NAME", ""
    )  # Format: project:region:instance
    DB_USER: str = os.getenv("DB_USER", "")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_NAME: str = os.getenv("DB_NAME", "")
    # Set to true if using Private IP (requires VPC access)
    USE_PRIVATE_IP: bool = os.getenv("USE_PRIVATE_IP", "false").lower() == "true"

    # GCP Cloud Storage Configuration
    GCP_BUCKET_NAME: str = os.getenv("GCP_BUCKET_NAME", "")
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "")
    # Default to gcp-bucket-key.json in project root if not specified
    _default_storage_key = (
        str(PROJECT_ROOT / "gcp-bucket-key.json")
        if (PROJECT_ROOT / "gcp-bucket-key.json").exists()
        else ""
    )
    GCP_STORAGE_KEY_FILE: str = os.getenv(
        "GCP_STORAGE_KEY_FILE", _default_storage_key
    )  # Path to service account JSON key file
    GCP_STORAGE_KEY_JSON: str = os.getenv(
        "GCP_STORAGE_KEY_JSON", ""
    )  # Inline service account JSON or base64 (fallback)
    # If key file path is not provided, will use default credentials
    USE_DEFAULT_CREDENTIALS: bool = (
        os.getenv("USE_DEFAULT_CREDENTIALS", "false").lower() == "true"
    )

    # Token lifetimes
    ACCESS_TOKEN_EXPIRE_MIN: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MIN", "20"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "14"))

    # Google Calendar (Service Account)
    # Default to gcp-key.json in project root if not specified (service account file)
    # Note: medilink-calender-oauth.json is OAuth client credentials, not a service account
    _default_calendar_key = (
        str(PROJECT_ROOT / "gcp-key.json")
        if (PROJECT_ROOT / "gcp-key.json").exists()
        else ""
    )
    GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_PATH: str = os.getenv(
        "GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_PATH",
        _default_calendar_key,
    )
    GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON: str = os.getenv(
        "GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON",
        "",
    )
    GOOGLE_SERVICE_ACCOUNT_CALENDAR_ID: str = os.getenv(
        "GOOGLE_SERVICE_ACCOUNT_CALENDAR_ID",
        "",
    )
    GOOGLE_HOLIDAYS_CALENDAR_ID: str = os.getenv(
        "GOOGLE_HOLIDAYS_CALENDAR_ID",
        "en.usa#holiday@group.v.calendar.google.com",
    )

    # Google Maps API Configuration
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    # Default to gcp-key.json in project root if not specified
    _default_gcp_key = (
        str(PROJECT_ROOT / "gcp-key.json")
        if (PROJECT_ROOT / "gcp-key.json").exists()
        else ""
    )
    GOOGLE_APPLICATION_CREDENTIALS_FILE: str = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS_FILE",
        _default_gcp_key,
    )
    GOOGLE_APPLICATION_CREDENTIALS_JSON: str = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS_JSON",
        "",
    )

    # Redis Configuration
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD", None)
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    REDIS_URL: Optional[str] = os.getenv(
        "REDIS_URL", None
    )  # Overrides host/port if provided

    # open ai api key
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")


config = config()
