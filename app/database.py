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


def _seed_metric_zones():
    """Populate metric_zones table with Garmin percentile zone boundaries."""
    logger = logging.getLogger(__name__)
    try:
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM metric_zones")).scalar()
            if count and count > 0:
                return

            zones = [
                # Cadence (higher is better)
                ("cadence", "excellent", "#ff69b4", ">95%", 185, None),
                ("cadence", "above_avg", "#3498db", "70-95%", 174, 185),
                ("cadence", "average", "#2ecc71", "30-69%", 163, 173),
                ("cadence", "below_avg", "#f39c12", "5-29%", 151, 162),
                ("cadence", "poor", "#e74c3c", "<5%", None, 151),
                # Ground Contact Time (lower is better)
                ("gct", "excellent", "#ff69b4", ">95%", None, 208),
                ("gct", "above_avg", "#3498db", "70-95%", 208, 240),
                ("gct", "average", "#2ecc71", "30-69%", 241, 272),
                ("gct", "below_avg", "#f39c12", "5-29%", 273, 305),
                ("gct", "poor", "#e74c3c", "<5%", 305, None),
                # Vertical Oscillation (lower is better)
                ("vert_osc", "excellent", "#ff69b4", ">95%", None, 6.4),
                ("vert_osc", "above_avg", "#3498db", "70-95%", 6.4, 8.1),
                ("vert_osc", "average", "#2ecc71", "30-69%", 8.1, 9.7),
                ("vert_osc", "below_avg", "#f39c12", "5-29%", 9.7, 11.5),
                ("vert_osc", "poor", "#e74c3c", "<5%", 11.5, None),
                # Vertical Ratio (lower is better)
                ("vert_ratio", "excellent", "#ff69b4", ">95%", None, 6.1),
                ("vert_ratio", "above_avg", "#3498db", "70-95%", 6.1, 7.4),
                ("vert_ratio", "average", "#2ecc71", "30-69%", 7.4, 8.6),
                ("vert_ratio", "below_avg", "#f39c12", "5-29%", 8.6, 10.1),
                ("vert_ratio", "poor", "#e74c3c", "<5%", 10.1, None),
            ]
            for metric_key, zone_name, zone_color, percentile_label, min_val, max_val in zones:
                conn.execute(
                    text(
                        "INSERT INTO metric_zones (metric_key, zone_name, zone_color, percentile_label, min_value, max_value) "
                        "VALUES (:mk, :zn, :zc, :pl, :mn, :mx)"
                    ),
                    {"mk": metric_key, "zn": zone_name, "zc": zone_color, "pl": percentile_label, "mn": min_val, "mx": max_val},
                )
            conn.commit()
            logger.info("Seeded metric_zones table with %d rows", len(zones))
    except Exception:
        logger.debug("metric_zones seeding skipped (table may not exist yet)")


def init_db():
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _migrate_db()
    _seed_metric_zones()
