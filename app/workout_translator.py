"""Translate a TrainingPlanDay into a Garmin structured-workout JSON payload.

Garmin's workout-service accepts a JSON document describing warmup/interval/
cooldown steps. This module builds that document from the data available in a
TrainingPlanDay (workout_type, target_distance_m, target_pace_min_km).
"""
from __future__ import annotations

import math
from typing import Any

from app.models import AthleteProfile, TrainingPlanDay

# ---------------------------------------------------------------------------
# Garmin constants
# ---------------------------------------------------------------------------

_SPORT_RUNNING = {"sportTypeId": 1, "sportTypeKey": "running"}

# Step types
_STEP_WARMUP = {"stepTypeId": 1, "stepTypeKey": "warmup"}
_STEP_COOLDOWN = {"stepTypeId": 2, "stepTypeKey": "cooldown"}
_STEP_INTERVAL = {"stepTypeId": 3, "stepTypeKey": "interval"}
_STEP_RECOVERY = {"stepTypeId": 4, "stepTypeKey": "recovery"}
_STEP_REST = {"stepTypeId": 5, "stepTypeKey": "rest"}
_STEP_REPEAT = {"stepTypeId": 6, "stepTypeKey": "repeat"}

# End conditions
_END_TIME = {"conditionTypeId": 1, "conditionTypeKey": "time"}
_END_DISTANCE = {"conditionTypeId": 2, "conditionTypeKey": "distance"}
_END_ITERATIONS = {"conditionTypeId": 7, "conditionTypeKey": "iterations"}

# Target types
_TARGET_NONE = {"workoutTargetTypeId": 1, "workoutTargetTypeKey": "no.target"}
_TARGET_PACE = {"workoutTargetTypeId": 6, "workoutTargetTypeKey": "pace.zone"}

# Fallback default pace for workouts with no profile pace (5:30/km in m/s)
_DEFAULT_PACE_MPS = 1000.0 / (5.5 * 60)


def _pace_to_mps(pace_min_km: float) -> float:
    """Convert min/km to m/s."""
    return 1000.0 / (pace_min_km * 60.0)


def _pace_target(pace_min_km: float, tolerance_pct: float = 0.05) -> dict:
    """Build a pace-zone target centred on pace_min_km ± tolerance_pct."""
    center = _pace_to_mps(pace_min_km)
    fast = center * (1 + tolerance_pct)   # faster end  (higher m/s)
    slow = center * (1 - tolerance_pct)   # slower end  (lower m/s)
    return {**_TARGET_PACE, "targetValueOne": round(fast, 4), "targetValueTwo": round(slow, 4)}


def _apply_target(step: dict, target: dict | None) -> dict:
    """Merge a target into a step dict.

    Garmin's format puts the type object under ``targetType`` but the numeric
    bounds (``targetValueOne``, ``targetValueTwo``) at the TOP level of the step.
    """
    if not target:
        step["targetType"] = _TARGET_NONE
        return step
    type_keys = {"workoutTargetTypeId", "workoutTargetTypeKey"}
    step["targetType"] = {k: v for k, v in target.items() if k in type_keys}
    for k, v in target.items():
        if k not in type_keys:
            step[k] = v
    return step


def _step_distance(step_type: dict, order: int, distance_m: float, target: dict | None = None) -> dict:
    step = {
        "stepOrder": order,
        "stepType": step_type,
        "endCondition": _END_DISTANCE,
        "endConditionValue": round(distance_m, 1),
    }
    return _apply_target(step, target)


def _step_time(step_type: dict, order: int, seconds: int, target: dict | None = None) -> dict:
    step = {
        "stepOrder": order,
        "stepType": step_type,
        "endCondition": _END_TIME,
        "endConditionValue": float(seconds),
    }
    return _apply_target(step, target)


def _repeat_block(order: int, reps: int, child_steps: list[dict]) -> dict:
    for i, s in enumerate(child_steps):
        s["stepOrder"] = i + 1
    return {
        "stepOrder": order,
        "stepType": _STEP_REPEAT,
        "endCondition": _END_ITERATIONS,
        "endConditionValue": float(reps),
        "numberOfIterations": reps,
        "workoutSteps": child_steps,
    }


# ---------------------------------------------------------------------------
# Per-workout-type builders
# ---------------------------------------------------------------------------

def _build_easy(dist_m: float, pace_min_km: float | None) -> list[dict]:
    wu = min(1000.0, dist_m * 0.12)
    cd = min(800.0, dist_m * 0.10)
    main = max(dist_m - wu - cd, dist_m * 0.78)
    steps = [
        _step_distance(_STEP_WARMUP, 1, wu),
        _step_distance(_STEP_INTERVAL, 2, main),
        _step_distance(_STEP_COOLDOWN, 3, cd),
    ]
    return steps


def _build_long(dist_m: float, pace_min_km: float | None) -> list[dict]:
    wu = min(1500.0, dist_m * 0.08)
    cd = min(1500.0, dist_m * 0.08)
    main = max(dist_m - wu - cd, dist_m * 0.84)
    return [
        _step_distance(_STEP_WARMUP, 1, wu),
        _step_distance(_STEP_INTERVAL, 2, main),
        _step_distance(_STEP_COOLDOWN, 3, cd),
    ]


def _build_tempo(dist_m: float, pace_min_km: float | None) -> list[dict]:
    wu = min(2000.0, dist_m * 0.20)
    cd = min(2000.0, dist_m * 0.20)
    tempo = max(dist_m - wu - cd, dist_m * 0.60)
    target = _pace_target(pace_min_km) if pace_min_km else _TARGET_NONE
    return [
        _step_distance(_STEP_WARMUP, 1, wu),
        _step_distance(_STEP_INTERVAL, 2, tempo, target=target),
        _step_distance(_STEP_COOLDOWN, 3, cd),
    ]


def _build_interval(dist_m: float, pace_min_km: float | None) -> list[dict]:
    wu = min(2000.0, dist_m * 0.20)
    cd = min(2000.0, dist_m * 0.20)
    work_dist = max(dist_m - wu - cd, dist_m * 0.60)

    # Estimate rep length from total work distance (1 km if short, 1.6 km if long)
    if work_dist <= 4000:
        rep_m = 400.0
    elif work_dist <= 8000:
        rep_m = 1000.0
    else:
        rep_m = 1600.0

    recovery_m = rep_m * 0.4
    reps = max(3, min(8, int(round(work_dist / (rep_m + recovery_m)))))

    target = _pace_target(pace_min_km) if pace_min_km else _TARGET_NONE
    child_steps = [
        _step_distance(_STEP_INTERVAL, 1, rep_m, target=target),
        _step_time(_STEP_REST, 2, int(recovery_m / (pace_min_km / 60.0 if pace_min_km else 5.5) * 0.8) if pace_min_km else 90),
    ]
    return [
        _step_distance(_STEP_WARMUP, 1, wu),
        _repeat_block(2, reps, child_steps),
        _step_distance(_STEP_COOLDOWN, 3, cd),
    ]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def translate_plan_day(
    plan_day: TrainingPlanDay,
    profile: AthleteProfile | None = None,
) -> dict | None:
    """Convert a TrainingPlanDay into a Garmin structured-workout payload.

    Returns None for rest and cross-training days (no Garmin workout to push).
    """
    wtype = (plan_day.workout_type or "").lower()
    if wtype in ("rest", "cross"):
        return None

    dist_m = plan_day.target_distance_m
    pace = plan_day.target_pace_min_km

    # Derive a fallback distance and pace from the athlete profile when missing.
    if dist_m is None or dist_m <= 0:
        dist_m = 8000.0  # generic 8 km default
    if pace is None and profile and profile.threshold_pace_min_km:
        # Easy pace ≈ threshold + 20%
        pace = profile.threshold_pace_min_km * 1.20

    builders = {
        "easy": _build_easy,
        "long": _build_long,
        "tempo": _build_tempo,
        "interval": _build_interval,
        "strength": None,  # skip
    }

    builder = builders.get(wtype)
    if builder is None:
        # Unknown type — build a generic easy-run structure.
        builder = _build_easy

    steps = builder(dist_m, pace)

    # Estimate total duration for the workout header
    speed_mps = _pace_to_mps(pace) if pace else _DEFAULT_PACE_MPS
    est_duration_sec = int(dist_m / speed_mps)

    type_labels = {
        "easy": "Easy Run",
        "long": "Long Run",
        "tempo": "Tempo Run",
        "interval": "Intervals",
        "strength": "Strength",
    }
    label = type_labels.get(wtype, wtype.title())
    km = dist_m / 1000.0
    workout_name = f"{label} — {km:.1f} km"
    if plan_day.description:
        # Append a short excerpt of the AI description (first 60 chars)
        excerpt = plan_day.description[:60].split(".")[0]
        if excerpt and excerpt.lower() not in workout_name.lower():
            workout_name = f"{workout_name} ({excerpt})"

    return {
        "workoutName": workout_name,
        "description": plan_day.description or "",
        "sportType": _SPORT_RUNNING,
        "estimatedDurationInSecs": est_duration_sec,
        "estimatedDistanceInMeters": round(dist_m, 1),
        "workoutSegments": [
            {
                "segmentOrder": 1,
                "sportType": _SPORT_RUNNING,
                "workoutSteps": steps,
            }
        ],
    }
