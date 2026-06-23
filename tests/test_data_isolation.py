"""Phase 3: every API read is scoped to the authenticated user.

Seeds two users with their own activities / summaries / insights / profile /
plan and asserts each caller sees only their own rows.
"""
from datetime import date, datetime, timedelta

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.api import api_router
from app.auth import get_current_user
from app.database import Base, get_db
from app.models import (
    Activity,
    AthleteProfile,
    DailySummary,
    GarminCalendarEvent,
    Insight,
    TrainingPlan,
    TrainingPlanDay,
    User,
)


@pytest.fixture
def session_factory():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield sessionmaker(bind=engine)
    engine.dispose()


def _seed(session_factory):
    """Create two users, each with one activity / summary / insight / profile."""
    db = session_factory()
    u1 = User(id=1, email="u1@example.com")
    u2 = User(id=2, email="u2@example.com")
    db.add_all([u1, u2])
    db.flush()

    base = datetime(2026, 6, 1, 7, 0)
    for uid in (1, 2):
        db.add(Activity(
            user_id=uid, garmin_id=1000 + uid, activity_type="running",
            name=f"Run U{uid}", started_at=base, duration_sec=3600, distance_m=10000,
        ))
        db.add(DailySummary(user_id=uid, date=date(2026, 6, 1), steps=1000 * uid))
        db.add(Insight(
            user_id=uid, created_at=base, trigger_type="weekly_review",
            content="c", summary=f"insight U{uid}", category="training_plan",
        ))
        db.add(AthleteProfile(user_id=uid, name=f"Athlete U{uid}", weekly_availability=str(uid)))
        plan = TrainingPlan(user_id=uid, generated_at=base, week_start=date(2026, 6, 1), plan_weeks=1)
        db.add(plan)
        db.flush()
        db.add(TrainingPlanDay(
            user_id=uid, plan_id=plan.id, day_date=date(2026, 6, 1),
            day_of_week="Monday", week_number=1, workout_type="easy",
        ))
        db.add(GarminCalendarEvent(
            user_id=uid, garmin_id=f"race_{uid}", event_type="race",
            date=date(2026, 9, 1), title=f"Race U{uid}", distance_label="10K",
        ))
    db.commit()
    db.close()


def _client_for(session_factory, user_id: int) -> TestClient:
    app = FastAPI()
    app.include_router(api_router)

    def override_get_db():
        s = session_factory()
        try:
            yield s
        finally:
            s.close()

    def override_user():
        s = session_factory()
        try:
            return s.query(User).filter(User.id == user_id).first()
        finally:
            s.close()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    return TestClient(app)


def test_activities_scoped_to_user(session_factory):
    _seed(session_factory)
    c1, c2 = _client_for(session_factory, 1), _client_for(session_factory, 2)

    a1 = c1.get("/api/v1/activities").json()
    a2 = c2.get("/api/v1/activities").json()
    assert len(a1) == 1 and a1[0]["name"] == "Run U1"
    assert len(a2) == 1 and a2[0]["name"] == "Run U2"


def test_cross_user_activity_detail_is_404(session_factory):
    _seed(session_factory)
    c1 = _client_for(session_factory, 1)
    # user1's own activity is visible
    own = c1.get("/api/v1/activities").json()[0]["id"]
    assert c1.get(f"/api/v1/activities/{own}").status_code == 200
    # user2's activity id must not be reachable by user1
    c2 = _client_for(session_factory, 2)
    other = c2.get("/api/v1/activities").json()[0]["id"]
    if other != own:
        assert c1.get(f"/api/v1/activities/{other}").status_code == 404


def test_insights_scoped_to_user(session_factory):
    _seed(session_factory)
    i1 = _client_for(session_factory, 1).get("/api/v1/insights").json()
    i2 = _client_for(session_factory, 2).get("/api/v1/insights").json()
    assert [i["summary"] for i in i1] == ["insight U1"]
    assert [i["summary"] for i in i2] == ["insight U2"]


def test_profile_scoped_to_user(session_factory):
    _seed(session_factory)
    p1 = _client_for(session_factory, 1).get("/api/v1/athlete-profile").json()
    p2 = _client_for(session_factory, 2).get("/api/v1/athlete-profile").json()
    assert p1["name"] == "Athlete U1"
    assert p2["name"] == "Athlete U2"


def test_training_plan_scoped_to_user(session_factory):
    _seed(session_factory)
    plan1 = _client_for(session_factory, 1).get("/api/v1/training-plan").json()
    plan2 = _client_for(session_factory, 2).get("/api/v1/training-plan").json()
    assert plan1 is not None and plan2 is not None
    assert plan1["id"] != plan2["id"]


def test_settings_counts_scoped_to_user(session_factory):
    _seed(session_factory)
    s1 = _client_for(session_factory, 1).get("/api/v1/settings").json()
    # Exactly one of each per user, never the other user's rows.
    assert s1["counts"]["activities"] == 1
    assert s1["counts"]["daily_summaries"] == 1
    assert s1["counts"]["insights"] == 1
    assert s1["counts"]["calendar_events"] == 1


def test_today_scoped_to_user(session_factory):
    _seed(session_factory)
    body = _client_for(session_factory, 1).get("/api/v1/today?date=2026-06-01").json()
    assert len(body["activities"]) == 1
    assert body["activities"][0]["name"] == "Run U1"
    assert body["daily_summary"]["steps"] == 1000
    assert [r["title"] for r in body["next_races"]] == ["Race U1"]
