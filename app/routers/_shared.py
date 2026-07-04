"""Small helpers shared across two or more domain routers."""
from datetime import date, datetime

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
