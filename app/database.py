import logging
import os
from contextlib import contextmanager

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


os.makedirs(os.path.dirname(settings.db_path), exist_ok=True)

engine = create_engine(
    f"sqlite:///{settings.db_path}",
    connect_args={"check_same_thread": False},
)


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, _connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def db_session():
    """Context manager for database sessions in non-FastAPI code (background jobs, sync tasks)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _migrate_db():
    """Add new columns to existing tables if they don't exist."""
    logger = logging.getLogger(__name__)
    new_activity_columns = {
        "avg_ground_contact_time": "FLOAT",
        "avg_vertical_oscillation": "FLOAT",
        "avg_vertical_ratio": "FLOAT",
        "normalized_power": "FLOAT",
        "training_stress_score": "FLOAT",
        "intensity_factor": "FLOAT",
        "avg_respiration_rate": "FLOAT",
        "max_respiration_rate": "FLOAT",
        "avg_speed": "FLOAT",
        "max_speed": "FLOAT",
        "min_hr": "INTEGER",
        "max_elevation": "FLOAT",
        "min_elevation": "FLOAT",
        "max_cadence": "FLOAT",
        "run_time_sec": "FLOAT",
        "walk_time_sec": "FLOAT",
        "typed_splits_json": "TEXT",
        "power_zones_json": "TEXT",
    }
    try:
        with engine.connect() as conn:
            rows = conn.execute(text("PRAGMA table_info(activities)")).fetchall()
            existing = {row[1] for row in rows}
            added = []
            for col, dtype in new_activity_columns.items():
                if col not in existing:
                    conn.execute(text(f"ALTER TABLE activities ADD COLUMN {col} {dtype}"))
                    added.append(col)
            conn.commit()
            if added:
                logger.info("Migrated activities table: added %s", ", ".join(added))
    except Exception:
        logger.debug("Migration skipped (table may not exist yet)")


def init_db():
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _migrate_db()
