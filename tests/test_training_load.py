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


# --- AI context ---

def test_format_training_load_context_handles_none():
    assert training_load.format_training_load_context(None) == ""


def test_build_context_includes_training_load(db):
    _add_activity(db, datetime(2026, 6, 10, 7, 0), tss=100.0)
    context = ai_coach._build_context(db, "activity", "Test trigger", reference_date=date(2026, 6, 10))
    assert "## Training Load" in context
    assert "Fitness (CTL" in context
    assert "Form (TSB" in context


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
