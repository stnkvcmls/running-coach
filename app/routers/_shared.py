"""Small helpers shared across two or more domain routers."""
from datetime import date, datetime

from sqlalchemy.orm import Session

from app import adherence as adherence_mod
from app import records as records_mod
from app.models import Activity, GarminCalendarEvent, PersonalRecord, TrainingPlanDay
from app.schemas import CalendarEventResponse, PersonalRecordResponse

# Plan-day workout types fulfilled by a run, and the coarse activity
# categories (see _categorize_activity_type) that fulfil a "cross" day.
_RUN_WORKOUT_TYPES = {"easy", "tempo", "long", "interval", "race"}
_CROSS_ACTIVITY_CATEGORIES = {"bike", "swim", "walk"}

# A run must cover at least this fraction of a run day's target distance to
# count as doing that session, so a 2 km shake-out doesn't "complete" a 9 km
# interval day.
PLAN_MATCH_MIN_DISTANCE_RATIO = 0.5


def _parse_date(s: str | None) -> date:
    if not s:
        return date.today()
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        return date.today()


def _categorize_activity_type(activity_type: str | None) -> str:
    """Group a raw Garmin activity type into a coarse category.

    Shared by Today's workout-tag matching (scheduled event -> activity) and
    the training plan's day-completion matching (plan day -> activity).
    """
    if not activity_type:
        return "other"
    activity_type = activity_type.lower()
    if "run" in activity_type:
        return "run"
    elif "cycling" in activity_type or "biking" in activity_type:
        return "bike"
    elif "swim" in activity_type:
        return "swim"
    elif "walk" in activity_type or "hik" in activity_type:
        return "walk"
    elif "strength" in activity_type:
        return "strength"
    return "other"


def _fulfils_workout_type(workout_type: str, activity_category: str) -> bool:
    if workout_type in _RUN_WORKOUT_TYPES:
        return activity_category == "run"
    if workout_type == "strength":
        return activity_category == "strength"
    if workout_type == "cross":
        return activity_category in _CROSS_ACTIVITY_CATEGORIES
    return False


def _plan_day_matchable(plan_day: TrainingPlanDay) -> bool:
    """Only rest days and days after today can never have been completed."""
    return plan_day.workout_type != "rest" and plan_day.day_date <= date.today()


def _select_plan_day_activity(
    plan_day: TrainingPlanDay, candidates: list[Activity],
) -> Activity | None:
    """Pick the activity, among the plan day's same-day ``candidates``, that
    completed it, or None.

    Shared by the training plan (``matched_activity_id``) and Today
    (``matched_plan_day_id``) so both screens agree on which run did the
    session. An activity qualifies when its coarse sport category fulfils the
    plan's workout type. On a run day with a target distance it must also cover
    ``PLAN_MATCH_MIN_DISTANCE_RATIO`` of the target, and the run closest to the
    target wins. Remaining ties (and days without a target) go to the earliest
    activity. The distance rules apply to run days only: a cross day's target
    can't be compared across bike, swim and walk distances.
    """
    if not _plan_day_matchable(plan_day):
        return None
    eligible = [
        a for a in candidates
        if _fulfils_workout_type(plan_day.workout_type, _categorize_activity_type(a.activity_type))
    ]
    target = plan_day.target_distance_m if plan_day.workout_type in _RUN_WORKOUT_TYPES else None
    if not target or target <= 0:
        target = None
    if target is not None:
        min_distance = target * PLAN_MATCH_MIN_DISTANCE_RATIO
        eligible = [a for a in eligible if (a.distance_m or 0) >= min_distance]

    def _rank(a: Activity) -> tuple[float, datetime]:
        gap = abs(a.distance_m - target) if target is not None else 0.0
        return gap, a.started_at or datetime.max

    return min(eligible, key=_rank, default=None)


def _enrich_event_with_steps(event: GarminCalendarEvent) -> CalendarEventResponse:
    """Convert a GarminCalendarEvent to CalendarEventResponse with parsed workout steps."""
    resp = CalendarEventResponse.model_validate(event)
    if event.event_type == "workout" and event.raw_json:
        steps = adherence_mod.parse_workout_steps(event.raw_json)
        if steps:
            resp.workout_steps = steps
    return resp


def _to_pr_response(r: PersonalRecord) -> PersonalRecordResponse:
    """Convert a PersonalRecord row to its API response, filling in display fields."""
    return PersonalRecordResponse(
        id=r.id,
        record_type=r.record_type,
        metric=r.metric,
        duration_sec=r.duration_sec,
        distance_label=r.distance_label,
        value=r.value,
        previous_value=r.previous_value,
        activity_id=r.activity_id,
        achieved_at=r.achieved_at,
        label=records_mod.record_label(r),
        display_value=records_mod.record_display_value(r),
    )


def _personal_records_by_activity(
    db: Session, user_id: int, activity_ids: list[int],
) -> dict[int, list[PersonalRecordResponse]]:
    """Batch-fetch PersonalRecords for a page/day of activities, grouped by
    activity id — one indexed IN-query instead of one per row. Used to set
    ActivitySummary.personal_records on list/Today payloads.
    """
    if not activity_ids:
        return {}
    rows = (
        db.query(PersonalRecord)
        .filter(PersonalRecord.user_id == user_id, PersonalRecord.activity_id.in_(activity_ids))
        .all()
    )
    out: dict[int, list[PersonalRecordResponse]] = {}
    for r in rows:
        out.setdefault(r.activity_id, []).append(_to_pr_response(r))
    return out
