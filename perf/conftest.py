"""Fixtures for the API performance suite.

Points the app's SQLAlchemy engine at a *copy* of the committed
``perf/perf.db`` so benchmarks run against three years of realistic data while
never mutating the checked-in artifact. The copy + ``DB_PATH`` assignment happen
at import time — before any ``app.*`` import — because ``app/database.py`` binds
its engine to ``DB_PATH`` when first imported, and pytest loads this conftest
before collecting the test modules.

External boundaries (AI coaching, Garmin sync) are stubbed so every endpoint —
including the AI/sync ones — runs its own logic and DB work without requiring
network access or API keys.
"""

from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path

import pytest

_PERF_DIR = Path(__file__).resolve().parent
_SRC_DB = _PERF_DIR / "perf.db"

# Fresh per-process copy of the seed DB; the engine binds to this below.
_TMP_DIR = tempfile.mkdtemp(prefix="perf_db_")
_DB_COPY = os.path.join(_TMP_DIR, "perf.db")
shutil.copy(_SRC_DB, _DB_COPY)

os.environ["DB_PATH"] = _DB_COPY
os.environ["GARMIN_TOKEN_DIR"] = os.path.join(_TMP_DIR, "tokens")
os.environ["AUTH_ENABLED"] = "false"

# Apply any pending migrations so the copied db matches the current schema.
_PROJECT_ROOT = _PERF_DIR.parent
from alembic.config import Config as _AlembicConfig
from alembic import command as _alembic_command

_alembic_cfg = _AlembicConfig(str(_PROJECT_ROOT / "alembic.ini"))
_alembic_cfg.set_main_option("sqlalchemy.url", f"sqlite:///{_DB_COPY}")
_alembic_cfg.set_main_option("script_location", str(_PROJECT_ROOT / "alembic"))
_alembic_command.upgrade(_alembic_cfg, "head")


def _noop(*_args, **_kwargs):
    return None


@pytest.fixture(scope="session")
def client():
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from app.api import api_router

    app = FastAPI()
    app.include_router(api_router)
    return TestClient(app)


@pytest.fixture(autouse=True)
def mock_external(monkeypatch):
    """Stub third-party calls so endpoints run without network/API keys."""
    import app.ai_coach as ai_coach
    import app.garmin_sync as garmin_sync

    monkeypatch.setattr(ai_coach, "analyze_activity_force", _noop)
    monkeypatch.setattr(ai_coach, "analyze_activity_with_feedback", _noop)
    monkeypatch.setattr(garmin_sync, "sync_calendar", _noop)

    def _fake_generate_plan(*_args, **_kwargs):
        # Return the most recent seeded plan; the endpoint re-queries it by id.
        from app.database import db_session
        from app.models import TrainingPlan

        with db_session() as session:
            plan = (
                session.query(TrainingPlan)
                .order_by(TrainingPlan.generated_at.desc())
                .first()
            )

        class _PlanRef:
            pass

        ref = _PlanRef()
        ref.id = plan.id if plan else None
        return ref

    monkeypatch.setattr(ai_coach, "generate_training_plan", _fake_generate_plan)


@pytest.fixture(scope="session")
def ids():
    """Real primary keys / params pulled from the seeded database."""
    from app.database import SessionLocal
    from app.models import Activity, DailySummary, GarminCalendarEvent

    session = SessionLocal()
    try:
        recent_acts = (
            session.query(Activity).order_by(Activity.started_at.desc()).limit(2).all()
        )
        summary = session.query(DailySummary).order_by(DailySummary.date.desc()).first()
        workout_event = (
            session.query(GarminCalendarEvent)
            .filter(GarminCalendarEvent.event_type == "workout")
            .order_by(GarminCalendarEvent.date.desc())
            .first()
        )
        latest_day = recent_acts[0].started_at.date()
        return {
            # Most recent activity carries full detail streams + an insight.
            "activity_id": recent_acts[0].id,
            # A second, distinct activity is the target for mutating endpoints
            # so it cannot perturb the activity-detail read benchmark.
            "feedback_activity_id": recent_acts[1].id,
            "summary_id": summary.id,
            "event_id": workout_event.id,
            # Anchored to seeded data so date-scoped endpoints hit populated
            # ranges regardless of the CI run date.
            "day": latest_day.isoformat(),
            "month": latest_day.strftime("%Y-%m"),
        }
    finally:
        session.close()
