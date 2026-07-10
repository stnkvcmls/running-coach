"""Small helpers shared across two or more domain routers."""
from datetime import date, datetime

from sqlalchemy.orm import Session

from app import adherence as adherence_mod
from app import records as records_mod
from app.models import GarminCalendarEvent, PersonalRecord
from app.schemas import CalendarEventResponse, PersonalRecordResponse


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
