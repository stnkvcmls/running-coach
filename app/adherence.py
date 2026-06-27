"""Workout adherence computation: compare a completed activity to its planned workout."""

from __future__ import annotations

import json

from app.models import Activity
from app.schemas import IntervalAdherence, WorkoutAdherence, WorkoutStepResponse


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
    mins, secs = divmod(int(round(pace_sec_per_km)), 60)
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


def _format_pace_sec(pace_sec_per_km: float | None) -> str | None:
    """Format seconds-per-km into a 'm:ss/km' display string."""
    if not pace_sec_per_km or pace_sec_per_km <= 0:
        return None
    mins = int(pace_sec_per_km // 60)
    secs = int(pace_sec_per_km % 60)
    return f"{mins}:{secs:02d}/km"


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


# Lap intensity types that represent rest/recovery (not running distance).
_REST_INTENSITY_TYPES = {"REST", "RECOVERY"}

# Lap intensity types that are run at an easy, untargeted pace. They count
# toward running distance but are excluded from the pace comparison, which is
# anchored on the workout's interval/tempo target pace.
_EASY_INTENSITY_TYPES = {"WARMUP", "WARM_UP", "COOLDOWN", "COOL_DOWN"}


def _step_distance_m(step: WorkoutStepResponse, pace_sec_per_km: float | None) -> float | None:
    """Distance contribution of a single step.

    Distance-based steps return their value directly. Time-based steps are
    converted to distance using ``pace_sec_per_km`` (the step's own target pace
    or a fallback). Returns ``None`` when the step has no measurable distance
    (e.g. a time-based step with no pace available, or a lap-button step).
    """
    if step.end_condition == "distance" and step.end_condition_value:
        return step.end_condition_value
    if step.end_condition == "time" and step.end_condition_value and pace_sec_per_km:
        return step.end_condition_value / pace_sec_per_km * 1000.0
    return None


def _actual_from_splits(
    activity: Activity,
) -> tuple[float | None, float | None, float | None]:
    """Derive running/rest distance and work-interval pace from Garmin laps.

    Reads ``activity.splits_json`` (``lapDTOs``) and classifies each lap by its
    ``intensityType``:

    - REST/RECOVERY → rest distance (excluded from distance and pace).
    - WARMUP/COOLDOWN → count toward running distance but NOT toward the pace
      average (they're run easy with no pace target, so including them would
      unfairly drag the average away from the interval/tempo target).
    - everything else (ACTIVE/INTERVAL/untyped) → "work" laps that drive both
      running distance and the pace average.

    Returns ``(running_dist_m, rest_dist_m, work_pace_sec_per_km)``. The pace
    falls back to all running laps when no work laps are distinguishable.

    Falls back to the activity totals (whole-activity distance and average
    pace, no rest split) when per-lap data is unavailable or unusable.
    """
    running_dist = 0.0          # all non-rest distance (warmup + cooldown + work)
    rest_dist = 0.0
    work_dist = 0.0             # work-interval distance only (for pace)
    work_dur = 0.0
    run_dist = 0.0              # all running distance/duration (pace fallback)
    run_dur = 0.0
    saw_lap = False

    if activity.splits_json:
        try:
            data = json.loads(activity.splits_json)
        except (json.JSONDecodeError, TypeError):
            data = None
        laps = data.get("lapDTOs") if isinstance(data, dict) else None
        if isinstance(laps, list):
            for lap in laps:
                if not isinstance(lap, dict):
                    continue
                dist = lap.get("distance")
                if not isinstance(dist, (int, float)) or dist <= 0:
                    continue
                saw_lap = True
                intensity = str(lap.get("intensityType") or "").upper()
                if intensity in _REST_INTENSITY_TYPES:
                    rest_dist += dist
                    continue
                running_dist += dist
                dur = (
                    lap.get("duration")
                    or lap.get("movingDuration")
                    or lap.get("elapsedDuration")
                )
                dur = dur if isinstance(dur, (int, float)) and dur > 0 else 0.0
                run_dist += dist
                run_dur += dur
                if intensity not in _EASY_INTENSITY_TYPES:
                    work_dist += dist
                    work_dur += dur

    if not saw_lap:
        # Fallback: no per-lap data — use whole-activity totals, no rest split.
        actual_pace_sec = (
            activity.avg_pace_min_km * 60 if activity.avg_pace_min_km else None
        )
        return activity.distance_m, None, actual_pace_sec

    # Pace from work intervals only; fall back to all running laps when no work
    # laps are distinguishable (e.g. a steady run with only warmup/cooldown).
    if work_dist > 0 and work_dur > 0:
        pace_sec = work_dur / (work_dist / 1000.0)
    elif run_dist > 0 and run_dur > 0:
        pace_sec = run_dur / (run_dist / 1000.0)
    else:
        pace_sec = None

    return (
        running_dist or None,
        rest_dist or None,
        pace_sec,
    )


def _ordered_laps(activity: Activity) -> list[dict]:
    """Parse ``splits_json`` lapDTOs into an ordered list of executed laps.

    Each entry is ``{distance, duration, intensity, is_rest, pace_sec}``. Laps
    with no positive distance are skipped. Returns ``[]`` when no usable lap data
    exists (so the caller falls back to whole-activity aggregates only).
    """
    if not activity.splits_json:
        return []
    try:
        data = json.loads(activity.splits_json)
    except (json.JSONDecodeError, TypeError):
        return []
    laps = data.get("lapDTOs") if isinstance(data, dict) else None
    if not isinstance(laps, list):
        return []

    result: list[dict] = []
    for lap in laps:
        if not isinstance(lap, dict):
            continue
        dist = lap.get("distance")
        if not isinstance(dist, (int, float)) or dist <= 0:
            continue
        intensity = str(lap.get("intensityType") or "").upper()
        dur = lap.get("duration") or lap.get("movingDuration") or lap.get("elapsedDuration")
        dur = dur if isinstance(dur, (int, float)) and dur > 0 else None
        pace_sec = dur / (dist / 1000.0) if dur else None
        result.append(
            {
                "distance": float(dist),
                "duration": dur,
                "intensity": intensity,
                "is_rest": intensity in _REST_INTENSITY_TYPES,
                "pace_sec": pace_sec,
            }
        )
    return result


# Step types that carry a per-rep numbered label (e.g. "Interval 1").
_NUMBERED_STEP_TYPES = {"interval", "rest"}

_STEP_LABEL = {
    "warmup": "Warmup",
    "cooldown": "Cooldown",
    "interval": "Interval",
    "rest": "Recovery",
    "repeat": "Interval",
}


def _step_channel(step: WorkoutStepResponse) -> str:
    """Map a planned step to an alignment channel."""
    if step.step_type == "warmup":
        return "warmup"
    if step.step_type == "cooldown":
        return "cooldown"
    if step.activity_type == "rest" or step.step_type == "rest":
        return "rest"
    return "work"


def _lap_channel(intensity: str, is_rest: bool) -> str:
    """Map an executed lap (by Garmin ``intensityType``) to an alignment channel."""
    if "WARM" in intensity:
        return "warmup"
    if "COOL" in intensity:
        return "cooldown"
    if is_rest:
        return "rest"
    return "work"


def _consume_channel_laps(
    laps: list[dict], start: int, planned_dist_m: float | None
) -> tuple[dict, int]:
    """Consume one or more raw laps from ``start`` to match one planned step.

    For distance-based steps the function greedily consumes consecutive laps
    until the accumulated distance reaches at least 85 % of ``planned_dist_m``.
    This handles Garmin auto-lap (e.g. a 2 km warmup recorded as two 1 km laps)
    without over-consuming into a separately planned step.
    For time-based or distance-unknown steps a single lap is consumed.

    Returns ``(segment_dict, next_cursor)``.
    """
    lap = laps[start]
    total_dist = lap["distance"]
    total_dur = lap["duration"] or 0.0
    end = start + 1

    if planned_dist_m is not None:
        threshold = planned_dist_m * 0.85
        while end < len(laps) and total_dist < threshold:
            nxt = laps[end]
            total_dist += nxt["distance"]
            total_dur += nxt["duration"] or 0.0
            end += 1

    pace_sec = total_dur / (total_dist / 1000.0) if total_dur and total_dist else None
    return {
        "distance": total_dist,
        "duration": total_dur if total_dur else None,
        "pace_sec": pace_sec,
        "intensity": lap["intensity"],
        "is_rest": lap["is_rest"],
    }, end


def _align_intervals(
    flat_steps: list[WorkoutStepResponse],
    laps: list[dict],
) -> list[IntervalAdherence]:
    """Align executed laps to planned steps for per-rep deltas.

    Planned steps and executed laps do not line up by index in practice: Garmin
    auto-lap splits long steps and the recorded lap count rarely equals the
    planned step count. Each side is bucketed into channels
    (warmup / work-interval / rest / cooldown) and paired in order within each
    channel. Rows are emitted in planned order, so the table still reads top to
    bottom as the workout was prescribed. Steps with no remaining lap in their
    channel are returned with ``matched=False``. Returns ``[]`` for trivial
    workouts (no interval structure) so the UI only shows the breakdown when it
    adds value.

    Laps are NOT pre-merged. Instead, :func:`_consume_channel_laps` greedily
    consumes one or more raw laps per planned step, guided by the step's planned
    distance. This correctly handles both Garmin auto-lap splits (a 2 km warmup
    → two 1 km laps that are consumed together) and back-to-back intervals that
    share the same Garmin ``intensityType`` but have distinct planned distances
    (each 300 m step gets its own lap rather than all being merged into one).

    Planned pace and distance are taken from each step's *own* target only.
    Steps without a pace target of their own (warmup, cooldown, untargeted
    rests) are never graded against the interval pace: their actual pace is
    shown for reference but no planned pace, delta, or fabricated time→distance
    target is invented for them.
    """
    has_structure = sum(1 for s in flat_steps if s.step_type in _NUMBERED_STEP_TYPES) >= 2
    if not has_structure or not laps:
        return []

    # Per-channel FIFO queues of raw executed laps (no pre-merging).
    raw_queues: dict[str, list[dict]] = {"warmup": [], "work": [], "rest": [], "cooldown": []}
    for lap in laps:
        raw_queues[_lap_channel(lap["intensity"], lap["is_rest"])].append(lap)
    cursor: dict[str, int] = {ch: 0 for ch in raw_queues}

    counters: dict[str, int] = {}
    rows: list[IntervalAdherence] = []
    for i, step in enumerate(flat_steps):
        base = _STEP_LABEL.get(step.step_type, step.step_type.title())
        if step.step_type in _NUMBERED_STEP_TYPES:
            counters[step.step_type] = counters.get(step.step_type, 0) + 1
            label = f"{base} {counters[step.step_type]}"
        else:
            label = base

        # Only the step's own pace target drives grading — no interval fallback.
        own_pace = (
            _parse_pace_display(step.target_display)
            if step.target_type == "pace" and step.target_display
            else None
        )
        planned_dist = _step_distance_m(step, own_pace)
        is_rest = step.activity_type == "rest"
        planned_pace_display = step.target_display if own_pace is not None else None

        channel = _step_channel(step)
        seg = None
        if cursor[channel] < len(raw_queues[channel]):
            seg, cursor[channel] = _consume_channel_laps(
                raw_queues[channel], cursor[channel], planned_dist
            )

        if seg is None:
            rows.append(
                IntervalAdherence(
                    step_order=i + 1,
                    label=label,
                    step_type=step.step_type,
                    planned_distance_m=planned_dist,
                    planned_pace_display=planned_pace_display,
                    matched=False,
                )
            )
            continue

        actual_dist = seg["distance"]
        actual_pace_sec = seg["pace_sec"]
        # Show actual pace for running steps (informational); only grade the
        # delta when the step set its own pace target.
        actual_pace_display = None if is_rest else _format_pace_sec(actual_pace_sec)
        pace_delta = None
        if own_pace is not None and not is_rest and actual_pace_sec is not None:
            pace_delta = round(actual_pace_sec - own_pace, 1)
        distance_delta = (
            round(actual_dist - planned_dist, 1) if planned_dist is not None else None
        )

        # Per-interval composite score (pace + distance), only for interval steps.
        # Warmup, cooldown, and rest carry no score since they lack pace targets.
        iv_score: float | None = None
        if step.step_type == "interval" and not is_rest:
            iv_score_parts: list[float] = []
            if own_pace is not None and actual_pace_sec is not None:
                iv_score_parts.append(max(0.0, 100.0 - (abs(actual_pace_sec - own_pace) / 30.0) * 50.0))
            if planned_dist is not None and actual_dist is not None:
                iv_score_parts.append(min(100.0, (actual_dist / planned_dist) * 100.0))
            if iv_score_parts:
                iv_score = round(sum(iv_score_parts) / len(iv_score_parts), 1)

        rows.append(
            IntervalAdherence(
                step_order=i + 1,
                label=label,
                step_type=step.step_type,
                planned_distance_m=planned_dist,
                actual_distance_m=actual_dist,
                planned_pace_display=planned_pace_display,
                actual_pace_display=actual_pace_display,
                pace_delta_sec_per_km=pace_delta,
                distance_delta_m=distance_delta,
                matched=True,
                interval_score=iv_score,
            )
        )
    return rows


def _compute_interval_pace_score(intervals: list[IntervalAdherence]) -> float | None:
    """Distance-weighted composite score across all planned interval steps.

    Unmatched steps contribute 0, so missed intervals drag the score down.
    Returns None when no graded interval steps are present (no pace or distance
    target on any interval step), so the caller can fall back to aggregate scoring.
    """
    has_graded = False
    weighted_sum = 0.0
    total_weight = 0.0
    for iv in intervals:
        if iv.step_type != "interval":
            continue
        weight = iv.planned_distance_m or 1.0
        if not iv.matched:
            # Missed interval — penalised as 0.
            weighted_sum += 0.0
            total_weight += weight
            has_graded = True
        elif iv.interval_score is not None:
            weighted_sum += iv.interval_score * weight
            total_weight += weight
            has_graded = True
    if not has_graded or total_weight == 0.0:
        return None
    return weighted_sum / total_weight


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

    # --- Planned pace: distance-weighted average of all interval pace targets ---
    # Using only the first pace target misrepresents workouts where intervals
    # alternate between speeds (e.g. 300 m fast + 300 m slow × 7): the blended
    # actual pace would be compared against the fast target alone, making a
    # perfectly executed run look slow. A weighted average reflects what the
    # athlete's overall pace is expected to be across the full workout.
    planned_pace_display: str | None = None
    planned_pace_sec: float | None = None
    _pace_num = 0.0  # sum of pace_sec × distance_m
    _pace_den = 0.0  # sum of distance_m
    for step in flat:
        if step.step_type != "interval" or step.target_type != "pace" or not step.target_display:
            continue
        parsed = _parse_pace_display(step.target_display)
        if parsed is None:
            continue
        # Use the step's own distance when known; fall back to equal weighting.
        dist = _step_distance_m(step, parsed) or 1.0
        _pace_num += parsed * dist
        _pace_den += dist
    if _pace_den > 0:
        planned_pace_sec = _pace_num / _pace_den
        planned_pace_display = _format_pace_sec(planned_pace_sec)

    # --- Planned distance: running periods only (warmup + cooldown + intervals).
    # Rest/recovery is excluded and tracked separately. Time-based running steps
    # are converted to distance via their own target pace, falling back to the
    # workout's planned interval pace. ---
    planned_distance_m: float | None = None
    planned_rest_distance_m: float | None = None
    for step in flat:
        step_pace = _parse_pace_display(step.target_display) if step.target_display else None
        pace = step_pace or planned_pace_sec
        dist = _step_distance_m(step, pace)
        if dist is None:
            continue
        if step.activity_type == "rest":
            planned_rest_distance_m = (planned_rest_distance_m or 0.0) + dist
        else:
            planned_distance_m = (planned_distance_m or 0.0) + dist

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

    # --- Actual running distance / rest distance / running-only pace ---
    actual_distance_m, actual_rest_distance_m, actual_pace_sec = _actual_from_splits(activity)

    actual_pace_display: str | None = _format_pace_sec(actual_pace_sec)

    # --- Distance adherence (running-only on both sides) ---
    distance_pct: float | None = None
    if planned_distance_m and actual_distance_m:
        distance_pct = min(100.0, (actual_distance_m / planned_distance_m) * 100.0)

    # --- Pace delta (positive = slower than plan) ---
    pace_delta_sec: float | None = None
    if actual_pace_sec is not None and planned_pace_sec is not None:
        pace_delta_sec = actual_pace_sec - planned_pace_sec

    # --- Per-interval breakdown (computed early so the score can use it) ---
    intervals = _align_intervals(flat, _ordered_laps(activity)) or None

    # --- Adherence score (0–100) ---
    # Use per-interval weighted scores when available: this catches workouts
    # where fast and slow intervals cancel out in the aggregate but each rep
    # individually deviated from its target.
    score_components: list[float] = []
    if distance_pct is not None:
        score_components.append(distance_pct)
    if intervals:
        per_iv = _compute_interval_pace_score(intervals)
        if per_iv is not None:
            score_components.append(per_iv)
        elif pace_delta_sec is not None:
            # Intervals present but none have graded steps → fall back to aggregate.
            pace_score = max(0.0, 100.0 - (abs(pace_delta_sec) / 30.0) * 50.0)
            score_components.append(pace_score)
    elif pace_delta_sec is not None:
        # No per-interval breakdown available → aggregate pace score.
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
    if actual_rest_distance_m:
        summary_parts.append(f"{int(round(actual_rest_distance_m))} m in rest")

    return WorkoutAdherence(
        planned_distance_m=planned_distance_m,
        planned_rest_distance_m=planned_rest_distance_m,
        actual_distance_m=actual_distance_m,
        actual_rest_distance_m=actual_rest_distance_m,
        distance_pct=round(distance_pct, 1) if distance_pct is not None else None,
        planned_pace_display=planned_pace_display,
        actual_pace_display=actual_pace_display,
        pace_delta_sec_per_km=round(pace_delta_sec, 1) if pace_delta_sec is not None else None,
        planned_intervals=planned_intervals,
        actual_laps=actual_laps,
        adherence_score=round(adherence_score, 1),
        summary=", ".join(summary_parts),
        intervals=intervals,
    )


def format_adherence_context(adherence: WorkoutAdherence) -> str:
    """Format adherence data as a markdown section for the AI coach."""
    lines = [f"## Workout Adherence\n{adherence.summary}"]
    if adherence.planned_distance_m is not None and adherence.actual_distance_m is not None:
        rest_note = (
            f" (+{int(round(adherence.actual_rest_distance_m))} m rest)"
            if adherence.actual_rest_distance_m
            else ""
        )
        lines.append(
            f"Distance (running only): planned {adherence.planned_distance_m / 1000:.2f} km"
            f" / actual {adherence.actual_distance_m / 1000:.2f} km{rest_note}"
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

    if adherence.intervals:
        lines.append("Per-interval execution:")
        for iv in adherence.intervals:
            if not iv.matched:
                lines.append(f"- {iv.label}: missed (no matching lap)")
                continue
            parts: list[str] = []
            if iv.actual_distance_m is not None:
                parts.append(f"{iv.actual_distance_m / 1000:.2f} km")
            if iv.actual_pace_display:
                parts.append(f"@ {iv.actual_pace_display}")
            if iv.pace_delta_sec_per_km is not None and iv.pace_delta_sec_per_km != 0:
                sign = "+" if iv.pace_delta_sec_per_km > 0 else "-"
                parts.append(f"({sign}{abs(iv.pace_delta_sec_per_km):.0f}s/km)")
            lines.append(f"- {iv.label}: {' '.join(parts)}" if parts else f"- {iv.label}")

    return "\n".join(lines)
