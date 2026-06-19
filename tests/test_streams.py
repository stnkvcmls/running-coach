import json

from app import streams
from app.models import Activity


def _make_details(samples, *, with_time=True, with_elev=True):
    """Build a Garmin details payload from a list of per-sample dicts."""
    descriptors = []
    idx = 0
    cols = []
    if with_time:
        descriptors.append({"metricsIndex": idx, "key": "sumElapsedDuration"}); cols.append("t"); idx += 1
    descriptors.append({"metricsIndex": idx, "key": "directPower"}); cols.append("power"); idx += 1
    descriptors.append({"metricsIndex": idx, "key": "directSpeed"}); cols.append("speed"); idx += 1
    descriptors.append({"metricsIndex": idx, "key": "directHeartRate"}); cols.append("hr"); idx += 1
    if with_elev:
        descriptors.append({"metricsIndex": idx, "key": "directElevation"}); cols.append("elev"); idx += 1
        descriptors.append({"metricsIndex": idx, "key": "sumDistance"}); cols.append("dist"); idx += 1
    rows = [{"metrics": [s.get(c) for c in cols]} for s in samples]
    return {"metricDescriptors": descriptors, "activityDetailMetrics": rows}


# --- parsing ---

def test_parse_streams_maps_columns():
    details = _make_details([
        {"t": 0, "power": 200, "speed": 3.0, "hr": 140, "elev": 10, "dist": 0},
        {"t": 1, "power": 210, "speed": 3.1, "hr": 142, "elev": 10, "dist": 3},
    ])
    s = streams.parse_streams(details)
    assert s["time"] == [0, 1]
    assert s["power"] == [200, 210]
    assert s["speed"] == [3.0, 3.1]
    assert s["hr"] == [140, 142]


def test_parse_streams_rejects_spikes():
    details = _make_details([
        {"t": 0, "power": 9999, "speed": 99.0, "hr": 300, "elev": 0, "dist": 0},
        {"t": 1, "power": 200, "speed": 3.0, "hr": 140, "elev": 0, "dist": 3},
    ])
    s = streams.parse_streams(details)
    assert s["power"][0] is None     # 9999 W rejected
    assert s["speed"][0] is None     # 99 m/s rejected
    assert s["hr"][0] is None        # 300 bpm rejected
    assert s["power"][1] == 200


def test_parse_streams_none_without_metrics():
    assert streams.parse_streams(None) is None
    assert streams.parse_streams({}) is None
    assert streams.parse_streams({"metricDescriptors": [], "activityDetailMetrics": []}) is None


def test_parse_streams_rebases_epoch_timestamp():
    details = {
        "metricDescriptors": [
            {"metricsIndex": 0, "key": "directTimestamp"},
            {"metricsIndex": 1, "key": "directPower"},
        ],
        "activityDetailMetrics": [
            {"metrics": [1_700_000_000_000, 200]},
            {"metrics": [1_700_000_001_000, 210]},
        ],
    }
    s = streams.parse_streams(details)
    assert s["time"][0] == 0.0
    assert s["time"][1] == 1.0


# --- grade adjustment ---

def test_minetti_factor_uphill_increases_downhill_decreases():
    assert streams._minetti_factor(0.0) == 1.0
    assert streams._minetti_factor(0.10) > 1.0
    assert streams._minetti_factor(-0.10) < 1.0


def test_grade_adjusted_speed_uphill_faster_equivalent():
    speed = [3.0, 3.0]
    elev = [0.0, 5.0]      # +5 m
    dist = [0.0, 100.0]    # over 100 m → 5% grade
    gap = streams.grade_adjusted_speed(speed, elev, dist)
    assert gap[1] > 3.0    # uphill → higher flat-equivalent speed


def test_grade_adjusted_speed_falls_back_without_elevation():
    speed = [3.0, 3.2]
    assert streams.grade_adjusted_speed(speed, [], []) == speed


# --- mean-maximal curve ---

def test_best_mean_finds_hardest_window():
    # 200 s at 200 W, with a 60 s block at 400 W in the middle.
    time = list(range(300))
    values = [400.0 if 100 <= t < 160 else 200.0 for t in range(300)]
    assert round(streams._best_mean(time, values, 60)) == 400
    # Over the full 300 s the average is well below 400.
    assert streams._best_mean(time, values, 300) is None or streams._best_mean(time, values, 299) < 300


def test_best_mean_none_when_too_short():
    assert streams._best_mean([0, 1, 2], [1, 1, 1], 60) is None


def test_mean_max_curve_skips_missing_durations():
    time = list(range(120))
    values = [250.0] * 120
    curve = streams.mean_max_curve(time, values, durations=[60, 600])
    assert 60 in curve
    assert 600 not in curve     # series shorter than 600 s
    assert round(curve[60]) == 250


def test_compute_curves_from_details():
    samples = [
        {"t": t, "power": 250, "speed": 3.5, "hr": 150, "elev": 0, "dist": 3.5 * t}
        for t in range(200)
    ]
    curves = streams.compute_curves_from_details(_make_details(samples), "running")
    assert "60" in curves["power"]
    assert round(curves["power"]["60"]) == 250
    assert "60" in curves["gap_speed"]
    assert curves["is_treadmill"] is False
    assert curves["duration"] == 199.0


def test_compute_curves_treadmill_flag():
    samples = [{"t": t, "power": 250, "speed": 3.0, "hr": 150} for t in range(120)]
    curves = streams.compute_curves_from_details(
        _make_details(samples, with_elev=False), "treadmill_running"
    )
    assert curves["is_treadmill"] is True


def test_compute_curves_none_when_unparseable():
    assert streams.compute_curves_from_details({}, "running") is None


# --- backfill ---

def test_backfill_missing_curves(db):
    samples = [{"t": t, "power": 250, "speed": 3.5, "hr": 150} for t in range(120)]
    details = _make_details(samples, with_elev=False)
    db.add(Activity(
        garmin_id=1, activity_type="running", name="Run",
        laps_json=json.dumps(details), mean_max_json=None,
    ))
    db.commit()

    updated = streams.backfill_missing_curves(db)
    assert updated == 1
    act = db.query(Activity).first()
    assert act.mean_max_json is not None
    assert "power" in json.loads(act.mean_max_json)

    # Second run is a no-op (already populated).
    assert streams.backfill_missing_curves(db) == 0
