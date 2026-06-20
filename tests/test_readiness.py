"""Tests for the Training Readiness scoring logic (P1-1)."""

from datetime import date, datetime, timedelta

import pytest

from app import training_load
from app.models import Activity, DailySummary
from app.schemas import TrainingLoadPoint


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _daily(
    *,
    sleep_seconds=None,
    sleep_score=None,
    resting_hr=None,
    stress_avg=None,
    body_battery_high=None,
    hrv_avg=None,
    hrv_weekly_avg=None,
    hrv_status=None,
):
    """Build a DailySummary stub with only the fields needed for readiness."""
    return DailySummary(
        date=date.today(),
        sleep_seconds=sleep_seconds,
        sleep_score=sleep_score,
        resting_hr=resting_hr,
        stress_avg=stress_avg,
        body_battery_high=body_battery_high,
        hrv_avg=hrv_avg,
        hrv_weekly_avg=hrv_weekly_avg,
        hrv_status=hrv_status,
    )


def _load(atl: float) -> TrainingLoadPoint:
    return TrainingLoadPoint(date=date.today(), tss=0, ctl=0, atl=atl, tsb=0)


# ---------------------------------------------------------------------------
# None-safety
# ---------------------------------------------------------------------------

def test_returns_none_when_all_inputs_absent():
    assert training_load.compute_readiness(None, None, []) is None


def test_returns_score_with_only_load_data():
    result = training_load.compute_readiness(None, _load(20.0), [])
    assert result is not None
    assert 0 <= result.score <= 100
    assert result.fatigue_component is not None
    assert result.sleep_component is None
    assert result.recovery_component is None
    assert result.rhr_component is None


# ---------------------------------------------------------------------------
# Sleep component
# ---------------------------------------------------------------------------

def test_sleep_score_contributes_directly():
    result = training_load.compute_readiness(_daily(sleep_score=80), None, [])
    assert result is not None
    assert result.sleep_component == 80


def test_sleep_duration_8h_gives_100():
    result = training_load.compute_readiness(_daily(sleep_seconds=8 * 3600), None, [])
    assert result is not None
    assert result.sleep_component == 100


def test_sleep_duration_5h_gives_0():
    result = training_load.compute_readiness(_daily(sleep_seconds=5 * 3600), None, [])
    assert result is not None
    assert result.sleep_component == 0


def test_sleep_duration_6_5h_gives_50():
    result = training_load.compute_readiness(_daily(sleep_seconds=int(6.5 * 3600)), None, [])
    assert result is not None
    assert result.sleep_component == 50


def test_sleep_averages_score_and_duration():
    # sleep_score = 80, duration 6.5h → duration_score 50 → avg = 65
    result = training_load.compute_readiness(
        _daily(sleep_score=80, sleep_seconds=int(6.5 * 3600)), None, []
    )
    assert result is not None
    assert result.sleep_component == 65


# ---------------------------------------------------------------------------
# Recovery component
# ---------------------------------------------------------------------------

def test_low_stress_gives_high_recovery():
    result = training_load.compute_readiness(_daily(stress_avg=10), None, [])
    assert result is not None
    assert result.recovery_component == 90


def test_high_stress_gives_low_recovery():
    result = training_load.compute_readiness(_daily(stress_avg=90), None, [])
    assert result is not None
    assert result.recovery_component == 10


def test_body_battery_feeds_recovery():
    result = training_load.compute_readiness(_daily(body_battery_high=70), None, [])
    assert result is not None
    assert result.recovery_component == 70


def test_recovery_averages_stress_and_battery():
    # stress_avg=20 → 80 pts, body_battery_high=60 → avg 70
    result = training_load.compute_readiness(_daily(stress_avg=20, body_battery_high=60), None, [])
    assert result is not None
    assert result.recovery_component == 70


# ---------------------------------------------------------------------------
# Fatigue component (ATL-based)
# ---------------------------------------------------------------------------

def test_zero_atl_gives_full_freshness():
    result = training_load.compute_readiness(None, _load(0.0), [])
    assert result.fatigue_component == 100


def test_atl_50_gives_50_freshness():
    result = training_load.compute_readiness(None, _load(50.0), [])
    assert result.fatigue_component == 50


def test_atl_above_100_clamps_to_zero():
    result = training_load.compute_readiness(None, _load(120.0), [])
    assert result.fatigue_component == 0


# ---------------------------------------------------------------------------
# RHR trend component
# ---------------------------------------------------------------------------

def test_rhr_matches_average_gives_75():
    result = training_load.compute_readiness(_daily(resting_hr=55), None, [55, 55, 55])
    assert result is not None
    assert result.rhr_component == 75


def test_rhr_below_average_gives_higher_score():
    # today 50 vs avg 55 → delta = -5 → score = 75 + 37.5 = 112.5, clamped to 100
    result = training_load.compute_readiness(_daily(resting_hr=50), None, [55, 55, 55])
    assert result is not None
    assert result.rhr_component == 100


def test_rhr_above_average_gives_lower_score():
    # today 65 vs avg 55 → delta = +10 → score = 75 - 75 = 0
    result = training_load.compute_readiness(_daily(resting_hr=65), None, [55, 55, 55])
    assert result is not None
    assert result.rhr_component == 0


def test_rhr_component_absent_without_recent_history():
    # With only resting_hr (no sleep/stress/battery/load), no component can
    # be scored, so the whole result is None.
    result = training_load.compute_readiness(_daily(resting_hr=55), None, [])
    assert result is None


def test_rhr_component_absent_when_combined_with_other_data():
    # When other components are present, rhr_component is None (no history)
    # but a score is still computed from the other components.
    result = training_load.compute_readiness(
        _daily(resting_hr=55, sleep_score=80), None, []
    )
    assert result is not None
    assert result.rhr_component is None


# ---------------------------------------------------------------------------
# HRV component
# ---------------------------------------------------------------------------

def test_hrv_at_baseline_gives_75():
    # hrv_avg == weekly baseline → ratio 1.0 → 75
    result = training_load.compute_readiness(
        _daily(hrv_avg=45, hrv_weekly_avg=45), None, []
    )
    assert result is not None
    assert result.hrv_component == 75


def test_hrv_above_baseline_scores_higher():
    # 54 vs 45 → ratio 1.2 → 75 + 50 = 125, clamped to 100
    result = training_load.compute_readiness(
        _daily(hrv_avg=54, hrv_weekly_avg=45), None, []
    )
    assert result is not None
    assert result.hrv_component == 100


def test_hrv_below_baseline_scores_lower():
    # 36 vs 45 → ratio 0.8 → 75 - 50 = 25
    result = training_load.compute_readiness(
        _daily(hrv_avg=36, hrv_weekly_avg=45), None, []
    )
    assert result is not None
    assert result.hrv_component == 25


def test_hrv_status_fallback_when_no_baseline():
    result = training_load.compute_readiness(
        _daily(hrv_avg=45, hrv_status="UNBALANCED"), None, []
    )
    assert result is not None
    assert result.hrv_component == 50


def test_hrv_component_none_without_hrv_avg():
    result = training_load.compute_readiness(
        _daily(hrv_status="BALANCED", sleep_score=80), None, []
    )
    assert result is not None
    assert result.hrv_component is None


def test_hrv_component_folds_into_composite():
    # Strong HRV should lift the composite versus suppressed HRV, all else equal.
    high = training_load.compute_readiness(
        _daily(sleep_score=70, hrv_avg=54, hrv_weekly_avg=45), None, []
    )
    low = training_load.compute_readiness(
        _daily(sleep_score=70, hrv_avg=36, hrv_weekly_avg=45), None, []
    )
    assert high is not None and low is not None
    assert high.score > low.score


# ---------------------------------------------------------------------------
# Labels
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("score,expected_label", [
    (0, "Low"),
    (30, "Low"),
    (31, "Fair"),
    (50, "Fair"),
    (51, "Good"),
    (70, "Good"),
    (71, "Very Good"),
    (85, "Very Good"),
    (86, "Excellent"),
    (100, "Excellent"),
])
def test_readiness_labels(score, expected_label):
    assert training_load._readiness_label(score) == expected_label


# ---------------------------------------------------------------------------
# Composite score bounds
# ---------------------------------------------------------------------------

def test_composite_score_in_range():
    daily = _daily(
        sleep_score=75,
        sleep_seconds=7 * 3600,
        stress_avg=35,
        body_battery_high=80,
        resting_hr=54,
    )
    result = training_load.compute_readiness(daily, _load(25.0), [56, 57, 55])
    assert result is not None
    assert 0 <= result.score <= 100


def test_all_inputs_excellent_gives_high_score():
    daily = _daily(
        sleep_score=95,
        sleep_seconds=8 * 3600,
        stress_avg=5,
        body_battery_high=95,
        resting_hr=48,
    )
    result = training_load.compute_readiness(daily, _load(5.0), [55, 55, 55])
    assert result is not None
    assert result.score >= 71  # at least "Very Good"


def test_all_inputs_poor_gives_low_score():
    daily = _daily(
        sleep_score=20,
        sleep_seconds=4 * 3600,
        stress_avg=90,
        body_battery_high=15,
        resting_hr=72,
    )
    result = training_load.compute_readiness(daily, _load(90.0), [55, 55, 55])
    assert result is not None
    assert result.score <= 40


# ---------------------------------------------------------------------------
# format_readiness_context
# ---------------------------------------------------------------------------

def test_format_readiness_context_none_returns_empty():
    assert training_load.format_readiness_context(None) == ""


def test_format_readiness_context_includes_score_and_label():
    daily = _daily(sleep_score=80, stress_avg=30, body_battery_high=70)
    result = training_load.compute_readiness(daily, _load(20.0), [])
    text = training_load.format_readiness_context(result)
    assert "## Training Readiness" in text
    assert "/100" in text
    assert result.label in text


def test_format_readiness_context_includes_components():
    daily = _daily(sleep_score=80, stress_avg=30, body_battery_high=70, resting_hr=55)
    result = training_load.compute_readiness(daily, _load(20.0), [57, 57])
    text = training_load.format_readiness_context(result)
    assert "Sleep" in text
    assert "Recovery" in text
    assert "Freshness" in text
    assert "Resting HR" in text


# ---------------------------------------------------------------------------
# API endpoint — /today includes readiness
# ---------------------------------------------------------------------------

def test_today_endpoint_includes_readiness_when_data_available(client, db):
    db.add(DailySummary(
        date=date(2026, 6, 17),
        sleep_score=78.0,
        sleep_seconds=7 * 3600,
        stress_avg=30,
        body_battery_high=75,
        resting_hr=54,
    ))
    db.add(Activity(
        garmin_id=99001,
        activity_type="running",
        name="Run",
        started_at=datetime(2026, 6, 10, 7, 0),
        duration_sec=3600,
        training_stress_score=50.0,
    ))
    db.commit()
    resp = client.get("/api/v1/today?date=2026-06-17")
    assert resp.status_code == 200
    body = resp.json()
    assert body["readiness"] is not None
    r = body["readiness"]
    assert 0 <= r["score"] <= 100
    assert r["label"] in ("Low", "Fair", "Good", "Very Good", "Excellent")


def test_today_endpoint_readiness_null_without_any_data(client, db):
    resp = client.get("/api/v1/today?date=2026-06-17")
    assert resp.status_code == 200
    body = resp.json()
    assert body["readiness"] is None
