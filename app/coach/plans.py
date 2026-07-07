"""Training plan generation, realignment detection, and race periodization.

``db_session()`` opens and the ``_get_ai_config``/``_call_ai`` provider
lookups are routed through the ``app.ai_coach`` shim rather than called as
bare names, since the test suite monkeypatches these on ``app.ai_coach``
(e.g. ``monkeypatch.setattr(ai_coach, "_get_ai_config", ...)``) and a bare
in-module call would resolve against this module's own globals instead.
"""
import json
import logging
import time
from datetime import datetime, date, timedelta, timezone

import anthropic
from google import genai
from google.genai import errors as _genai_errors
from google.genai import types as _genai_types

from sqlalchemy.orm import Session
from sqlalchemy import func

from app import training_load
from app import threshold as threshold_mod
from app import season_plan as season_plan_mod
from app import nutrition as nutrition_mod
from app.config import settings
from app.models import (
    DEFAULT_USER_ID,
    Activity,
    AthleteProfile,
    DailySummary,
    GarminCalendarEvent,
    Insight,
    SyncStatus,
    TrainingPlan,
    TrainingPlanDay,
)
from app.strength_routines import catalog_summary, get_routine
from app.coach.context import (
    _build_context,
    _format_activity_context,
    _format_athlete_profile_context,
    _load_zones,
    _load_zone_configs,
    recent_heat_stress,
)
from app.coach.providers import AITransientError, AIFatalError, _MAX_RETRIES, _BACKOFF_BASE

logger = logging.getLogger(__name__)

_PLAN_MAX_TOKENS = 16000


def _build_plan_system_prompt() -> str:
    """Build the plan generation system prompt, embedding the current routine catalog."""
    routine_catalog = catalog_summary()
    return f"""You are an expert running coach generating a periodized training plan.
Output ONLY a valid JSON object with no markdown fences, no commentary — just raw JSON.

Schema:
{{
  "phase": "<base|build|peak|taper>",
  "overview": "<2-3 sentence narrative about the plan's intent>",
  "weeks": [
    {{
      "week_number": 1,
      "theme": "<short theme, e.g. 'Aerobic Base'>",
      "notes": "<1-2 sentence coaching note for the week>",
      "days": [
        {{
          "date": "YYYY-MM-DD",
          "day_of_week": "<Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday>",
          "workout_type": "<easy|tempo|long|interval|rest|cross|strength>",
          "target_distance_km": <number or null>,
          "target_pace_display": "<e.g. '5:15/km' or null>",
          "description": "<brief workout description>",
          "notes": "<optional coaching note or null>",
          "routine_id": "<routine id from the catalog below, or null>"
        }}
      ]
    }}
  ]
}}

Available strength & mobility routines (use the exact id string for routine_id):
{routine_catalog}

Rules:
- Generate exactly 4 weeks, each with exactly 7 days in order starting from the given week_start.
- workout_type must be one of: easy, tempo, long, interval, rest, cross, strength.
- target_distance_km and target_pace_display may be null for rest, cross, and strength days.
- Respect the athlete's weekly_availability (days/sessions per week).
- Anchor pace targets to the athlete's threshold pace if available.
- Distribute load progressively: build 2 weeks, recover 1 week, then race-specific or peak.
- Account for any upcoming races as goal events (taper if race is within 3 weeks).
- When a "Race Periodization Directives" section is present in the athlete context, the
  per-week volume/intensity caps listed there are mandatory and override the generic
  progressive-build, adherence, and strength rules above for the specific weeks listed —
  do not increase volume during a listed RACE WEEK, TAPER, or RECOVERY week even if
  adherence has been excellent.
- When a "Season Plan Skeleton" section is present, use its per-week phase and target
  weekly volume as guidance for shaping this 4-week plan's phase/volume — it reflects the
  season-long periodization to the goal race. Race Periodization Directives (if present)
  still take precedence over it for the specific weeks they cover.
- Respect injury history — avoid high-impact volume if relevant injuries are listed.
- Strength & cross-training:
  * Include 1–2 `strength` sessions per week during base and build phases; 0–1 during taper
    (maintenance only, reduced load).
  * For `strength` days set target_distance_km and target_pace_display to null. Set routine_id
    to the most appropriate routine from the catalog above. Choose based on the athlete's injury
    history (e.g. "hip-glute" for IT-band issues, "lower-leg" for calf/Achilles history,
    "mobility-recovery" for recovery weeks, "running-base" as the general default).
    Also write a brief description summarising the focus of the session.
  * Schedule `strength` on easy or rest-adjacent days. Do not pair strength with tempo,
    interval, or long-run days.
  * For `cross` days describe the activity (cycling, swimming, elliptical, yoga/pilates) and
    approximate duration, e.g. "45 min easy cycling or 30 min yoga". Set target_distance_km,
    target_pace_display, and routine_id to null.
- Plan Difficulty (if provided):
  * comfortable → 1 hard session (tempo or interval) per week max; avoid mandatory pace targets
    on long runs; keep easy days truly easy.
  * balanced → 1-2 hard sessions per week; include pace targets on some long runs.
  * challenging → 2 hard sessions per week; regular pace targets on quality and long-run days.
- Training Volume (if provided):
  * gradual → keep weekly km near or slightly above current_weekly_mileage; max long run ~32 km;
    very gentle progression (≤5% per week).
  * steady → moderate progression; max long run ~33 km.
  * progressive → aggressive build; max long run ~34 km; 8-10% weekly progression allowed.
- Elevation Profile (if provided):
  * flat → no hill workouts; flat route descriptions only.
  * rolling → 1 hill workout per week (e.g. hill strides or rolling route easy run).
  * moderate → 1-2 hill sessions per week (hill repeats or hilly tempo).
  * hilly → regular hill workouts; include hill repeats in quality sessions.
- Available Training Days / Long Run Day (if provided): only schedule runs on the listed
  available days; place the long run on the specified long_run_day.
- When a "Current Plan Adherence" section is present, use it to shape the new plan:
  * Adherence ≥80%: the athlete is consistent — progress load as designed.
  * Adherence 60–79%: moderate disruption — keep similar volume but reduce the count of the
    session type missed most often (e.g. one fewer interval day).
  * Adherence <60%: significant disruption — scale total weekly volume down ~10–15% and
    prioritize key quality sessions (one tempo/interval + long run) over quantity.
  * If the same workout type is repeatedly missed, reduce or replace it with a more accessible
    type (e.g. swap interval → tempo, or tempo → easy with strides).
  * After multiple consecutive missed sessions, treat the first week of the new plan as a
    rebuild week (easy/moderate volume) before resuming normal load.
"""


_PLAN_SYSTEM_PROMPT = _build_plan_system_prompt()

# Anthropic tool-use schema — forces a schema-valid plan object instead of free text.
_PLAN_TOOL_SCHEMA = {
    "name": "generate_plan",
    "description": "Return the 4-week running training plan as a structured object.",
    "input_schema": {
        "type": "object",
        "properties": {
            "phase": {
                "type": "string",
                "enum": ["base", "build", "peak", "taper"],
            },
            "overview": {"type": "string"},
            "weeks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "week_number": {"type": "integer"},
                        "theme": {"type": "string"},
                        "notes": {"type": "string"},
                        "days": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "date": {"type": "string"},
                                    "day_of_week": {
                                        "type": "string",
                                        "enum": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                                    },
                                    "workout_type": {
                                        "type": "string",
                                        "enum": ["easy", "tempo", "long", "interval", "rest", "cross", "strength"],
                                    },
                                    "target_distance_km": {"type": ["number", "null"]},
                                    "target_pace_display": {"type": ["string", "null"]},
                                    "description": {"type": "string"},
                                    "notes": {"type": ["string", "null"]},
                                    "routine_id": {"type": ["string", "null"]},
                                },
                                "required": ["date", "day_of_week", "workout_type", "description"],
                            },
                        },
                    },
                    "required": ["week_number", "days"],
                },
            },
        },
        "required": ["phase", "overview", "weeks"],
    },
}

# Gemini response_schema — enforces structured JSON output at the API level.
# Gemini's schema dialect doesn't support type unions, so nullable fields are
# left optional (absent) rather than typed as ["string", "null"].
_PLAN_GEMINI_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "phase": {"type": "string"},
        "overview": {"type": "string"},
        "weeks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "week_number": {"type": "integer"},
                    "theme": {"type": "string"},
                    "notes": {"type": "string"},
                    "days": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "date": {"type": "string"},
                                "day_of_week": {"type": "string"},
                                "workout_type": {"type": "string"},
                                "target_distance_km": {"type": "number"},
                                "target_pace_display": {"type": "string"},
                                "description": {"type": "string"},
                                "notes": {"type": "string"},
                                "routine_id": {"type": "string"},
                            },
                            "required": ["date", "day_of_week", "workout_type", "description"],
                        },
                    },
                },
                "required": ["week_number", "days"],
            },
        },
    },
    "required": ["phase", "overview", "weeks"],
}


def _build_plan_adherence_context(
    db: Session, reference_date: date, user_id: int = DEFAULT_USER_ID
) -> str | None:
    """Build adherence summary for the most recent training plan.

    For each non-rest day in the current plan that has already passed, checks
    whether an activity was completed and notes distance adherence. Returns None
    when there is no active plan or no past scheduled sessions yet.
    """
    plan = (
        db.query(TrainingPlan)
        .filter(TrainingPlan.user_id == user_id)
        .order_by(TrainingPlan.generated_at.desc())
        .first()
    )
    if not plan:
        return None

    past_days = (
        db.query(TrainingPlanDay)
        .filter(
            TrainingPlanDay.plan_id == plan.id,
            TrainingPlanDay.day_date < reference_date,
            TrainingPlanDay.workout_type != "rest",
        )
        .order_by(TrainingPlanDay.day_date.asc())
        .all()
    )
    if not past_days:
        return None

    completed = 0
    missed = 0
    rows: list[str] = []

    for plan_day in past_days:
        day_start = datetime.combine(plan_day.day_date, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        activity = (
            db.query(Activity)
            .filter(
                Activity.user_id == user_id,
                Activity.started_at >= day_start,
                Activity.started_at < day_end,
            )
            .first()
        )
        if activity:
            completed += 1
            dist_note = ""
            if plan_day.target_distance_m and activity.distance_m:
                pct = (activity.distance_m / plan_day.target_distance_m) * 100
                dist_note = (
                    f" ({pct:.0f}% of planned {plan_day.target_distance_m / 1000:.1f} km)"
                )
            rows.append(
                f"- {plan_day.day_date} [{plan_day.workout_type}] COMPLETED{dist_note}"
            )
        else:
            missed += 1
            target_note = ""
            if plan_day.target_distance_m:
                target_note = f" (planned {plan_day.target_distance_m / 1000:.1f} km)"
            rows.append(
                f"- {plan_day.day_date} [{plan_day.workout_type}] MISSED{target_note}"
            )

    total = completed + missed
    if total == 0:
        return None

    rate = (completed / total) * 100
    lines = [
        f"## Current Plan Adherence ({total} scheduled sessions)",
        f"Completed: {completed}/{total} ({rate:.0f}%)",
    ] + rows
    return "\n".join(lines)


# Taper/recovery length (in weeks) by race distance category — the closer
# categories to a marathon need longer taper and recovery windows.
_TAPER_WEEKS_BY_CATEGORY = {"marathon": 3, "half": 2, "10k": 1, "short": 1}
_RECOVERY_WEEKS_BY_CATEGORY = {"marathon": 2, "half": 2, "10k": 1, "short": 1}

_RACE_WEEK_GUIDANCE = (
    "cap weekly volume at ~40-50% of a normal build week; only easy shakeout runs "
    "plus short race-pace strides; no hard efforts within 4 days of race day"
)
_TAPER_GUIDANCE = {
    1: (
        "final taper week — target ~65-75% of peak weekly volume, cut the long run "
        "to ~50-60% of its peak length, one short race-pace tune-up early in the week, "
        "nothing hard in the final 4 days"
    ),
    2: (
        "target ~80-85% of peak weekly volume, begin trimming the long run, keep one "
        "quality session but shorten it"
    ),
    3: (
        "target ~85-90% of peak weekly volume, start easing off big long runs while "
        "keeping intensity"
    ),
}
_RECOVERY_GUIDANCE = {
    1: (
        "days 1-3 rest or easy cross-training only; days 4-7 easy running at ~30-40% "
        "of the pre-race weekly volume; no quality sessions"
    ),
    2: (
        "~55-70% of the pre-race weekly volume, still easy/moderate only, no quality "
        "sessions until this week is complete"
    ),
}


def _race_distance_category(distance_m: float | None) -> str:
    """Classify a race distance into a taper/recovery category.

    marathon >=30km, half >=18km, 10k >=8km, else short (5K or unknown distance).
    """
    if not distance_m:
        return "short"
    if distance_m >= 30000:
        return "marathon"
    if distance_m >= 18000:
        return "half"
    if distance_m >= 8000:
        return "10k"
    return "short"


def _build_race_periodization_context(
    db: Session, week_start: date, plan_weeks: int, user_id: int = DEFAULT_USER_ID
) -> str | None:
    """Deterministic taper/recovery directives for each week of the plan.

    Scans tracked races (GarminCalendarEvent, event_type="race") in a window
    bracketing the plan and, for every plan week that falls in a race week, its
    taper, or its recovery block, emits a mandatory volume/intensity directive
    scaled by race distance. Weeks with no nearby race get no directive, leaving
    the generic progression rules in the system prompt in charge.
    """
    window_start = week_start - timedelta(days=21)
    window_end = week_start + timedelta(days=7 * plan_weeks + 21)
    races = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.user_id == user_id,
            GarminCalendarEvent.event_type == "race",
            GarminCalendarEvent.date >= window_start,
            GarminCalendarEvent.date <= window_end,
        )
        .order_by(GarminCalendarEvent.date.asc())
        .all()
    )
    if not races:
        return None

    lines: list[str] = []
    for week_idx in range(plan_weeks):
        w_start = week_start + timedelta(days=7 * week_idx)
        w_end = w_start + timedelta(days=6)

        race_week = next((r for r in races if w_start <= r.date <= w_end), None)
        if race_week:
            priority = f" (Priority {race_week.priority})" if race_week.priority else ""
            lines.append(
                f"- Week {week_idx + 1} ({w_start}–{w_end}): RACE WEEK — "
                f"{race_week.title or 'race'}{priority} on {race_week.date}. "
                f"{_RACE_WEEK_GUIDANCE}."
            )
            continue

        # Recovery takes priority over taper (safety first) when both could apply.
        recovery_hit: tuple[GarminCalendarEvent, int] | None = None
        for r in races:
            if r.date >= w_start:
                continue
            weeks_since = -(-(w_start - r.date).days // 7)  # ceil division
            category = _race_distance_category(r.distance_m)
            if 1 <= weeks_since <= _RECOVERY_WEEKS_BY_CATEGORY[category]:
                if recovery_hit is None or weeks_since < recovery_hit[1]:
                    recovery_hit = (r, weeks_since)
        if recovery_hit:
            r, weeks_since = recovery_hit
            guidance = _RECOVERY_GUIDANCE.get(weeks_since, _RECOVERY_GUIDANCE[1])
            lines.append(
                f"- Week {week_idx + 1} ({w_start}–{w_end}): RECOVERY (week "
                f"{weeks_since} post-race) — after {r.title or 'race'} on {r.date}. "
                f"{guidance}."
            )
            continue

        taper_hit: tuple[GarminCalendarEvent, int] | None = None
        for r in races:
            if r.date <= w_end:
                continue
            weeks_before = -(-(r.date - w_end).days // 7)  # ceil division
            category = _race_distance_category(r.distance_m)
            if 1 <= weeks_before <= _TAPER_WEEKS_BY_CATEGORY[category]:
                if taper_hit is None or weeks_before < taper_hit[1]:
                    taper_hit = (r, weeks_before)
        if taper_hit:
            r, weeks_before = taper_hit
            guidance = _TAPER_GUIDANCE.get(weeks_before, _TAPER_GUIDANCE[1])
            plural = "s" if weeks_before != 1 else ""
            lines.append(
                f"- Week {week_idx + 1} ({w_start}–{w_end}): TAPER ({weeks_before} "
                f"week{plural} out) — {r.title or 'race'} on {r.date}. {guidance}."
            )

    if not lines:
        return None
    return (
        "## Race Periodization Directives (mandatory — override default "
        "progression for these weeks)\n" + "\n".join(lines)
    )


def _build_plan_context(
    db: Session,
    reference_date: date,
    user_id: int = DEFAULT_USER_ID,
    week_start: date | None = None,
    plan_weeks: int = 4,
) -> str:
    """Build context string for plan generation (profile + load + recent history)."""
    sections: list[str] = [f"Today's date: {reference_date}"]

    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    if profile:
        ctx = _format_athlete_profile_context(profile, reference_date)
        if ctx:
            sections.append(ctx)

    try:
        estimate = threshold_mod.estimate_thresholds(db, user_id=user_id)
        est_ctx = threshold_mod.format_threshold_estimate_context(estimate, profile)
        if est_ctx:
            sections.append(est_ctx)
    except Exception:
        pass

    load_point = training_load.current_load(db, as_of=reference_date, user_id=user_id)
    load_ctx = training_load.format_training_load_context(load_point)
    if load_ctx:
        sections.append(load_ctx)

    today_summary = (
        db.query(DailySummary)
        .filter(DailySummary.user_id == user_id, DailySummary.date == reference_date)
        .first()
    )
    rhr_cutoff = reference_date - timedelta(days=7)
    recent_rhr_rows = (
        db.query(DailySummary.resting_hr)
        .filter(
            DailySummary.user_id == user_id,
            DailySummary.date >= rhr_cutoff,
            DailySummary.date < reference_date,
            DailySummary.resting_hr.isnot(None),
        )
        .all()
    )
    recent_rhr = [row[0] for row in recent_rhr_rows]
    readiness = training_load.compute_readiness(today_summary, load_point, recent_rhr)
    readiness_ctx = training_load.format_readiness_context(readiness)
    if readiness_ctx:
        sections.append(readiness_ctx)

    # Weekly volume last 8 weeks
    weeks = []
    for w in range(8):
        vol_week_start = reference_date - timedelta(days=reference_date.weekday() + 7 * w)
        vol_week_end = vol_week_start + timedelta(days=7)
        result = (
            db.query(func.count(Activity.id), func.sum(Activity.distance_m))
            .filter(
                Activity.user_id == user_id,
                Activity.started_at >= datetime.combine(vol_week_start, datetime.min.time()),
                Activity.started_at < datetime.combine(vol_week_end, datetime.min.time()),
            )
            .first()
        )
        count, dist = result
        if count and count > 0:
            weeks.append(f"- Week of {vol_week_start}: {count} runs, {(dist or 0) / 1000:.1f} km")
    if weeks:
        sections.append("## Recent Weekly Volume\n" + "\n".join(weeks))

    # Adherence to the current plan
    adherence_ctx = _build_plan_adherence_context(db, reference_date, user_id)
    if adherence_ctx:
        sections.append(adherence_ctx)

    # Upcoming races
    upcoming = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.user_id == user_id,
            GarminCalendarEvent.event_type == "race",
            GarminCalendarEvent.date >= reference_date,
        )
        .order_by(GarminCalendarEvent.date.asc())
        .all()
    )
    if upcoming:
        race_lines = []
        for r in upcoming:
            days_until = (r.date - reference_date).days
            priority = f" [Priority {r.priority}]" if r.priority else ""
            race_lines.append(
                f"- {r.title} ({r.distance_label or '?'}) on {r.date} "
                f"({days_until} days away){priority}"
            )
        sections.append("## Upcoming Races\n" + "\n".join(race_lines))

    # Deterministic taper/recovery directives for this plan's weeks
    resolved_week_start = week_start or _next_monday(reference_date)
    periodization_ctx = _build_race_periodization_context(
        db, resolved_week_start, plan_weeks, user_id
    )
    if periodization_ctx:
        sections.append(periodization_ctx)

    # Season-long periodization skeleton (deterministic, no AI call)
    season_ctx = season_plan_mod.build_season_plan_context(
        db, user_id, resolved_week_start, plan_weeks, reference_date
    )
    if season_ctx:
        sections.append(season_ctx)

    return "\n\n".join(sections)


def _next_monday(ref: date) -> date:
    """Return the Monday on or after ``ref``."""
    days_ahead = (7 - ref.weekday()) % 7
    return ref + timedelta(days=days_ahead if days_ahead else 7)


def _parse_plan_json(raw: str) -> dict:
    """Extract and parse JSON from raw AI response (strip any markdown fences)."""
    text = raw.strip()
    # Strip optional ```json ... ``` fences
    if text.startswith("```"):
        lines = text.splitlines()
        start = next((i for i, l in enumerate(lines) if l.strip() in ("```", "```json")), 0)
        end = next((i for i in range(len(lines) - 1, start, -1) if lines[i].strip() == "```"), len(lines))
        text = "\n".join(lines[start + 1:end])
    return json.loads(text)


def _store_training_plan(
    db: Session, plan_data: dict, week_start: date, raw_json: str, user_id: int = DEFAULT_USER_ID
) -> TrainingPlan:
    """Persist the parsed plan dict as TrainingPlan + TrainingPlanDay rows."""
    plan = TrainingPlan(
        user_id=user_id,
        generated_at=datetime.now(timezone.utc),
        week_start=week_start,
        plan_weeks=len(plan_data.get("weeks", [])) or 4,
        phase=plan_data.get("phase"),
        overview=plan_data.get("overview"),
        raw_json=raw_json,
    )
    db.add(plan)
    db.flush()  # populate plan.id

    for week in plan_data.get("weeks", []):
        week_num = week.get("week_number", 1)
        theme = week.get("theme")
        for day_data in week.get("days", []):
            try:
                day_date = date.fromisoformat(day_data["date"])
            except (KeyError, ValueError):
                continue
            dist_km = day_data.get("target_distance_km")
            dist_m = dist_km * 1000 if dist_km is not None else None
            pace_display = day_data.get("target_pace_display")
            pace_num = _parse_pace_display(pace_display) if pace_display else None
            raw_routine_id = day_data.get("routine_id")
            routine_id = raw_routine_id if get_routine(raw_routine_id or "") else None
            db.add(TrainingPlanDay(
                user_id=user_id,
                plan_id=plan.id,
                day_date=day_date,
                day_of_week=day_data.get("day_of_week", day_date.strftime("%A")),
                week_number=week_num,
                workout_type=day_data.get("workout_type", "easy"),
                target_distance_m=dist_m,
                target_pace_min_km=pace_num,
                target_pace_display=pace_display,
                description=day_data.get("description"),
                notes=day_data.get("notes"),
                week_theme=theme,
                routine_id=routine_id,
            ))
    db.commit()
    return plan


def _parse_pace_display(pace_str: str) -> float | None:
    """Parse '5:15/km' or '5:15' to float min/km. Returns None on failure."""
    try:
        parts = pace_str.replace("/km", "").strip().split(":")
        return int(parts[0]) + int(parts[1]) / 60.0
    except Exception:
        return None


_REALIGNMENT_MISSED_THRESHOLD = 2  # Show banner when this many sessions are missed


def detect_plan_realignment(
    db: Session, reference_date: date, user_id: int = DEFAULT_USER_ID
) -> dict:
    """Return realignment state for the current plan.

    Looks at all past non-rest TrainingPlanDay rows that lack a matching
    Activity. When the missed count reaches _REALIGNMENT_MISSED_THRESHOLD and
    the user has not dismissed the banner (via SyncStatus), sets should_prompt
    to True.
    """
    plan = (
        db.query(TrainingPlan)
        .filter(TrainingPlan.user_id == user_id)
        .order_by(TrainingPlan.generated_at.desc())
        .first()
    )
    empty = {
        "should_prompt": False,
        "missed_count": 0,
        "total_scheduled": 0,
        "missed_sessions": [],
        "race_note": None,
    }
    if not plan:
        return empty

    dismiss_row = db.query(SyncStatus).filter(
        SyncStatus.user_id == user_id,
        SyncStatus.key == "plan_realignment_dismissed_until",
    ).first()
    dismissed = False
    if dismiss_row and dismiss_row.value:
        try:
            dismissed = date.fromisoformat(dismiss_row.value) > reference_date
        except ValueError:
            pass

    past_days = (
        db.query(TrainingPlanDay)
        .filter(
            TrainingPlanDay.plan_id == plan.id,
            TrainingPlanDay.day_date < reference_date,
            TrainingPlanDay.workout_type != "rest",
        )
        .order_by(TrainingPlanDay.day_date.asc())
        .all()
    )

    missed_sessions: list[dict] = []
    for plan_day in past_days:
        day_start = datetime.combine(plan_day.day_date, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        activity = (
            db.query(Activity)
            .filter(
                Activity.user_id == user_id,
                Activity.started_at >= day_start,
                Activity.started_at < day_end,
            )
            .first()
        )
        if not activity:
            missed_sessions.append({
                "date": plan_day.day_date,
                "workout_type": plan_day.workout_type,
                "target_distance_km": plan_day.target_distance_m / 1000 if plan_day.target_distance_m else None,
            })

    # Race-aware realignment: a race that completed after this plan was
    # generated means the plan predates it and won't reflect a recovery block.
    race_note = None
    completed_race = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.user_id == user_id,
            GarminCalendarEvent.event_type == "race",
            GarminCalendarEvent.date >= plan.generated_at.date(),
            GarminCalendarEvent.date < reference_date,
        )
        .order_by(GarminCalendarEvent.date.desc())
        .first()
    )
    if completed_race:
        category = _race_distance_category(completed_race.distance_m)
        recovery_days = _RECOVERY_WEEKS_BY_CATEGORY[category] * 7
        if (reference_date - completed_race.date).days <= recovery_days:
            race_note = (
                f"Your plan predates {completed_race.title or 'your race'} on "
                f"{completed_race.date} — regenerate to apply a recovery block."
            )

    missed_count = len(missed_sessions)
    return {
        "should_prompt": (
            (missed_count >= _REALIGNMENT_MISSED_THRESHOLD or race_note is not None)
            and not dismissed
        ),
        "missed_count": missed_count,
        "total_scheduled": len(past_days),
        "race_note": race_note,
        "missed_sessions": missed_sessions,
    }


def generate_training_plan(
    reference_date: date | None = None, user_id: int = DEFAULT_USER_ID, note: str | None = None
) -> TrainingPlan | None:
    """Generate and persist a 4-week AI training plan.

    Can be called from the API (on demand) or from the scheduler (weekly).
    `note` carries an optional athlete-stated reason (e.g. from the chat
    adjust_upcoming_week tool) that should take priority over the default
    rolling-adherence logic. Returns the new TrainingPlan or None on failure.
    """
    from app import ai_coach as _shim

    with _shim.db_session() as db:
        ref = reference_date or date.today()
        week_start = _next_monday(ref)

        try:
            context = _build_plan_context(db, ref, user_id, week_start=week_start)
            provider, model = _shim._get_ai_config(db, user_id)

            plan_prompt = (
                f"Generate a 4-week running training plan starting Monday {week_start}.\n\n"
                f"Athlete context:\n{context}"
            )
            if note:
                plan_prompt += (
                    f"\n\nAthlete note for this regeneration: {note}\n"
                    "Prioritize accommodating this above the default rolling adherence logic."
                )

            last_exc: Exception = RuntimeError("no attempts made")
            raw = None
            plan_data: dict | None = None
            for attempt in range(_MAX_RETRIES):
                try:
                    if provider == "gemini":
                        gemini_client = genai.Client(api_key=settings.gemini_api_key)
                        try:
                            response = gemini_client.models.generate_content(
                                model=model,
                                contents=plan_prompt,
                                config=_genai_types.GenerateContentConfig(
                                    system_instruction=_PLAN_SYSTEM_PROMPT,
                                    response_mime_type="application/json",
                                    response_schema=_PLAN_GEMINI_RESPONSE_SCHEMA,
                                ),
                            )
                        except _genai_errors.ServerError as exc:
                            raise AITransientError(str(exc)) from exc
                        except _genai_errors.ClientError as exc:
                            if getattr(exc, "code", None) == 429:
                                raise AITransientError(str(exc)) from exc
                            raise AIFatalError(str(exc)) from exc
                        raw = response.text
                    else:
                        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
                        try:
                            response = client.messages.create(
                                model=model,
                                max_tokens=_PLAN_MAX_TOKENS,
                                system=_PLAN_SYSTEM_PROMPT,
                                tools=[_PLAN_TOOL_SCHEMA],
                                tool_choice={"type": "tool", "name": "generate_plan"},
                                messages=[{"role": "user", "content": plan_prompt}],
                            )
                        except (
                            anthropic.RateLimitError,
                            anthropic.APITimeoutError,
                            anthropic.APIConnectionError,
                            anthropic.InternalServerError,
                        ) as exc:
                            raise AITransientError(str(exc)) from exc
                        except (
                            anthropic.AuthenticationError,
                            anthropic.PermissionDeniedError,
                            anthropic.BadRequestError,
                            anthropic.NotFoundError,
                        ) as exc:
                            raise AIFatalError(str(exc)) from exc
                        # Extract the structured dict from the guaranteed tool_use block.
                        for block in response.content:
                            if block.type == "tool_use" and block.name == "generate_plan":
                                plan_data = block.input
                                raw = json.dumps(plan_data)
                                break
                        # Fallback: model returned text instead of a tool call.
                        if plan_data is None:
                            for block in response.content:
                                if hasattr(block, "text"):
                                    raw = block.text
                                    break
                    break  # success
                except AIFatalError:
                    raise
                except AITransientError as exc:
                    last_exc = exc
                    if attempt < _MAX_RETRIES - 1:
                        wait = _BACKOFF_BASE ** attempt
                        logger.warning(
                            "Transient AI error during plan generation (attempt %d/%d), retrying in %ds: %s",
                            attempt + 1, _MAX_RETRIES, wait, exc,
                        )
                        time.sleep(wait)
            else:
                raise last_exc

            if plan_data is None:
                plan_data = _parse_plan_json(raw)
            plan = _store_training_plan(db, plan_data, week_start, raw, user_id)
            logger.info(
                "Training plan generated: %d weeks, phase=%s, week_start=%s",
                plan.plan_weeks, plan.phase, plan.week_start,
            )
            return plan
        except Exception:
            logger.exception("Training plan generation failed")
            return None


def weekly_review(user_id: int = DEFAULT_USER_ID):
    """Generate a weekly training summary and recommendations."""
    from app import ai_coach as _shim

    with _shim.db_session() as db:
        try:
            week_start = date.today() - timedelta(days=7)
            week_activities = (
                db.query(Activity)
                .filter(
                    Activity.user_id == user_id,
                    Activity.started_at >= datetime.combine(week_start, datetime.min.time()),
                )
                .order_by(Activity.started_at.asc())
                .all()
            )

            if not week_activities:
                logger.info("No activities this week, skipping weekly review")
                return

            zones_by_metric = _load_zones(db)
            zc = _load_zone_configs(db, user_id)
            activity_summaries = "\n\n".join(
                _format_activity_context(
                    a, zones_by_metric,
                    hr_zone_configs=zc["hr"], pace_zone_configs=zc["pace"],
                    threshold_hr=zc["threshold_hr"], threshold_pace=zc["threshold_pace"],
                    db=db,
                )
                for a in week_activities
            )
            trigger_data = f"## Weekly Review ({week_start} to {date.today()})\n\n{activity_summaries}"
            full_context = _build_context(db, "weekly_review", trigger_data, user_id=user_id)
            content, summary, category = _shim._call_ai(db, full_context, "weekly_review", user_id)

            insight = Insight(
                user_id=user_id,
                created_at=datetime.now(timezone.utc),
                trigger_type="weekly_review",
                trigger_id=None,
                content=content,
                summary=summary,
                category="training_plan",
            )
            db.add(insight)
            db.commit()
            logger.info("Weekly review complete: %s", summary[:80])
            from app import notifications as notifications_mod
            notifications_mod.notify(
                db, user_id, "weekly_review",
                title="Your weekly review is ready",
                body=summary,
                url="/",
            )
        except Exception:
            logger.exception("Weekly review failed")


_BRIEFING_SYSTEM_PROMPT = """You are an expert running coach writing a short, motivating pre-workout \
briefing for today's scheduled training session — the one moment before the athlete heads out the door.

Write 3-5 short sentences (no headers, no bullet lists) covering, in this order, whenever the
supporting data is present:
1. Why this session matters right now, given the current training phase/season block.
2. The concrete execution target for today (pace/HR zone/effort, drawn from the scheduled session).
3. A one-line readiness note: how the athlete is set up today, and whether to run the session as
   written, ease off, or push.
4. If a fuelling target is present (long efforts only), a one-line reminder of the carb/fluid target.
5. If a heat-stress/conditions note is present, a one-line heads-up.

Skip any point whose supporting data is not present rather than inventing detail. Keep the tone
encouraging and direct, like a coach texting an athlete the morning of a key session. Start the
response with "**Summary:** " followed by a single punchy sentence, then a blank line, then the
full briefing."""


def _build_briefing_trigger_data(
    db: Session, plan: TrainingPlan | None, plan_day: TrainingPlanDay, user_id: int
) -> str:
    """Format today's scheduled session, season phase, and fuelling for the briefing prompt."""
    parts = [f"**Scheduled session for {plan_day.day_date} ({plan_day.day_of_week})**"]
    parts.append(f"Workout type: {plan_day.workout_type}")
    if plan_day.target_distance_m:
        parts.append(f"Target distance: {plan_day.target_distance_m / 1000:.1f} km")
    if plan_day.target_pace_display:
        parts.append(f"Target pace: {plan_day.target_pace_display}")
    if plan_day.description:
        parts.append(f"Description: {plan_day.description}")
    if plan_day.notes:
        parts.append(f"Coach notes: {plan_day.notes}")
    if plan_day.week_theme:
        parts.append(f"Week theme: {plan_day.week_theme}")

    if plan:
        phase_line = f"Season phase: {plan.phase}" if plan.phase else ""
        if plan.overview:
            phase_line += (" — " if phase_line else "") + plan.overview
        if phase_line:
            parts.append(phase_line)

    # Fuelling guidance for long efforts (reuses the same helper as the plan-day API response).
    if plan_day.workout_type == "long" and plan_day.target_distance_m and plan_day.target_pace_min_km:
        profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
        duration_sec = (plan_day.target_distance_m / 1000.0) * plan_day.target_pace_min_km * 60.0
        heat_stress = recent_heat_stress(db, plan_day.day_date, user_id)
        guidance = nutrition_mod.compute_fuelling_guidance(
            duration_sec=duration_sec,
            intensity="long",
            weight_kg=profile.weight_kg if profile else None,
            heat_stress=heat_stress,
        )
        if guidance:
            parts.append(f"Fuelling target: {guidance.note}")

    return "\n".join(parts)


def generate_briefing(plan_day_id: int) -> None:
    """Generate a short pre-workout briefing Insight for a scheduled plan day.

    Called as an AIJob after the morning daily sync, or on demand. Regenerating
    (on-demand) replaces any existing briefing for the same plan day.
    """
    from app import ai_coach as _shim
    from app import notifications as notifications_mod

    with _shim.db_session() as db:
        try:
            plan_day = db.query(TrainingPlanDay).get(plan_day_id)
            if not plan_day:
                logger.warning("Plan day %s not found for briefing", plan_day_id)
                return
            user_id = plan_day.user_id or DEFAULT_USER_ID

            db.query(Insight).filter(
                Insight.user_id == user_id,
                Insight.trigger_type == "briefing",
                Insight.trigger_id == plan_day.id,
            ).delete()

            plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_day.plan_id).first()
            trigger_data = _build_briefing_trigger_data(db, plan, plan_day, user_id)
            full_context = _build_context(
                db, "briefing", trigger_data, reference_date=plan_day.day_date, user_id=user_id
            )
            content, summary, category = _shim._call_ai(
                db, full_context, "briefing", user_id, system_prompt=_BRIEFING_SYSTEM_PROMPT
            )

            db.add(Insight(
                user_id=user_id,
                created_at=datetime.now(timezone.utc),
                trigger_type="briefing",
                trigger_id=plan_day.id,
                content=content,
                summary=summary,
                category=category,
            ))
            db.commit()
            logger.info("Briefing generated for plan day %s: %s", plan_day.id, summary[:80])

            notifications_mod.notify(
                db, user_id, "briefing",
                title="Today's briefing is ready",
                body=summary,
                url="/",
            )
        except Exception:
            logger.exception("Briefing generation failed for plan day %s", plan_day_id)
