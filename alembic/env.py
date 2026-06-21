from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool, engine_from_config

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import Base and all models so autogenerate detects the full schema.
from app.database import Base  # noqa: E402
from app import models  # noqa: E402, F401

target_metadata = Base.metadata

# Override the URL from app settings so CLI commands pick up the right DB.
from app.config import settings  # noqa: E402

config.set_main_option("sqlalchemy.url", f"sqlite:///{settings.db_path}")


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # Reuse the app engine so WAL mode / foreign-key pragmas are active.
    from app.database import engine as app_engine

    with app_engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
