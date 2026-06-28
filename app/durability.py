"""Durability / endurance score: fatigue-resistance index from mean-max curves.

For each long activity (duration > FATIGUE_OFFSET_SEC + REFERENCE_DURATION_SEC),
we compare the mean-maximal GAP-speed (or power) computed from the *late* portion
of the stream (after FATIGUE_OFFSET_SEC) against the athlete's all-time-best
(fresh) curve from the same lookback window.

    durability_index = late_best_at_REF_dur / fresh_best_at_REF_dur × 100

100% means the athlete sustains their peak 5-minute effort even after 30 minutes
of running. Values above ~95% indicate strong fatigue resistance; below ~85%
suggests significant aerobic decoupling.
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

FATIGUE_OFFSET_SEC: int = 1800   # 30 min — samples before this are "fresh"
REFERENCE_DURATION_SEC: int = 300  # 5 min mean-max effort used as the index point
MIN_ACTIVITY_DURATION_SEC: float = FATIGUE_OFFSET_SEC + REFERENCE_DURATION_SEC  # 35 min


def _is_run(activity_type: str | None) -> bool:
    if not activity_type:
        return False
    t = activity_type.lower()
    return "run" in t or "trail" in t or "treadmill" in t


@dataclass
class DurabilityPoint:
    date: str
    durability_index: float   # 0–105 %
    activity_name: str
    duration_sec: float
    metric: str               # "pace" or "power"


@dataclass
class DurabilityTrend:
    trend_points: list[DurabilityPoint] = field(default_factory=list)
    mean_durability: float | None = None
    durability_rating: str | None = None
    activities_analyzed: int = 0
    lookback_days: int = 90
    fatigue_offset_sec: int = FATIGUE_OFFSET_SEC
    reference_duration_sec: int = REFERENCE_DURATION_SEC


def _rating(mean_index: float) -> str:
    if mean_index >= 97:
        return "excellent"
    if mean_index >= 92:
        return "good"
    if mean_index >= 85:
        return "moderate"
    return "needs improvement"


def compute_durability_trend(
    db: Session,
    lookback_days: int = 90,
    user_id: int = DEFAULT_USER_ID,
) -> DurabilityTrend:
    """Compute per-activity durability indices over the lookback window.

    1. Load all run activities with mean_max_json + laps_json.
    2. Build the fresh frontier: per-duration max across all mean_max_json values.
    3. For each activity long enough (≥ 35 min), parse streams, extract the late
       portion (after 30 min), compute mean-max at 300 s, compute the ratio.
    """
    cutoff = datetime.utcnow() - timedelta(days=lookback_days)
    activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == user_id,
            Activity.started_at >= cutoff,
            Activity.laps_json.isnot(None),
            Activity.mean_max_json.isnot(None),
        )
        .order_by(Activity.started_at.asc())
        .all()
    )
    runs = [a for a in activities if _is_run(a.activity_type)]

    if not runs:
        return DurabilityTrend(lookback_days=lookback_days)

    # Build fresh frontier from stored mean_max_json (already the best-effort curve)
    fresh_gap: dict[int, float] = {}
    fresh_power: dict[int, float] = {}

    for a in runs:
        try:
            curve = json.loads(a.mean_max_json)
        except (json.JSONDecodeError, TypeError):
            continue
        for dur_str, val in curve.get("gap_speed", {}).items():
            dur = int(dur_str)
            if isinstance(val, (int, float)) and val > fresh_gap.get(dur, 0.0):
                fresh_gap[dur] = float(val)
        for dur_str, val in curve.get("power", {}).items():
            dur = int(dur_str)
            if isinstance(val, (int, float)) and val > fresh_power.get(dur, 0.0):
                fresh_power[dur] = float(val)

    fresh_gap_ref = fresh_gap.get(REFERENCE_DURATION_SEC)
    fresh_power_ref = fresh_power.get(REFERENCE_DURATION_SEC)

    if fresh_gap_ref is None and fresh_power_ref is None:
        return DurabilityTrend(lookback_days=lookback_days)

    points: list[DurabilityPoint] = []

    for a in runs:
        if (a.duration_sec or 0) < MIN_ACTIVITY_DURATION_SEC:
            continue
        try:
            details = json.loads(a.laps_json)
        except (json.JSONDecodeError, TypeError):
            continue

        parsed = streams_mod.parse_streams(details)
        if parsed is None:
            continue

        late = streams_mod.compute_late_mean_max_curve(
            parsed,
            fatigue_offset_sec=FATIGUE_OFFSET_SEC,
            durations=[REFERENCE_DURATION_SEC],
        )
        if not late:
            continue

        date_str = a.started_at.date().isoformat() if a.started_at else "unknown"
        name = a.name or a.activity_type or "Run"

        # Prefer GAP speed (most runners lack power)
        if fresh_gap_ref and fresh_gap_ref > 0:
            late_val = late.get("gap_speed", {}).get(REFERENCE_DURATION_SEC)
            if late_val is not None:
                index = round(min(late_val / fresh_gap_ref * 100, 105.0), 1)
                points.append(DurabilityPoint(
                    date=date_str,
                    durability_index=index,
                    activity_name=name,
                    duration_sec=a.duration_sec or 0,
                    metric="pace",
                ))
                continue

        if fresh_power_ref and fresh_power_ref > 0:
            late_val = late.get("power", {}).get(REFERENCE_DURATION_SEC)
            if late_val is not None:
                index = round(min(late_val / fresh_power_ref * 100, 105.0), 1)
                points.append(DurabilityPoint(
                    date=date_str,
                    durability_index=index,
                    activity_name=name,
                    duration_sec=a.duration_sec or 0,
                    metric="power",
                ))

    if not points:
        return DurabilityTrend(lookback_days=lookback_days, activities_analyzed=0)

    mean_idx = round(sum(p.durability_index for p in points) / len(points), 1)
    return DurabilityTrend(
        trend_points=points,
        mean_durability=mean_idx,
        durability_rating=_rating(mean_idx),
        activities_analyzed=len(points),
        lookback_days=lookback_days,
    )


def format_durability_context(trend: DurabilityTrend) -> str:
    """One-liner + recent data points for the AI coaching context."""
    if trend.activities_analyzed == 0 or trend.mean_durability is None:
        return ""
    lines = [
        f"Durability Index: {trend.mean_durability:.1f}% ({trend.durability_rating}) "
        f"— sustained performance after {trend.fatigue_offset_sec // 60} min of running "
        f"[{trend.activities_analyzed} qualifying activities, {trend.lookback_days}d window]"
    ]
    for p in trend.trend_points[-3:]:
        dur_min = int((p.duration_sec or 0) // 60)
        lines.append(f"  {p.date}: {p.durability_index:.1f}% ({p.metric}, {dur_min} min)")
    return "## Durability (Fatigue Resistance)\n" + "\n".join(lines)
