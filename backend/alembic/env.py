import os
import sys
import asyncio
from pathlib import Path
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncEngine, async_engine_from_config

from alembic import context

BASE_DIR = Path(__file__).resolve().parents[1]
APP_DIR = BASE_DIR / "app"

sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(APP_DIR))

from dotenv import load_dotenv  # noqa: E402
from db.base import Base  # noqa: E402

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

dotenv_path = BASE_DIR / ".env"
if dotenv_path.exists():
    load_dotenv(dotenv_path)

target_metadata = Base.metadata

database_url = (
    os.getenv("ASYNC_DATABASE_URL")
    or os.getenv("DATABASE_URL")
    or config.get_main_option("sqlalchemy.url")
)
if not database_url:
    raise RuntimeError(
        "Database URL not configured. Set ASYNC_DATABASE_URL or DATABASE_URL."
    )
config.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable: AsyncEngine = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async def run_async_migrations() -> None:
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
