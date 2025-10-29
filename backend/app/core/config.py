import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import Optional

load_dotenv()


class config(BaseSettings):
    SENDER_EMAIL: str = os.getenv("SENDER_EMAIL", "")
    SENDER_PASSWORD: str = os.getenv("SENDER_PASSWORD", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://localhost/medilink")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "development-secret-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    
    # Cloud SQL Configuration
    USE_CLOUD_SQL: bool = os.getenv("USE_CLOUD_SQL", "false").lower() == "true"
    INSTANCE_CONNECTION_NAME: str = os.getenv("INSTANCE_CONNECTION_NAME", "")  # Format: project:region:instance
    DB_USER: str = os.getenv("DB_USER", "")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_NAME: str = os.getenv("DB_NAME", "")
    # Set to true if using Private IP (requires VPC access)
    USE_PRIVATE_IP: bool = os.getenv("USE_PRIVATE_IP", "false").lower() == "true"


config = config()
