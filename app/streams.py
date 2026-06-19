"""Activity stream parsing and mean-maximal curve computation.

Garmin's activity *details* endpoint (``get_activity_details``, stored on
``Activity.laps_json``) returns per-sample time series — power, speed, heart
rate, elevation, distance — as a column matrix (``activityDetailMetrics``) plus a
``metricDescriptors`` list saying which column is which.

From those streams we compute a **mean-maximal curve**: the best *time-weighted
average* power / grade-adjusted speed / HR sustainable over a set of standard
durations. Aggregating the per-duration best across many activities yields the
athlete's power-duration and velocity-duration curves — the proper input for the
Critical Power / Critical Velocity models in :mod:`app.threshold` (whole-activity
averages, the previous input, can't see a maximal effort buried inside a longer
run).

Curves are stored compactly per activity (``Activity.mean_max_json``) so the
estimator never has to re-parse the large raw stream blobs.
"""

from __future__ import annotations

import json
import logging

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Durations (seconds) at which the mean-maximal curve is sampled. Spans the
# anaerobic short end (for W'/Pmax) through ~90 min (aerobic threshold end).
STANDARD_DURATIONS: list[int] = [
    5, 15, 30, 60, 120, 180, 300, 480, 600, 720,
    1200, 1800, 2400, 3000, 3600, 5400,
]

# Spike-rejection caps — anything beyond these is a sensor/GPS glitch for running.
_MAX_POWER_W = 2000.0
_MAX_SPEED_MS = 12.0          # ~22 km/h, faster than a 2:45/km sprint
_MAX_HR = 240
_MIN_HR = 20

# Minetti running energy cost (J/kg/m) as a function of gradient i (rise/run);
# used to convert pace on a slope to its flat-ground (grade-adjusted) equivalent.
_FLAT_COST = 3.6
_GRADE_CLAMP = 0.30           # ignore gradients steeper than ±30%


def _normalize_key(key: str) -> str:
    """Map a Garmin metric descriptor key onto a canonical stream name."""
    k = (key or "").lower()
    if "elapsedduration" in k or k == "directtimestamp" or "sumduration" in k:
        return "time"
    if "power" in k:
        return "power"
    if "speed" in k:
        return "speed"
    if "heartrate" in k:
        return "hr"
    if "elevation" in k or "altitude" in k:
        return "elevation"
    if "sumdistance" in k or k == "distance":
        return "distance"
    if k == "directtimestamp":
        return "timestamp"
    return ""


def parse_streams(details: dict | None) -> dict[str, list[float | None]] | None:
    """Parse a Garmin details payload into per-sample stream arrays.

    Returns a dict with keys ``time, power, speed, hr, elevation, distance``
    (each a list aligned by sample, ``None`` where missing or rejected) or
    ``None`` when there's no usable stream data. ``time`` is elapsed seconds
    from the start; if no duration column exists it falls back to a timestamp
    column rebased to zero, then to the sample index.
    """
    if not isinstance(details, dict):
        return None
    descriptors = details.get("metricDescriptors")
    rows = details.get("activityDetailMetrics")
    if not isinstance(descriptors, list) or not isinstance(rows, list) or not rows:
        return None

    index_to_name: dict[int, str] = {}
    timestamp_index: int | None = None
    for d in descriptors:
        if not isinstance(d, dict):
            continue
        idx = d.get("metricsIndex")
        if idx is None:
            continue
        if d.get("key") == "directTimestamp":
            timestamp_index = idx
        name = _normalize_key(d.get("key", ""))
        # Prefer an explicit elapsed-duration column for "time"; don't let a raw
        # timestamp clobber it.
        if name and name not in index_to_name.values():
            index_to_name[idx] = name

    out: dict[str, list[float | None]] = {
        "time": [], "power": [], "speed": [], "hr": [], "elevation": [], "distance": [],
    }
    have_time = "time" in index_to_name.values()

    for i, row in enumerate(rows):
        metrics = row.get("metrics") if isinstance(row, dict) else None
        if not isinstance(metrics, list):
            continue
        sample: dict[str, float | None] = {k: None for k in out}
        for idx, name in index_to_name.items():
            if name == "time":
                continue
            if idx < len(metrics):
                sample[name] = metrics[idx]
        # Time axis
        if have_time:
            t = None
            for idx, name in index_to_name.items():
                if name == "time" and idx < len(metrics):
                    t = metrics[idx]
            sample["time"] = t
        elif timestamp_index is not None and timestamp_index < len(metrics):
            sample["time"] = metrics[timestamp_index]
        else:
            sample["time"] = float(i)
        for k in out:
            out[k].append(sample[k])

    # Rebase a timestamp-based axis (ms or s epoch) to elapsed seconds.
    times = [t for t in out["time"] if isinstance(t, (int, float))]
    if times and min(times) > 1e6:  # looks like an epoch timestamp
        base = min(times)
        scale = 1000.0 if min(times) > 1e11 else 1.0  # ms vs s epoch
        out["time"] = [
            (t - base) / scale if isinstance(t, (int, float)) else None
            for t in out["time"]
        ]

    # Spike rejection.
    out["power"] = [_clamp(v, 0.0, _MAX_POWER_W) for v in out["power"]]
    out["speed"] = [_clamp(v, 0.0, _MAX_SPEED_MS) for v in out["speed"]]
    out["hr"] = [_clamp(v, _MIN_HR, _MAX_HR) for v in out["hr"]]

    if not any(isinstance(t, (int, float)) for t in out["time"]):
        return None
    return out


def _clamp(v, lo: float, hi: float) -> float | None:
    if not isinstance(v, (int, float)):
        return None
    if v < lo or v > hi:
        return None
    return float(v)


def _minetti_factor(grade: float) -> float:
    """Flat-equivalent speed multiplier for a running gradient ``grade``.

    Ratio of Minetti's energy cost of running at ``grade`` to the flat cost, so
    uphill running maps to a faster equivalent flat speed (more effort) and
    downhill to a slower one.
    """
    i = max(-_GRADE_CLAMP, min(_GRADE_CLAMP, grade))
    cost = (
        155.4 * i**5 - 30.4 * i**4 - 43.3 * i**3
        + 46.3 * i**2 + 19.5 * i + 3.6
    )
    return max(0.1, cost / _FLAT_COST)


def grade_adjusted_speed(
    speed: list[float | None],
    elevation: list[float | None],
    distance: list[float | None],
) -> list[float | None]:
    """Convert a speed stream to grade-adjusted (flat-equivalent) speed.

    Falls back to raw speed wherever elevation/distance is unavailable.
    """
    n = len(speed)
    out: list[float | None] = list(speed)
    if not elevation or not distance:
        return out
    for i in range(1, n):
        s = speed[i]
        if s is None:
            continue
        e0, e1 = elevation[i - 1], elevation[i]
        d0, d1 = distance[i - 1], distance[i]
        if None in (e0, e1, d0, d1):
            continue
        dd = d1 - d0
        if dd <= 0:
            continue
        grade = (e1 - e0) / dd
        out[i] = s * _minetti_factor(grade)
    return out


def _best_mean(time: list[float | None], values: list[float | None], duration: float) -> float | None:
    """Best time-weighted average of ``values`` over any ≥ ``duration`` window.

    Samples with a missing time or value are dropped first; the average over a
    window is ``Σ(value·dt) / Σ(dt)`` so non-uniform (downsampled) streams are
    handled correctly. Returns ``None`` if the series is shorter than ``duration``.
    """
    pts = [
        (t, v)
        for t, v in zip(time, values)
        if isinstance(t, (int, float)) and isinstance(v, (int, float))
    ]
    pts.sort(key=lambda p: p[0])
    n = len(pts)
    if n < 2:
        return None
    if pts[-1][0] - pts[0][0] < duration:
        return None

    # Cumulative time and value·dt, attributing each interval's dt to its start.
    cum_t = [0.0] * n
    cum_vt = [0.0] * n
    for i in range(1, n):
        dt = pts[i][0] - pts[i - 1][0]
        if dt <= 0:
            dt = 0.0
        cum_t[i] = cum_t[i - 1] + dt
        cum_vt[i] = cum_vt[i - 1] + pts[i - 1][1] * dt

    best: float | None = None
    j = 0
    for i in range(n):
        if j < i:
            j = i
        while j < n and cum_t[j] - cum_t[i] < duration:
            j += 1
        if j >= n:
            break
        window_t = cum_t[j] - cum_t[i]
        if window_t <= 0:
            continue
        mean = (cum_vt[j] - cum_vt[i]) / window_t
        if best is None or mean > best:
            best = mean
    return best


def mean_max_curve(
    time: list[float | None],
    values: list[float | None],
    durations: list[int] = STANDARD_DURATIONS,
) -> dict[int, float]:
    """Best sustained average of ``values`` at each duration (omits empty ones)."""
    curve: dict[int, float] = {}
    for d in durations:
        best = _best_mean(time, values, d)
        if best is not None:
            curve[d] = round(best, 2)
    return curve


def _is_treadmill(activity_type: str | None) -> bool:
    return bool(activity_type) and "treadmill" in activity_type.lower()


def compute_curves_from_details(
    details: dict | None, activity_type: str | None = None
) -> dict | None:
    """Compute the mean-maximal curves for one activity from its detail streams.

    Returns ``{"power": {dur: w}, "gap_speed": {dur: m/s}, "speed": {...},
    "hr": {dur: bpm}, "is_treadmill": bool, "duration": seconds}`` or ``None``
    when streams can't be parsed.
    """
    streams = parse_streams(details)
    if streams is None:
        return None
    time = streams["time"]
    gap = grade_adjusted_speed(streams["speed"], streams["elevation"], streams["distance"])

    result: dict = {
        "power": {str(k): v for k, v in mean_max_curve(time, streams["power"]).items()},
        "speed": {str(k): v for k, v in mean_max_curve(time, streams["speed"]).items()},
        "gap_speed": {str(k): v for k, v in mean_max_curve(time, gap).items()},
        "hr": {str(k): v for k, v in mean_max_curve(time, streams["hr"]).items()},
        "is_treadmill": _is_treadmill(activity_type),
    }
    valid_times = [t for t in time if isinstance(t, (int, float))]
    result["duration"] = round(max(valid_times) - min(valid_times), 1) if valid_times else 0.0
    if not (result["power"] or result["gap_speed"] or result["speed"]):
        return None
    return result


def backfill_missing_curves(db: Session, limit: int = 500) -> int:
    """Compute ``mean_max_json`` for synced activities that lack it.

    Self-heals databases populated before curve computation existed. Bounded by
    ``limit`` per call so it spreads cost across invocations; returns the number
    of activities updated.
    """
    from app.models import Activity

    rows = (
        db.query(Activity)
        .filter(Activity.mean_max_json.is_(None), Activity.laps_json.isnot(None))
        .order_by(Activity.started_at.desc())
        .limit(limit)
        .all()
    )
    updated = 0
    for act in rows:
        try:
            details = json.loads(act.laps_json)
        except (json.JSONDecodeError, TypeError):
            continue
        curves = compute_curves_from_details(details, act.activity_type)
        if curves:
            act.mean_max_json = json.dumps(curves)
            updated += 1
    if updated:
        db.commit()
        logger.info("Backfilled mean-max curves for %d activities", updated)
    return updated
