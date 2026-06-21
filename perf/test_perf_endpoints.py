"""Per-endpoint API performance benchmarks.

One benchmark per route in ``app/api.py`` (28 routes; the two export routes are
exercised in both CSV and JSON form). Each runs against a copy of the committed
``perf/perf.db`` (3 years of data — see ``perf/seed_perf_db.py``) with external
services stubbed (see ``perf/conftest.py``).

Read (GET) endpoints are defined first; mutating (POST/PUT) endpoints come last
so their writes to the shared session-scoped DB copy cannot perturb the read
benchmarks. Mutations are kept idempotent (or target a dedicated activity).

Run locally::

    pip install -r requirements-perf.txt
    pytest perf/ --benchmark-json=output.json
"""

from __future__ import annotations


def _ok(resp):
    assert resp.status_code == 200, f"{resp.request.url} -> {resp.status_code}: {resp.text[:200]}"
    return resp


# --------------------------------------------------------------------------- #
# Read endpoints (GET)
# --------------------------------------------------------------------------- #

def test_me(benchmark, client):
    _ok(benchmark(lambda: client.get("/api/v1/me")))


def test_today(benchmark, client, ids):
    _ok(benchmark(lambda: client.get("/api/v1/today", params={"date": ids["day"]})))


def test_training_load(benchmark, client, ids):
    _ok(benchmark(lambda: client.get(
        "/api/v1/training-load", params={"days": 365, "date": ids["day"]})))


def test_wellness_trends(benchmark, client):
    _ok(benchmark(lambda: client.get("/api/v1/wellness-trends", params={"days": 365})))


def test_activities_list(benchmark, client):
    _ok(benchmark(lambda: client.get(
        "/api/v1/activities", params={"limit": 100, "type": "running"})))


def test_activity_detail(benchmark, client, ids):
    _ok(benchmark(lambda: client.get(f"/api/v1/activities/{ids['activity_id']}")))


def test_daily_summaries_list(benchmark, client):
    _ok(benchmark(lambda: client.get("/api/v1/daily-summaries", params={"limit": 100})))


def test_daily_summary_detail(benchmark, client, ids):
    _ok(benchmark(lambda: client.get(f"/api/v1/daily-summaries/{ids['summary_id']}")))


def test_calendar_month(benchmark, client, ids):
    _ok(benchmark(lambda: client.get("/api/v1/calendar", params={"month": ids["month"]})))


def test_calendar_week(benchmark, client, ids):
    _ok(benchmark(lambda: client.get("/api/v1/calendar/week", params={"date": ids["day"]})))


def test_calendar_event_detail(benchmark, client, ids):
    _ok(benchmark(lambda: client.get(f"/api/v1/calendar-events/{ids['event_id']}")))


def test_insights(benchmark, client):
    _ok(benchmark(lambda: client.get("/api/v1/insights", params={"limit": 200})))


def test_settings(benchmark, client):
    _ok(benchmark(lambda: client.get("/api/v1/settings")))


def test_get_ai_config(benchmark, client):
    _ok(benchmark(lambda: client.get("/api/v1/ai-config")))


def test_get_athlete_profile(benchmark, client):
    _ok(benchmark(lambda: client.get("/api/v1/athlete-profile")))


def test_get_zones(benchmark, client):
    _ok(benchmark(lambda: client.get("/api/v1/zones")))


def test_threshold_estimate(benchmark, client):
    _ok(benchmark(lambda: client.get("/api/v1/threshold-estimate")))


def test_performance_curve(benchmark, client):
    _ok(benchmark(lambda: client.get("/api/v1/performance-curve", params={"days": 90})))


def test_get_training_plan(benchmark, client):
    _ok(benchmark(lambda: client.get("/api/v1/training-plan")))


def test_get_realignment_status(benchmark, client):
    _ok(benchmark(lambda: client.get("/api/v1/training-plan/realignment-status")))


def test_export_activities_csv(benchmark, client):
    _ok(benchmark(lambda: client.get("/api/v1/export/activities", params={"format": "csv"})))


def test_export_activities_json(benchmark, client):
    _ok(benchmark(lambda: client.get("/api/v1/export/activities", params={"format": "json"})))


def test_export_insights_csv(benchmark, client):
    _ok(benchmark(lambda: client.get("/api/v1/export/insights", params={"format": "csv"})))


def test_export_insights_json(benchmark, client):
    _ok(benchmark(lambda: client.get("/api/v1/export/insights", params={"format": "json"})))


# --------------------------------------------------------------------------- #
# Mutating endpoints (POST / PUT) — kept idempotent, defined last
# --------------------------------------------------------------------------- #

def test_set_ai_config(benchmark, client):
    # Re-asserts the seeded selection: idempotent.
    _ok(benchmark(lambda: client.post(
        "/api/v1/ai-config", json={"provider": "claude", "model": "claude-sonnet-4-6"})))


def test_set_athlete_profile(benchmark, client):
    # Writes back an unchanged value: idempotent.
    _ok(benchmark(lambda: client.post("/api/v1/athlete-profile", json={"resting_hr": 48})))


def test_update_zones(benchmark, client):
    _ok(benchmark(lambda: client.put("/api/v1/zones", json={"zones": [
        {"zone_type": "hr", "zone_number": 1, "zone_name": "Recovery"},
    ]})))


def test_apply_threshold_estimate(benchmark, client):
    _ok(benchmark(lambda: client.post(
        "/api/v1/threshold-estimate/apply", json={"fields": ["max_hr"]})))


def test_generate_training_plan(benchmark, client):
    # AI generation is stubbed; this measures persistence + serialization.
    _ok(benchmark(lambda: client.post("/api/v1/training-plan/generate")))


def test_trigger_realignment_dismiss(benchmark, client):
    # Dismiss is idempotent; measures the SyncStatus upsert path.
    _ok(benchmark(lambda: client.post(
        "/api/v1/training-plan/realign", json={"action": "dismiss"})))


def test_trigger_analysis(benchmark, client, ids):
    _ok(benchmark(lambda: client.post(f"/api/v1/activities/{ids['activity_id']}/analyze")))


def test_submit_feedback(benchmark, client, ids):
    _ok(benchmark(lambda: client.post(
        f"/api/v1/activities/{ids['feedback_activity_id']}/feedback",
        json={"rating": "good", "tags": ["felt-strong"], "text": "Smooth session."})))


def test_trigger_sync(benchmark, client):
    # Garmin's sync_calendar is stubbed; measures the dispatch path.
    _ok(benchmark(lambda: client.post("/api/v1/sync/calendar")))
