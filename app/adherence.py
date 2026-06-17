"""Workout adherence computation: compare a completed activity to its planned workout."""

from __future__ import annotations

import json

from app.models import Activity
from app.schemas import WorkoutAdherence, WorkoutStepResponse


# ---------------------------------------------------------------------------
# Workout step parsing helpers (moved from api.py)
# ---------------------------------------------------------------------------

def _format_step_distance(meters: float) -> str:
    if meters >= 1000:
        km = meters / 1000
        return f"{km:g}km" if km == int(km) else f"{km:.1f}km"
    return f"{int(meters)}m"


def _format_step_duration(seconds: float) -> str:
    seconds = int(seconds)
    if seconds >= 60:
        m = seconds // 60
        s = seconds % 60
        if s > 0:
            return f"{m}:{s:02d}"
        return f"{m} min"
    return f"{seconds}s"


def _format_pace(meters_per_sec: float) -> str:
    if meters_per_sec <= 0:
        return ""
    pace_sec_per_km = 1000.0 / meters_per_sec
    mins = int(pace_sec_per_km // 60)
    secs = int(pace_sec_per_km % 60)
    return f"{mins}:{secs:02d}/km"


def _garmin_str(value) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        for k, v in value.items():
            if k.endswith("Key") and isinstance(v, str):
                return v
        for v in value.values():
            if isinstance(v, str):
                return v
    return ""


def _parse_step_target(step: dict) -> tuple[str | None, str | None]:
    target_type_raw = _garmin_str(step.get("targetType") or step.get("type") or "")
    target_type_lower = target_type_raw.lower().replace(".", "_") if target_type_raw else ""

    if "pace" in target_type_lower or "speed" in target_type_lower:
        val1 = step.get("targetValueOne") or step.get("targetValue")
        val2 = step.get("targetValueTwo")
        if val1 and isinstance(val1, (int, float)) and val1 > 0:
            pace1 = _format_pace(val1)
            if val2 and isinstance(val2, (int, float)) and val2 > 0 and val2 != val1:
                pace2 = _format_pace(val2)
                return "pace", f"{pace2} - {pace1}" if val2 > val1 else f"{pace1} - {pace2}"
            return "pace", pace1
        zone = step.get("targetValueOne") or step.get("zoneNumber")
        if zone:
            return "pace", f"Pace Zone {zone}"
        return "pace", None

    if "heart" in target_type_lower:
        zone = step.get("zoneNumber") or step.get("targetValueOne")
        if zone:
            return "heart_rate", f"HR Zone {int(zone)}"
        return "heart_rate", None

    return "open", None


def _classify_activity_type(step_type: str) -> str:
    rest_types = {"rest", "recovery", "recover"}
    return "rest" if step_type in rest_types else "run"


def _parse_single_step(step: dict, order: int) -> WorkoutStepResponse:
    step_type_raw = _garmin_str(step.get("stepType") or step.get("type") or "interval").lower()
    step_type_map = {
        "warmup": "warmup", "warm_up": "warmup", "warm up": "warmup",
        "cooldown": "cooldown", "cool_down": "cooldown", "cool down": "cooldown",
        "interval": "interval", "active": "interval",
        "rest": "rest", "recovery": "rest", "recover": "rest",
        "repeat": "repeat",
        "other": "interval",
    }
    step_type = step_type_map.get(step_type_raw, step_type_raw)

    end_condition_raw = _garmin_str(step.get("endCondition") or step.get("conditionType") or "").lower()
    end_condition_raw = end_condition_raw.replace(".", "_")
    end_value = step.get("endConditionValue") or step.get("conditionValue")

    end_condition = None
    end_condition_display = None
    if "distance" in end_condition_raw and end_value:
        end_condition = "distance"
        end_condition_display = _format_step_distance(float(end_value))
    elif "time" in end_condition_raw and end_value:
        end_condition = "time"
        end_condition_display = _format_step_duration(float(end_value))
    elif "lap" in end_condition_raw:
        end_condition = "lap_button"
        end_condition_display = "Lap Button"

    target_type, target_display = _parse_step_target(step)
    description = step.get("description") or step.get("stepDescription") or None

    repeat_count = None
    nested_steps = None
    if step_type == "repeat":
        repeat_count = step.get("repeatCount") or step.get("numberOfIterations")
        if repeat_count:
            repeat_count = int(repeat_count)
        child_steps = step.get("workoutSteps") or step.get("steps") or []
        if isinstance(child_steps, list) and child_steps:
            nested_steps = [
                _parse_single_step(s, i + 1)
                for i, s in enumerate(child_steps)
            ]

    return WorkoutStepResponse(
        step_order=order,
        step_type=step_type,
        end_condition=end_condition,
        end_condition_value=float(end_value) if end_value else None,
        end_condition_display=end_condition_display,
        target_type=target_type,
        target_display=target_display,
        description=description,
        activity_type=_classify_activity_type(step_type),
        repeat_count=repeat_count,
        steps=nested_steps,
    )


def parse_workout_steps(raw_json_str: str) -> list[WorkoutStepResponse]:
    """Parse Garmin raw_json into structured workout steps."""
    try:
        data = json.loads(raw_json_str)
    except (json.JSONDecodeError, TypeError):
        return []

    steps_raw = data.get("workoutSteps") or data.get("steps") or []

    if not steps_raw:
        segments = data.get("workoutSegments") or []
        for seg in segments:
            if isinstance(seg, dict):
                seg_steps = seg.get("workoutSteps") or seg.get("steps") or []
                if isinstance(seg_steps, list):
                    steps_raw.extend(seg_steps)

    if not isinstance(steps_raw, list):
        return []

    result = []
    order = 1
    for s in steps_raw:
        if not isinstance(s, dict):
            continue
        parsed = _parse_single_step(s, order)
        result.append(parsed)
        order += 1

    return result


# ---------------------------------------------------------------------------
# Adherence computation
# ---------------------------------------------------------------------------

def _flatten_steps(steps: list[WorkoutStepResponse]) -> list[WorkoutStepResponse]:
    """Expand repeat blocks into their constituent steps (repeated N times)."""
    flat: list[WorkoutStepResponse] = []
    for step in steps:
        if step.step_type == "repeat" and step.steps and step.repeat_count:
            for _ in range(step.repeat_count):
                flat.extend(_flatten_steps(step.steps))
        else:
            flat.append(step)
    return flat


def _parse_single_pace(pace_str: str) -> float | None:
    """Parse 'mm:ss' into total seconds per km."""
    try:
        parts = pace_str.split(":")
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
    except (ValueError, IndexError):
        pass
    return None


def _parse_pace_display(pace_display: str) -> float | None:
    """Parse pace display like '4:30/km' or '4:25 - 4:35/km' into sec/km."""
    if not pace_display or "/km" not in pace_display:
        return None
    pace_str = pace_display.replace("/km", "").strip()
    if " - " in pace_str:
        parts_list = pace_str.split(" - ")
        paces = [_parse_single_pace(p.strip()) for p in parts_list]
        valid = [p for p in paces if p is not None]
        return sum(valid) / len(valid) if valid else None
    return _parse_single_pace(pace_str)


def compute_adherence(
    activity: Activity,
    workout_steps: list[WorkoutStepResponse],
) -> WorkoutAdherence | None:
    """Compare a completed activity to its planned workout steps.

    Returns None when there are no workout steps to compare against.
    """
    if not workout_steps:
        return None

    flat = _flatten_steps(workout_steps)

    # --- Planned distance (sum of all distance-based steps, including recovery) ---
    planned_distance_m: float | None = None
    for step in flat:
        if step.end_condition == "distance" and step.end_condition_value:
            planned_distance_m = (planned_distance_m or 0.0) + step.end_condition_value

    # --- Planned pace: first interval step with a concrete pace target ---
    planned_pace_display: str | None = None
    planned_pace_sec: float | None = None
    for step in flat:
        if step.step_type == "interval" and step.target_type == "pace" and step.target_display:
            parsed = _parse_pace_display(step.target_display)
            if parsed is not None:
                planned_pace_display = step.target_display
                planned_pace_sec = parsed
                break

    # --- Planned interval count (unique interval steps after expansion) ---
    planned_intervals = sum(1 for s in flat if s.step_type == "interval") or None

    # --- Actual lap count ---
    actual_laps: int | None = None
    if activity.laps_json:
        try:
            laps_data = json.loads(activity.laps_json)
            if isinstance(laps_data, list):
                actual_laps = len(laps_data)
        except (json.JSONDecodeError, TypeError):
            pass

    # --- Actual pace display ---
    actual_pace_display: str | None = None
    actual_pace_sec: float | None = None
    if activity.avg_pace_min_km:
        p_min = int(activity.avg_pace_min_km)
        p_sec = int((activity.avg_pace_min_km - p_min) * 60)
        actual_pace_display = f"{p_min}:{p_sec:02d}/km"
        actual_pace_sec = activity.avg_pace_min_km * 60

    # --- Distance adherence ---
    distance_pct: float | None = None
    if planned_distance_m and activity.distance_m:
        distance_pct = min(100.0, (activity.distance_m / planned_distance_m) * 100.0)

    # --- Pace delta (positive = slower than plan) ---
    pace_delta_sec: float | None = None
    if actual_pace_sec is not None and planned_pace_sec is not None:
        pace_delta_sec = actual_pace_sec - planned_pace_sec

    # --- Adherence score (0–100) ---
    score_components: list[float] = []
    if distance_pct is not None:
        score_components.append(distance_pct)
    if pace_delta_sec is not None:
        # 30 s/km tolerance → score drops linearly to 0 at 60 s/km off target
        pace_score = max(0.0, 100.0 - (abs(pace_delta_sec) / 30.0) * 50.0)
        score_components.append(pace_score)
    adherence_score = sum(score_components) / len(score_components) if score_components else 100.0

    # --- Human-readable summary ---
    summary_parts: list[str] = []
    if distance_pct is not None:
        summary_parts.append(f"{distance_pct:.0f}% of planned distance")
    if pace_delta_sec is not None:
        direction = "slower" if pace_delta_sec > 0 else "faster"
        delta_abs = abs(pace_delta_sec)
        if delta_abs >= 60:
            delta_str = f"{int(delta_abs // 60)}:{int(delta_abs % 60):02d}"
        else:
            delta_str = f"{int(delta_abs)}s"
        summary_parts.append(f"{delta_str}/km {direction} than target")
    if not summary_parts:
        summary_parts.append("Workout completed (no distance/pace plan to compare)")

    return WorkoutAdherence(
        planned_distance_m=planned_distance_m,
        actual_distance_m=activity.distance_m,
        distance_pct=round(distance_pct, 1) if distance_pct is not None else None,
        planned_pace_display=planned_pace_display,
        actual_pace_display=actual_pace_display,
        pace_delta_sec_per_km=round(pace_delta_sec, 1) if pace_delta_sec is not None else None,
        planned_intervals=planned_intervals,
        actual_laps=actual_laps,
        adherence_score=round(adherence_score, 1),
        summary=", ".join(summary_parts),
    )


def format_adherence_context(adherence: WorkoutAdherence) -> str:
    """Format adherence data as a markdown section for the AI coach."""
    lines = [f"## Workout Adherence\n{adherence.summary}"]
    if adherence.planned_distance_m is not None and adherence.actual_distance_m is not None:
        lines.append(
            f"Distance: planned {adherence.planned_distance_m / 1000:.2f} km"
            f" / actual {adherence.actual_distance_m / 1000:.2f} km"
            + (f" ({adherence.distance_pct:.0f}%)" if adherence.distance_pct is not None else "")
        )
    if adherence.planned_pace_display and adherence.actual_pace_display:
        lines.append(
            f"Pace: planned {adherence.planned_pace_display}"
            f" / actual {adherence.actual_pace_display}"
        )
    if adherence.pace_delta_sec_per_km is not None:
        direction = "slower" if adherence.pace_delta_sec_per_km > 0 else "faster"
        lines.append(f"Pace vs plan: {abs(adherence.pace_delta_sec_per_km):.0f}s/km {direction}")
    if adherence.planned_intervals is not None and adherence.actual_laps is not None:
        lines.append(
            f"Intervals: {adherence.planned_intervals} planned / {adherence.actual_laps} laps executed"
        )
    lines.append(f"Adherence score: {adherence.adherence_score:.0f}/100")
    return "\n".join(lines)
