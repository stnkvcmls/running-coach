import json
from datetime import date, datetime, timedelta
from unittest.mock import MagicMock

import pytest

from app.models import (
    Activity,
    DailySummary,
    GarminCalendarEvent,
    Insight,
    SyncStatus,
)


# --- Fixtures / helpers ---

def _add_activity(db, started_at, **kw):
    defaults = dict(
        garmin_id=int(started_at.timestamp()),
        activity_type="running",
        name="Morning Run",
        started_at=started_at,
        duration_sec=3600,
        distance_m=10000,
    )
    defaults.update(kw)
    act = Activity(**defaults)
    db.add(act)
    db.commit()
    db.refresh(act)
    return act


# --- /activities ---

def test_list_activities_pagination_and_filter(client, db):
    base = datetime(2026, 6, 1, 7, 0)
    for i in range(3):
        _add_activity(db, base + timedelta(days=i))
    _add_activity(db, base + timedelta(days=4), activity_type="cycling", name="Ride")

    all_resp = client.get("/api/v1/activities")
    assert all_resp.status_code == 200
    assert len(all_resp.json()) == 4

    running = client.get("/api/v1/activities?type=running")
    assert len(running.json()) == 3

    page2 = client.get("/api/v1/activities?page=2&limit=2")
    assert len(page2.json()) == 2


def test_activity_detail_includes_parsed_json(client, db):
    act = _add_activity(
        db,
        datetime(2026, 6, 1, 7, 0),
        splits_json=json.dumps([{"distance": 1000}]),
        hr_zones_json=json.dumps([{"zoneNumber": 1, "secsInZone": 60}]),
        feedback_tags=json.dumps(["sore_legs"]),
    )
    resp = client.get(f"/api/v1/activities/{act.id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["splits"] == [{"distance": 1000}]
    assert body["feedback_tags"] == ["sore_legs"]


def test_activity_detail_404(client):
    assert client.get("/api/v1/activities/999").status_code == 404


def test_activity_detail_links_scheduled_workout(client, db):
    act = _add_activity(db, datetime(2026, 6, 1, 7, 0))
    db.add(GarminCalendarEvent(
        garmin_id="w1",
        event_type="workout",
        date=date(2026, 6, 1),
        title="Tempo",
        raw_json=json.dumps({"workoutSteps": [{"stepType": "warmup", "endCondition": "lap.button"}]}),
    ))
    db.commit()
    body = client.get(f"/api/v1/activities/{act.id}").json()
    assert body["scheduled_workout"] is not None
    assert body["scheduled_workout"]["title"] == "Tempo"


# --- /daily-summaries ---

def test_daily_summaries_list_and_detail(client, db):
    s = DailySummary(date=date(2026, 6, 1), steps=10000, resting_hr=48)
    db.add(s)
    db.commit()
    db.refresh(s)

    listed = client.get("/api/v1/daily-summaries")
    assert listed.status_code == 200
    assert listed.json()[0]["steps"] == 10000

    detail = client.get(f"/api/v1/daily-summaries/{s.id}")
    assert detail.status_code == 200
    assert detail.json()["summary"]["resting_hr"] == 48


def test_daily_summary_detail_404(client):
    assert client.get("/api/v1/daily-summaries/123").status_code == 404


def test_daily_detail_includes_day_activities(client, db):
    s = DailySummary(date=date(2026, 6, 1))
    db.add(s)
    db.commit()
    db.refresh(s)
    _add_activity(db, datetime(2026, 6, 1, 8, 0))
    body = client.get(f"/api/v1/daily-summaries/{s.id}").json()
    assert len(body["activities"]) == 1


# --- /calendar ---

def test_calendar_month(client, db):
    _add_activity(db, datetime(2026, 6, 10, 7, 0))
    db.add(GarminCalendarEvent(
        garmin_id="r1", event_type="race", date=date(2026, 6, 20), title="10K",
    ))
    db.commit()
    resp = client.get("/api/v1/calendar?month=2026-06")
    assert resp.status_code == 200
    days = resp.json()
    assert len(days) == 30  # June has 30 days
    by_date = {d["date"]: d for d in days}
    assert len(by_date["2026-06-10"]["activities"]) == 1
    assert len(by_date["2026-06-20"]["events"]) == 1


def test_calendar_month_invalid_falls_back(client):
    # Bad month string -> current month, still 200.
    assert client.get("/api/v1/calendar?month=garbage").status_code == 200


def test_calendar_week(client, db):
    # 2026-06-17 is a Wednesday; week starts Monday 2026-06-15.
    _add_activity(db, datetime(2026, 6, 16, 7, 0))
    resp = client.get("/api/v1/calendar/week?date=2026-06-17")
    assert resp.status_code == 200
    days = resp.json()
    assert len(days) == 7
    assert days[0]["date"] == "2026-06-15"
    assert len(days[1]["activities"]) == 1


# --- /calendar-events/{id} ---

def test_calendar_event_detail(client, db):
    e = GarminCalendarEvent(
        garmin_id="w1", event_type="workout", date=date(2026, 6, 17), title="Easy",
        raw_json=json.dumps({"workoutSteps": [{"stepType": "interval", "endCondition": "lap.button"}]}),
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    resp = client.get(f"/api/v1/calendar-events/{e.id}")
    assert resp.status_code == 200
    assert resp.json()["workout_steps"]


def test_calendar_event_detail_404(client):
    assert client.get("/api/v1/calendar-events/77").status_code == 404


# --- /insights ---

def test_insights_list_and_filter(client, db):
    db.add(Insight(trigger_type="activity", content="a", summary="A", category="workout_analysis"))
    db.add(Insight(trigger_type="daily_summary", content="b", summary="B", category="recovery"))
    db.commit()
    assert len(client.get("/api/v1/insights").json()) == 2
    recovery = client.get("/api/v1/insights?category=recovery").json()
    assert len(recovery) == 1
    assert recovery[0]["category"] == "recovery"


# --- /settings ---

def test_settings_counts_and_statuses(client, db):
    _add_activity(db, datetime(2026, 6, 1, 7, 0))
    db.add(SyncStatus(key="last_activity_sync", value="2026-06-01T00:00:00"))
    db.commit()
    body = client.get("/api/v1/settings").json()
    assert body["counts"]["activities"] == 1
    assert "last_activity_sync" in body["sync_statuses"]


# --- /ai-config ---

def test_ai_config_defaults(client):
    body = client.get("/api/v1/ai-config").json()
    assert body["provider"] == "claude"
    assert "claude" in body["available_providers"]
    assert "gemini" in body["available_models"]


def test_ai_config_set_valid(client, db):
    resp = client.post("/api/v1/ai-config", json={"provider": "gemini", "model": "gemini-2.5-flash"})
    assert resp.status_code == 200
    assert resp.json()["provider"] == "gemini"
    # Persisted: a subsequent GET reflects it.
    assert client.get("/api/v1/ai-config").json()["model"] == "gemini-2.5-flash"


def test_ai_config_set_updates_existing(client):
    client.post("/api/v1/ai-config", json={"provider": "claude", "model": "claude-sonnet-4-6"})
    client.post("/api/v1/ai-config", json={"provider": "claude", "model": "claude-opus-4-7"})
    assert client.get("/api/v1/ai-config").json()["model"] == "claude-opus-4-7"


def test_ai_config_unknown_provider(client):
    resp = client.post("/api/v1/ai-config", json={"provider": "openai", "model": "gpt"})
    assert resp.status_code == 400


def test_ai_config_invalid_model(client):
    resp = client.post("/api/v1/ai-config", json={"provider": "claude", "model": "not-a-model"})
    assert resp.status_code == 400


# --- Actions: analyze / feedback / sync (threads mocked) ---

@pytest.fixture
def no_threads(monkeypatch):
    """Stub the background job targets the action handlers spawn.

    Handlers import these lazily (``from app.x import y``) then run them in a
    daemon thread, so replacing the module attribute makes the spawned thread a
    harmless no-op without touching the real ``threading`` module.
    """
    import app.ai_coach as ai_coach
    import app.main as main_module
    import app.garmin_sync as garmin_sync

    monkeypatch.setattr(ai_coach, "analyze_activity_force", MagicMock())
    monkeypatch.setattr(ai_coach, "analyze_activity_with_feedback", MagicMock())
    monkeypatch.setattr(main_module, "_scheduled_activity_sync", MagicMock())
    monkeypatch.setattr(main_module, "_scheduled_daily_sync", MagicMock())
    monkeypatch.setattr(garmin_sync, "sync_calendar", MagicMock())


def test_trigger_analysis_accepted(client, db, no_threads):
    act = _add_activity(db, datetime(2026, 6, 1, 7, 0))
    resp = client.post(f"/api/v1/activities/{act.id}/analyze")
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"


def test_trigger_analysis_404(client, no_threads):
    assert client.post("/api/v1/activities/999/analyze").status_code == 404


def test_submit_feedback(client, db, no_threads):
    act = _add_activity(db, datetime(2026, 6, 1, 7, 0))
    db.add(Insight(trigger_type="activity", trigger_id=act.id, content="old", summary="old"))
    db.commit()
    resp = client.post(
        f"/api/v1/activities/{act.id}/feedback",
        json={"rating": "bad", "tags": ["tough_pace"], "text": "legs heavy"},
    )
    assert resp.status_code == 200
    db.expire_all()
    refreshed = db.get(Activity, act.id)
    assert refreshed.feedback_rating == "bad"
    assert json.loads(refreshed.feedback_tags) == ["tough_pace"]
    assert refreshed.ai_analyzed is False
    # Existing insight was cleared.
    assert db.query(Insight).filter(Insight.trigger_id == act.id).count() == 0


def test_submit_feedback_404(client, no_threads):
    resp = client.post("/api/v1/activities/999/feedback", json={"rating": "good"})
    assert resp.status_code == 404


def test_feedback_rejects_invalid_rating(client, db, no_threads):
    act = _add_activity(db, datetime(2026, 6, 1, 7, 0))
    resp = client.post(f"/api/v1/activities/{act.id}/feedback", json={"rating": "meh"})
    assert resp.status_code == 422


@pytest.mark.parametrize("sync_type", ["activities", "daily", "calendar"])
def test_trigger_sync_accepted(client, no_threads, sync_type):
    resp = client.post(f"/api/v1/sync/{sync_type}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"


def test_trigger_sync_unknown(client, no_threads):
    assert client.post("/api/v1/sync/bogus").status_code == 400
