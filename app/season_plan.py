"""Deterministic season-long periodization skeleton to the athlete's goal race.

Unlike ``generate_training_plan`` (AI-generated, rolling 4-week window), this
module is pure rule-based computation — no AI call — that splits the weeks
between now and the goal race into phase blocks (base/build/peak/taper/race/
recovery) with a target weekly volume per week. It's cheap enough to compute
on every read, and is injected into ``_build_plan_context`` so the 4-week
generator has a season-long skeleton to fill in.
"""
import logging
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import (
    Activity,
    AthleteProfile,
    DEFAULT_USER_ID,
    GarminCalendarEvent,
    SeasonPlan,
    SeasonPlanWeek,
)

logger = logging.getLogger(__name__)

# Same distance-category thresholds as app.ai_coach._race_distance_category,
# kept independent here to avoid a cross-module refactor of existing tested code.
_TAPER_WEEKS_BY_CATEGORY = {"marathon": 3, "half": 2, "10k": 1, "short": 1}
_RECOVERY_WEEKS_BY_CATEGORY = {"marathon": 2, "half": 2, "10k": 1, "short": 1}

_VOLUME_FACTOR_BY_PREFERENCE = {"gradual": 1.15, "steady": 1.25, "progressive": 1.4}

_TAPER_PCT_OF_PEAK = {1: 0.70, 2: 0.825, 3: 0.90}
_RACE_WEEK_PCT_OF_PEAK = 0.45
_RECOVERY_PCT_OF_PEAK = {1: 0.35, 2: 0.625}
_CUTBACK_WEEK_FACTOR = 0.8

_PHASE_NOTES = {
    "base": "Base — aerobic volume build",
    "build": "Build — quality + volume",
    "peak": "Peak — race-specific sharpening",
}


@dataclass
class GoalRace:
    date: date
    title: str | None
    distance_m: float | None
    source: str  # "garmin_calendar" | "profile"


def _next_monday(ref: date) -> date:
    """Return the Monday on or after ``ref``."""
    days_ahead = (7 - ref.weekday()) % 7
    return ref + timedelta(days=days_ahead if days_ahead else 7)


def _week_monday(d: date) -> date:
    """Return the Monday of the week containing ``d``."""
    return d - timedelta(days=d.weekday())


def _race_distance_category(distance_m: float | None) -> str:
    """Classify a race distance into a taper/recovery category (mirrors ai_coach's)."""
    if not distance_m:
        return "short"
    if distance_m >= 30000:
        return "marathon"
    if distance_m >= 18000:
        return "half"
    if distance_m >= 8000:
        return "10k"
    return "short"


def select_goal_race(
    db: Session, user_id: int = DEFAULT_USER_ID, reference_date: date | None = None
) -> GoalRace | None:
    """Pick the athlete's goal race: nearest upcoming A-priority Garmin race,
    else the nearest upcoming race of any priority, else the profile's
    freeform goal race date, else None.
    """
    ref = reference_date or date.today()

    upcoming_races = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.user_id == user_id,
            GarminCalendarEvent.event_type == "race",
            GarminCalendarEvent.date >= ref,
        )
        .order_by(GarminCalendarEvent.date.asc())
        .all()
    )
    if upcoming_races:
        a_priority = next((r for r in upcoming_races if r.priority == "A"), None)
        chosen = a_priority or upcoming_races[0]
        return GoalRace(
            date=chosen.date,
            title=chosen.title,
            distance_m=chosen.distance_m,
            source="garmin_calendar",
        )

    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    if profile and profile.goal_race_date and profile.goal_race_date >= ref:
        return GoalRace(
            date=profile.goal_race_date,
            title=profile.goal_race,
            distance_m=None,
            source="profile",
        )

    return None


def _split_phases(build_weeks: int) -> tuple[int, int, int]:
    """Split the weeks-before-taper into (base, build, peak) week counts.

    Roughly 45/35/20; collapses to all-base when too short to periodize.
    Each phase gets at least 1 week once build_weeks >= 3.
    """
    if build_weeks <= 0:
        return (0, 0, 0)
    if build_weeks < 3:
        return (build_weeks, 0, 0)
    peak_n = max(1, round(build_weeks * 0.20))
    build_n = max(1, round(build_weeks * 0.35))
    base_n = build_weeks - peak_n - build_n
    return (base_n, build_n, peak_n)


def _weekly_baseline_and_peak(
    db: Session, profile: AthleteProfile | None, user_id: int, reference_date: date
) -> tuple[float | None, float | None]:
    """Baseline = stated or actual recent weekly km; peak = stated or scaled target."""
    baseline_km = profile.weekly_mileage_km if profile and profile.weekly_mileage_km else None
    if baseline_km is None:
        cutoff = reference_date - timedelta(days=28)
        total_m = (
            db.query(func.sum(Activity.distance_m))
            .filter(
                Activity.user_id == user_id,
                Activity.started_at >= datetime.combine(cutoff, datetime.min.time()),
                Activity.started_at < datetime.combine(reference_date, datetime.min.time()),
            )
            .scalar()
        )
        if total_m:
            baseline_km = (total_m / 1000.0) / 4.0

    peak_km = None
    if profile and profile.target_weekly_km:
        peak_km = profile.target_weekly_km
    elif baseline_km is not None:
        factor = _VOLUME_FACTOR_BY_PREFERENCE.get(
            profile.training_volume if profile else None, 1.25
        )
        peak_km = baseline_km * factor

    return baseline_km, peak_km


def generate_season_plan(
    db: Session, user_id: int = DEFAULT_USER_ID, reference_date: date | None = None
) -> SeasonPlan | None:
    """Compute and persist a fresh season-long periodization skeleton.

    Returns None if there's no goal race to periodize toward, or the goal
    race falls before the skeleton could start (this week or already past).
    """
    ref = reference_date or date.today()
    goal = select_goal_race(db, user_id, ref)
    if goal is None:
        return None

    start = _next_monday(ref)
    if goal.date < start:
        return None

    race_week_start = _week_monday(goal.date)
    total_weeks_to_race = (race_week_start - start).days // 7 + 1

    category = _race_distance_category(goal.distance_m)
    weeks_before_race = total_weeks_to_race - 1
    taper_weeks = min(_TAPER_WEEKS_BY_CATEGORY[category], weeks_before_race)
    recovery_weeks = _RECOVERY_WEEKS_BY_CATEGORY[category]
    build_weeks = max(0, weeks_before_race - taper_weeks)
    base_n, build_n, peak_n = _split_phases(build_weeks)
    ramp_weeks = base_n + build_n + peak_n

    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    baseline_km, peak_km = _weekly_baseline_and_peak(db, profile, user_id, ref)

    weeks_data: list[dict] = []
    for week_idx in range(total_weeks_to_race):
        week_number = week_idx + 1
        week_start = start + timedelta(days=7 * week_idx)

        if week_idx < ramp_weeks:
            phase = "base" if week_idx < base_n else ("build" if week_idx < base_n + build_n else "peak")
            target = None
            if ramp_weeks > 0 and baseline_km is not None and peak_km is not None:
                progress = (week_idx + 1) / ramp_weeks
                target = baseline_km + (peak_km - baseline_km) * progress
                if week_number % 4 == 0:
                    target *= _CUTBACK_WEEK_FACTOR
            notes = _PHASE_NOTES[phase]
        elif week_idx < ramp_weeks + taper_weeks:
            weeks_before = taper_weeks - (week_idx - ramp_weeks)
            phase = "taper"
            target = peak_km * _TAPER_PCT_OF_PEAK.get(weeks_before, 0.90) if peak_km else None
            plural = "s" if weeks_before != 1 else ""
            notes = f"Taper — {weeks_before} week{plural} out"
        else:
            phase = "race"
            target = peak_km * _RACE_WEEK_PCT_OF_PEAK if peak_km else None
            notes = "Race week"

        weeks_data.append({
            "week_number": week_number,
            "week_start": week_start,
            "phase": phase,
            "target_weekly_km": target,
            "notes": notes,
        })

    for i in range(recovery_weeks):
        weeks_since = i + 1
        week_number = total_weeks_to_race + weeks_since
        week_start = start + timedelta(days=7 * (total_weeks_to_race + i))
        target = peak_km * _RECOVERY_PCT_OF_PEAK.get(weeks_since, 0.625) if peak_km else None
        weeks_data.append({
            "week_number": week_number,
            "week_start": week_start,
            "phase": "recovery",
            "target_weekly_km": target,
            "notes": f"Recovery — week {weeks_since} post-race",
        })

    return _store_season_plan(db, weeks_data, goal, start, peak_km, user_id)


def _store_season_plan(
    db: Session,
    weeks_data: list[dict],
    goal: GoalRace,
    start: date,
    peak_km: float | None,
    user_id: int,
) -> SeasonPlan:
    plan = SeasonPlan(
        user_id=user_id,
        generated_at=datetime.now(timezone.utc),
        start_date=start,
        goal_race_title=goal.title,
        goal_race_date=goal.date,
        goal_race_distance_m=goal.distance_m,
        goal_race_source=goal.source,
        peak_weekly_km=peak_km,
    )
    db.add(plan)
    db.flush()  # populate plan.id

    for w in weeks_data:
        db.add(SeasonPlanWeek(
            user_id=user_id,
            season_plan_id=plan.id,
            week_number=w["week_number"],
            week_start=w["week_start"],
            phase=w["phase"],
            target_weekly_km=w["target_weekly_km"],
            notes=w["notes"],
        ))
    db.commit()
    logger.info(
        "Season plan generated: %d weeks to %s (%s)",
        len(weeks_data), goal.date, goal.title or "goal race",
    )
    return plan


def ensure_season_plan(
    db: Session, user_id: int = DEFAULT_USER_ID, reference_date: date | None = None
) -> SeasonPlan | None:
    """Return the current season plan, regenerating it if the goal race is
    new, has changed, or no longer applies.
    """
    ref = reference_date or date.today()
    goal = select_goal_race(db, user_id, ref)

    existing = (
        db.query(SeasonPlan)
        .filter(SeasonPlan.user_id == user_id)
        .order_by(SeasonPlan.generated_at.desc())
        .first()
    )

    if goal is None:
        return existing

    if existing is not None and existing.goal_race_date == goal.date:
        return existing

    return generate_season_plan(db, user_id, ref)


def build_season_plan_context(
    db: Session,
    user_id: int,
    window_start: date,
    window_weeks: int,
    reference_date: date | None = None,
) -> str | None:
    """Render the skeleton weeks overlapping the current plan window as AI context."""
    plan = ensure_season_plan(db, user_id, reference_date)
    if plan is None:
        return None

    window_end = window_start + timedelta(days=7 * window_weeks)
    weeks = (
        db.query(SeasonPlanWeek)
        .filter(
            SeasonPlanWeek.season_plan_id == plan.id,
            SeasonPlanWeek.user_id == user_id,
            SeasonPlanWeek.week_start >= window_start,
            SeasonPlanWeek.week_start < window_end,
        )
        .order_by(SeasonPlanWeek.week_start.asc())
        .all()
    )
    if not weeks:
        return None

    lines = [
        f"- Week of {w.week_start}: {w.phase.upper()}"
        + (f", target ~{w.target_weekly_km:.0f} km" if w.target_weekly_km else "")
        + (f" — {w.notes}" if w.notes else "")
        for w in weeks
    ]
    return (
        "## Season Plan Skeleton (guides phase & target weekly volume for these "
        "weeks; detailed workouts still follow the rules above)\n"
        + "\n".join(lines)
        + f"\n\nGoal race: {plan.goal_race_title or 'race'} on {plan.goal_race_date}."
    )
