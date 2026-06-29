import json
from datetime import datetime, timedelta

from app import ai_coach, threshold
from app.models import Activity, AthleteProfile

CP_DURATIONS = [120, 300, 600, 1200, 2400]


def _curve_json(*, power=None, gap_speed=None, hr=None, is_treadmill=False, duration=1800.0):
    return json.dumps({
        "power": power or {},
        "speed": {},
        "gap_speed": gap_speed or {},
        "hr": hr or {},
        "is_treadmill": is_treadmill,
        "duration": duration,
    })


def _add(db, *, days_ago=2, mean_max=None, activity_type="running",
         max_hr=None, avg_hr=None, duration_sec=1800, raw=None, laps=None):
    started = datetime.utcnow() - timedelta(days=days_ago)
    act = Activity(
        garmin_id=int(started.timestamp() * 1000) + (days_ago * 1000) + int(duration_sec),
        activity_type=activity_type, name="Run", started_at=started,
        duration_sec=duration_sec, max_hr=max_hr, avg_hr=avg_hr,
        mean_max_json=mean_max,
        raw_json=json.dumps(raw) if raw is not None else None,
        laps_json=json.dumps(laps) if laps is not None else None,
    )
    db.add(act)
    db.commit()
    return act


def _power_curve(cp, w, durations=CP_DURATIONS):
    return {str(t): round(cp + w / t, 2) for t in durations}


def _gap_curve(cv, d, durations=CP_DURATIONS):
    return {str(t): round(cv + d / t, 4) for t in durations}


# --- math helpers ---

def test_weighted_linear_fit_basic():
    # y = 2x + 1, equal weights
    slope, intercept = threshold._weighted_linear_fit([(0, 1), (1, 3), (2, 5)], [1, 1, 1])
    assert round(slope, 6) == 2.0
    assert round(intercept, 6) == 1.0


def test_weighted_linear_fit_zero_weight_returns_none():
    assert threshold._weighted_linear_fit([(0, 1), (1, 2)], [0, 0]) is None


def test_build_frontier_keeps_best_with_support():
    curves = [
        (1.0, {"power": {"300": 300, "600": 250}}),
        (5.0, {"power": {"300": 320}}),    # better 300 s effort, older
    ]
    frontier = threshold._build_frontier(curves, "power")
    by_dur = {p.duration: p for p in frontier}
    assert by_dur[300].value == 320
    assert by_dur[300].sample_size == 2
    assert by_dur[600].value == 250


def test_fit_two_param_recovers_cp():
    curves = [(1.0, {"power": _power_curve(250, 15000)})]
    frontier = threshold._build_frontier(curves, "power")
    cp, w, used = threshold._fit_two_param(frontier)
    assert abs(cp - 250) < 2
    assert abs(w - 15000) < 200


def test_fit_two_param_rejects_non_physical():
    # Rising output with duration → negative asymptote/work.
    frontier = [
        threshold._FrontierPoint(300, 100, 1.0, 1),
        threshold._FrontierPoint(1200, 300, 1.0, 1),
    ]
    assert threshold._fit_two_param(frontier) is None


def test_fit_two_param_needs_two_points_in_range():
    frontier = [threshold._FrontierPoint(300, 300, 1.0, 1)]
    assert threshold._fit_two_param(frontier) is None


def test_three_param_selected_on_bending_curve():
    # Build a curve that genuinely follows the 3-param model.
    cp, w, pmax = 250.0, 15000.0, 600.0
    durations = [60, 120, 300, 600, 1200, 2400]
    curve = {str(t): round(threshold._model_3p(t, cp, w, pmax), 2) for t in durations}
    curves = [(1.0, {"power": curve})]
    est, w_out, pmax_out = threshold._estimate_critical_power(curves)
    assert est.value is not None
    # 3-param should win and report a Pmax in range.
    assert est.method == "critical_power_3p"
    assert pmax_out is not None and pmax_out > est.value


# --- estimation pipeline ---

def test_estimate_critical_power_from_curves(db):
    _add(db, mean_max=_curve_json(power=_power_curve(250, 15000)))
    est = threshold.estimate_thresholds(db)
    assert est.critical_power.value is not None
    assert abs(est.critical_power.value - 250) < 3
    assert est.w_prime is not None


def test_estimate_threshold_pace_from_gap_curve(db):
    cv = 3.5
    _add(db, mean_max=_curve_json(gap_speed=_gap_curve(cv, 200)))
    est = threshold.estimate_thresholds(db)
    pace = est.threshold_pace_min_km.value
    assert pace is not None
    assert abs(pace - (1000.0 / cv / 60.0)) < 0.15


def test_treadmill_excluded_from_pace_but_kept_for_power(db):
    _add(db, mean_max=_curve_json(
        power=_power_curve(250, 15000), gap_speed=_gap_curve(3.5, 200), is_treadmill=True,
    ))
    est = threshold.estimate_thresholds(db)
    assert est.critical_power.value is not None      # power kept
    assert est.threshold_pace_min_km.value is None    # pace dropped


def test_confidence_note_when_missing_short_effort(db):
    # Only long-duration efforts → no short anchor → note + not high confidence.
    long_curve = {str(t): round(250 + 15000 / t, 2) for t in [1200, 1800, 2400]}
    _add(db, mean_max=_curve_json(power=long_curve))
    est = threshold.estimate_thresholds(db)
    assert est.critical_power.confidence != "high"
    assert est.critical_power.note is not None
    assert "short" in est.critical_power.note


def test_estimate_empty_db(db):
    est = threshold.estimate_thresholds(db)
    assert est.critical_power.value is None
    assert est.threshold_pace_min_km.value is None
    assert est.max_hr.value is None
    assert est.activities_analyzed == 0


def test_old_activities_excluded(db):
    _add(db, days_ago=400, mean_max=_curve_json(power=_power_curve(250, 15000)), max_hr=180)
    est = threshold.estimate_thresholds(db, lookback_days=90)
    assert est.activities_analyzed == 0
    assert est.critical_power.value is None


def test_non_run_excluded(db):
    _add(db, activity_type="cycling", mean_max=_curve_json(power=_power_curve(250, 15000)))
    est = threshold.estimate_thresholds(db)
    assert est.activities_analyzed == 0


# --- max HR + LTHR ---

def test_estimate_max_hr(db):
    _add(db, mean_max=_curve_json(), max_hr=180)
    _add(db, days_ago=4, mean_max=_curve_json(), max_hr=189)
    est = threshold.estimate_thresholds(db)
    assert est.max_hr.value == 189


def test_lthr_prefers_garmin_value(db):
    _add(db, mean_max=_curve_json(), max_hr=190, avg_hr=175,
         raw={"lactateThresholdHeartRate": 168})
    est = threshold.estimate_thresholds(db)
    assert est.threshold_hr.method == "garmin_lactate_threshold"
    assert est.threshold_hr.value == 168


def test_lthr_sustained_effort_fallback():
    acts = [
        Activity(activity_type="running", duration_sec=1800, max_hr=190, avg_hr=170),
        Activity(activity_type="running", duration_sec=2400, max_hr=188, avg_hr=172),
        Activity(activity_type="running", duration_sec=2000, max_hr=185, avg_hr=168),
    ]
    est = threshold._estimate_threshold_hr(acts, max_hr=190, cv=None)
    assert est.method == "sustained_effort"
    assert 165 <= est.value <= 175


def test_lthr_pct_max_fallback():
    acts = [Activity(activity_type="running", duration_sec=600, max_hr=185, avg_hr=120)]
    est = threshold._estimate_threshold_hr(acts, max_hr=185, cv=None)
    assert est.method == "pct_max_hr"
    assert est.value == round(185 * threshold._LTHR_MAX_HR_FRACTION, 0)
    assert est.note is not None


def test_steady_hr_near_cv_from_streams():
    # 800 s stream: 700 s at threshold speed (3.5 m/s) with HR ramping 150->170
    # (drift), then easy. Steady HR uses the segment's second half.
    cv = 3.5
    rows = []
    for t in range(800):
        if t < 700:
            speed = 3.5
            hr = 150 + (t / 700) * 20    # 150 → 170
        else:
            speed = 2.0
            hr = 130
        rows.append({"metrics": [t, speed, hr]})
    details = {
        "metricDescriptors": [
            {"metricsIndex": 0, "key": "sumElapsedDuration"},
            {"metricsIndex": 1, "key": "directSpeed"},
            {"metricsIndex": 2, "key": "directHeartRate"},
        ],
        "activityDetailMetrics": rows,
    }
    act = Activity(activity_type="running", duration_sec=800, laps_json=json.dumps(details))
    vals = threshold._steady_hr_near_cv([act], cv)
    assert len(vals) == 1
    # second half of 0..700s segment → HR averages ~165
    assert 160 <= vals[0] <= 170


def test_lthr_uses_near_cv_segment(db):
    cv = 3.5
    rows = [{"metrics": [t, 3.5, 165]} for t in range(700)]
    details = {
        "metricDescriptors": [
            {"metricsIndex": 0, "key": "sumElapsedDuration"},
            {"metricsIndex": 1, "key": "directSpeed"},
            {"metricsIndex": 2, "key": "directHeartRate"},
        ],
        "activityDetailMetrics": rows,
    }
    _add(db, mean_max=_curve_json(gap_speed=_gap_curve(cv, 200)),
         max_hr=190, laps=details)
    est = threshold.estimate_thresholds(db)
    assert est.threshold_hr.method == "near_threshold_segment"
    assert 160 <= est.threshold_hr.value <= 170


# --- apply ---

def test_apply_estimate_all_fields(db):
    _add(db, mean_max=_curve_json(power=_power_curve(250, 15000),
                                  gap_speed=_gap_curve(3.5, 200)), max_hr=185)
    est = threshold.estimate_thresholds(db)
    profile = AthleteProfile()
    applied = threshold.apply_estimate_to_profile(profile, est)
    assert "threshold_power" in applied
    assert "max_hr" in applied
    assert isinstance(profile.threshold_power, int)


def test_apply_estimate_field_filter(db):
    _add(db, mean_max=_curve_json(), max_hr=185)
    est = threshold.estimate_thresholds(db)
    profile = AthleteProfile()
    applied = threshold.apply_estimate_to_profile(profile, est, fields=["max_hr"])
    assert applied == ["max_hr"]
    assert profile.max_hr == 185


def test_apply_estimate_skips_none(db):
    est = threshold.estimate_thresholds(db)
    profile = AthleteProfile()
    assert threshold.apply_estimate_to_profile(profile, est) == []


# --- context formatting ---

def test_format_context_shows_missing_fields():
    est = threshold.ThresholdEstimate(
        critical_power=threshold.FieldEstimate(250.0, "critical_power_3p", "high", 4),
        w_prime=15000.0, pmax=600.0,
        threshold_pace_min_km=threshold.FieldEstimate(4.5, "critical_velocity", "medium", 3),
        threshold_hr=threshold.FieldEstimate(170.0, "near_threshold_segment", "high", 3),
        max_hr=threshold.FieldEstimate(189.0, "observed_max", "high", 6),
        lookback_days=90, activities_analyzed=10,
    )
    ctx = threshold.format_threshold_estimate_context(est, None)
    assert "Critical Power" in ctx
    assert "Pmax 600 W" in ctx
    assert "4:30/km" in ctx
    assert "170 bpm" in ctx


def test_format_context_hides_set_fields():
    est = threshold.ThresholdEstimate(
        critical_power=threshold.FieldEstimate(250.0, "critical_power_2p", "high", 4),
        w_prime=None, pmax=None,
        threshold_pace_min_km=threshold.FieldEstimate(4.5, "critical_velocity", "high", 4),
        threshold_hr=threshold.FieldEstimate(170.0, "sustained_effort", "high", 3),
        max_hr=threshold.FieldEstimate(189.0, "observed_max", "high", 6),
        lookback_days=90, activities_analyzed=10,
    )
    profile = AthleteProfile(threshold_power=260, threshold_pace_min_km=4.4,
                             threshold_hr=168, max_hr=190)
    assert threshold.format_threshold_estimate_context(est, profile) == ""


def test_format_pace_rounds_to_minute():
    assert threshold._format_pace(4.999) == "5:00/km"


# --- API endpoints ---

def test_threshold_estimate_endpoint(client, session_factory):
    db = session_factory()
    started = datetime.utcnow() - timedelta(days=3)
    db.add(Activity(
        garmin_id=42, activity_type="running", name="Run", started_at=started,
        duration_sec=2400, max_hr=185,
        mean_max_json=_curve_json(power=_power_curve(250, 15000)),
    ))
    db.commit()
    db.close()

    resp = client.get("/api/v1/threshold-estimate")
    assert resp.status_code == 200
    body = resp.json()
    assert body["critical_power"]["value"] is not None
    assert body["activities_analyzed"] == 1


def test_threshold_apply_endpoint_creates_profile(client, session_factory):
    db = session_factory()
    started = datetime.utcnow() - timedelta(days=3)
    db.add(Activity(
        garmin_id=43, activity_type="running", name="Run", started_at=started,
        duration_sec=2400, max_hr=185,
        mean_max_json=_curve_json(power=_power_curve(250, 15000)),
    ))
    db.commit()
    db.close()

    resp = client.post("/api/v1/threshold-estimate/apply", json={})
    assert resp.status_code == 200
    body = resp.json()
    assert body["threshold_power"] is not None
    assert body["max_hr"] == 185


def test_threshold_apply_no_data_returns_400(client):
    resp = client.post("/api/v1/threshold-estimate/apply", json={})
    assert resp.status_code == 400


def test_build_context_includes_estimate(db):
    _add(db, mean_max=_curve_json(power=_power_curve(250, 15000)), max_hr=185)
    ctx = ai_coach._build_context(db, "activity", "test run")
    assert "Estimated Thresholds" in ctx


# --- Estimate cache ---

def test_threshold_cache_hit_returns_same_result(db):
    """Second call returns a cached result identical to the first."""
    _add(db, mean_max=_curve_json(power=_power_curve(280, 14000)), max_hr=185)
    est1 = threshold.estimate_thresholds(db)
    est2 = threshold.estimate_thresholds(db)
    assert est1.critical_power.value == est2.critical_power.value
    assert est1.activities_analyzed == est2.activities_analyzed


def test_threshold_cache_invalidated_on_new_activity(db):
    """Adding a new activity in the lookback window causes a cache miss."""
    est1 = threshold.estimate_thresholds(db)
    assert est1.activities_analyzed == 0

    _add(db, mean_max=_curve_json(power=_power_curve(280, 14000)), max_hr=185)
    est2 = threshold.estimate_thresholds(db)
    assert est2.activities_analyzed == 1


def test_threshold_cache_roundtrip_preserves_fields(db):
    """Serialization + deserialization preserves all FieldEstimate fields."""
    curve = _curve_json(
        power=_power_curve(280, 14000),
        gap_speed=_gap_curve(4.2, 200),
        hr={str(t): 160 for t in CP_DURATIONS},
    )
    _add(db, mean_max=curve, max_hr=185)

    est = threshold.estimate_thresholds(db)
    cached = threshold.estimate_thresholds(db)  # second call → cache hit

    assert cached.critical_power.value == est.critical_power.value
    assert cached.threshold_pace_min_km.method == est.threshold_pace_min_km.method
    assert cached.lookback_days == est.lookback_days


# --- Incremental threshold compute (frontier caching) ---

def test_frontier_stored_in_cache_after_full_compute(db):
    """Full compute stores power and pace frontiers alongside the estimate."""
    _add(db, mean_max=_curve_json(power=_power_curve(250, 15000),
                                  gap_speed=_gap_curve(3.5, 200)))
    threshold.estimate_thresholds(db)
    raw = threshold._load_cached_threshold_raw(db, user_id=1)
    assert raw is not None
    assert "power_frontier" in raw
    assert "pace_frontier" in raw
    assert len(raw["power_frontier"]) > 0


def test_incremental_skips_refit_when_no_new_prs(db):
    """New activity with lower power than the cached frontier keeps CP unchanged."""
    _add(db, mean_max=_curve_json(power=_power_curve(250, 15000)), days_ago=10)
    est1 = threshold.estimate_thresholds(db)
    assert est1.critical_power.value is not None
    assert abs(est1.critical_power.value - 250) < 5

    # Lower-power activity — does not set any new PRs on the frontier.
    _add(db, mean_max=_curve_json(power=_power_curve(150, 5000)), days_ago=5)
    est2 = threshold.estimate_thresholds(db)
    assert est2.critical_power.value is not None
    # CP anchored by the original 250 W activity; incremental path returns it unchanged.
    assert abs(est2.critical_power.value - 250) < 5


def test_incremental_refits_when_new_pr_recorded(db):
    """New activity with higher power triggers an incremental refit to the higher CP."""
    _add(db, mean_max=_curve_json(power=_power_curve(250, 15000)), days_ago=10)
    est1 = threshold.estimate_thresholds(db)
    assert est1.critical_power.value is not None

    # Stronger activity — sets new PRs across the power frontier.
    _add(db, mean_max=_curve_json(power=_power_curve(300, 15000)), days_ago=5)
    est2 = threshold.estimate_thresholds(db)
    assert est2.critical_power.value is not None
    assert est2.critical_power.value > est1.critical_power.value


# --- Performance curve + race predictions ---

def test_predict_race_times_basic():
    cv = 3.5    # m/s (≈4:45/km threshold)
    d_prime = 200.0
    preds = threshold._predict_race_times(cv, d_prime)
    labels = [p.distance_label for p in preds]
    assert "5K" in labels
    assert "10K" in labels
    assert "Half Marathon" in labels
    assert "Marathon" in labels


def test_predict_race_times_formula():
    cv = 4.0    # m/s
    d_prime = 100.0
    pred_5k = next(p for p in threshold._predict_race_times(cv, d_prime) if p.distance_label == "5K")
    expected_sec = (5000.0 - d_prime) / cv
    assert abs(pred_5k.predicted_time_sec - expected_sec) < 1
    expected_pace = (expected_sec / 5000.0) * 1000.0 / 60.0
    assert abs(pred_5k.predicted_pace_min_km - expected_pace) < 0.01


def test_predict_race_times_skips_when_d_prime_exceeds_distance():
    # D' = 6000 m > 5000 m → 5K prediction should be skipped (6000 > 5000)
    preds = threshold._predict_race_times(cv=3.5, d_prime=6000.0)
    labels = [p.distance_label for p in preds]
    assert "5K" not in labels
    assert "10K" in labels         # 6000 < 10000, so 10K is valid
    assert "Half Marathon" in labels


def test_get_performance_curve_data_empty_db(db):
    data = threshold.get_performance_curve_data(db)
    assert data.power_points == []
    assert data.pace_points == []
    assert data.critical_power is None
    assert data.critical_velocity is None
    assert data.race_predictions == []
    assert data.activities_analyzed == 0


def test_get_performance_curve_data_with_pace(db):
    cv = 3.5
    _add(db, mean_max=_curve_json(gap_speed=_gap_curve(cv, 200)))
    data = threshold.get_performance_curve_data(db)
    assert len(data.pace_points) > 0
    assert data.critical_velocity is not None
    assert abs(data.critical_velocity - cv) < 0.1
    assert data.d_prime is not None
    assert len(data.race_predictions) > 0


def test_get_performance_curve_data_with_power(db):
    _add(db, mean_max=_curve_json(power=_power_curve(250, 15000)))
    data = threshold.get_performance_curve_data(db)
    assert len(data.power_points) > 0
    assert data.critical_power is not None
    assert abs(data.critical_power - 250) < 3
    assert data.w_prime is not None


def test_performance_curve_includes_model_values(db):
    cv = 3.5
    _add(db, mean_max=_curve_json(gap_speed=_gap_curve(cv, 200)))
    data = threshold.get_performance_curve_data(db)
    points_with_model = [p for p in data.pace_points if p.model_value is not None]
    assert len(points_with_model) > 0


def test_performance_curve_endpoint(client, session_factory):
    db = session_factory()
    started = datetime.utcnow() - timedelta(days=3)
    db.add(Activity(
        garmin_id=99, activity_type="running", name="Run", started_at=started,
        duration_sec=2400,
        mean_max_json=_curve_json(gap_speed=_gap_curve(3.5, 200)),
    ))
    db.commit()
    db.close()

    resp = client.get("/api/v1/performance-curve?days=90")
    assert resp.status_code == 200
    body = resp.json()
    assert "pace_points" in body
    assert "race_predictions" in body
    assert body["activities_analyzed"] == 1
    assert body["critical_velocity"] is not None
    assert len(body["race_predictions"]) > 0
