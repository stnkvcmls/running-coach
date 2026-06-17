from app import training_load
from app.models import Activity, AthleteProfile


# --- _interpret_tsb thresholds ---

def test_interpret_tsb_bands():
    assert training_load._interpret_tsb(20) == "very fresh / detraining risk"
    assert training_load._interpret_tsb(10) == "fresh, tapered"
    assert training_load._interpret_tsb(0) == "neutral / race-ready range"
    assert training_load._interpret_tsb(-20) == "productive training fatigue"
    assert training_load._interpret_tsb(-40) == "high fatigue — overreaching risk"


# --- intensity factor cap ---

def test_estimate_tss_intensity_capped():
    # An absurdly fast pace would blow up the IF; it is capped at _MAX_IF (1.5).
    profile = AthleteProfile(threshold_pace_min_km=5.0)
    fast = Activity(duration_sec=3600, avg_pace_min_km=0.5)  # IF would be 10
    capped = Activity(duration_sec=3600, avg_pace_min_km=5.0 / 1.5)  # IF == 1.5
    tss_fast, _ = training_load.estimate_tss(fast, profile)
    tss_capped, _ = training_load.estimate_tss(capped, profile)
    assert tss_fast == tss_capped


# --- HR threshold falls back to max_hr * 0.9 ---

def test_estimate_tss_hr_threshold_from_max_hr():
    profile = AthleteProfile(max_hr=200)  # threshold ~ 180
    act = Activity(duration_sec=3600, avg_hr=180)
    tss, source = training_load.estimate_tss(act, profile)
    assert source == "hr"
    assert round(tss) == 100


# --- format context renders snapshot ---

def test_format_training_load_context_renders_values():
    from app.schemas import TrainingLoadPoint
    from datetime import date

    point = TrainingLoadPoint(date=date(2026, 6, 17), tss=80, ctl=55, atl=70, tsb=-15)
    text = training_load.format_training_load_context(point)
    assert "## Training Load" in text
    assert "Fitness (CTL, 42d): 55" in text
    assert "Fatigue (ATL, 7d): 70" in text
    assert "Form (TSB" in text
    assert "productive training fatigue" in text


# --- compute_load_series with days<=0 returns full series ---

def test_compute_load_series_no_window_returns_full(db):
    from datetime import datetime as dt, date, timedelta
    base = dt(2026, 5, 1, 7, 0)
    for i in range(5):
        db.add(Activity(
            garmin_id=int((base + timedelta(days=i)).timestamp()),
            activity_type="running", name="Run",
            started_at=base + timedelta(days=i),
            duration_sec=3600, distance_m=10000, training_stress_score=50,
        ))
    db.commit()
    full = training_load.compute_load_series(db, end_date=date(2026, 5, 5), days=0)
    # From first activity (May 1) through May 5 == 5 days.
    assert len(full) == 5
