from datetime import date, datetime, timedelta

from app import ai_coach, training_load
from app.models import Activity, AthleteProfile


def _add_activity(db, started_at, *, duration_sec=3600, tss=None,
                  avg_pace_min_km=None, avg_hr=None, distance_m=10000):
    db.add(Activity(
        garmin_id=int(started_at.timestamp()),
        activity_type="running",
        name="Run",
        started_at=started_at,
        duration_sec=duration_sec,
        distance_m=distance_m,
        avg_pace_min_km=avg_pace_min_km,
        avg_hr=avg_hr,
        training_stress_score=tss,
    ))
    db.commit()


# --- TSS estimation ---

def test_estimate_tss_prefers_stored_power_score():
    act = Activity(duration_sec=3600, training_stress_score=88.0, avg_pace_min_km=4.0)
    tss, source = training_load.estimate_tss(act, None)
    assert source == "power"
    assert tss == 88.0


def test_estimate_tss_pace_based():
    # Running exactly at threshold pace for one hour ≈ 100 TSS.
    profile = AthleteProfile(threshold_pace_min_km=5.0)
    act = Activity(duration_sec=3600, avg_pace_min_km=5.0)
    tss, source = training_load.estimate_tss(act, profile)
    assert source == "pace"
    assert round(tss) == 100


def test_estimate_tss_hr_based_when_no_pace_threshold():
    profile = AthleteProfile(threshold_hr=160)
    act = Activity(duration_sec=3600, avg_hr=160)
    tss, source = training_load.estimate_tss(act, profile)
    assert source == "hr"
    assert round(tss) == 100


def test_estimate_tss_duration_floor_without_references():
    act = Activity(duration_sec=3600)
    tss, source = training_load.estimate_tss(act, None)
    assert source == "duration"
    assert tss > 0


def test_estimate_tss_zero_without_duration():
    act = Activity(duration_sec=0)
    tss, source = training_load.estimate_tss(act, None)
    assert source == "none"
    assert tss == 0.0


# --- Series / snapshot ---

def test_empty_series_without_activities(db):
    assert training_load.compute_load_series(db, date(2026, 6, 17), days=30) == []
    assert training_load.current_load(db) is None


def test_single_activity_seeds_fitness_and_fatigue(db):
    day = datetime(2026, 6, 10, 7, 0)
    _add_activity(db, day, tss=100.0)
    point = training_load.current_load(db, as_of=date(2026, 6, 10))
    assert point is not None
    # One day of TSS=100: ATL rises faster than CTL, so TSB is negative.
    assert point.atl > point.ctl
    assert point.tsb < 0
    assert point.tss == 100.0


def test_series_length_capped_by_days(db):
    base = datetime(2026, 5, 1, 7, 0)
    for i in range(40):
        _add_activity(db, base + timedelta(days=i), tss=50.0)
    points = training_load.compute_load_series(db, base.date() + timedelta(days=39), days=10)
    assert len(points) == 10
    # Fitness should be building across a steady block.
    assert points[-1].ctl > points[0].ctl


def test_rest_day_lowers_fatigue_toward_fitness(db):
    base = datetime(2026, 5, 1, 7, 0)
    for i in range(20):
        _add_activity(db, base + timedelta(days=i), tss=80.0)
    loaded = training_load.current_load(db, as_of=base.date() + timedelta(days=19))
    # Two weeks later with no training, fatigue decays and form goes positive.
    rested = training_load.current_load(db, as_of=base.date() + timedelta(days=33))
    assert rested.atl < loaded.atl
    assert rested.tsb > loaded.tsb


# --- ACWR + ramp rate ---

def test_acwr_none_when_ctl_too_low(db):
    """ACWR should be None when CTL hasn't built up enough to be meaningful."""
    _add_activity(db, datetime(2026, 6, 1, 7, 0), tss=50.0)
    point = training_load.current_load(db, as_of=date(2026, 6, 1))
    assert point is not None
    # CTL after one day from zero is tiny — ACWR should be None or computed only when CTL > 1.
    if point.ctl <= 1.0:
        assert point.acwr is None
    else:
        assert point.acwr is not None


def test_acwr_computed_after_buildup(db):
    """ACWR should be ATL/CTL once CTL is established."""
    base = datetime(2026, 5, 1, 7, 0)
    for i in range(30):
        _add_activity(db, base + timedelta(days=i), tss=80.0)
    point = training_load.current_load(db, as_of=base.date() + timedelta(days=29))
    assert point is not None
    assert point.ctl > 1.0
    assert point.acwr is not None
    # With steady training, ACWR ≈ 1.0 (ATL ≈ CTL in steady state).
    assert 0.5 < point.acwr < 2.0


def test_ramp_rate_7d_after_7_days(db):
    """ramp_rate_7d reflects CTL change over the prior 7 days."""
    base = datetime(2026, 5, 1, 7, 0)
    for i in range(14):
        _add_activity(db, base + timedelta(days=i), tss=80.0)
    series = training_load.compute_load_series(db, end_date=base.date() + timedelta(days=13), days=14)
    # Last point must have ramp_rate_7d; first 7 points won't.
    last = series[-1]
    assert last.ramp_rate_7d is not None
    # CTL should be building — ramp positive.
    assert last.ramp_rate_7d > 0


def test_ramp_rate_7d_none_for_early_points(db):
    """ramp_rate_7d must be None until 7 days of history exist."""
    base = datetime(2026, 5, 1, 7, 0)
    for i in range(5):
        _add_activity(db, base + timedelta(days=i), tss=80.0)
    series = training_load.compute_load_series(db, end_date=base.date() + timedelta(days=4), days=5)
    for p in series:
        assert p.ramp_rate_7d is None


def test_injury_risk_high_on_very_high_acwr():
    assert training_load._injury_risk(acwr=1.6, ramp_7d=None) == "high"


def test_injury_risk_moderate_on_elevated_acwr():
    assert training_load._injury_risk(acwr=1.4, ramp_7d=None) == "moderate"


def test_injury_risk_low_in_sweet_spot():
    assert training_load._injury_risk(acwr=1.0, ramp_7d=5.0) == "low"


def test_injury_risk_high_on_steep_ramp():
    assert training_load._injury_risk(acwr=None, ramp_7d=12.0) == "high"


def test_injury_risk_moderate_on_steep_ramp():
    assert training_load._injury_risk(acwr=None, ramp_7d=8.0) == "moderate"


# --- AI context ---

def test_format_training_load_context_handles_none():
    assert training_load.format_training_load_context(None) == ""


def test_build_context_includes_training_load(db):
    _add_activity(db, datetime(2026, 6, 10, 7, 0), tss=100.0)
    context = ai_coach._build_context(db, "activity", "Test trigger", reference_date=date(2026, 6, 10))
    assert "## Training Load" in context
    assert "Fitness (CTL" in context
    assert "Form (TSB" in context


def test_format_training_load_context_includes_acwr_when_present():
    from app.schemas import TrainingLoadPoint
    point = TrainingLoadPoint(
        date=date(2026, 6, 10),
        tss=80.0, ctl=40.0, atl=50.0, tsb=-10.0,
        acwr=1.25, ramp_rate_7d=3.5, ramp_rate_28d=10.0,
        injury_risk="low",
    )
    ctx = training_load.format_training_load_context(point)
    assert "ACWR" in ctx
    assert "1.25" in ctx
    assert "sweet spot" in ctx
    assert "Ramp rate (7d" in ctx
    assert "Ramp rate (28d" in ctx
    assert "Injury risk: low" in ctx


def test_training_load_endpoint_includes_acwr_fields(client, db):
    base = datetime(2026, 5, 1, 7, 0)
    for i in range(35):
        _add_activity(db, base + timedelta(days=i), tss=70.0)
    resp = client.get("/api/v1/training-load?days=30")
    assert resp.status_code == 200
    body = resp.json()
    current = body["current"]
    assert "acwr" in current
    assert "ramp_rate_7d" in current
    assert "injury_risk" in current


def test_build_context_omits_training_load_without_activities(db):
    context = ai_coach._build_context(db, "activity", "Test trigger", reference_date=date(2026, 6, 10))
    assert "## Training Load" not in context


# --- API ---

def test_training_load_endpoint(client, db):
    base = datetime(2026, 6, 1, 7, 0)
    for i in range(5):
        _add_activity(db, base + timedelta(days=i), tss=70.0)
    resp = client.get("/api/v1/training-load?days=30")
    assert resp.status_code == 200
    body = resp.json()
    assert body["current"] is not None
    assert len(body["points"]) >= 5
    assert "ctl" in body["points"][0]


def test_today_endpoint_includes_training_load(client, db):
    _add_activity(db, datetime(2026, 6, 10, 7, 0), tss=90.0)
    resp = client.get("/api/v1/today?date=2026-06-10")
    assert resp.status_code == 200
    assert resp.json()["training_load"] is not None


# --- Series cache ---

def test_series_cache_hit_returns_same_result(db):
    """Second call returns a cached series that matches the first."""
    base = datetime.now().replace(hour=7, minute=0, second=0, microsecond=0)
    for i in range(5):
        _add_activity(db, base - timedelta(days=i + 1), tss=60.0)

    series1 = training_load.compute_load_series(db, days=30)
    series2 = training_load.compute_load_series(db, days=30)
    assert series1 == series2


def test_series_cache_invalidated_on_new_activity(db):
    """Adding a new activity invalidates the cache and produces updated results."""
    from datetime import date

    base = datetime.now().replace(hour=7, minute=0, second=0, microsecond=0)
    _add_activity(db, base - timedelta(days=3), tss=50.0)

    point_before = training_load.current_load(db)
    assert point_before is not None

    # Add an activity with a very high TSS; the series should now differ.
    _add_activity(db, base - timedelta(days=2), tss=200.0)
    point_after = training_load.current_load(db)
    assert point_after is not None
    assert point_after.atl != point_before.atl


def test_series_cache_bypassed_for_historical_date(db):
    """Historical end_date queries bypass the today-only cache."""
    from datetime import date

    base = datetime.now().replace(hour=7, minute=0, second=0, microsecond=0)
    for i in range(3):
        _add_activity(db, base - timedelta(days=i + 5), tss=70.0)

    today = date.today()
    # Populate cache for today.
    series_today = training_load.compute_load_series(db, days=90)
    # Historical query should still work correctly.
    historical_date = today - timedelta(days=2)
    series_hist = training_load.compute_load_series(db, end_date=historical_date, days=30)
    assert series_hist is not None
    assert len(series_hist) > 0
    # Historical series ends at the requested date.
    assert series_hist[-1].date == historical_date
