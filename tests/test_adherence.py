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
    def __init__(self, distance_m=None, avg_pace_min_km=None, laps_json=None):
        self.distance_m = distance_m
        self.avg_pace_min_km = avg_pace_min_km
        self.laps_json = laps_json


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
