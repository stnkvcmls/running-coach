"""Translate a TrainingPlanDay or race pacing plan into a Garmin structured-workout JSON payload.

Garmin's workout-service accepts a JSON document describing warmup/interval/
cooldown steps. This module builds that document from the data available in a
TrainingPlanDay (workout_type, target_distance_m, target_pace_min_km) or from
a list of per-split pacing targets for a race-day pacing plan.
"""
from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, Any

from app.models import AthleteProfile, TrainingPlanDay

if TYPE_CHECKING:
    from app.pacing import PacingSplit

# ---------------------------------------------------------------------------
# Garmin constants
# IDs and required metadata fields verified against garminconnect.workout module
# and the ExecutableStepDTO/RepeatGroupDTO Jackson discriminator requirement.
# ---------------------------------------------------------------------------

_SPORT_RUNNING = {"sportTypeId": 1, "sportTypeKey": "running", "displayOrder": 1}

# Step types — displayOrder matches stepTypeId
_STEP_WARMUP   = {"stepTypeId": 1, "stepTypeKey": "warmup",   "displayOrder": 1}
_STEP_COOLDOWN = {"stepTypeId": 2, "stepTypeKey": "cooldown", "displayOrder": 2}
_STEP_INTERVAL = {"stepTypeId": 3, "stepTypeKey": "interval", "displayOrder": 3}
_STEP_RECOVERY = {"stepTypeId": 4, "stepTypeKey": "recovery", "displayOrder": 4}
_STEP_REST     = {"stepTypeId": 5, "stepTypeKey": "rest",     "displayOrder": 5}
_STEP_REPEAT   = {"stepTypeId": 6, "stepTypeKey": "repeat",   "displayOrder": 6}

# End conditions: verified from live Garmin API behaviour (conditionTypeId 1 = lap button press)
_END_DISTANCE   = {"conditionTypeId": 3, "conditionTypeKey": "distance",   "displayOrder": 3, "displayable": True}
_END_TIME       = {"conditionTypeId": 2, "conditionTypeKey": "time",       "displayOrder": 2, "displayable": True}
_END_ITERATIONS = {"conditionTypeId": 7, "conditionTypeKey": "iterations", "displayOrder": 7, "displayable": False}

# Target types (displayOrder matches workoutTargetTypeId)
_TARGET_NONE = {"workoutTargetTypeId": 1, "workoutTargetTypeKey": "no.target", "displayOrder": 1}
_TARGET_PACE = {"workoutTargetTypeId": 6, "workoutTargetTypeKey": "pace.zone", "displayOrder": 6}

# Fallback default pace when no profile pace available (5:30/km)
_DEFAULT_PACE_MPS = 1000.0 / (5.5 * 60)

# Jackson polymorphic type discriminators required by Garmin's workout-service
_TYPE_STEP   = "ExecutableStepDTO"
_TYPE_REPEAT = "RepeatGroupDTO"


def _pace_to_mps(pace_min_km: float) -> float:
    """Convert min/km to m/s."""
    return 1000.0 / (pace_min_km * 60.0)


def _pace_target(pace_min_km: float, tolerance_pct: float = 0.05) -> dict:
    """Build a pace-zone target centred on pace_min_km ± tolerance_pct."""
    center = _pace_to_mps(pace_min_km)
    fast = center * (1 + tolerance_pct)   # faster end  (higher m/s)
    slow = center * (1 - tolerance_pct)   # slower end  (lower m/s)
    return {
        **_TARGET_PACE,
        "targetValueOne": round(fast, 4),
        "targetValueTwo": round(slow, 4),
    }


def _make_step(
    step_type: dict,
    order: int,
    end_condition: dict,
    end_value: float,
    target: dict | None = None,
) -> dict:
    """Build an ExecutableStepDTO dict."""
    # Pace targets: type keys go under targetType; value bounds stay at step level
    if target and "targetValueOne" in target:
        type_keys = {"workoutTargetTypeId", "workoutTargetTypeKey", "displayOrder"}
        target_type = {k: v for k, v in target.items() if k in type_keys}
        extra = {k: v for k, v in target.items() if k not in type_keys}
    else:
        target_type = target or _TARGET_NONE
        extra = {}

    step: dict[str, Any] = {
        "type": _TYPE_STEP,
        "stepOrder": order,
        "stepType": step_type,
        "endCondition": end_condition,
        "endConditionValue": end_value,
        "targetType": target_type,
    }
    step.update(extra)
    return step


def _step_distance(step_type: dict, order: int, distance_m: float, target: dict | None = None) -> dict:
    return _make_step(step_type, order, _END_DISTANCE, round(distance_m, 1), target)


def _step_time(step_type: dict, order: int, seconds: int, target: dict | None = None) -> dict:
    return _make_step(step_type, order, _END_TIME, float(seconds), target)


def _repeat_block(order: int, reps: int, child_steps: list[dict]) -> dict:
    for i, s in enumerate(child_steps):
        s["stepOrder"] = i + 1
    return {
        "type": _TYPE_REPEAT,
        "stepOrder": order,
        "stepType": _STEP_REPEAT,
        "endCondition": _END_ITERATIONS,
        "endConditionValue": float(reps),
        "numberOfIterations": reps,
        "smartRepeat": False,
        "workoutSteps": child_steps,
    }


# ---------------------------------------------------------------------------
# Per-workout-type builders
# ---------------------------------------------------------------------------

def _build_easy(dist_m: float, pace_min_km: float | None) -> list[dict]:
    wu = min(1000.0, dist_m * 0.12)
    cd = min(800.0, dist_m * 0.10)
    main = max(dist_m - wu - cd, dist_m * 0.78)
    return [
        _step_distance(_STEP_WARMUP, 1, wu),
        _step_distance(_STEP_INTERVAL, 2, main),
        _step_distance(_STEP_COOLDOWN, 3, cd),
    ]


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
    target = _pace_target(pace_min_km) if pace_min_km else None
    return [
        _step_distance(_STEP_WARMUP, 1, wu),
        _step_distance(_STEP_INTERVAL, 2, tempo, target=target),
        _step_distance(_STEP_COOLDOWN, 3, cd),
    ]


def _build_interval(dist_m: float, pace_min_km: float | None) -> list[dict]:
    wu = min(2000.0, dist_m * 0.20)
    cd = min(2000.0, dist_m * 0.20)
    work_dist = max(dist_m - wu - cd, dist_m * 0.60)

    if work_dist <= 4000:
        rep_m = 400.0
    elif work_dist <= 8000:
        rep_m = 1000.0
    else:
        rep_m = 1600.0

    # Recovery is time-based so reps = work distance / rep distance
    reps = max(3, min(8, int(round(work_dist / rep_m))))
    # ~90s per 1 km of rep; minimum 60s
    recovery_secs = max(60, int(rep_m * 0.09))

    target = _pace_target(pace_min_km) if pace_min_km else None
    child_steps = [
        _step_distance(_STEP_INTERVAL, 1, rep_m, target=target),
        _step_time(_STEP_REST, 2, recovery_secs),
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

    if dist_m is None or dist_m <= 0:
        dist_m = 8000.0
    if pace is None and profile and profile.threshold_pace_min_km:
        pace = profile.threshold_pace_min_km * 1.20

    builders = {
        "easy": _build_easy,
        "long": _build_long,
        "tempo": _build_tempo,
        "interval": _build_interval,
    }
    builder = builders.get(wtype, _build_easy)
    steps = builder(dist_m, pace)

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
        excerpt = plan_day.description[:60].split(".")[0]
        if excerpt and excerpt.lower() not in workout_name.lower():
            workout_name = f"{workout_name} ({excerpt})"

    return {
        "workoutName": workout_name,
        "description": plan_day.description or "",
        "sportType": _SPORT_RUNNING,
        "estimatedDurationInSecs": est_duration_sec,
        "estimatedDistanceInMeters": round(dist_m, 1),
        "author": {},
        "workoutSegments": [
            {
                "segmentOrder": 1,
                "sportType": _SPORT_RUNNING,
                "workoutSteps": steps,
            }
        ],
    }


def translate_race_pacing(
    race_name: str,
    race_date: date,
    splits: "list[PacingSplit]",
) -> dict:
    """Build a Garmin structured-workout JSON for a race-day pacing plan.

    Each split becomes a distance-based interval step with a per-km pace target.
    Uses a tighter 3% pace tolerance than training workouts.
    """
    steps = []
    for i, split in enumerate(splits):
        target = _pace_target(split.target_pace_min_km, tolerance_pct=0.03)
        steps.append(_step_distance(_STEP_INTERVAL, i + 1, split.split_distance_m, target=target))

    total_dist = sum(s.split_distance_m for s in splits)
    total_time = sum(s.split_time_sec for s in splits)

    return {
        "workoutName": f"Race Pacing — {race_name}",
        "description": f"Race day pacing plan for {race_name} on {race_date.isoformat()}",
        "sportType": _SPORT_RUNNING,
        "estimatedDurationInSecs": round(total_time),
        "estimatedDistanceInMeters": round(total_dist, 1),
        "author": {},
        "workoutSegments": [
            {
                "segmentOrder": 1,
                "sportType": _SPORT_RUNNING,
                "workoutSteps": steps,
            }
        ],
    }
