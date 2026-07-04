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

from sqlalchemy import or_
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Durations (seconds) at which the mean-maximal curve is sampled. Spans the
# anaerobic short end (for W'/Pmax) through ~90 min (aerobic threshold end).
STANDARD_DURATIONS: list[int] = [
    5, 15, 30, 60, 120, 180, 300, 480, 600, 720,
    1200, 1800, 2400, 3000, 3600, 5400,
]

# Standard race distances (meters) at which we look for the fastest contiguous
# effort anywhere within an activity — Strava's "Best Efforts" set. Unlike the
# duration-keyed mean-max curve above, this is windowed by *distance*: a half
# marathon race yields a 5K and 10K best effort too, from whichever contiguous
# stretch of it was fastest, not just the whole-activity time.
RACE_DISTANCES_M: list[tuple[str, float]] = [
    ("400m", 400.0),
    ("1/2 mile", 804.672),
    ("1K", 1000.0),
    ("1 mile", 1609.344),
    ("2 mile", 3218.688),
    ("5K", 5000.0),
    ("10K", 10000.0),
    ("15K", 15000.0),
    ("10 mile", 16093.44),
    ("20K", 20000.0),
    ("Half Marathon", 21097.5),
    ("30K", 30000.0),
    ("Marathon", 42195.0),
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


def minetti_factor(grade: float) -> float:
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
        out[i] = s * minetti_factor(grade)
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


def _best_mean_with_position(
    time: list[float | None],
    values: list[float | None],
    duration: float,
) -> tuple[float, float] | None:
    """Like ``_best_mean`` but also returns the start time of the best window.

    Returns ``(best_value, window_start_sec)`` or ``None``.
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

    cum_t = [0.0] * n
    cum_vt = [0.0] * n
    for i in range(1, n):
        dt = pts[i][0] - pts[i - 1][0]
        if dt <= 0:
            dt = 0.0
        cum_t[i] = cum_t[i - 1] + dt
        cum_vt[i] = cum_vt[i - 1] + pts[i - 1][1] * dt

    best: float | None = None
    best_start: float | None = None
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
            best_start = pts[i][0]
    if best is None or best_start is None:
        return None
    return (best, best_start)


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


def _best_time_for_distance(
    time: list[float | None], distance: list[float | None], target_m: float
) -> float | None:
    """Minimum elapsed time to cover any contiguous window of ``target_m`` meters.

    Mirrors ``_best_mean``'s two-pointer sweep but keyed on distance instead of
    duration: as the window start advances, both the cumulative distance and
    the target end-distance only increase, so the end pointer never needs to
    move backwards. The exact crossing time is linearly interpolated between
    the two samples that bracket it, so the result isn't quantized to sample
    spacing. Returns ``None`` if the stream never covers ``target_m``.
    """
    pts = [
        (t, d)
        for t, d in zip(time, distance)
        if isinstance(t, (int, float)) and isinstance(d, (int, float))
    ]
    pts.sort(key=lambda p: p[0])
    # Enforce non-decreasing distance, dropping samples where GPS/footpod noise
    # made cumulative distance regress (a real reset — e.g. a paused/restarted
    # recording — would show up as a large gap rather than a small regression).
    cleaned: list[tuple[float, float]] = []
    running_max = None
    for t, d in pts:
        if running_max is None or d >= running_max:
            running_max = d
            cleaned.append((t, d))
    n = len(cleaned)
    if n < 2:
        return None
    times = [p[0] for p in cleaned]
    dists = [p[1] for p in cleaned]
    if dists[-1] - dists[0] < target_m:
        return None

    best: float | None = None
    j = 0
    for i in range(n):
        if j < i:
            j = i
        target_dist = dists[i] + target_m
        while j < n and dists[j] < target_dist:
            j += 1
        if j >= n:
            break
        if j == i:
            continue
        d0, d1 = dists[j - 1], dists[j]
        t0, t1 = times[j - 1], times[j]
        t_at_target = t1 if d1 == d0 else t0 + (target_dist - d0) / (d1 - d0) * (t1 - t0)
        elapsed = t_at_target - times[i]
        if elapsed > 0 and (best is None or elapsed < best):
            best = elapsed
    return best


def compute_distance_efforts(
    streams: dict[str, list[float | None]], activity_type: str | None = None
) -> dict[str, float]:
    """Best (fastest) time to cover each standard race distance, anywhere in the activity.

    Skipped for treadmill activities: footpod/treadmill-belt cumulative distance
    isn't reliable enough for a race-distance best effort (the same reason
    GAP-pace frontiers exclude treadmill runs in app.threshold).
    """
    if _is_treadmill(activity_type):
        return {}
    time = streams.get("time", [])
    distance = streams.get("distance", [])
    out: dict[str, float] = {}
    for label, target_m in RACE_DISTANCES_M:
        best = _best_time_for_distance(time, distance, target_m)
        if best is not None:
            out[label] = round(best, 1)
    return out


def compute_curves_from_details(
    details: dict | None, activity_type: str | None = None
) -> dict | None:
    """Compute the mean-maximal curves for one activity from its detail streams.

    Returns ``{"power": {dur: w}, "gap_speed": {dur: m/s}, "speed": {...},
    "hr": {dur: bpm}, "is_treadmill": bool, "duration": seconds,
    "distance_efforts": {label: seconds}}`` or ``None`` when streams can't be
    parsed. ``distance_efforts`` is the fastest time anywhere in the activity
    covering each standard race distance (Strava's "Best Efforts"), independent
    of the activity's total distance.
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
        "distance_efforts": compute_distance_efforts(streams, activity_type),
    }
    valid_times = [t for t in time if isinstance(t, (int, float))]
    result["duration"] = round(max(valid_times) - min(valid_times), 1) if valid_times else 0.0
    if not (result["power"] or result["gap_speed"] or result["speed"]):
        return None
    return result


def compute_early_mean_max_curve(
    streams: dict[str, list[float | None]],
    fatigue_offset_sec: float,
    durations: list[int] = STANDARD_DURATIONS,
) -> dict[str, dict[int, float]]:
    """Mean-max curves from only the 'fresh' (early) portion before fatigue_offset_sec.

    Mirror of ``compute_late_mean_max_curve`` for the first half of the run.
    """
    time = streams.get("time", [])

    early_end = next(
        (i for i, t in enumerate(time) if isinstance(t, (int, float)) and t >= fatigue_offset_sec),
        len(time),
    )

    early_time = time[:early_end]
    early_power = streams.get("power", [])[:early_end]
    early_speed = streams.get("speed", [])[:early_end]
    early_elev = streams.get("elevation", [])[:early_end]
    early_dist = streams.get("distance", [])[:early_end]
    early_hr = streams.get("hr", [])[:early_end]
    early_gap = grade_adjusted_speed(early_speed, early_elev, early_dist)

    return {
        "power": mean_max_curve(early_time, early_power, durations),
        "speed": mean_max_curve(early_time, early_speed, durations),
        "gap_speed": mean_max_curve(early_time, early_gap, durations),
        "hr": mean_max_curve(early_time, early_hr, durations),
    }


def compute_aerobic_metrics(
    streams: dict[str, list[float | None]],
) -> tuple[float | None, float | None]:
    """Compute aerobic decoupling and efficiency factor from aligned stream arrays.

    Aerobic decoupling (Pa:HR) measures cardiac drift: the change in the
    pace-or-power : HR ratio between the first and second halves of the run.
    A value below ~5% indicates good aerobic coupling at the effort level used.

    Efficiency Factor (EF) = avg_GAP_speed / avg_HR, expressed in m/s/bpm.
    Falls back to raw speed when GAP is unavailable.

    Returns (decoupling_pct, efficiency_factor), either or both may be None when
    the streams lack sufficient data (no HR, too short, etc.).
    """
    time = streams.get("time", [])
    hr = streams.get("hr", [])
    speed = streams.get("speed", [])
    elevation = streams.get("elevation", [])
    distance = streams.get("distance", [])

    gap = grade_adjusted_speed(speed, elevation, distance)

    # Build clean (t, pace_proxy, hr) triples — prefer GAP, fall back to speed.
    pts: list[tuple[float, float, float]] = []
    for t, s, g, h in zip(time, speed, gap, hr):
        if not isinstance(t, (int, float)):
            continue
        if not isinstance(h, (int, float)) or h <= 0:
            continue
        v = g if isinstance(g, (int, float)) and g > 0 else (s if isinstance(s, (int, float)) and s > 0 else None)
        if v is None:
            continue
        pts.append((float(t), float(v), float(h)))

    if len(pts) < 20:
        return None, None

    pts.sort(key=lambda p: p[0])
    t0, t1 = pts[0][0], pts[-1][0]
    total_duration = t1 - t0
    if total_duration < 600:  # need at least 10 min
        return None, None

    mid = t0 + total_duration / 2

    # Time-weighted means for first and second halves.
    def _half_means(subset: list[tuple[float, float, float]]) -> tuple[float, float] | None:
        if len(subset) < 2:
            return None
        sum_vdt = sum_hdt = sum_dt = 0.0
        for i in range(1, len(subset)):
            dt = subset[i][0] - subset[i - 1][0]
            if dt <= 0:
                continue
            sum_vdt += subset[i - 1][1] * dt
            sum_hdt += subset[i - 1][2] * dt
            sum_dt += dt
        if sum_dt <= 0:
            return None
        return sum_vdt / sum_dt, sum_hdt / sum_dt

    first_half = [p for p in pts if p[0] <= mid]
    second_half = [p for p in pts if p[0] > mid]

    f = _half_means(first_half)
    s = _half_means(second_half)
    if f is None or s is None or f[1] <= 0 or s[1] <= 0:
        return None, None

    first_ratio = f[0] / f[1]
    second_ratio = s[0] / s[1]

    # Positive decoupling = HR drifted up relative to pace in second half (normal).
    if first_ratio <= 0:
        decoupling_pct = None
    else:
        decoupling_pct = round((first_ratio - second_ratio) / first_ratio * 100, 2)

    # EF over the whole activity.
    all_means = _half_means(pts)
    if all_means is None or all_means[1] <= 0:
        ef = None
    else:
        ef = round(all_means[0] / all_means[1], 6)  # m/s per bpm

    return decoupling_pct, ef


def compute_aerobic_metrics_from_details(
    details: dict | None,
) -> tuple[float | None, float | None]:
    """Parse Garmin detail payload and return (decoupling_pct, efficiency_factor)."""
    parsed = parse_streams(details)
    if parsed is None:
        return None, None
    return compute_aerobic_metrics(parsed)


def compute_late_mean_max_curve(
    streams: dict[str, list[float | None]],
    fatigue_offset_sec: float,
    durations: list[int] = STANDARD_DURATIONS,
) -> dict[str, dict[int, float]]:
    """Mean-max curves computed only from the 'late' (fatigued) portion of a run.

    Filters stream samples to those with elapsed time >= fatigue_offset_sec, then
    runs mean_max_curve on each channel. Returns a dict with keys "power",
    "speed", "gap_speed", "hr" (any may be empty if the late window is too short).
    """
    time = streams.get("time", [])

    late_start = next(
        (i for i, t in enumerate(time) if isinstance(t, (int, float)) and t >= fatigue_offset_sec),
        None,
    )
    if late_start is None:
        return {}

    late_time = time[late_start:]
    late_power = streams.get("power", [])[late_start:]
    late_speed = streams.get("speed", [])[late_start:]
    late_elev = streams.get("elevation", [])[late_start:]
    late_dist = streams.get("distance", [])[late_start:]
    late_hr = streams.get("hr", [])[late_start:]
    late_gap = grade_adjusted_speed(late_speed, late_elev, late_dist)

    return {
        "power": mean_max_curve(late_time, late_power, durations),
        "speed": mean_max_curve(late_time, late_speed, durations),
        "gap_speed": mean_max_curve(late_time, late_gap, durations),
        "hr": mean_max_curve(late_time, late_hr, durations),
    }


def backfill_missing_aerobic_metrics(db: Session, limit: int = 500, user_id: int | None = None) -> int:
    """Compute decoupling_pct / efficiency_factor for activities that lack them.

    Mirrors the pattern of backfill_missing_curves. Returns the number of rows updated.
    """
    from app.models import Activity

    query = db.query(Activity).filter(
        Activity.decoupling_pct.is_(None),
        Activity.laps_json.isnot(None),
    )
    if user_id is not None:
        query = query.filter(Activity.user_id == user_id)
    rows = query.order_by(Activity.started_at.desc()).limit(limit).all()

    updated = 0
    for act in rows:
        try:
            details = json.loads(act.laps_json)
        except (json.JSONDecodeError, TypeError):
            continue
        dec, ef = compute_aerobic_metrics_from_details(details)
        if dec is not None or ef is not None:
            act.decoupling_pct = dec
            act.efficiency_factor = ef
            updated += 1
    if updated:
        db.commit()
        logger.info("Backfilled aerobic metrics for %d activities", updated)
    return updated


def backfill_missing_curves(db: Session, limit: int = 500, user_id: int | None = None) -> int:
    """Compute ``mean_max_json`` for synced activities that lack it.

    Self-heals databases populated before curve computation existed. Bounded by
    ``limit`` per call so it spreads cost across invocations; returns the number
    of activities updated. When ``user_id`` is given, only that user's activities
    are processed.
    """
    from app.models import Activity

    query = db.query(Activity).filter(
        Activity.mean_max_json.is_(None), Activity.laps_json.isnot(None)
    )
    if user_id is not None:
        query = query.filter(Activity.user_id == user_id)
    rows = (
        query.order_by(Activity.started_at.desc())
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


def backfill_missing_distance_efforts(db: Session, limit: int = 100_000, user_id: int | None = None) -> int:
    """Recompute ``mean_max_json`` for activities whose curves predate distance efforts.

    Self-heals databases whose curves were computed before Strava-style
    rolling-window race-distance bests existed (``distance_efforts`` wasn't a
    key in ``compute_curves_from_details``'s output yet). Detected by a cheap
    substring check rather than parsing every row up front. When ``user_id`` is
    given, only that user's activities are processed.
    """
    from app.models import Activity

    query = db.query(Activity).filter(
        Activity.laps_json.isnot(None),
        or_(
            Activity.mean_max_json.is_(None),
            ~Activity.mean_max_json.like("%distance_efforts%"),
        ),
    )
    if user_id is not None:
        query = query.filter(Activity.user_id == user_id)
    rows = query.order_by(Activity.started_at.desc()).limit(limit).all()

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
        logger.info("Backfilled distance efforts for %d activities", updated)
    return updated
