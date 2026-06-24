"""Tests for app.workout_translator and the push-to-Garmin API endpoint."""
from __future__ import annotations

import json
from datetime import date
from unittest.mock import MagicMock, patch

import pytest

from app.models import AthleteProfile, TrainingPlanDay
from app.workout_translator import translate_plan_day, _pace_to_mps


# ---------------------------------------------------------------------------
# translate_plan_day unit tests
# ---------------------------------------------------------------------------

def _make_day(workout_type: str, dist_m: float | None = 8000.0, pace: float | None = 5.5) -> TrainingPlanDay:
    day = TrainingPlanDay()
    day.id = 1
    day.user_id = 1
    day.plan_id = 1
    day.day_date = date(2026, 7, 1)
    day.day_of_week = "Wednesday"
    day.week_number = 1
    day.workout_type = workout_type
    day.target_distance_m = dist_m
    day.target_pace_min_km = pace
    day.description = "Test workout description."
    day.notes = None
    day.week_theme = None
    return day


def test_rest_returns_none():
    day = _make_day("rest")
    assert translate_plan_day(day) is None


def test_cross_returns_none():
    day = _make_day("cross")
    assert translate_plan_day(day) is None


def test_easy_run_structure():
    day = _make_day("easy", dist_m=8000.0, pace=6.0)
    payload = translate_plan_day(day)

    assert payload is not None
    assert payload["workoutName"].startswith("Easy Run")
    assert payload["sportType"]["sportTypeKey"] == "running"
    assert len(payload["workoutSegments"]) == 1

    steps = payload["workoutSegments"][0]["workoutSteps"]
    # warmup + main + cooldown
    assert len(steps) == 3
    assert steps[0]["stepType"]["stepTypeKey"] == "warmup"
    assert steps[-1]["stepType"]["stepTypeKey"] == "cooldown"
    # Distances sum to roughly target
    total = sum(s["endConditionValue"] for s in steps if s["endCondition"]["conditionTypeKey"] == "distance")
    assert total == pytest.approx(8000.0, rel=0.05)


def test_tempo_run_has_pace_target():
    day = _make_day("tempo", dist_m=10000.0, pace=4.5)
    payload = translate_plan_day(day)

    assert payload is not None
    steps = payload["workoutSegments"][0]["workoutSteps"]
    # Middle step is the tempo block with a pace target
    tempo_steps = [s for s in steps if s["targetType"]["workoutTargetTypeKey"] == "pace.zone"]
    assert len(tempo_steps) >= 1
    tv1 = tempo_steps[0]["targetValueOne"]
    tv2 = tempo_steps[0]["targetValueTwo"]
    # Both values are m/s; faster end (tv1) > slower end (tv2)
    assert tv1 > tv2
    expected_mps = _pace_to_mps(4.5)
    assert tv1 == pytest.approx(expected_mps * 1.05, rel=0.02)
    assert tv2 == pytest.approx(expected_mps * 0.95, rel=0.02)


def test_interval_workout_has_repeat_block():
    day = _make_day("interval", dist_m=12000.0, pace=4.0)
    payload = translate_plan_day(day)

    assert payload is not None
    steps = payload["workoutSegments"][0]["workoutSteps"]
    repeat_steps = [s for s in steps if s["stepType"]["stepTypeKey"] == "repeat"]
    assert len(repeat_steps) == 1
    block = repeat_steps[0]
    assert block["numberOfIterations"] >= 3
    assert len(block["workoutSteps"]) == 2  # interval + recovery


def test_long_run_structure():
    day = _make_day("long", dist_m=25000.0, pace=6.5)
    payload = translate_plan_day(day)

    assert payload is not None
    assert "Long Run" in payload["workoutName"]
    steps = payload["workoutSegments"][0]["workoutSteps"]
    assert steps[0]["stepType"]["stepTypeKey"] == "warmup"
    assert steps[-1]["stepType"]["stepTypeKey"] == "cooldown"


def test_fallback_distance_when_none():
    day = _make_day("easy", dist_m=None, pace=5.5)
    payload = translate_plan_day(day)
    assert payload is not None
    assert payload["estimatedDistanceInMeters"] == pytest.approx(8000.0)


def test_fallback_pace_from_profile():
    day = _make_day("tempo", dist_m=10000.0, pace=None)
    profile = AthleteProfile()
    profile.threshold_pace_min_km = 4.0
    payload = translate_plan_day(day, profile=profile)
    assert payload is not None
    # A pace target should have been derived from profile threshold × 1.2
    steps = payload["workoutSegments"][0]["workoutSteps"]
    tempo_steps = [s for s in steps if s["targetType"]["workoutTargetTypeKey"] == "pace.zone"]
    assert len(tempo_steps) >= 1


def test_description_appended_to_name():
    day = _make_day("easy", dist_m=8000.0)
    day.description = "Steady comfortable pace. Focus on form."
    payload = translate_plan_day(day)
    assert payload is not None
    assert "Steady comfortable pace" in payload["workoutName"]


def test_estimated_duration_positive():
    day = _make_day("easy", dist_m=8000.0, pace=5.5)
    payload = translate_plan_day(day)
    assert payload is not None
    assert payload["estimatedDurationInSecs"] > 0


# ---------------------------------------------------------------------------
# API endpoint: push-to-garmin (integration-style with mocks)
# ---------------------------------------------------------------------------
# Tests rely on auth_enabled=False (dev/CI mode): get_current_user auto-creates
# a "dev@localhost" user with id=1. Plan days also default to user_id=1, so
# they belong to that same dev user.

_API = "/api/v1"


def _make_plan(db):
    from app.models import TrainingPlan, TrainingPlanDay
    from app.models import DEFAULT_USER_ID
    plan = TrainingPlan(user_id=DEFAULT_USER_ID, week_start=date(2026, 7, 1), plan_weeks=1)
    db.add(plan)
    db.flush()
    day = TrainingPlanDay(
        user_id=DEFAULT_USER_ID,
        plan_id=plan.id,
        day_date=date(2026, 7, 2),
        day_of_week="Thursday",
        week_number=1,
        workout_type="easy",
        target_distance_m=8000.0,
        target_pace_min_km=5.5,
        description="Easy run",
    )
    db.add(day)
    db.commit()
    db.refresh(day)
    return plan, day


def _make_rest_day(db):
    from app.models import TrainingPlan, TrainingPlanDay, DEFAULT_USER_ID
    plan = TrainingPlan(user_id=DEFAULT_USER_ID, week_start=date(2026, 7, 1), plan_weeks=1)
    db.add(plan)
    db.flush()
    rest_day = TrainingPlanDay(
        user_id=DEFAULT_USER_ID,
        plan_id=plan.id,
        day_date=date(2026, 7, 6),
        day_of_week="Sunday",
        week_number=1,
        workout_type="rest",
    )
    db.add(rest_day)
    db.commit()
    db.refresh(rest_day)
    return rest_day


def test_push_endpoint_no_garmin_connection(client, db):
    """Returns 422 when no Garmin account is connected.

    The dev user is auto-created by auth without a garmin_email. We patch the
    user lookup to confirm the guard is reached before any DB lookup.
    """
    from app.auth import get_current_user
    from app.models import User

    # Insert the dev user with no garmin credentials before the request
    dev = User(email="dev@localhost", garmin_email=None)
    db.add(dev)
    db.commit()

    resp = client.post(f"{_API}/training-plan/days/999/push-to-garmin")
    assert resp.status_code == 422
    assert "Garmin account not connected" in resp.json()["detail"]


def test_push_endpoint_rest_day_returns_422(client, db, patch_db_session):
    """Returns 422 for rest days."""
    from app.models import User

    # Pre-create the dev user with Garmin connected so the no-garmin guard passes
    dev = User(email="dev@localhost", garmin_email="g@garmin.com")
    db.add(dev)
    db.commit()

    rest_day = _make_rest_day(db)
    patch_db_session(__import__("app.garmin_sync", fromlist=["garmin_sync"]))

    resp = client.post(f"{_API}/training-plan/days/{rest_day.id}/push-to-garmin")
    assert resp.status_code == 422
    assert "not pushable" in resp.json()["detail"]


def test_push_endpoint_success(client, db, patch_db_session):
    """Happy path: mocked Garmin returns a workoutId."""
    from app.models import User

    dev = User(email="dev@localhost", garmin_email="g@garmin.com")
    db.add(dev)
    db.commit()

    _, day = _make_plan(db)

    patch_db_session(__import__("app.garmin_sync", fromlist=["garmin_sync"]))

    fake_garmin = MagicMock()
    fake_create_resp = MagicMock()
    fake_create_resp.json.return_value = {"workoutId": 99887766}
    fake_schedule_resp = MagicMock()
    fake_schedule_resp.json.return_value = {}

    def fake_request(method, host, path, **kwargs):
        if "schedule" not in path:
            return fake_create_resp
        return fake_schedule_resp

    fake_garmin.garth.request.side_effect = fake_request

    with patch("app.garmin_sync.get_garmin_client", return_value=fake_garmin):
        resp = client.post(f"{_API}/training-plan/days/{day.id}/push-to-garmin")

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["garmin_workout_id"] == 99887766
    assert body["scheduled_date"] == "2026-07-02"
    assert "Easy Run" in body["workout_name"]
