import json
from datetime import date, datetime, timedelta
from unittest.mock import MagicMock

import pytest

from app import routes
from app.models import Activity, DailySummary, GarminCalendarEvent, Insight


# --- Template filters (pure) ---

@pytest.mark.parametrize("pace,expected", [
    (None, "-"),
    (0, "-"),
    (-1, "-"),
    (4.5, "4:30"),
    (5.0, "5:00"),
    (4.0833, "4:04"),
])
def test_pace_str(pace, expected):
    assert routes._pace_str(pace) == expected


@pytest.mark.parametrize("seconds,expected", [
    (None, "-"),
    (0, "-"),
    (90, "1:30"),
    (3661, "1:01:01"),
    (600, "10:00"),
])
def test_duration_str(seconds, expected):
    assert routes._duration_str(seconds) == expected


@pytest.mark.parametrize("meters,expected", [
    (None, "-"),
    (0, "-"),
    (5000, "5.00"),
    (12000, "12.0"),
    (10000, "10.0"),
])
def test_distance_str(meters, expected):
    assert routes._distance_str(meters) == expected


# --- HTML endpoints ---

def _add_activity(db, started_at, **kw):
    defaults = dict(
        garmin_id=int(started_at.timestamp()),
        activity_type="running",
        name="Run",
        started_at=started_at,
        duration_sec=3600,
        distance_m=10000,
    )
    defaults.update(kw)
    a = Activity(**defaults)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


def test_dashboard_renders(routes_client, db):
    _add_activity(db, datetime(2026, 6, 10, 7, 0))
    db.add(Insight(trigger_type="activity", content="x", summary="Nice run", category="workout_analysis"))
    db.commit()
    resp = routes_client.get("/")
    assert resp.status_code == 200
    assert "text/html" in resp.headers["content-type"]


def test_dashboard_with_next_race(routes_client, db):
    db.add(GarminCalendarEvent(
        garmin_id="r1", event_type="race",
        date=date.today() + timedelta(days=30), title="Marathon",
    ))
    db.commit()
    assert routes_client.get("/").status_code == 200


def test_activity_detail_page(routes_client, db):
    a = _add_activity(
        db, datetime(2026, 6, 10, 7, 0),
        splits_json=json.dumps([{"distance": 1000}]),
    )
    resp = routes_client.get(f"/activity/{a.id}")
    assert resp.status_code == 200


def test_activity_detail_page_404(routes_client):
    assert routes_client.get("/activity/999").status_code == 404


def test_daily_list_and_detail_pages(routes_client, db):
    s = DailySummary(date=date(2026, 6, 10), steps=10000)
    db.add(s)
    db.commit()
    db.refresh(s)
    assert routes_client.get("/daily").status_code == 200
    assert routes_client.get(f"/daily/{s.id}").status_code == 200


def test_daily_detail_404(routes_client):
    assert routes_client.get("/daily/999").status_code == 404


def test_insights_page_and_filter(routes_client, db):
    db.add(Insight(trigger_type="activity", content="x", summary="A", category="workout_analysis"))
    db.commit()
    assert routes_client.get("/insights").status_code == 200
    assert routes_client.get("/insights?category=workout_analysis").status_code == 200


def test_calendar_page(routes_client, db):
    _add_activity(db, datetime(2026, 6, 10, 7, 0))
    resp = routes_client.get("/calendar?month=2026-06")
    assert resp.status_code == 200


def test_calendar_page_invalid_month(routes_client):
    assert routes_client.get("/calendar?month=bad").status_code == 200


def test_settings_page(routes_client, db):
    _add_activity(db, datetime(2026, 6, 10, 7, 0))
    assert routes_client.get("/settings").status_code == 200


# --- POST actions (threads' targets stubbed) ---

@pytest.fixture
def stub_jobs(monkeypatch):
    import app.ai_coach as ai_coach
    import app.main as main_module
    import app.garmin_sync as garmin_sync

    monkeypatch.setattr(ai_coach, "analyze_activity_force", MagicMock())
    monkeypatch.setattr(main_module, "_scheduled_activity_sync", MagicMock())
    monkeypatch.setattr(main_module, "_scheduled_daily_sync", MagicMock())
    monkeypatch.setattr(garmin_sync, "sync_calendar", MagicMock())


def test_trigger_activity_analysis_redirects(routes_client, db, stub_jobs):
    a = _add_activity(db, datetime(2026, 6, 10, 7, 0))
    resp = routes_client.post(f"/activity/{a.id}/analyze", follow_redirects=False)
    assert resp.status_code == 303


def test_trigger_activity_analysis_404(routes_client, stub_jobs):
    assert routes_client.post("/activity/999/analyze", follow_redirects=False).status_code == 404


@pytest.mark.parametrize("path", ["/sync/activities", "/sync/daily", "/sync/calendar"])
def test_sync_post_redirects(routes_client, stub_jobs, path):
    resp = routes_client.post(path, follow_redirects=False)
    assert resp.status_code == 303
