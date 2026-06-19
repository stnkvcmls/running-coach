from datetime import datetime, timedelta

import pytest

from app import ai_coach, threshold
from app.models import Activity, AthleteProfile


def _add(db, *, days_ago=1, duration_sec, avg_power=None, avg_speed=None,
         distance_m=None, avg_hr=None, max_hr=None):
    started = datetime.utcnow() - timedelta(days=days_ago)
    act = Activity(
        garmin_id=int(started.timestamp() * 1000) + int(duration_sec),
        activity_type="running",
        name="Run",
        started_at=started,
        duration_sec=duration_sec,
        avg_power=avg_power,
        avg_speed=avg_speed,
        distance_m=distance_m,
        avg_hr=avg_hr,
        max_hr=max_hr,
    )
    db.add(act)
    db.commit()
    return act


# --- pure math helpers ---

def test_linear_fit_basic():
    # y = 2x + 1
    slope, intercept = threshold._linear_fit([(0, 1), (1, 3), (2, 5)])
    assert round(slope, 6) == 2.0
    assert round(intercept, 6) == 1.0


def test_linear_fit_needs_two_points():
    assert threshold._linear_fit([(1, 1)]) is None


def test_linear_fit_no_x_spread():
    assert threshold._linear_fit([(1, 2), (1, 5)]) is None


def test_build_frontier_keeps_best_per_bin():
    # Two efforts in the 5-10min bin; only the higher-power one survives.
    samples = [(400, 300), (450, 320), (1500, 250)]
    frontier = threshold._build_frontier(samples)
    # bin0 best = (450, 320), bin2 best = (1500, 250)
    assert (450, 320) in frontier
    assert (1500, 250) in frontier
    assert (400, 300) not in frontier
    assert len(frontier) == 2


def test_fit_hyperbolic_recovers_cp_and_wprime():
    # Construct points exactly on P = 250 + 15000/t
    cp, w = 250.0, 15000.0
    frontier = [(t, cp + w / t) for t in (400, 800, 1600, 3200)]
    asymptote, work, conf = threshold._fit_hyperbolic(frontier)
    assert round(asymptote) == 250
    assert round(work) == 15000
    assert conf == "high"


def test_fit_hyperbolic_rejects_negative_asymptote():
    # Rising output with duration → negative work / bad asymptote.
    frontier = [(400, 100), (800, 200), (1600, 400)]
    assert threshold._fit_hyperbolic(frontier) is None


def test_fit_hyperbolic_needs_two_points():
    assert threshold._fit_hyperbolic([(400, 300)]) is None


# --- end-to-end estimation ---

def test_estimate_critical_power(db):
    cp, w = 250.0, 15000.0
    for t, day in [(400, 2), (900, 5), (1700, 8), (3300, 12)]:
        _add(db, days_ago=day, duration_sec=t, avg_power=cp + w / t)
    est = threshold.estimate_thresholds(db)
    assert est.critical_power.value is not None
    assert abs(est.critical_power.value - 250) < 5
    assert est.critical_power.method == "critical_power"
    assert est.w_prime is not None


def test_estimate_threshold_pace_from_speed(db):
    cv, dprime = 3.5, 200.0  # m/s, m
    for t, day in [(400, 2), (900, 5), (1700, 8), (3300, 12)]:
        _add(db, days_ago=day, duration_sec=t, avg_speed=cv + dprime / t)
    est = threshold.estimate_thresholds(db)
    pace = est.threshold_pace_min_km.value
    assert pace is not None
    # CV 3.5 m/s → 1000/3.5/60 ≈ 4.76 min/km
    assert abs(pace - (1000.0 / 3.5 / 60.0)) < 0.2


def test_estimate_threshold_pace_falls_back_to_distance(db):
    # No avg_speed, but distance + duration give speed.
    for t, day, dist in [(400, 2, 1500), (900, 5, 3200), (1700, 8, 5800)]:
        _add(db, days_ago=day, duration_sec=t, distance_m=dist)
    est = threshold.estimate_thresholds(db)
    assert est.threshold_pace_min_km.value is not None


def test_estimate_max_hr(db):
    _add(db, days_ago=2, duration_sec=1800, max_hr=180)
    _add(db, days_ago=4, duration_sec=1800, max_hr=189)
    est = threshold.estimate_thresholds(db)
    assert est.max_hr.value == 189


def test_estimate_threshold_hr_sustained_effort(db):
    # Max HR 190; hard sustained efforts (>=20min, avg >= 0.85*190 = 161.5)
    _add(db, days_ago=2, duration_sec=1800, max_hr=190, avg_hr=170)
    _add(db, days_ago=5, duration_sec=2400, max_hr=188, avg_hr=172)
    _add(db, days_ago=8, duration_sec=2000, max_hr=185, avg_hr=168)
    est = threshold.estimate_thresholds(db)
    assert est.threshold_hr.method == "sustained_effort"
    assert 165 <= est.threshold_hr.value <= 175


def test_estimate_threshold_hr_pct_fallback(db):
    # Max HR present but no qualifying hard sustained effort (all easy/short).
    _add(db, days_ago=2, duration_sec=600, max_hr=185, avg_hr=120)
    est = threshold.estimate_thresholds(db)
    assert est.threshold_hr.method == "pct_max_hr"
    assert est.threshold_hr.value == round(185 * threshold._LTHR_MAX_HR_FRACTION, 0)


def test_estimate_empty_db(db):
    est = threshold.estimate_thresholds(db)
    assert est.critical_power.value is None
    assert est.threshold_pace_min_km.value is None
    assert est.threshold_hr.value is None
    assert est.max_hr.value is None
    assert est.activities_analyzed == 0


def test_old_activities_excluded(db):
    # Outside the lookback window → ignored.
    _add(db, days_ago=400, duration_sec=1800, avg_power=300, max_hr=180)
    est = threshold.estimate_thresholds(db, lookback_days=90)
    assert est.activities_analyzed == 0
    assert est.max_hr.value is None


# --- apply to profile ---

def test_apply_estimate_to_profile_all_fields(db):
    cp, w = 250.0, 15000.0
    for t, day in [(400, 2), (900, 5), (1700, 8), (3300, 12)]:
        _add(db, days_ago=day, duration_sec=t, avg_power=cp + w / t,
             avg_speed=3.5 + 200 / t, max_hr=185, avg_hr=170)
    est = threshold.estimate_thresholds(db)
    profile = AthleteProfile()
    applied = threshold.apply_estimate_to_profile(profile, est)
    assert "threshold_power" in applied
    assert "max_hr" in applied
    assert profile.threshold_power == int(est.critical_power.value)
    assert isinstance(profile.threshold_power, int)


def test_apply_estimate_respects_field_filter(db):
    _add(db, days_ago=2, duration_sec=1800, max_hr=185)
    est = threshold.estimate_thresholds(db)
    profile = AthleteProfile()
    applied = threshold.apply_estimate_to_profile(profile, est, fields=["max_hr"])
    assert applied == ["max_hr"]
    assert profile.max_hr == 185
    assert profile.threshold_hr is None  # not requested


def test_apply_estimate_skips_none_values(db):
    est = threshold.estimate_thresholds(db)  # empty db → all None
    profile = AthleteProfile()
    applied = threshold.apply_estimate_to_profile(profile, est)
    assert applied == []


# --- AI context formatting ---

def test_format_context_shows_missing_fields():
    est = threshold.ThresholdEstimate(
        critical_power=threshold.FieldEstimate(250.0, "critical_power", "high", 4),
        w_prime=15000.0,
        threshold_pace_min_km=threshold.FieldEstimate(4.5, "critical_velocity", "medium", 3),
        threshold_hr=threshold.FieldEstimate(170.0, "sustained_effort", "high", 3),
        max_hr=threshold.FieldEstimate(189.0, "observed_max", "high", 6),
        lookback_days=90,
        activities_analyzed=10,
    )
    ctx = threshold.format_threshold_estimate_context(est, None)
    assert "Estimated Thresholds" in ctx
    assert "Critical Power" in ctx
    assert "4:30/km" in ctx
    assert "170 bpm" in ctx


def test_format_context_hides_fields_already_in_profile():
    est = threshold.ThresholdEstimate(
        critical_power=threshold.FieldEstimate(250.0, "critical_power", "high", 4),
        w_prime=None,
        threshold_pace_min_km=threshold.FieldEstimate(4.5, "critical_velocity", "high", 4),
        threshold_hr=threshold.FieldEstimate(170.0, "sustained_effort", "high", 3),
        max_hr=threshold.FieldEstimate(189.0, "observed_max", "high", 6),
        lookback_days=90,
        activities_analyzed=10,
    )
    profile = AthleteProfile(
        threshold_power=260, threshold_pace_min_km=4.4, threshold_hr=168, max_hr=190
    )
    ctx = threshold.format_threshold_estimate_context(est, profile)
    assert ctx == ""  # everything already set


def test_format_context_empty_when_no_estimates():
    est = threshold.ThresholdEstimate(
        critical_power=threshold._empty(),
        w_prime=None,
        threshold_pace_min_km=threshold._empty(),
        threshold_hr=threshold._empty(),
        max_hr=threshold._empty(),
        lookback_days=90,
        activities_analyzed=0,
    )
    assert threshold.format_threshold_estimate_context(est, None) == ""


def test_format_pace_rounds_seconds_to_minute():
    # 4.999 min/km should not render as 4:60.
    assert threshold._format_pace(4.999) == "5:00/km"


# --- API endpoints ---

def test_threshold_estimate_endpoint(client, session_factory):
    db = session_factory()
    cp, w = 250.0, 15000.0
    for t, day in [(400, 2), (900, 5), (1700, 8), (3300, 12)]:
        started = datetime.utcnow() - timedelta(days=day)
        db.add(Activity(
            garmin_id=int(started.timestamp() * 1000) + int(t),
            activity_type="running", name="Run", started_at=started,
            duration_sec=t, avg_power=cp + w / t, max_hr=185,
        ))
    db.commit()
    db.close()

    resp = client.get("/api/v1/threshold-estimate")
    assert resp.status_code == 200
    body = resp.json()
    assert body["critical_power"]["value"] is not None
    assert body["activities_analyzed"] == 4


def test_threshold_apply_endpoint_creates_profile(client, session_factory):
    db = session_factory()
    cp, w = 250.0, 15000.0
    for t, day in [(400, 2), (900, 5), (1700, 8), (3300, 12)]:
        started = datetime.utcnow() - timedelta(days=day)
        db.add(Activity(
            garmin_id=int(started.timestamp() * 1000) + int(t),
            activity_type="running", name="Run", started_at=started,
            duration_sec=t, avg_power=cp + w / t, max_hr=185,
        ))
    db.commit()
    db.close()

    resp = client.post("/api/v1/threshold-estimate/apply", json={})
    assert resp.status_code == 200
    body = resp.json()
    assert body["threshold_power"] is not None
    assert body["max_hr"] == 185


def test_threshold_apply_endpoint_no_data_returns_400(client):
    resp = client.post("/api/v1/threshold-estimate/apply", json={})
    assert resp.status_code == 400


def test_build_context_includes_estimate(db):
    # No profile thresholds set → estimate section should appear in AI context.
    cp, w = 250.0, 15000.0
    for t, day in [(400, 2), (900, 5), (1700, 8), (3300, 12)]:
        _add(db, days_ago=day, duration_sec=t, avg_power=cp + w / t, max_hr=185)
    ctx = ai_coach._build_context(db, "activity", "test run")
    assert "Estimated Thresholds" in ctx
