"""Personal records / peak-performance detection.

Detects when a synced activity sets a new all-time best against the athlete's
own history, using data already computed elsewhere: the per-activity
mean-maximal curve (see :mod:`app.streams`, stored on ``Activity.mean_max_json``)
for duration-based bests (best sustained power / grade-adjusted pace at each
standard duration) and Strava-style "Best Efforts" (fastest time to cover each
standard race distance anywhere within the activity, also in ``mean_max_json``
as ``distance_efforts`` — so a half marathon race yields a 5K and 10K best
effort too, not just a Half Marathon one). Pure detection over stored data —
no new sync.

Two entry points:

- :func:`detect_new_records_for_activity` — incremental, called right after a
  single new activity is stored during live sync. Compares only against
  activities that happened *before* it (by ``started_at``), so a late-arriving
  activity for a past date can't be mistaken for a new best.
- :func:`rebuild_personal_records` — full replay in chronological order, used
  once after a historical backfill completes. Backfill pages arrive
  newest-first, so per-activity incremental detection during backfill would
  compare each activity against an incomplete history.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app import streams
from app.models import DEFAULT_USER_ID, Activity, PersonalRecord, SyncStatus

logger = logging.getLogger(__name__)

DURATION_METRICS = ("power", "gap_speed")

# Canonical chip order for the UI — Strava's "Best Efforts" distance set.
RACE_DISTANCE_LABELS = [label for label, _ in streams.RACE_DISTANCES_M]

# Bumped whenever the record-detection logic changes in a way that requires
# re-mining existing history (see ensure_records_backfilled).
_BACKFILL_STATUS_KEY = "personal_records_backfill_version"
_BACKFILL_VERSION = 2  # v2: Strava-style rolling-window distance-effort bests


def _is_run(activity_type: str | None) -> bool:
    if not activity_type:
        return False
    t = activity_type.lower()
    return "run" in t or "treadmill" in t


def _duration_curve(activity: Activity, metric: str) -> dict[int, float]:
    if not activity.mean_max_json:
        return {}
    try:
        curve = json.loads(activity.mean_max_json)
    except (json.JSONDecodeError, TypeError):
        return {}
    sub = curve.get(metric) or {}
    out: dict[int, float] = {}
    for dur_str, val in sub.items():
        try:
            out[int(dur_str)] = float(val)
        except (TypeError, ValueError):
            continue
    return out


def _distance_efforts(activity: Activity) -> dict[str, float]:
    """This activity's fastest time at each standard race distance, if any."""
    if not activity.mean_max_json:
        return {}
    try:
        curve = json.loads(activity.mean_max_json)
    except (json.JSONDecodeError, TypeError):
        return {}
    efforts = curve.get("distance_efforts") or {}
    return {
        label: float(seconds)
        for label, seconds in efforts.items()
        if isinstance(seconds, (int, float))
    }


@dataclass
class _BestState:
    """Running best-so-far, keyed by (metric, duration) and by distance label."""

    duration_best: dict[tuple[str, int], float] = field(default_factory=dict)
    distance_best: dict[str, float] = field(default_factory=dict)


def _accumulate(state: _BestState, activity: Activity) -> None:
    """Fold ``activity`` into ``state`` without generating any records."""
    if not _is_run(activity.activity_type) or not activity.started_at:
        return
    for metric in DURATION_METRICS:
        for duration, value in _duration_curve(activity, metric).items():
            key = (metric, duration)
            if value > state.duration_best.get(key, float("-inf")):
                state.duration_best[key] = value
    for label, seconds in _distance_efforts(activity).items():
        if seconds < state.distance_best.get(label, float("inf")):
            state.distance_best[label] = seconds


def _check_and_record(
    activity: Activity, state: _BestState, user_id: int
) -> list[PersonalRecord]:
    """Compare ``activity`` against ``state``, returning new records and advancing ``state``."""
    if not _is_run(activity.activity_type) or not activity.started_at:
        return []

    records: list[PersonalRecord] = []

    for metric in DURATION_METRICS:
        for duration, value in _duration_curve(activity, metric).items():
            key = (metric, duration)
            prior_best = state.duration_best.get(key)
            if prior_best is None or value > prior_best:
                records.append(PersonalRecord(
                    user_id=user_id,
                    record_type="duration",
                    metric=metric,
                    duration_sec=duration,
                    value=value,
                    previous_value=prior_best,
                    activity_id=activity.id,
                    achieved_at=activity.started_at,
                ))
                state.duration_best[key] = value

    for label, seconds in _distance_efforts(activity).items():
        prior_best = state.distance_best.get(label)
        if prior_best is None or seconds < prior_best:
            records.append(PersonalRecord(
                user_id=user_id,
                record_type="distance",
                distance_label=label,
                value=seconds,
                previous_value=prior_best,
                activity_id=activity.id,
                achieved_at=activity.started_at,
            ))
            state.distance_best[label] = seconds

    return records


def detect_new_records_for_activity(
    db: Session, activity: Activity, user_id: int = DEFAULT_USER_ID
) -> list[PersonalRecord]:
    """Detect and persist any new bests set by a single newly-synced activity.

    Compares only against activities that started strictly before this one, so
    it stays correct regardless of what order activities are synced in.
    """
    if not activity.started_at:
        return []
    prior = (
        db.query(Activity)
        .filter(
            Activity.user_id == user_id,
            Activity.id != activity.id,
            Activity.started_at.isnot(None),
            Activity.started_at < activity.started_at,
        )
        .all()
    )
    state = _BestState()
    for a in prior:
        _accumulate(state, a)

    new_records = _check_and_record(activity, state, user_id)
    if new_records:
        db.add_all(new_records)
        db.commit()
        for r in new_records:
            db.refresh(r)
    return new_records


def rebuild_personal_records(db: Session, user_id: int = DEFAULT_USER_ID) -> int:
    """Recompute the full personal-record history in chronological order.

    Clears existing records for the user and replays every activity oldest to
    newest, so each is checked only against what truly preceded it. Used once
    after a historical backfill (whose activities land newest-page-first, so
    per-activity incremental detection during backfill would be unreliable).
    """
    db.query(PersonalRecord).filter(PersonalRecord.user_id == user_id).delete()

    activities = (
        db.query(Activity)
        .filter(Activity.user_id == user_id, Activity.started_at.isnot(None))
        .order_by(Activity.started_at.asc())
        .all()
    )

    state = _BestState()
    created = 0
    for activity in activities:
        new_records = _check_and_record(activity, state, user_id)
        if new_records:
            db.add_all(new_records)
            created += len(new_records)

    db.commit()
    logger.info("Rebuilt personal records for user %s: %d records", user_id, created)
    return created


def ensure_records_backfilled(db: Session, user_id: int = DEFAULT_USER_ID) -> None:
    """Lazily (re)mine full history when the detection logic version advances.

    ``rebuild_personal_records`` normally runs once, right after a historical
    Garmin backfill completes. Accounts that finished their backfill before
    this feature existed (or before a later change to how records are
    detected) never got that call, so their pre-existing activities would
    otherwise never be (re)checked. A ``SyncStatus`` row tracks the backfill
    version this user's records were last built with; a mismatch triggers a
    one-time re-mine: recompute any activity curves missing distance-effort
    data, then replay full history in chronological order. Mirrors the
    self-healing pattern used elsewhere (e.g. ``streams.backfill_missing_curves``)
    — the first request after a version bump pays the one-time cost; every
    request after that is a single indexed lookup.
    """
    status = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == user_id, SyncStatus.key == _BACKFILL_STATUS_KEY)
        .first()
    )
    current_version = int(status.value) if status and status.value else 0
    if current_version >= _BACKFILL_VERSION:
        return
    has_history = (
        db.query(Activity.id)
        .filter(Activity.user_id == user_id, Activity.started_at.isnot(None))
        .first()
    )
    if has_history is not None:
        try:
            streams.backfill_missing_distance_efforts(db, user_id=user_id)
            rebuild_personal_records(db, user_id=user_id)
        except Exception:
            logger.exception("Lazy personal-record backfill failed for user %s", user_id)
            return  # leave the version stale so the next request retries

    if status:
        status.value = str(_BACKFILL_VERSION)
        status.updated_at = datetime.now(timezone.utc)
    else:
        db.add(SyncStatus(
            user_id=user_id, key=_BACKFILL_STATUS_KEY, value=str(_BACKFILL_VERSION),
            updated_at=datetime.now(timezone.utc),
        ))
    db.commit()


# ---------------------------------------------------------------------------
# Queries
# ---------------------------------------------------------------------------

def get_current_bests(db: Session, user_id: int = DEFAULT_USER_ID) -> list[PersonalRecord]:
    """The current (latest) record per duration/distance key — the all-time bests."""
    all_records = (
        db.query(PersonalRecord)
        .filter(PersonalRecord.user_id == user_id)
        .order_by(PersonalRecord.achieved_at.asc())
        .all()
    )
    latest: dict[tuple, PersonalRecord] = {}
    for r in all_records:
        key = (r.record_type, r.metric, r.duration_sec, r.distance_label)
        latest[key] = r  # ascending order => the last write per key is the current best
    return list(latest.values())


def get_recent_records(
    db: Session, user_id: int = DEFAULT_USER_ID, days: int = 90
) -> list[PersonalRecord]:
    """Records achieved within the last ``days`` days, most recent first."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    return (
        db.query(PersonalRecord)
        .filter(PersonalRecord.user_id == user_id, PersonalRecord.achieved_at >= cutoff)
        .order_by(PersonalRecord.achieved_at.desc())
        .all()
    )


def get_distance_top_n(
    db: Session, user_id: int = DEFAULT_USER_ID, top_n: int = 3
) -> dict[str, list[PersonalRecord]]:
    """Top-``top_n`` historical bests per race distance, fastest first.

    ``PersonalRecord`` is append-only and a row is only created when a time
    actually beats the prior best for that distance, so the sequence of rows
    for a given distance label is already strictly improving over time — the
    most-recently-achieved row is the fastest, the one before it is the
    second-fastest, and so on. Sorting by ``achieved_at`` descending therefore
    gives the fastest-first rank directly, with no separate ranking query.
    """
    all_records = (
        db.query(PersonalRecord)
        .filter(PersonalRecord.user_id == user_id, PersonalRecord.record_type == "distance")
        .order_by(PersonalRecord.achieved_at.desc())
        .all()
    )
    out: dict[str, list[PersonalRecord]] = {}
    for r in all_records:
        bucket = out.setdefault(r.distance_label, [])
        if len(bucket) < top_n:
            bucket.append(r)
    return out


# ---------------------------------------------------------------------------
# Formatting
# ---------------------------------------------------------------------------

def _format_duration_label(duration_sec: int) -> str:
    if duration_sec < 60:
        return f"{duration_sec}-sec"
    mins = duration_sec / 60
    return f"{int(mins)}-min" if mins == int(mins) else f"{mins:.1f}-min"


def _format_pace_from_speed(speed_ms: float | None) -> str:
    if not speed_ms or speed_ms <= 0:
        return "n/a"
    pace_min_km = (1000.0 / speed_ms) / 60.0
    m = int(pace_min_km)
    s = int(round((pace_min_km - m) * 60))
    if s == 60:
        m += 1
        s = 0
    return f"{m}:{s:02d}/km"


def _format_race_time(seconds: float | None) -> str:
    if seconds is None:
        return "n/a"
    seconds = int(round(seconds))
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def _format_duration_value(metric: str, value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"{value:.0f} W" if metric == "power" else _format_pace_from_speed(value)


def record_label(record: PersonalRecord) -> str:
    """Short human-readable label for a record, e.g. '20-min power' or 'Half Marathon'."""
    if record.record_type == "duration":
        metric_label = "power" if record.metric == "power" else "GAP-pace"
        return f"{_format_duration_label(record.duration_sec)} {metric_label}"
    return record.distance_label or ""


def record_display_value(record: PersonalRecord) -> str:
    """Formatted value for a record, e.g. '320 W' or '1:32:10'."""
    if record.record_type == "duration":
        return _format_duration_value(record.metric, record.value)
    return _format_race_time(record.value)


def format_record_line(record: PersonalRecord) -> str:
    """One human-readable line describing a single PersonalRecord."""
    if record.record_type == "duration":
        label = _format_duration_label(record.duration_sec)
        metric_label = "power" if record.metric == "power" else "GAP-pace"
        line = f"New {label} {metric_label} best: {_format_duration_value(record.metric, record.value)}"
        if record.previous_value is not None:
            line += f" (previous: {_format_duration_value(record.metric, record.previous_value)})"
        return line
    line = f"New {record.distance_label} best: {_format_race_time(record.value)}"
    if record.previous_value is not None:
        line += f" (previous: {_format_race_time(record.previous_value)})"
    return line


def format_activity_pr_context(
    db: Session, activity_id: int, user_id: int = DEFAULT_USER_ID
) -> str:
    """Markdown block summarizing PRs set by one activity, for the AI context."""
    records = (
        db.query(PersonalRecord)
        .filter(PersonalRecord.user_id == user_id, PersonalRecord.activity_id == activity_id)
        .all()
    )
    if not records:
        return ""
    lines = "\n".join(f"- {format_record_line(r)}" for r in records)
    return "**Personal Records set in this activity — clear fitness signal:**\n" + lines
