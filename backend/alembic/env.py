from logging.config import fileConfig

from alembic import context
from sqlalchemy import text

from app import models  # noqa: F401  (registers tables on Base.metadata)
from app.database import Base, engine

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Arbitrary constant so that several backend replicas starting at the same
# time take turns running migrations instead of racing each other.
MIGRATION_LOCK_ID = 210021


def run_migrations_online() -> None:
    with engine.connect() as connection:
        is_postgres = connection.dialect.name == "postgresql"
        if is_postgres:
            connection.execute(text(f"SELECT pg_advisory_lock({MIGRATION_LOCK_ID})"))
            connection.commit()
        try:
            context.configure(connection=connection, target_metadata=target_metadata)
            with context.begin_transaction():
                context.run_migrations()
        finally:
            if is_postgres:
                connection.execute(text(f"SELECT pg_advisory_unlock({MIGRATION_LOCK_ID})"))
                connection.commit()


run_migrations_online()
