"""Durability / endurance score: fatigue-resistance index from mean-max curves.

Two computation modes:

**intra** — compares the athlete's best 5-min pace from the *early* portion
(first 30 min) of each long run against their best 5-min pace from the *late*
portion (after 30 min) of the same run.  Self-contained: no cross-run
contamination, handles tempo/intervals/easy equally.

**easy_baseline** — builds a "fresh" reference curve from *easy* runs only
(Garmin aerobic training effect < 3.0), then compares the late-portion best of
any long run against that easy-run frontier.  Shows how fatigued pace compares
to the athlete's comfortably-paced best.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models import Activity, DEFAULT_USER_ID
from app import streams as streams_mod

logger = logging.getLogger(__name__)

FATIGUE_OFFSET_SEC: int = 1800   # 30 min — split point between "early" and "late"
REFERENCE_DURATION_SEC: int = 300  # 5 min mean-max used as the index duration
MIN_ACTIVITY_DURATION_SEC: float = FATIGUE_OFFSET_SEC + REFERENCE_DURATION_SEC


def _is_run(activity_type: str | None) -> bool:
    if not activity_type:
        return False
    t = activity_type.lower()
    return "run" in t or "trail" in t or "treadmill" in t


def _is_easy_run(activity: Activity) -> bool:
    """True when Garmin aerobic training effect < 3.0 (base/maintaining), or unknown."""
    te = activity.training_effect_aerobic
    if te is None:
        return True   # no data → include rather than exclude
    return te < 3.0


def _gap(parsed: dict) -> list[float | None]:
    """Grade-adjusted speed from parsed streams; falls back to raw speed automatically."""
    return streams_mod.grade_adjusted_speed(
        parsed.get("speed", []),
        parsed.get("elevation", []),
        parsed.get("distance", []),
    )


def _split_at(time: list, values: list, offset: float):
    """Split (time, values) lists into early (< offset) and late (>= offset) halves."""
    split = next(
        (i for i, t in enumerate(time) if isinstance(t, (int, float)) and t >= offset),
        None,
    )
    if split is None:
        return (time, values, [], [])
    return (time[:split], values[:split], time[split:], values[split:])


@dataclass
class DurabilityPoint:
    date: str
    durability_index: float       # 0–105 %
    activity_name: str
    duration_sec: float
    metric: str                   # "pace" (GAP/speed) or "power"
    # Window positions within this activity (seconds from activity start)
    early_window_start_sec: float | None = None   # intra only
    early_window_end_sec: float | None = None
    late_window_start_sec: float | None = None
    late_window_end_sec: float | None = None


@dataclass
class DurabilityTrend:
    trend_points: list[DurabilityPoint] = field(default_factory=list)
    mean_durability: float | None = None
    durability_rating: str | None = None
    activities_analyzed: int = 0
    lookback_days: int = 90
    fatigue_offset_sec: int = FATIGUE_OFFSET_SEC
    reference_duration_sec: int = REFERENCE_DURATION_SEC
    mode: str = "intra"
    # easy_baseline only: the single activity that contributes the global fresh best
    fresh_activity_name: str | None = None
    fresh_activity_date: str | None = None
    fresh_activity_duration_sec: float | None = None
    fresh_window_start_sec: float | None = None
    fresh_window_end_sec: float | None = None


def _rating(mean_index: float) -> str:
    if mean_index >= 97:
        return "excellent"
    if mean_index >= 92:
        return "good"
    if mean_index >= 85:
        return "moderate"
    return "needs improvement"


def _compute_intra(runs: list[Activity]) -> list[DurabilityPoint]:
    """Intra-run mode: compare early vs late 5-min best within each run."""
    points: list[DurabilityPoint] = []

    for a in runs:
        if (a.duration_sec or 0) < MIN_ACTIVITY_DURATION_SEC:
            continue
        try:
            parsed = streams_mod.parse_streams(json.loads(a.laps_json))
        except (json.JSONDecodeError, TypeError):
            continue
        if parsed is None:
            continue

        gap = _gap(parsed)
        time = parsed["time"]
        e_time, e_vals, l_time, l_vals = _split_at(time, gap, FATIGUE_OFFSET_SEC)

        early = streams_mod._best_mean_with_position(e_time, e_vals, float(REFERENCE_DURATION_SEC))
        late = streams_mod._best_mean_with_position(l_time, l_vals, float(REFERENCE_DURATION_SEC))

        if early is None or late is None or early[0] <= 0:
            continue

        index = round(min(late[0] / early[0] * 100, 105.0), 1)
        date_str = a.started_at.date().isoformat() if a.started_at else "unknown"
        ref = float(REFERENCE_DURATION_SEC)
        points.append(DurabilityPoint(
            date=date_str,
            durability_index=index,
            activity_name=a.name or a.activity_type or "Run",
            duration_sec=a.duration_sec or 0,
            metric="pace",
            early_window_start_sec=early[1],
            early_window_end_sec=early[1] + ref,
            late_window_start_sec=late[1],
            late_window_end_sec=late[1] + ref,
        ))

    return points


def _compute_easy_baseline(runs: list[Activity]) -> tuple[list[DurabilityPoint], dict]:
    """Easy-baseline mode: compare late 5-min vs fresh easy-run frontier."""
    easy_runs = [a for a in runs if _is_easy_run(a)]

    # Build fresh frontier from easy runs using stored mean_max_json
    fresh_best_val: float | None = None
    fresh_best_act: Activity | None = None

    for a in easy_runs:
        try:
            curve = json.loads(a.mean_max_json)
        except (json.JSONDecodeError, TypeError):
            continue
        val = curve.get("gap_speed", {}).get(str(REFERENCE_DURATION_SEC))
        if val is not None and isinstance(val, (int, float)):
            if fresh_best_val is None or float(val) > fresh_best_val:
                fresh_best_val = float(val)
                fresh_best_act = a

    if fresh_best_val is None or fresh_best_val <= 0:
        return [], {}

    # Find WHERE in the fresh activity that best window sits
    fresh_info: dict = {}
    if fresh_best_act and fresh_best_act.laps_json:
        try:
            parsed_fresh = streams_mod.parse_streams(json.loads(fresh_best_act.laps_json))
            if parsed_fresh is not None:
                fresh_gap = _gap(parsed_fresh)
                result = streams_mod._best_mean_with_position(
                    parsed_fresh["time"], fresh_gap, float(REFERENCE_DURATION_SEC)
                )
                if result:
                    fresh_info = {
                        "name": fresh_best_act.name or "Run",
                        "date": fresh_best_act.started_at.date().isoformat() if fresh_best_act.started_at else "unknown",
                        "duration_sec": fresh_best_act.duration_sec or 0,
                        "window_start": result[1],
                        "window_end": result[1] + REFERENCE_DURATION_SEC,
                    }
        except Exception:
            pass

    # Analyze ALL long runs for late-portion performance
    points: list[DurabilityPoint] = []
    for a in runs:
        if (a.duration_sec or 0) < MIN_ACTIVITY_DURATION_SEC:
            continue
        try:
            parsed = streams_mod.parse_streams(json.loads(a.laps_json))
        except (json.JSONDecodeError, TypeError):
            continue
        if parsed is None:
            continue

        gap = _gap(parsed)
        time = parsed["time"]
        _, _, l_time, l_vals = _split_at(time, gap, FATIGUE_OFFSET_SEC)

        late = streams_mod._best_mean_with_position(l_time, l_vals, float(REFERENCE_DURATION_SEC))
        if late is None:
            continue

        index = round(min(late[0] / fresh_best_val * 100, 105.0), 1)
        date_str = a.started_at.date().isoformat() if a.started_at else "unknown"
        ref = float(REFERENCE_DURATION_SEC)
        points.append(DurabilityPoint(
            date=date_str,
            durability_index=index,
            activity_name=a.name or a.activity_type or "Run",
            duration_sec=a.duration_sec or 0,
            metric="pace",
            late_window_start_sec=late[1],
            late_window_end_sec=late[1] + ref,
        ))

    return points, fresh_info


def compute_durability_trend(
    db: Session,
    lookback_days: int = 90,
    user_id: int = DEFAULT_USER_ID,
    mode: str = "intra",
) -> DurabilityTrend:
    """Compute per-activity durability indices over the lookback window.

    ``mode`` must be ``"intra"`` or ``"easy_baseline"``.
    """
    if mode not in ("intra", "easy_baseline"):
        mode = "intra"

    cutoff = datetime.utcnow() - timedelta(days=lookback_days)
    activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == user_id,
            Activity.started_at >= cutoff,
            Activity.laps_json.isnot(None),
        )
        .order_by(Activity.started_at.asc())
        .all()
    )
    runs = [a for a in activities if _is_run(a.activity_type)]

    if not runs:
        return DurabilityTrend(mode=mode, lookback_days=lookback_days)

    if mode == "intra":
        points = _compute_intra(runs)
        trend = DurabilityTrend(mode=mode, lookback_days=lookback_days)
    else:
        # easy_baseline also needs mean_max_json for frontier building
        runs_with_mm = [a for a in runs if a.mean_max_json]
        points, fresh_info = _compute_easy_baseline(runs_with_mm)
        trend = DurabilityTrend(
            mode=mode,
            lookback_days=lookback_days,
            fresh_activity_name=fresh_info.get("name"),
            fresh_activity_date=fresh_info.get("date"),
            fresh_activity_duration_sec=fresh_info.get("duration_sec"),
            fresh_window_start_sec=fresh_info.get("window_start"),
            fresh_window_end_sec=fresh_info.get("window_end"),
        )

    if not points:
        trend.activities_analyzed = 0
        return trend

    mean_idx = round(sum(p.durability_index for p in points) / len(points), 1)
    trend.trend_points = points
    trend.mean_durability = mean_idx
    trend.durability_rating = _rating(mean_idx)
    trend.activities_analyzed = len(points)
    return trend


def format_durability_context(trend: DurabilityTrend) -> str:
    """One-liner + recent data points for the AI coaching context."""
    if trend.activities_analyzed == 0 or trend.mean_durability is None:
        return ""
    mode_label = "intra-run early vs late" if trend.mode == "intra" else "vs easy-run baseline"
    lines = [
        f"Durability Index: {trend.mean_durability:.1f}% ({trend.durability_rating}) "
        f"— {mode_label}, sustained 5-min effort after {trend.fatigue_offset_sec // 60} min "
        f"[{trend.activities_analyzed} qualifying runs, {trend.lookback_days}d window]"
    ]
    for p in trend.trend_points[-3:]:
        dur_min = int((p.duration_sec or 0) // 60)
        lines.append(f"  {p.date}: {p.durability_index:.1f}% ({dur_min} min run)")
    return "## Durability (Fatigue Resistance)\n" + "\n".join(lines)
