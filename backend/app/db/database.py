from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from db import Base
from db.models import (
    User,
    DBSession,
    OTPStore,
    DoctorProfile,
    DoctorSocialLink,
    Specialty,
    DoctorSpecialty,
    Appointment,
    AppointmentRequest,
    Notification,
    Address,
    FileBatch,
    PatientFile,
)
from core import config
from core.gcp_credentials import ensure_application_default_credentials
import asyncpg
import asyncio
from google.cloud.sql.connector import Connector

# Ensure ADC is available before connector initialization
# Prioritize file path over JSON string
ensure_application_default_credentials(
    config.GOOGLE_APPLICATION_CREDENTIALS_FILE,
    config.GOOGLE_APPLICATION_CREDENTIALS_JSON,
)

# Global connector instance
connector: Connector = None
connector_loop = None


async def init_connector():
    """Initialize the Cloud SQL connector. Must be called during startup."""
    global connector, connector_loop
    if connector is None:
        # Get the current event loop and store it
        connector_loop = asyncio.get_running_loop()
        # Initialize connector with the explicit loop
        connector = Connector(loop=connector_loop)


async def getconn() -> asyncpg.Connection:
    """
    Create a connection to Cloud SQL using Cloud SQL Python Connector.
    This function is called by SQLAlchemy when creating a new connection.
    """
    global connector, connector_loop
    if connector is None:
        raise RuntimeError(
            "Connector not initialized. Call init_connector() during startup."
        )

    # Ensure we're using the same event loop
    current_loop = asyncio.get_running_loop()
    if current_loop != connector_loop:
        # If we're in a different loop (due to greenlets), recreate the connector
        connector = Connector(loop=current_loop)
        connector_loop = current_loop

    conn: asyncpg.Connection = await connector.connect_async(
        config.INSTANCE_CONNECTION_NAME,
        "asyncpg",
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        db=config.DB_NAME,
        ip_type="private" if config.USE_PRIVATE_IP else "public",
    )
    return conn


# Create engine using Cloud SQL Connector
engine = create_async_engine(
    "postgresql+asyncpg://",
    async_creator=getconn,
    poolclass=NullPool,  # Cloud SQL Connector handles connection pooling
    echo=True,
)

sessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# Dependency (to be used in routes for getting DB session)
async def get_session() -> AsyncSession:
    async with sessionLocal() as session:
        yield session


# need to shift to main.py later
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# Cleanup function to close the connector
async def close_connector():
    """Close the Cloud SQL connector on application shutdown."""
    global connector, connector_loop
    if connector is not None:
        try:
            await connector.close_async()
        except Exception as e:
            print(f"Error closing connector: {e}")
        finally:
            connector = None
            connector_loop = None
