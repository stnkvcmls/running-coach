"""Threshold / Critical Power auto-estimation.

Derives the athlete's functional thresholds from recent training so the profile
(and the threshold-anchored zones built on it) stays current without manual
entry — the Stryd "auto-calculated Critical Power" idea adapted to this app's
data.

The estimator works on **mean-maximal curves** (see :mod:`app.streams`): the best
sustained power / grade-adjusted speed the athlete held for each of a set of
durations, aggregated across recent activities into a power-duration and a
velocity-duration *frontier*. Fitting the Critical Power / Critical Velocity
models to those frontiers — rather than to whole-activity averages — is what makes
the estimates precise, because a maximal effort buried inside a longer run is now
visible.

Estimates produced:

- **Critical Power (CP)** + **W'** via the 2-parameter model ``P(t) = CP + W'/t``,
  weighted toward recent efforts, optionally refined by the 3-parameter Morton
  model (which adds **Pmax** and fits the short end better). For running, CP is
  treated as functional threshold power.
- **Threshold pace** via the analogous critical-velocity model on the
  grade-adjusted speed frontier.
- **Threshold HR (LTHR)**: Garmin's lactate-threshold HR if synced, else the
  drift-corrected steady-state HR of sustained near-threshold segments, else a
  fraction of observed max HR.

Each field carries a method, confidence, sample size, and a guidance note when the
available efforts don't yet constrain the model well.
"""

from __future__ import annotations

import dataclasses
import json
import logging
import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app import streams
from app.models import DEFAULT_USER_ID, Activity, AthleteProfile, SyncStatus

logger = logging.getLogger(__name__)

_THRESHOLD_CACHE_KEY = "threshold_estimate"

DEFAULT_LOOKBACK_DAYS = 90

# Valid fitting range for the 2-parameter model (≈2–40 min): shorter efforts are
# anaerobically dominated, longer ones drift below the asymptote.
_FIT_MIN_S = 120
_FIT_MAX_S = 2400
# Anchors that make a fit well-conditioned.
_SHORT_ANCHOR_S = 300
_LONG_ANCHOR_S = 1200

# Recency weighting: an effort's influence decays with e^(-age/τ) so CP tracks
# current fitness rather than season-old peaks.
_RECENCY_TAU_DAYS = 45.0

# Physiological clamps.
_W_PRIME_MIN, _W_PRIME_MAX = 3000.0, 40000.0     # J
_D_PRIME_MIN, _D_PRIME_MAX = 20.0, 600.0         # m

# LTHR heuristics.
_LTHR_MAX_HR_FRACTION = 0.90
_HARD_EFFORT_HR_FRACTION = 0.85
_HARD_EFFORT_MIN_SEC = 20 * 60
_NEAR_THRESHOLD_LO = 0.95     # speed band (× CV) for a "threshold" segment
_NEAR_THRESHOLD_HI = 1.08
_SEGMENT_MIN_SEC = 600


@dataclass
class FieldEstimate:
    value: float | None
    method: str | None
    confidence: str | None      # "low" | "medium" | "high"
    sample_size: int
    note: str | None = None


def _empty(note: str | None = None) -> FieldEstimate:
    return FieldEstimate(value=None, method=None, confidence=None, sample_size=0, note=note)


@dataclass
class ThresholdEstimate:
    critical_power: FieldEstimate
    w_prime: float | None
    pmax: float | None
    threshold_pace_min_km: FieldEstimate
    threshold_hr: FieldEstimate
    max_hr: FieldEstimate
    lookback_days: int
    activities_analyzed: int


# ---------------------------------------------------------------------------
# Frontier construction
# ---------------------------------------------------------------------------

@dataclass
class _FrontierPoint:
    duration: int
    value: float
    weight: float          # recency weight of the contributing activity
    sample_size: int       # how many activities reached this duration


def _recency_weight(age_days: float) -> float:
    return math.exp(-max(0.0, age_days) / _RECENCY_TAU_DAYS)


def _build_frontier(
    curves: list[tuple[float, dict]], metric: str
) -> list[_FrontierPoint]:
    """Best value per duration across activities, with recency weight + support.

    ``curves`` is a list of ``(age_days, curve_dict)``; ``metric`` selects the
    sub-curve (``"power"`` or ``"gap_speed"``). For each duration we keep the
    single best value and the recency weight of the activity that set it, plus a
    count of how many activities reached that duration.
    """
    best: dict[int, tuple[float, float]] = {}     # dur -> (value, weight)
    support: dict[int, int] = {}
    for age_days, curve in curves:
        sub = curve.get(metric) or {}
        for dur_str, val in sub.items():
            try:
                dur = int(dur_str)
                v = float(val)
            except (TypeError, ValueError):
                continue
            support[dur] = support.get(dur, 0) + 1
            if dur not in best or v > best[dur][0]:
                best[dur] = (v, _recency_weight(age_days))
    return [
        _FrontierPoint(duration=d, value=best[d][0], weight=best[d][1], sample_size=support[d])
        for d in sorted(best)
    ]


# ---------------------------------------------------------------------------
# Model fitting
# ---------------------------------------------------------------------------

def _weighted_linear_fit(
    points: list[tuple[float, float]], weights: list[float]
) -> tuple[float, float] | None:
    """Weighted OLS ``y = slope·x + intercept``; ``None`` if x has no spread."""
    sw = sum(weights)
    if sw <= 0 or len(points) < 2:
        return None
    sx = sum(w * x for (x, _), w in zip(points, weights))
    sy = sum(w * y for (_, y), w in zip(points, weights))
    sxx = sum(w * x * x for (x, _), w in zip(points, weights))
    sxy = sum(w * x * y for (x, y), w in zip(points, weights))
    denom = sw * sxx - sx * sx
    if denom == 0:
        return None
    slope = (sw * sxy - sx * sy) / denom
    intercept = (sy - slope * sx) / sw
    return slope, intercept


def _fit_two_param(
    frontier: list[_FrontierPoint],
) -> tuple[float, float, list[_FrontierPoint]] | None:
    """Fit ``output(t) = asymptote + work/t`` over the valid duration window.

    Returns ``(asymptote, work, used_points)`` or ``None`` for a degenerate or
    non-physical fit (asymptote ≤ 0 or work < 0).
    """
    used = [p for p in frontier if _FIT_MIN_S <= p.duration <= _FIT_MAX_S]
    if len(used) < 2:
        return None
    fit = _weighted_linear_fit(
        [(1.0 / p.duration, p.value) for p in used],
        [p.weight for p in used],
    )
    if fit is None:
        return None
    work, asymptote = fit
    if asymptote <= 0 or work < 0:
        return None
    return asymptote, work, used


def _model_3p(t: float, cp: float, w: float, pmax: float) -> float:
    """Morton 3-parameter critical-power model."""
    denom = t + w / (pmax - cp)
    return cp + w / denom


def _weighted_sse(points, weights, fn) -> float:
    return sum(w * (y - fn(x)) ** 2 for (x, y), w in zip(points, weights))


def _golden_min(fn, lo: float, hi: float, iters: int = 40) -> float:
    """1-D golden-section minimization on ``[lo, hi]``."""
    gr = (math.sqrt(5) - 1) / 2
    c = hi - gr * (hi - lo)
    d = lo + gr * (hi - lo)
    for _ in range(iters):
        if fn(c) < fn(d):
            hi = d
        else:
            lo = c
        c = hi - gr * (hi - lo)
        d = lo + gr * (hi - lo)
    return (lo + hi) / 2


def _fit_three_param(
    frontier: list[_FrontierPoint], cp2: float, w2: float
) -> tuple[float, float, float] | None:
    """Refine CP/W' with the 3-parameter model, adding Pmax.

    A scipy-free bounded search: grid over (CP, Pmax), inner golden-section over
    W'. Uses the full frontier (including the short end Pmax governs). Returns
    ``(cp, w_prime, pmax)`` only if it stays physiological and fits the same
    points at least 5% better than the 2-parameter model.
    """
    used = [p for p in frontier if 60 <= p.duration <= _FIT_MAX_S]
    if len(used) < 3:
        return None
    pts = [(float(p.duration), p.value) for p in used]
    wts = [p.weight for p in used]
    sse_2p = _weighted_sse(pts, wts, lambda t: cp2 + w2 / t)

    best = None  # (sse, cp, w, pmax)
    cp_lo, cp_hi = 0.6 * cp2, 1.15 * cp2
    for ci in range(12):
        cp = cp_lo + (cp_hi - cp_lo) * ci / 11
        if cp <= 0:
            continue
        for pi in range(12):
            pmax = cp * (1.3 + (4.0 - 1.3) * pi / 11)
            if pmax <= cp:
                continue

            def sse_for_w(w: float) -> float:
                if w <= 0:
                    return float("inf")
                return _weighted_sse(pts, wts, lambda t: _model_3p(t, cp, w, pmax))

            w = _golden_min(sse_for_w, _W_PRIME_MIN, _W_PRIME_MAX)
            sse = sse_for_w(w)
            if best is None or sse < best[0]:
                best = (sse, cp, w, pmax)

    if best is None:
        return None
    sse, cp, w, pmax = best
    if sse >= 0.95 * sse_2p:
        return None
    if not (_W_PRIME_MIN <= w <= _W_PRIME_MAX and pmax > cp > 0):
        return None
    return cp, w, pmax


def _confidence_and_note(
    used: list[_FrontierPoint], kind: str
) -> tuple[str, str | None]:
    """Confidence + guidance from frontier coverage.

    ``kind`` is "power" or "pace", used only to phrase the note.
    """
    durations = [p.duration for p in used]
    has_short = any(d <= _SHORT_ANCHOR_S for d in durations)
    has_long = any(d >= _LONG_ANCHOR_S for d in durations)
    ratio = max(durations) / min(durations) if min(durations) > 0 else 1.0

    notes: list[str] = []
    if not has_short:
        notes.append("add a hard ~3–5 min effort to pin down the short end")
    if not has_long:
        notes.append("add a sustained 20+ min effort to anchor threshold")
    note = ("To sharpen this estimate, " + " and ".join(notes) + ".") if notes else None

    if has_short and has_long and len(used) >= 4 and ratio >= 4.0:
        conf = "high"
    elif len(used) >= 3 and (has_short or has_long):
        conf = "medium"
    else:
        conf = "low"
    return conf, note


# ---------------------------------------------------------------------------
# Individual estimates
# ---------------------------------------------------------------------------

def _fit_critical_power_from_frontier(
    frontier: list[_FrontierPoint],
) -> tuple[FieldEstimate, float | None, float | None]:
    """Fit the CP model from a pre-built frontier (skips the _build_frontier call).

    Used by both the full-recompute path and the incremental merge path so the
    fitting logic is not duplicated.
    """
    if not frontier:
        return _empty("No power data in recent activities."), None, None
    fit = _fit_two_param(frontier)
    if fit is None:
        return (
            _empty("Not enough power efforts across durations to model Critical Power."),
            None, None,
        )
    cp, w_prime, used = fit
    pmax = None
    method = "critical_power_2p"
    refined = _fit_three_param(frontier, cp, w_prime)
    if refined is not None:
        cp, w_prime, pmax = refined
        method = "critical_power_3p"
    w_prime = max(_W_PRIME_MIN, min(_W_PRIME_MAX, w_prime))
    conf, note = _confidence_and_note(used, "power")
    sample = max(p.sample_size for p in used)
    return (
        FieldEstimate(value=round(cp, 0), method=method, confidence=conf,
                      sample_size=sample, note=note),
        round(w_prime, 0),
        round(pmax, 0) if pmax is not None else None,
    )


def _fit_threshold_pace_from_frontier(
    frontier: list[_FrontierPoint],
) -> tuple[FieldEstimate, float | None]:
    """Fit the CV model from a pre-built frontier (skips the _build_frontier call)."""
    if not frontier:
        return _empty("No pace/GPS data in recent activities."), None
    fit = _fit_two_param(frontier)
    if fit is None:
        return _empty("Not enough efforts across durations to model threshold pace."), None
    cv, d_prime, used = fit
    d_prime = max(_D_PRIME_MIN, min(_D_PRIME_MAX, d_prime))
    pace_min_km = (1000.0 / cv) / 60.0
    conf, note = _confidence_and_note(used, "pace")
    sample = max(p.sample_size for p in used)
    return (
        FieldEstimate(value=round(pace_min_km, 2), method="critical_velocity",
                      confidence=conf, sample_size=sample, note=note),
        cv,
    )


def _estimate_critical_power(
    curves: list[tuple[float, dict]]
) -> tuple[FieldEstimate, float | None, float | None]:
    """Estimate CP (W), and the supporting W' (J) and Pmax (W)."""
    frontier = _build_frontier(curves, "power")
    return _fit_critical_power_from_frontier(frontier)


def _estimate_threshold_pace(curves: list[tuple[float, dict]]) -> tuple[FieldEstimate, float | None]:
    """Estimate threshold pace (min/km) and CV (m/s) via critical velocity."""
    frontier = _build_frontier(curves, "gap_speed")
    return _fit_threshold_pace_from_frontier(frontier)


def _garmin_lactate_threshold_hr(activities: list[Activity]) -> int | None:
    """Pull Garmin's own lactate-threshold HR from raw activity JSON, if present."""
    for a in sorted(activities, key=lambda x: x.started_at or datetime.min, reverse=True):
        if not a.raw_json:
            continue
        try:
            data = json.loads(a.raw_json)
        except (json.JSONDecodeError, TypeError):
            continue
        if not isinstance(data, dict):
            continue
        for key, val in data.items():
            kl = key.lower()
            if "lactatethreshold" in kl and ("heart" in kl or "bpm" in kl):
                if isinstance(val, (int, float)) and 100 <= val <= 220:
                    return int(val)
    return None


def _steady_hr_near_cv(activities: list[Activity], cv: float) -> list[int]:
    """Drift-corrected steady HR from sustained near-threshold segments.

    For each activity, parse its streams and find the longest contiguous segment
    run within the threshold speed band for ≥ ``_SEGMENT_MIN_SEC``; take the HR
    average of that segment's second half (to discount cardiac drift). Returns one
    value per qualifying activity.
    """
    lo, hi = cv * _NEAR_THRESHOLD_LO, cv * _NEAR_THRESHOLD_HI
    results: list[int] = []
    for a in activities:
        if not a.laps_json:
            continue
        try:
            details = json.loads(a.laps_json)
        except (json.JSONDecodeError, TypeError):
            continue
        parsed = streams.parse_streams(details)
        if not parsed:
            continue
        time, speed, hr = parsed["time"], parsed["speed"], parsed["hr"]
        # Walk the stream tracking the current in-band run.
        seg_start_t = None
        seg_hr: list[tuple[float, float]] = []
        best_seg: list[tuple[float, float]] = []
        for t, s, h in zip(time, speed, hr):
            in_band = isinstance(s, (int, float)) and lo <= s <= hi
            if in_band and isinstance(t, (int, float)):
                if seg_start_t is None:
                    seg_start_t = t
                if isinstance(h, (int, float)):
                    seg_hr.append((t, h))
            else:
                if seg_start_t is not None and seg_hr and (seg_hr[-1][0] - seg_start_t) >= _SEGMENT_MIN_SEC:
                    if len(seg_hr) > len(best_seg):
                        best_seg = seg_hr
                seg_start_t, seg_hr = None, []
        if seg_start_t is not None and seg_hr and (seg_hr[-1][0] - seg_start_t) >= _SEGMENT_MIN_SEC:
            if len(seg_hr) > len(best_seg):
                best_seg = seg_hr
        if best_seg:
            half = best_seg[len(best_seg) // 2:]   # second half → drift-corrected
            results.append(int(round(sum(h for _, h in half) / len(half))))
    return results


def _estimate_max_hr(activities: list[Activity]) -> FieldEstimate:
    maxes = [int(a.max_hr) for a in activities if a.max_hr and a.max_hr > 0]
    if not maxes:
        return _empty()
    return FieldEstimate(
        value=float(max(maxes)),
        method="observed_max",
        confidence="high" if len(maxes) >= 5 else "medium",
        sample_size=len(maxes),
    )


def _estimate_threshold_hr(
    activities: list[Activity], max_hr: float | None, cv: float | None
) -> FieldEstimate:
    """LTHR: Garmin value → near-CV steady HR → sustained-effort avg → %max."""
    garmin_lthr = _garmin_lactate_threshold_hr(activities)
    if garmin_lthr is not None:
        return FieldEstimate(value=float(garmin_lthr), method="garmin_lactate_threshold",
                             confidence="high", sample_size=1)

    if cv is not None and cv > 0:
        steady = _steady_hr_near_cv(activities, cv)
        if steady:
            steady.sort()
            mid = len(steady) // 2
            median = steady[mid] if len(steady) % 2 else (steady[mid - 1] + steady[mid]) / 2
            return FieldEstimate(value=round(median, 0), method="near_threshold_segment",
                                 confidence="high" if len(steady) >= 3 else "medium",
                                 sample_size=len(steady))

    if max_hr and max_hr > 0:
        hard = [
            int(a.avg_hr) for a in activities
            if a.avg_hr and a.avg_hr > 0 and a.duration_sec
            and a.duration_sec >= _HARD_EFFORT_MIN_SEC
            and a.avg_hr >= max_hr * _HARD_EFFORT_HR_FRACTION
        ]
        if hard:
            hard.sort()
            mid = len(hard) // 2
            median = hard[mid] if len(hard) % 2 else (hard[mid - 1] + hard[mid]) / 2
            return FieldEstimate(value=round(median, 0), method="sustained_effort",
                                 confidence="medium", sample_size=len(hard))
        return FieldEstimate(value=round(max_hr * _LTHR_MAX_HR_FRACTION, 0),
                             method="pct_max_hr", confidence="low", sample_size=0,
                             note="Estimated from max HR; do a sustained threshold effort for a real LTHR.")
    return _empty()


# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Frontier serialization helpers
# ---------------------------------------------------------------------------

def _frontier_to_list(frontier: list[_FrontierPoint]) -> list[dict]:
    return [dataclasses.asdict(p) for p in frontier]


def _list_to_frontier(data: list[dict]) -> list[_FrontierPoint]:
    return [_FrontierPoint(**d) for d in data]


def _merge_curves_into_frontier(
    frontier: list[_FrontierPoint],
    new_curves: list[tuple[float, dict]],
    metric: str,
) -> tuple[list[_FrontierPoint], bool]:
    """Merge new activity curves into an existing frontier.

    Returns ``(updated_frontier, changed)`` where ``changed`` is True only if
    at least one duration gained a new best value (i.e., a new PR was recorded).
    The support count for every duration is incremented for each new activity
    that reaches it, regardless of whether it sets a new best.
    """
    best: dict[int, tuple[float, float]] = {p.duration: (p.value, p.weight) for p in frontier}
    support: dict[int, int] = {p.duration: p.sample_size for p in frontier}
    changed = False
    for age_days, curve in new_curves:
        sub = curve.get(metric) or {}
        for dur_str, val in sub.items():
            try:
                dur = int(dur_str)
                v = float(val)
            except (TypeError, ValueError):
                continue
            support[dur] = support.get(dur, 0) + 1
            w = _recency_weight(age_days)
            if dur not in best or v > best[dur][0]:
                best[dur] = (v, w)
                changed = True
    updated = [
        _FrontierPoint(duration=d, value=best[d][0], weight=best[d][1],
                       sample_size=support[d])
        for d in sorted(best)
    ]
    return updated, changed


# ---------------------------------------------------------------------------
# Result cache (SyncStatus-backed memoization)
# ---------------------------------------------------------------------------

def _threshold_fingerprint(db: Session, lookback_days: int, cutoff: datetime, user_id: int) -> str:
    """Cache key: run count + curves-available count + max synced_at in window."""
    run_count = db.query(func.count(Activity.id)).filter(
        Activity.user_id == user_id,
        Activity.started_at >= cutoff,
    ).scalar() or 0
    curve_count = db.query(func.count(Activity.id)).filter(
        Activity.user_id == user_id,
        Activity.started_at >= cutoff,
        Activity.mean_max_json.isnot(None),
    ).scalar() or 0
    max_sync = db.query(func.max(Activity.synced_at)).filter(
        Activity.user_id == user_id,
        Activity.started_at >= cutoff,
    ).scalar()
    return "|".join([
        str(lookback_days),
        str(run_count),
        str(curve_count),
        max_sync.isoformat() if max_sync else "",
    ])


def _deserialize_estimate(d: dict) -> ThresholdEstimate:
    return ThresholdEstimate(
        critical_power=FieldEstimate(**d["critical_power"]),
        w_prime=d["w_prime"],
        pmax=d["pmax"],
        threshold_pace_min_km=FieldEstimate(**d["threshold_pace_min_km"]),
        threshold_hr=FieldEstimate(**d["threshold_hr"]),
        max_hr=FieldEstimate(**d["max_hr"]),
        lookback_days=d["lookback_days"],
        activities_analyzed=d["activities_analyzed"],
    )


def _load_cached_threshold_raw(
    db: Session, user_id: int
) -> dict | None:
    """Return the raw cache dict (without fingerprint validation) for incremental use."""
    row = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == user_id, SyncStatus.key == _THRESHOLD_CACHE_KEY)
        .first()
    )
    if not row or not row.value:
        return None
    try:
        return json.loads(row.value)
    except (json.JSONDecodeError, TypeError):
        return None


def _load_cached_threshold(
    db: Session, lookback_days: int, cutoff: datetime, user_id: int
) -> ThresholdEstimate | None:
    """Return the cached estimate when the fingerprint matches, else None."""
    data = _load_cached_threshold_raw(db, user_id)
    if data is None:
        return None
    if data.get("fp") != _threshold_fingerprint(db, lookback_days, cutoff, user_id):
        return None
    try:
        return _deserialize_estimate(data["estimate"])
    except Exception:
        return None


def _save_cached_threshold(
    db: Session,
    estimate: ThresholdEstimate,
    lookback_days: int,
    cutoff: datetime,
    user_id: int,
    power_frontier: list[_FrontierPoint] | None = None,
    pace_frontier: list[_FrontierPoint] | None = None,
) -> None:
    """Persist the estimate, fingerprint, and optional frontiers to SyncStatus."""
    payload: dict = {
        "fp": _threshold_fingerprint(db, lookback_days, cutoff, user_id),
        "estimate": dataclasses.asdict(estimate),
    }
    if power_frontier is not None:
        payload["power_frontier"] = _frontier_to_list(power_frontier)
    if pace_frontier is not None:
        payload["pace_frontier"] = _frontier_to_list(pace_frontier)
    json_payload = json.dumps(payload)
    row = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == user_id, SyncStatus.key == _THRESHOLD_CACHE_KEY)
        .first()
    )
    if row:
        row.value = json_payload
        row.updated_at = datetime.now(timezone.utc)
    else:
        db.add(SyncStatus(user_id=user_id, key=_THRESHOLD_CACHE_KEY, value=json_payload,
                          updated_at=datetime.now(timezone.utc)))
    db.commit()


# ---------------------------------------------------------------------------
# Incremental threshold update (skip full refit when frontier unchanged)
# ---------------------------------------------------------------------------

def _try_incremental_threshold(
    db: Session, lookback_days: int, cutoff: datetime, now: datetime, user_id: int
) -> ThresholdEstimate | None:
    """Attempt to update the threshold estimate without a full activity re-scan.

    Strategy:
    1. Load the cached frontier (stored alongside the estimate).
    2. Parse the old fingerprint to determine how many runs were in the window.
    3. If the new run count is lower (activities dropped out of the 90-day window),
       return None — a full rebuild is required.
    4. Otherwise, find new activities (synced after the last cache) and merge their
       mean-max curves into the cached frontier.
    5. If no new PRs result: return the cached estimate with an updated fingerprint.
    6. If the frontier changed: refit CP/CV from the updated frontier (fast,
       O(frontier points)) and return — skipping the re-parse of old activities.
    """
    cached_data = _load_cached_threshold_raw(db, user_id)
    if cached_data is None:
        return None
    if "power_frontier" not in cached_data and "pace_frontier" not in cached_data:
        return None  # Old cache entry without frontier; fall back to full rebuild.

    old_fp = cached_data.get("fp", "")
    parts = old_fp.split("|")
    if len(parts) < 4:
        return None
    try:
        old_run_count = int(parts[1])
        old_max_sync_str = parts[3]
        old_max_sync = datetime.fromisoformat(old_max_sync_str) if old_max_sync_str else None
    except (ValueError, IndexError):
        return None

    new_run_count = (
        db.query(func.count(Activity.id))
        .filter(Activity.user_id == user_id, Activity.started_at >= cutoff)
        .scalar() or 0
    )
    if new_run_count < old_run_count:
        return None  # Activities dropped from window — full rebuild needed.

    # Find new run activities with curves synced after the last cache.
    new_query = (
        db.query(Activity)
        .filter(
            Activity.user_id == user_id,
            Activity.started_at >= cutoff,
            Activity.started_at.isnot(None),
            Activity.mean_max_json.isnot(None),
        )
    )
    if old_max_sync is not None:
        new_query = new_query.filter(Activity.synced_at > old_max_sync)
    new_runs = [a for a in new_query.all() if _is_run(a.activity_type)]

    def _age(a: Activity) -> float:
        return (now - a.started_at).total_seconds() / 86400.0 if a.started_at else 9999.0

    new_curves: list[tuple[float, dict]] = []
    for a in new_runs:
        try:
            curve = json.loads(a.mean_max_json)
        except (json.JSONDecodeError, TypeError):
            continue
        new_curves.append((_age(a), curve))

    power_frontier = _list_to_frontier(cached_data.get("power_frontier") or [])
    pace_frontier = _list_to_frontier(cached_data.get("pace_frontier") or [])

    if not new_curves:
        # No new curve data — just refresh the fingerprint and return cached estimate.
        try:
            est = _deserialize_estimate(cached_data["estimate"])
            _save_cached_threshold(db, est, lookback_days, cutoff, user_id,
                                   power_frontier=power_frontier, pace_frontier=pace_frontier)
            return est
        except Exception:
            return None

    # Merge new curves into frontiers.
    non_treadmill = [(age, c) for age, c in new_curves if not c.get("is_treadmill")]
    power_frontier_new, power_changed = _merge_curves_into_frontier(
        power_frontier, new_curves, "power"
    )
    pace_frontier_new, pace_changed = _merge_curves_into_frontier(
        pace_frontier, non_treadmill, "gap_speed"
    )

    if not power_changed and not pace_changed:
        # No new PRs: return cached estimate with updated fingerprint.
        try:
            est = _deserialize_estimate(cached_data["estimate"])
            _save_cached_threshold(db, est, lookback_days, cutoff, user_id,
                                   power_frontier=power_frontier_new,
                                   pace_frontier=pace_frontier_new)
            return est
        except Exception:
            return None

    # Frontier changed: refit from the updated frontier (no full activity re-scan).
    try:
        cp, w_prime, pmax = _fit_critical_power_from_frontier(power_frontier_new)
        pace, cv = _fit_threshold_pace_from_frontier(pace_frontier_new)
        # HR estimates still require the full run list (they use raw laps/streams).
        all_runs = [
            a for a in db.query(Activity).filter(
                Activity.user_id == user_id,
                Activity.started_at >= cutoff,
                Activity.started_at.isnot(None),
            ).all()
            if _is_run(a.activity_type)
        ]
        max_hr_est = _estimate_max_hr(all_runs)
        thr_hr = _estimate_threshold_hr(all_runs, max_hr_est.value, cv)
        estimate = ThresholdEstimate(
            critical_power=cp, w_prime=w_prime, pmax=pmax,
            threshold_pace_min_km=pace, threshold_hr=thr_hr, max_hr=max_hr_est,
            lookback_days=lookback_days, activities_analyzed=len(all_runs),
        )
        _save_cached_threshold(db, estimate, lookback_days, cutoff, user_id,
                               power_frontier=power_frontier_new, pace_frontier=pace_frontier_new)
        return estimate
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def _is_run(activity_type: str | None) -> bool:
    if not activity_type:
        return False
    t = activity_type.lower()
    return "run" in t or "treadmill" in t


def estimate_thresholds(
    db: Session, lookback_days: int = DEFAULT_LOOKBACK_DAYS, user_id: int = DEFAULT_USER_ID
) -> ThresholdEstimate:
    """Compute threshold estimates from the last ``lookback_days`` of activities.

    On a fingerprint cache hit, returns immediately. On a miss, tries an
    incremental frontier merge (merging only new activities' curves into the cached
    frontier) before falling back to a full recompute from all activities.
    """
    now = datetime.utcnow()
    cutoff = now - timedelta(days=lookback_days)

    cached = _load_cached_threshold(db, lookback_days, cutoff, user_id)
    if cached is not None:
        return cached

    # Try incremental update: merge only new activities into the cached frontier.
    incremental = _try_incremental_threshold(db, lookback_days, cutoff, now, user_id)
    if incremental is not None:
        return incremental

    # Full recompute: self-heal missing curves, then rebuild frontier from scratch.
    try:
        streams.backfill_missing_curves(db, user_id=user_id)
    except Exception:
        pass

    activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == user_id,
            Activity.started_at.isnot(None),
            Activity.started_at >= cutoff,
        )
        .all()
    )
    runs = [a for a in activities if _is_run(a.activity_type)]

    def _age(a: Activity) -> float:
        return (now - a.started_at).total_seconds() / 86400.0 if a.started_at else 9999.0

    def _curves(include_treadmill: bool) -> list[tuple[float, dict]]:
        out: list[tuple[float, dict]] = []
        for a in runs:
            if not a.mean_max_json:
                continue
            try:
                curve = json.loads(a.mean_max_json)
            except (json.JSONDecodeError, TypeError):
                continue
            if not include_treadmill and curve.get("is_treadmill"):
                continue
            out.append((_age(a), curve))
        return out

    # Power tolerates treadmill (footpod power is valid indoors); pace does not
    # (indoor GPS speed is unreliable).
    power_curves = _curves(include_treadmill=True)
    pace_curves = _curves(include_treadmill=False)

    # Build frontiers explicitly so we can cache them for the next incremental update.
    power_frontier = _build_frontier(power_curves, "power")
    pace_frontier = _build_frontier(pace_curves, "gap_speed")

    cp, w_prime, pmax = _fit_critical_power_from_frontier(power_frontier)
    pace, cv = _fit_threshold_pace_from_frontier(pace_frontier)
    max_hr = _estimate_max_hr(runs)
    thr_hr = _estimate_threshold_hr(runs, max_hr.value, cv)

    estimate = ThresholdEstimate(
        critical_power=cp,
        w_prime=w_prime,
        pmax=pmax,
        threshold_pace_min_km=pace,
        threshold_hr=thr_hr,
        max_hr=max_hr,
        lookback_days=lookback_days,
        activities_analyzed=len(runs),
    )

    try:
        _save_cached_threshold(db, estimate, lookback_days, cutoff, user_id,
                               power_frontier=power_frontier, pace_frontier=pace_frontier)
    except Exception:
        logger.debug("Threshold estimate cache write failed", exc_info=True)

    return estimate


# ---------------------------------------------------------------------------
# Performance curve (power-duration + pace-duration + race predictions)
# ---------------------------------------------------------------------------

RACE_DISTANCES = [
    ("5K", 5000.0),
    ("10K", 10000.0),
    ("Half Marathon", 21097.5),
    ("Marathon", 42195.0),
]


@dataclass
class CurvePoint:
    duration_sec: int
    actual_value: float        # measured frontier value
    model_value: float | None  # model fit at this duration


@dataclass
class RacePrediction:
    distance_label: str
    distance_m: float
    predicted_time_sec: float
    predicted_pace_min_km: float


@dataclass
class PerformanceCurveData:
    power_points: list[CurvePoint] = field(default_factory=list)
    pace_points: list[CurvePoint] = field(default_factory=list)
    critical_power: float | None = None
    w_prime: float | None = None
    critical_velocity: float | None = None   # m/s
    d_prime: float | None = None             # m
    race_predictions: list[RacePrediction] = field(default_factory=list)
    lookback_days: int = DEFAULT_LOOKBACK_DAYS
    activities_analyzed: int = 0


def _predict_race_times(cv: float, d_prime: float) -> list[RacePrediction]:
    """Predict finish times for standard distances using the CV model: t = (D - D') / CV."""
    predictions: list[RacePrediction] = []
    for label, dist_m in RACE_DISTANCES:
        if d_prime >= dist_m:
            continue
        t_sec = (dist_m - d_prime) / cv
        if t_sec <= 0:
            continue
        pace_min_km = (t_sec / dist_m) * 1000.0 / 60.0
        predictions.append(RacePrediction(
            distance_label=label,
            distance_m=dist_m,
            predicted_time_sec=round(t_sec, 0),
            predicted_pace_min_km=round(pace_min_km, 2),
        ))
    return predictions


def get_performance_curve_data(
    db: Session, lookback_days: int = DEFAULT_LOOKBACK_DAYS, user_id: int = DEFAULT_USER_ID
) -> PerformanceCurveData:
    """Aggregate mean-max frontiers + CP/CV model fit for the performance curve UI.

    Reuses the same activity queries and fitting logic as ``estimate_thresholds``
    but returns the raw frontier points (for charting) alongside the model params
    and race time predictions.
    """
    now = datetime.utcnow()
    cutoff = now - timedelta(days=lookback_days)

    activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == user_id,
            Activity.started_at.isnot(None),
            Activity.started_at >= cutoff,
        )
        .all()
    )
    runs = [a for a in activities if _is_run(a.activity_type)]

    def _age(a: Activity) -> float:
        return (now - a.started_at).total_seconds() / 86400.0 if a.started_at else 9999.0

    def _curves(include_treadmill: bool) -> list[tuple[float, dict]]:
        out: list[tuple[float, dict]] = []
        for a in runs:
            if not a.mean_max_json:
                continue
            try:
                curve = json.loads(a.mean_max_json)
            except (json.JSONDecodeError, TypeError):
                continue
            if not include_treadmill and curve.get("is_treadmill"):
                continue
            out.append((_age(a), curve))
        return out

    power_raw = _curves(include_treadmill=True)
    pace_raw = _curves(include_treadmill=False)

    power_frontier = _build_frontier(power_raw, "power")
    pace_frontier = _build_frontier(pace_raw, "gap_speed")

    # Fit power model
    cp: float | None = None
    w_prime_out: float | None = None

    power_fit = _fit_two_param(power_frontier)
    if power_fit is not None:
        cp_val, wp_val, _ = power_fit
        refined = _fit_three_param(power_frontier, cp_val, wp_val)
        if refined:
            cp, w_prime_out, _ = refined
        else:
            cp, w_prime_out = cp_val, wp_val
        w_prime_out = max(_W_PRIME_MIN, min(_W_PRIME_MAX, w_prime_out))

    def _power_model(t: float) -> float | None:
        if cp is None or w_prime_out is None:
            return None
        return cp + w_prime_out / t

    # Fit pace / velocity model
    cv: float | None = None
    d_prime_out: float | None = None

    pace_fit = _fit_two_param(pace_frontier)
    if pace_fit is not None:
        cv_val, dp_val, _ = pace_fit
        cv = cv_val
        d_prime_out = max(_D_PRIME_MIN, min(_D_PRIME_MAX, dp_val))

    def _pace_model(t: float) -> float | None:
        if cv is None or d_prime_out is None:
            return None
        return cv + d_prime_out / t

    power_points = [
        CurvePoint(
            duration_sec=p.duration,
            actual_value=round(p.value, 1),
            model_value=round(m, 1) if (m := _power_model(p.duration)) is not None else None,
        )
        for p in power_frontier
    ]
    pace_points = [
        CurvePoint(
            duration_sec=p.duration,
            actual_value=round(p.value, 4),
            model_value=round(m, 4) if (m := _pace_model(p.duration)) is not None else None,
        )
        for p in pace_frontier
    ]

    race_predictions: list[RacePrediction] = []
    if cv is not None and d_prime_out is not None:
        race_predictions = _predict_race_times(cv, d_prime_out)

    return PerformanceCurveData(
        power_points=power_points,
        pace_points=pace_points,
        critical_power=round(cp, 0) if cp is not None else None,
        w_prime=round(w_prime_out, 0) if w_prime_out is not None else None,
        critical_velocity=round(cv, 4) if cv is not None else None,
        d_prime=round(d_prime_out, 1) if d_prime_out is not None else None,
        race_predictions=race_predictions,
        lookback_days=lookback_days,
        activities_analyzed=len(runs),
    )


def apply_estimate_to_profile(
    profile: AthleteProfile,
    estimate: ThresholdEstimate,
    fields: list[str] | None = None,
) -> list[str]:
    """Write estimated values onto ``profile`` in place; return fields updated."""
    candidates = {
        "threshold_power": (estimate.critical_power.value, int),
        "threshold_pace_min_km": (estimate.threshold_pace_min_km.value, float),
        "threshold_hr": (estimate.threshold_hr.value, int),
        "max_hr": (estimate.max_hr.value, int),
    }
    applied: list[str] = []
    for name, (value, caster) in candidates.items():
        if value is None:
            continue
        if fields is not None and name not in fields:
            continue
        setattr(profile, name, caster(value))
        applied.append(name)
    return applied


# ---------------------------------------------------------------------------
# AI context
# ---------------------------------------------------------------------------

def _format_pace(pace_min_km: float) -> str:
    p_min = int(pace_min_km)
    p_sec = int(round((pace_min_km - p_min) * 60))
    if p_sec == 60:
        p_min += 1
        p_sec = 0
    return f"{p_min}:{p_sec:02d}/km"


def format_threshold_estimate_context(
    estimate: ThresholdEstimate, profile: AthleteProfile | None
) -> str:
    """Render auto-derived thresholds the athlete hasn't set, as a markdown block."""
    lines: list[str] = []

    has_power = bool(profile and getattr(profile, "threshold_power", None))
    if not has_power and estimate.critical_power.value is not None:
        cp = estimate.critical_power.value
        detail = f" (confidence: {estimate.critical_power.confidence}"
        if estimate.w_prime is not None:
            detail += f", W' {estimate.w_prime:.0f} J"
        if estimate.pmax is not None:
            detail += f", Pmax {estimate.pmax:.0f} W"
        detail += ")"
        lines.append(f"- Critical Power (≈FTP): {cp:.0f} W{detail}")

    has_pace = bool(profile and profile.threshold_pace_min_km)
    if not has_pace and estimate.threshold_pace_min_km.value is not None:
        lines.append(
            f"- Threshold Pace: {_format_pace(estimate.threshold_pace_min_km.value)}"
            f" (grade-adjusted; confidence: {estimate.threshold_pace_min_km.confidence})"
        )

    has_hr = bool(profile and profile.threshold_hr)
    if not has_hr and estimate.threshold_hr.value is not None:
        lines.append(
            f"- Threshold HR (LTHR): {estimate.threshold_hr.value:.0f} bpm"
            f" (confidence: {estimate.threshold_hr.confidence})"
        )

    has_max = bool(profile and profile.max_hr)
    if not has_max and estimate.max_hr.value is not None:
        lines.append(f"- Max HR (observed): {estimate.max_hr.value:.0f} bpm")

    if not lines:
        return ""
    return (
        "## Estimated Thresholds (auto-derived from recent training)\n"
        "Computed from power-/velocity-duration curves; not yet saved to the profile.\n"
        + "\n".join(lines)
    )
