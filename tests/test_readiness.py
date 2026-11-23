"""Tests for the Training Readiness scoring logic (P1-1)."""

from datetime import date, datetime, timedelta

import pytest

from app import training_load
from app.models import Activity, DailyCheckin, DailySummary
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


def _load(atl: float = 0.0, *, ctl: float = 0.0, tsb: float = 0.0) -> TrainingLoadPoint:
    return TrainingLoadPoint(date=date.today(), tss=0, ctl=ctl, atl=atl, tsb=tsb)


def _checkin(*, soreness=None, energy=None, mood=None):
    return DailyCheckin(date=date.today(), soreness=soreness, energy=energy, mood=mood)


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
# Fatigue component (TSB-based: 75 + 2 * TSB, clamped 0..100)
# ---------------------------------------------------------------------------

def test_steady_state_fit_runner_tsb_zero_gives_75():
    # A fit runner at steady state (CTL=85, ATL=85, TSB=0) is balanced, not exhausted.
    result = training_load.compute_readiness(None, _load(85.0, ctl=85.0, tsb=0.0), [])
    assert result.fatigue_component == 75


def test_positive_tsb_10_gives_95():
    result = training_load.compute_readiness(None, _load(60.0, ctl=70.0, tsb=10.0), [])
    assert result.fatigue_component == 95


def test_negative_tsb_25_gives_25():
    result = training_load.compute_readiness(None, _load(85.0, ctl=60.0, tsb=-25.0), [])
    assert result.fatigue_component == 25


def test_deep_negative_tsb_clamps_to_zero():
    result = training_load.compute_readiness(None, _load(120.0, ctl=60.0, tsb=-60.0), [])
    assert result.fatigue_component == 0


def test_high_positive_tsb_clamps_to_100():
    result = training_load.compute_readiness(None, _load(20.0, ctl=60.0, tsb=40.0), [])
    assert result.fatigue_component == 100


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
# Subjective component (daily check-in)
# ---------------------------------------------------------------------------

def test_subjective_component_none_without_checkin():
    result = training_load.compute_readiness(_daily(sleep_score=80), None, [])
    assert result is not None
    assert result.subjective_component is None


def test_subjective_component_none_when_checkin_has_no_taps():
    result = training_load.compute_readiness(None, None, [], _checkin())
    assert result is None


def test_subjective_component_best_case_gives_100():
    result = training_load.compute_readiness(None, None, [], _checkin(soreness=5, energy=5, mood=5))
    assert result is not None
    assert result.subjective_component == 100


def test_subjective_component_worst_case_gives_0():
    result = training_load.compute_readiness(None, None, [], _checkin(soreness=1, energy=1, mood=1))
    assert result is not None
    assert result.subjective_component == 0


def test_subjective_component_averages_present_taps():
    # soreness=3 -> 50, energy=5 -> 100 -> avg 75
    result = training_load.compute_readiness(None, None, [], _checkin(soreness=3, energy=5))
    assert result is not None
    assert result.subjective_component == 75


def test_subjective_component_folds_into_composite():
    # Strong check-in should lift the composite versus a bad one, all else equal.
    good = training_load.compute_readiness(
        _daily(sleep_score=70), None, [], _checkin(soreness=5, energy=5, mood=5)
    )
    bad = training_load.compute_readiness(
        _daily(sleep_score=70), None, [], _checkin(soreness=1, energy=1, mood=1)
    )
    assert good is not None and bad is not None
    assert good.score > bad.score


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


@pytest.mark.parametrize("score,expected_verdict,expected_label", [
    (0, "rest", "Rest or go very easy"),
    (30, "rest", "Rest or go very easy"),
    (31, "ease", "Ease off today"),
    (50, "ease", "Ease off today"),
    (51, "train", "Train as planned"),
    (100, "train", "Train as planned"),
])
def test_readiness_verdict_bands(score, expected_verdict, expected_label):
    assert training_load._readiness_verdict(score) == (expected_verdict, expected_label)
    # Also verify through compute_readiness using sleep_score alone (1:1 with score).
    result = training_load.compute_readiness(_daily(sleep_score=score), None, [])
    assert result is not None
    assert result.score == score
    assert result.verdict == expected_verdict
    assert result.verdict_label == expected_label


def test_readiness_reasons_ordered_lowest_first_and_capped_at_two():
    # fatigue: TSB=-32.5 -> 75 - 65 = 10 (lowest)
    # sleep: sleep_score=20 (second lowest)
    # hrv: 36 / 45 = 0.8 -> 25 (third lowest, excluded by cap of 2)
    # recovery: stress_avg=60 -> 40 (fourth lowest, excluded)
    daily = _daily(sleep_score=20, stress_avg=60, hrv_avg=36, hrv_weekly_avg=45)
    result = training_load.compute_readiness(daily, _load(80.0, ctl=47.5, tsb=-32.5), [])
    assert result is not None
    assert result.reasons == [
        "Recent training load is high.",
        "Short or poor sleep last night.",
    ]


def test_readiness_reasons_empty_when_all_components_at_or_above_50():
    # sleep=50, recovery=50, fatigue=75 (TSB=0), rhr=75, hrv=50 (UNBALANCED), subjective=50
    daily = _daily(
        sleep_score=50,
        stress_avg=50,
        body_battery_high=50,
        resting_hr=55,
        hrv_avg=45,
        hrv_status="UNBALANCED",
    )
    result = training_load.compute_readiness(
        daily,
        _load(40.0, ctl=40.0, tsb=0.0),
        [55, 55],
        _checkin(soreness=3, energy=3, mood=3),
    )
    assert result is not None
    assert result.reasons == []


def test_readiness_reasons_cover_rhr_hrv_recovery_and_subjective():
    # Check each remaining component copy individually.
    r_rec = training_load.compute_readiness(_daily(stress_avg=80), None, [])
    assert r_rec.reasons == ["Body battery / stress show incomplete recovery."]

    r_rhr = training_load.compute_readiness(_daily(resting_hr=65), None, [55, 55])
    assert r_rhr.reasons == ["Resting heart rate is up on your recent average."]

    r_hrv = training_load.compute_readiness(_daily(hrv_avg=36, hrv_weekly_avg=45), None, [])
    assert r_hrv.reasons == ["Overnight HRV is below your baseline."]

    r_sub = training_load.compute_readiness(None, None, [], _checkin(soreness=1, energy=2, mood=2))
    assert r_sub.reasons == ["Your check-in says you're not feeling great."]


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
    assert "- Verdict: Train as planned" in text
    assert "- Why:" not in text


def test_format_readiness_context_includes_verdict_and_why_when_low():
    daily = _daily(sleep_score=40, stress_avg=60, body_battery_high=40)
    result = training_load.compute_readiness(daily, None, [])
    assert result is not None
    assert result.verdict == "ease"
    text = training_load.format_readiness_context(result)
    assert "- Verdict: Ease off today" in text
    assert "- Why:" in text
    assert "Short or poor sleep last night." in text
    assert "Body battery / stress show incomplete recovery." in text


def test_format_readiness_context_includes_components():
    daily = _daily(sleep_score=80, stress_avg=30, body_battery_high=70, resting_hr=55)
    result = training_load.compute_readiness(daily, _load(20.0), [57, 57])
    text = training_load.format_readiness_context(result)
    assert "Sleep" in text
    assert "Recovery" in text
    assert "Freshness" in text
    assert "Resting HR" in text


def test_format_readiness_context_includes_subjective_component():
    result = training_load.compute_readiness(None, None, [], _checkin(soreness=4, energy=4, mood=4))
    text = training_load.format_readiness_context(result)
    assert "check-in" in text.lower()


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
    assert r["verdict"] in ("train", "ease", "rest")
    assert r["verdict_label"] in ("Train as planned", "Ease off today", "Rest or go very easy")
    assert isinstance(r["reasons"], list)


def test_today_endpoint_folds_in_daily_checkin(client, db):
    db.add(DailyCheckin(date=date(2026, 6, 17), soreness=5, energy=5, mood=5))
    db.commit()
    resp = client.get("/api/v1/today?date=2026-06-17")
    assert resp.status_code == 200
    body = resp.json()
    assert body["readiness"] is not None
    assert body["readiness"]["subjective_component"] == 100
    assert body["daily_checkin"] is not None
    assert body["daily_checkin"]["soreness"] == 5


def test_today_endpoint_readiness_null_without_any_data(client, db):
    resp = client.get("/api/v1/today?date=2026-06-17")
    assert resp.status_code == 200
    body = resp.json()
    assert body["readiness"] is None
