import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class config(BaseSettings):
    SENDER_EMAIL: str = os.getenv("SENDER_EMAIL")
    SENDER_PASSWORD: str = os.getenv("SENDER_PASSWORD")
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM")


config = config()
