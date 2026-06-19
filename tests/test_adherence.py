"""Tests for app.adherence: compute_adherence and format_adherence_context."""

import json

import pytest

from app import adherence as adh
from app.schemas import WorkoutAdherence


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_steps(raw_list):
    """Parse a raw list of step dicts directly."""
    raw = json.dumps({"workoutSteps": raw_list})
    return adh.parse_workout_steps(raw)


class FakeActivity:
    def __init__(self, distance_m=None, avg_pace_min_km=None, laps_json=None, splits_json=None):
        self.distance_m = distance_m
        self.avg_pace_min_km = avg_pace_min_km
        self.laps_json = laps_json
        self.splits_json = splits_json


# ---------------------------------------------------------------------------
# _flatten_steps
# ---------------------------------------------------------------------------

def test_flatten_no_repeats():
    steps = make_steps([
        {"stepType": "warmup", "endCondition": "distance", "endConditionValue": 1000},
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 5000},
    ])
    flat = adh._flatten_steps(steps)
    assert len(flat) == 2


def test_flatten_repeat_block():
    """4 reps of (interval + rest) → 8 flat steps."""
    steps = make_steps([
        {"stepType": "repeat", "repeatCount": 4, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 400},
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 60},
        ]},
    ])
    flat = adh._flatten_steps(steps)
    assert len(flat) == 8
    assert flat[0].step_type == "interval"
    assert flat[1].step_type == "rest"
    assert flat[6].step_type == "interval"


# ---------------------------------------------------------------------------
# _parse_pace_display / _parse_single_pace
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("pace_str,expected", [
    ("4:30", 270.0),
    ("5:00", 300.0),
    ("3:59", 239.0),
])
def test_parse_single_pace(pace_str, expected):
    assert adh._parse_single_pace(pace_str) == expected


def test_parse_pace_display_simple():
    assert adh._parse_pace_display("4:30/km") == 270.0


def test_parse_pace_display_range_midpoint():
    # "4:20 - 4:40/km" → midpoint of 260 and 280 = 270
    result = adh._parse_pace_display("4:20 - 4:40/km")
    assert result == pytest.approx(270.0)


def test_parse_pace_display_no_km():
    assert adh._parse_pace_display("4:30") is None
    assert adh._parse_pace_display("") is None
    assert adh._parse_pace_display(None) is None


# ---------------------------------------------------------------------------
# compute_adherence
# ---------------------------------------------------------------------------

def test_compute_adherence_returns_none_for_empty_steps():
    activity = FakeActivity(distance_m=5000.0, avg_pace_min_km=5.0)
    assert adh.compute_adherence(activity, []) is None


def test_compute_adherence_distance_only():
    """Workout with only a distance step and no pace target."""
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 5000},
    ])
    activity = FakeActivity(distance_m=5000.0)
    result = adh.compute_adherence(activity, steps)

    assert result is not None
    assert result.planned_distance_m == 5000.0
    assert result.actual_distance_m == 5000.0
    assert result.distance_pct == 100.0
    assert result.adherence_score == 100.0
    assert result.planned_pace_display is None
    assert result.planned_intervals == 1


def test_compute_adherence_partial_distance():
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 10000},
    ])
    activity = FakeActivity(distance_m=8000.0)
    result = adh.compute_adherence(activity, steps)

    assert result.distance_pct == pytest.approx(80.0)
    assert result.adherence_score < 90


def test_compute_adherence_distance_pct_capped_at_100():
    """Running more than planned should not exceed 100%."""
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 5000},
    ])
    activity = FakeActivity(distance_m=6000.0)
    result = adh.compute_adherence(activity, steps)
    assert result.distance_pct == 100.0


def test_compute_adherence_with_pace_target():
    """Pace on-target gives high adherence score."""
    steps = make_steps([
        {"stepType": "warm_up", "endCondition": "distance", "endConditionValue": 1000},
        {"stepType": "active", "endCondition": "distance", "endConditionValue": 5000,
         "targetType": "pace", "targetValueOne": 1000 / 270},  # 4:30/km
        {"stepType": "cool_down", "endCondition": "distance", "endConditionValue": 1000},
    ])
    activity = FakeActivity(distance_m=7000.0, avg_pace_min_km=4.5)  # 4:30/km exactly
    result = adh.compute_adherence(activity, steps)

    assert result.planned_pace_display == "4:30/km"
    assert result.actual_pace_display == "4:30/km"
    assert result.pace_delta_sec_per_km == pytest.approx(0.0, abs=1.0)
    assert result.adherence_score >= 95.0


def test_compute_adherence_slower_pace():
    """Running 60s/km slower should reduce score significantly."""
    steps = make_steps([
        {"stepType": "active", "endCondition": "distance", "endConditionValue": 5000,
         "targetType": "pace", "targetValueOne": 1000 / 270},  # 4:30/km plan
    ])
    activity = FakeActivity(distance_m=5000.0, avg_pace_min_km=5.5)  # 5:30/km = 60s slower
    result = adh.compute_adherence(activity, steps)

    assert result.pace_delta_sec_per_km == pytest.approx(60.0, abs=1.0)
    assert result.adherence_score < 80.0


def test_compute_adherence_interval_count_from_repeat():
    """3x interval in a repeat block → planned_intervals = 3."""
    steps = make_steps([
        {"stepType": "warm_up", "endCondition": "time", "endConditionValue": 600},
        {"stepType": "repeat", "repeatCount": 3, "workoutSteps": [
            {"stepType": "active", "endCondition": "distance", "endConditionValue": 1000,
             "targetType": "pace", "targetValueOne": 1000 / 270},
            {"stepType": "recovery", "endCondition": "time", "endConditionValue": 120},
        ]},
        {"stepType": "cool_down", "endCondition": "time", "endConditionValue": 600},
    ])
    activity = FakeActivity(distance_m=4200.0, avg_pace_min_km=4.5, laps_json='[{},{},{}]')
    result = adh.compute_adherence(activity, steps)

    assert result.planned_intervals == 3
    assert result.actual_laps == 3


def test_compute_adherence_laps_from_json():
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 5000},
    ])
    activity = FakeActivity(
        distance_m=5000.0,
        laps_json=json.dumps([{"lap": 1}, {"lap": 2}, {"lap": 3}]),
    )
    result = adh.compute_adherence(activity, steps)
    assert result.actual_laps == 3


def test_compute_adherence_laps_invalid_json():
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 5000},
    ])
    activity = FakeActivity(distance_m=5000.0, laps_json="not json")
    result = adh.compute_adherence(activity, steps)
    assert result.actual_laps is None


def test_compute_adherence_no_distance_no_pace():
    """Time-only steps with no pace target → no comparison, score = 100."""
    steps = make_steps([
        {"stepType": "interval", "endCondition": "time", "endConditionValue": 1800},
    ])
    activity = FakeActivity(distance_m=7000.0, avg_pace_min_km=4.2)
    result = adh.compute_adherence(activity, steps)
    assert result.planned_distance_m is None
    assert result.planned_pace_display is None
    assert result.adherence_score == 100.0
    assert "no distance" in result.summary.lower()


# ---------------------------------------------------------------------------
# Rest-aware distance & pace (running-only)
# ---------------------------------------------------------------------------

def test_planned_distance_excludes_rest():
    """Rest steps are excluded from planned distance and tracked separately."""
    steps = make_steps([
        {"stepType": "warmup", "endCondition": "distance", "endConditionValue": 1000},
        {"stepType": "repeat", "repeatCount": 4, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 1000,
             "targetType": "pace", "targetValueOne": 1000 / 240},  # 4:00/km
            {"stepType": "rest", "endCondition": "distance", "endConditionValue": 200},
        ]},
        {"stepType": "cooldown", "endCondition": "distance", "endConditionValue": 1000},
    ])
    activity = FakeActivity(distance_m=6800.0)
    result = adh.compute_adherence(activity, steps)

    # running = 1000 warmup + 4×1000 intervals + 1000 cooldown = 6000
    assert result.planned_distance_m == pytest.approx(6000.0)
    # rest = 4 × 200 = 800
    assert result.planned_rest_distance_m == pytest.approx(800.0)


def test_planned_distance_time_based_running_interval():
    """A running interval given in time is converted to distance via its pace."""
    steps = make_steps([
        {"stepType": "repeat", "repeatCount": 6, "workoutSteps": [
            {"stepType": "interval", "endCondition": "time", "endConditionValue": 60,
             "targetType": "pace", "targetValueOne": 1000 / 240},  # 4:00/km → 250 m/min
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 90},
        ]},
    ])
    activity = FakeActivity(distance_m=1500.0)
    result = adh.compute_adherence(activity, steps)

    # 6 × (60s at 4:00/km = 250 m) = 1500 m running
    assert result.planned_distance_m == pytest.approx(1500.0)


def test_time_interval_without_pace_uses_planned_pace_fallback():
    """A time-based step with no target falls back to the workout's planned pace."""
    steps = make_steps([
        {"stepType": "warm_up", "endCondition": "time", "endConditionValue": 240},  # no pace
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 3000,
         "targetType": "pace", "targetValueOne": 1000 / 240},  # 4:00/km
    ])
    activity = FakeActivity(distance_m=4000.0)
    result = adh.compute_adherence(activity, steps)

    # warmup 240s @ 4:00/km (fallback) = 1000 m, + 3000 m interval = 4000 m
    assert result.planned_distance_m == pytest.approx(4000.0)


def test_actual_from_splits_rest_and_running_pace():
    """Actual running/rest distance and running-only pace come from lapDTOs."""
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 6000,
         "targetType": "pace", "targetValueOne": 1000 / 240},  # 4:00/km plan
    ])
    laps = {"lapDTOs": [
        {"distance": 3000, "duration": 720, "intensityType": "ACTIVE"},   # 4:00/km
        {"distance": 245, "duration": 90, "intensityType": "REST"},
        {"distance": 3000, "duration": 720, "intensityType": "ACTIVE"},   # 4:00/km
        {"distance": 245, "duration": 90, "intensityType": "RECOVERY"},
    ]}
    activity = FakeActivity(
        distance_m=6490.0, avg_pace_min_km=5.0,  # overall avg slower (includes rest)
        splits_json=json.dumps(laps),
    )
    result = adh.compute_adherence(activity, steps)

    assert result.actual_distance_m == pytest.approx(6000.0)        # running only
    assert result.actual_rest_distance_m == pytest.approx(490.0)    # rest laps
    assert result.actual_pace_display == "4:00/km"                  # running-only, not 5:00
    assert result.pace_delta_sec_per_km == pytest.approx(0.0, abs=1.0)
    assert "490 m in rest" in result.summary


def test_worked_example_8km_plus_490m_rest():
    """Reproduce the target: 8.00 km planned / 8.00 km (+490 m rest) actual."""
    steps = make_steps([
        {"stepType": "warmup", "endCondition": "distance", "endConditionValue": 1000},
        {"stepType": "repeat", "repeatCount": 6, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 1000,
             "targetType": "pace", "targetValueOne": 1000 / 240},
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 90},
        ]},
        {"stepType": "cooldown", "endCondition": "distance", "endConditionValue": 1000},
    ])
    # 6 running laps + warmup + cooldown = 8 running laps (8 km), 6 rest laps (490 m)
    lap_dtos = (
        [{"distance": 1000, "duration": 240, "intensityType": "WARMUP"}]
        + [
            lap
            for _ in range(6)
            for lap in (
                {"distance": 1000, "duration": 240, "intensityType": "INTERVAL"},
                {"distance": 81.67, "duration": 90, "intensityType": "REST"},
            )
        ]
        + [{"distance": 1000, "duration": 240, "intensityType": "COOLDOWN"}]
    )
    activity = FakeActivity(distance_m=8490.0, splits_json=json.dumps({"lapDTOs": lap_dtos}))
    result = adh.compute_adherence(activity, steps)

    assert result.planned_distance_m == pytest.approx(8000.0)
    assert f"{result.actual_distance_m / 1000:.2f}" == "8.00"
    assert int(round(result.actual_rest_distance_m)) == 490
    assert result.distance_pct == 100.0


def test_actual_fallback_no_splits_uses_totals():
    """Without lapDTOs, actual falls back to activity totals (no rest split)."""
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 5000},
    ])
    activity = FakeActivity(distance_m=4800.0, avg_pace_min_km=4.5)
    result = adh.compute_adherence(activity, steps)

    assert result.actual_distance_m == 4800.0
    assert result.actual_rest_distance_m is None
    assert result.actual_pace_display == "4:30/km"


# ---------------------------------------------------------------------------
# format_adherence_context
# ---------------------------------------------------------------------------

def test_format_adherence_context_full():
    adherence = WorkoutAdherence(
        planned_distance_m=7000.0,
        actual_distance_m=7200.0,
        distance_pct=100.0,
        planned_pace_display="4:30/km",
        actual_pace_display="4:28/km",
        pace_delta_sec_per_km=-2.0,
        planned_intervals=3,
        actual_laps=3,
        adherence_score=97.0,
        summary="100% of planned distance, 2s/km faster than target",
    )
    ctx = adh.format_adherence_context(adherence)
    assert "## Workout Adherence" in ctx
    assert "4:30/km" in ctx
    assert "4:28/km" in ctx
    assert "97" in ctx
    assert "3 planned" in ctx


def test_format_adherence_context_minimal():
    adherence = WorkoutAdherence(
        adherence_score=100.0,
        summary="Workout completed (no distance/pace plan to compare)",
    )
    ctx = adh.format_adherence_context(adherence)
    assert "## Workout Adherence" in ctx
    assert "100" in ctx
