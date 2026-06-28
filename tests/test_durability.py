"""Tests for app/durability.py and the compute_late_mean_max_curve helper."""

import json
from datetime import datetime, timedelta

import pytest

from app import durability as dur_mod
from app import streams as streams_mod
from app.models import Activity


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_details(samples):
    """Build a minimal Garmin detail payload from per-sample dicts."""
    descriptors = [
        {"metricsIndex": 0, "key": "sumElapsedDuration"},
        {"metricsIndex": 1, "key": "directPower"},
        {"metricsIndex": 2, "key": "directSpeed"},
        {"metricsIndex": 3, "key": "directHeartRate"},
        {"metricsIndex": 4, "key": "directElevation"},
        {"metricsIndex": 5, "key": "sumDistance"},
    ]
    rows = [
        {"metrics": [s.get("t"), s.get("power"), s.get("speed"), s.get("hr"), s.get("elev", 0), s.get("dist", 0)]}
        for s in samples
    ]
    return {"metricDescriptors": descriptors, "activityDetailMetrics": rows}


def _make_activity(db, *, garmin_id=1, duration_sec=3600, activity_type="running",
                   samples=None, mean_max=None, started_at=None):
    """Create and persist an Activity with synthetic stream + mean_max data."""
    if samples is None:
        samples = [{"t": t, "power": 250, "speed": 3.5, "hr": 150, "elev": 0, "dist": 3.5 * t}
                   for t in range(int(duration_sec) + 1)]
    if mean_max is None:
        # Compute it from the samples
        details = _make_details(samples)
        mean_max = streams_mod.compute_curves_from_details(details, activity_type)

    if started_at is None:
        started_at = datetime.utcnow() - timedelta(days=1)

    act = Activity(
        garmin_id=garmin_id,
        activity_type=activity_type,
        name="Test Run",
        duration_sec=duration_sec,
        started_at=started_at,
        laps_json=json.dumps(_make_details(samples)),
        mean_max_json=json.dumps(mean_max) if mean_max else None,
    )
    db.add(act)
    db.commit()
    return act


# ---------------------------------------------------------------------------
# compute_late_mean_max_curve (streams module)
# ---------------------------------------------------------------------------

def test_late_curve_excludes_early_samples():
    """Samples before fatigue_offset_sec must not inflate the late curve."""
    # Fresh: 0-1799 s at high speed; late: 1800+ s at slow speed
    fast_speed = 5.0
    slow_speed = 3.0
    samples_fast = [{"t": t, "speed": fast_speed, "power": 400, "hr": 160}
                    for t in range(1800)]
    samples_slow = [{"t": t + 1800, "speed": slow_speed, "power": 250, "hr": 165}
                    for t in range(600)]

    all_samples = samples_fast + samples_slow
    descriptors = [
        {"metricsIndex": 0, "key": "sumElapsedDuration"},
        {"metricsIndex": 1, "key": "directSpeed"},
        {"metricsIndex": 2, "key": "directPower"},
        {"metricsIndex": 3, "key": "directHeartRate"},
    ]
    rows = [{"metrics": [s["t"], s["speed"], s["power"], s["hr"]]} for s in all_samples]
    details = {"metricDescriptors": descriptors, "activityDetailMetrics": rows}

    parsed = streams_mod.parse_streams(details)
    late = streams_mod.compute_late_mean_max_curve(parsed, fatigue_offset_sec=1800, durations=[300])

    # Late 5-min best should be the slow speed, not the fast speed
    late_300 = late.get("speed", {}).get(300)
    assert late_300 is not None
    assert late_300 < fast_speed   # must not include the fast early segment
    assert abs(late_300 - slow_speed) < 0.1


def test_late_curve_empty_when_activity_too_short():
    """Activities shorter than the fatigue offset return empty curves."""
    samples = [{"t": t, "speed": 3.5, "power": 250, "hr": 150} for t in range(600)]
    descriptors = [
        {"metricsIndex": 0, "key": "sumElapsedDuration"},
        {"metricsIndex": 1, "key": "directSpeed"},
        {"metricsIndex": 2, "key": "directPower"},
        {"metricsIndex": 3, "key": "directHeartRate"},
    ]
    rows = [{"metrics": [s["t"], s["speed"], s["power"], s["hr"]]} for s in samples]
    details = {"metricDescriptors": descriptors, "activityDetailMetrics": rows}

    parsed = streams_mod.parse_streams(details)
    late = streams_mod.compute_late_mean_max_curve(parsed, fatigue_offset_sec=1800)
    assert late == {}


# ---------------------------------------------------------------------------
# durability.compute_durability_trend
# ---------------------------------------------------------------------------

def test_durability_empty_when_no_runs(db):
    trend = dur_mod.compute_durability_trend(db, lookback_days=90)
    assert trend.activities_analyzed == 0
    assert trend.trend_points == []
    assert trend.mean_durability is None


def test_durability_skips_short_activities(db):
    """Activities under 35 min should not produce a data point."""
    samples = [{"t": t, "power": 250, "speed": 3.5, "hr": 150, "elev": 0, "dist": 3.5 * t}
               for t in range(1200)]  # 20 min — below MIN_ACTIVITY_DURATION_SEC
    _make_activity(db, garmin_id=1, duration_sec=1200, samples=samples)

    trend = dur_mod.compute_durability_trend(db, lookback_days=90)
    assert trend.activities_analyzed == 0


def test_durability_produces_point_for_long_run(db):
    """A long run (>35 min) with stream data should produce one data point."""
    # Uniform 3.5 m/s for 3600 s → late curve should match fresh curve → ~100%
    samples = [{"t": t, "speed": 3.5, "hr": 150, "elev": 0, "dist": 3.5 * t}
               for t in range(3601)]
    _make_activity(db, garmin_id=1, duration_sec=3600, samples=samples)

    trend = dur_mod.compute_durability_trend(db, lookback_days=90)
    assert trend.activities_analyzed == 1
    assert len(trend.trend_points) == 1
    pt = trend.trend_points[0]
    # With uniform speed, late ≈ fresh so index should be close to 100%
    assert 85.0 <= pt.durability_index <= 105.0
    assert pt.metric in ("pace", "power")


def test_durability_index_lower_when_late_is_slower(db):
    """A run that slows down after 30 min should yield an index < 100%."""
    fast_speed = 4.0
    slow_speed = 2.5
    # 1800 s at fast, then 1200 s at slow (total 3000 s = 50 min)
    samples = (
        [{"t": t, "speed": fast_speed, "hr": 160, "elev": 0, "dist": fast_speed * t}
         for t in range(1800)]
        + [{"t": 1800 + t, "speed": slow_speed, "hr": 170, "elev": 0,
            "dist": fast_speed * 1800 + slow_speed * t}
           for t in range(1200)]
    )
    details = _make_details(samples)
    mean_max = streams_mod.compute_curves_from_details(details, "running")
    _make_activity(db, garmin_id=1, duration_sec=3000, samples=samples, mean_max=mean_max)

    trend = dur_mod.compute_durability_trend(db, lookback_days=90)
    assert trend.activities_analyzed == 1
    # Late (slow) vs fresh (fast at 300s window) → index well below 100%
    assert trend.trend_points[0].durability_index < 95.0


def test_durability_rating_thresholds(db):
    # Plant three long runs so mean ends up in different rating buckets
    # by mocking the computed trend directly
    trend = dur_mod.DurabilityTrend(
        trend_points=[
            dur_mod.DurabilityPoint("2026-01-01", 98.0, "A", 3600, "pace"),
        ],
        mean_durability=98.0,
        durability_rating=dur_mod._rating(98.0),
        activities_analyzed=1,
        lookback_days=90,
    )
    assert trend.durability_rating == "excellent"

    assert dur_mod._rating(93.0) == "good"
    assert dur_mod._rating(87.0) == "moderate"
    assert dur_mod._rating(80.0) == "needs improvement"


def test_durability_excludes_non_run_activities(db):
    """Cycling / swimming activities must not be included."""
    samples = [{"t": t, "speed": 5.0, "hr": 150, "elev": 0, "dist": 5.0 * t}
               for t in range(3601)]
    _make_activity(db, garmin_id=1, duration_sec=3600, samples=samples,
                   activity_type="cycling")

    trend = dur_mod.compute_durability_trend(db, lookback_days=90)
    assert trend.activities_analyzed == 0


def test_durability_trend_multiple_runs(db):
    """Multiple long runs accumulate into a trend and a mean is computed."""
    for i in range(3):
        samples = [{"t": t, "speed": 3.5, "hr": 150, "elev": 0, "dist": 3.5 * t}
                   for t in range(3601)]
        details = _make_details(samples)
        mm = streams_mod.compute_curves_from_details(details, "running")
        started = datetime.utcnow() - timedelta(days=10 + i)
        _make_activity(db, garmin_id=i + 1, duration_sec=3600, samples=samples,
                       mean_max=mm, started_at=started)

    trend = dur_mod.compute_durability_trend(db, lookback_days=90)
    assert trend.activities_analyzed == 3
    assert trend.mean_durability is not None
    assert trend.durability_rating is not None


# ---------------------------------------------------------------------------
# format_durability_context
# ---------------------------------------------------------------------------

def test_format_durability_context_empty_when_no_data():
    trend = dur_mod.DurabilityTrend()
    assert dur_mod.format_durability_context(trend) == ""


def test_format_durability_context_contains_key_fields():
    trend = dur_mod.DurabilityTrend(
        trend_points=[
            dur_mod.DurabilityPoint("2026-06-01", 94.5, "Long Run", 4200, "pace"),
        ],
        mean_durability=94.5,
        durability_rating="good",
        activities_analyzed=1,
        lookback_days=90,
    )
    ctx = dur_mod.format_durability_context(trend)
    assert "94.5%" in ctx
    assert "good" in ctx
    assert "2026-06-01" in ctx
    assert "Durability" in ctx
