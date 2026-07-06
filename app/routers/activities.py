"""Activity list/detail, analysis trigger, and feedback submission."""
import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Activity, GarminCalendarEvent, Insight, MetricZone, PersonalRecord, User
from app.schemas import (
    AIJobEnqueuedResponse,
    ActivityDetail,
    ActivitySummary,
    FeedbackRequest,
    InsightResponse,
    MetricZoneResponse,
)
from app import adherence as adherence_mod
from app import records as records_mod
from app import streams as streams_mod
from app import weather as weather_mod
from app.utils import safe_json_loads, parse_activity_charts, parse_activity_route
from app.routers._shared import _enrich_event_with_steps, _to_pr_response

import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/activities", response_model=list[ActivitySummary])
def api_activities(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Activity)
        .filter(Activity.user_id == current_user.id)
        .order_by(Activity.started_at.desc())
    )
    if type:
        query = query.filter(Activity.activity_type == type)
    offset = (page - 1) * limit
    activities = query.offset(offset).limit(limit).all()
    return [ActivitySummary.model_validate(a) for a in activities]


@router.get("/activities/{activity_id}", response_model=ActivityDetail)
def api_activity_detail(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activity = (
        db.query(Activity)
        .filter(Activity.id == activity_id, Activity.user_id == current_user.id)
        .first()
    )
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    splits = safe_json_loads(activity.splits_json)
    hr_zones = safe_json_loads(activity.hr_zones_json)
    weather = safe_json_loads(activity.weather_json)
    power_zones = safe_json_loads(activity.power_zones_json)
    laps = safe_json_loads(activity.laps_json)
    route = parse_activity_route(laps)

    # On-demand GPS backfill: activities synced before route support lack the
    # polyline. If this is an outdoor activity (summary advertises a polyline)
    # but we have no route yet, re-fetch the details with the polyline once and
    # cache it back into laps_json so future opens are instant. Guarded so
    # indoor activities and transient Garmin failures don't refetch every open.
    if route is None and activity.garmin_id:
        summary = safe_json_loads(activity.raw_json) or {}
        if summary.get("hasPolyline"):
            try:
                from app.garmin_sync import get_garmin_client

                client = get_garmin_client()
                fresh = client.get_activity_details(
                    activity.garmin_id, maxchart=10000, maxpoly=10000
                )
                refreshed_route = parse_activity_route(fresh)
                if refreshed_route is not None:
                    activity.laps_json = json.dumps(fresh)
                    db.commit()
                    laps = fresh
                    route = refreshed_route
            except Exception as e:
                logger.debug("On-demand route fetch failed for %s: %s", activity.garmin_id, e)

    chart_data = parse_activity_charts(laps)

    # Backfill aerobic metrics for activities synced before this feature landed.
    if activity.decoupling_pct is None and laps:
        try:
            dec, ef = streams_mod.compute_aerobic_metrics_from_details(laps)
            if dec is not None or ef is not None:
                activity.decoupling_pct = dec
                activity.efficiency_factor = ef
                db.commit()
        except Exception:
            pass

    insight = (
        db.query(Insight)
        .filter(
            Insight.user_id == current_user.id,
            Insight.trigger_type == "activity",
            Insight.trigger_id == activity.id,
        )
        .first()
    )

    zones = db.query(MetricZone).all()
    metric_zones: dict[str, list[MetricZoneResponse]] = {}
    for z in zones:
        metric_zones.setdefault(z.metric_key, []).append(
            MetricZoneResponse.model_validate(z)
        )

    # Find scheduled workout for this activity's date
    scheduled_workout = None
    activity_adherence = None
    if activity.started_at:
        activity_date = activity.started_at.date() if isinstance(activity.started_at, datetime) else activity.started_at
        workout_event = (
            db.query(GarminCalendarEvent)
            .filter(
                GarminCalendarEvent.user_id == current_user.id,
                GarminCalendarEvent.date == activity_date,
                GarminCalendarEvent.event_type == "workout",
            )
            .first()
        )
        if workout_event:
            scheduled_workout = _enrich_event_with_steps(workout_event)
            if workout_event.raw_json:
                workout_steps = adherence_mod.parse_workout_steps(workout_event.raw_json)
                activity_adherence = adherence_mod.compute_adherence(activity, workout_steps)

    wx_adjusted_pace, wx_penalty_sec, wx_description = weather_mod.weather_pace_info(
        weather, activity.avg_pace_min_km
    )

    records_mod.ensure_records_backfilled(db, user_id=current_user.id)
    personal_records = (
        db.query(PersonalRecord)
        .filter(PersonalRecord.user_id == current_user.id, PersonalRecord.activity_id == activity.id)
        .all()
    )

    result = ActivityDetail.model_validate(activity)
    result.splits = splits
    result.hr_zones = hr_zones
    result.weather = weather
    result.power_zones = power_zones
    result.chart_data = chart_data
    result.route = route
    result.metric_zones = metric_zones
    result.insight = InsightResponse.model_validate(insight) if insight else None
    result.scheduled_workout = scheduled_workout
    result.adherence = activity_adherence
    result.feedback_tags = safe_json_loads(activity.feedback_tags)
    result.weather_adjusted_pace_min_km = wx_adjusted_pace
    result.weather_penalty_sec_per_km = wx_penalty_sec
    result.weather_description = wx_description
    result.personal_records = [_to_pr_response(r) for r in personal_records] or None
    return result


# --- Actions ---

@router.post("/activities/{activity_id}/analyze")
def api_trigger_analysis(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activity = (
        db.query(Activity)
        .filter(Activity.id == activity_id, Activity.user_id == current_user.id)
        .first()
    )
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    from app.ai_coach import enqueue_job
    job_id = enqueue_job("analyze_activity", {"activity_id": activity_id}, current_user.id)
    return AIJobEnqueuedResponse(status="queued", job_id=job_id)


@router.post("/activities/{activity_id}/feedback")
def api_submit_feedback(
    activity_id: int,
    feedback: FeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activity = (
        db.query(Activity)
        .filter(Activity.id == activity_id, Activity.user_id == current_user.id)
        .first()
    )
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity.feedback_rating = feedback.rating
    activity.feedback_tags = json.dumps(feedback.tags) if feedback.tags else None
    activity.feedback_text = feedback.text
    activity.rpe = feedback.rpe
    activity.ai_analyzed = False

    # Delete existing insight
    db.query(Insight).filter(
        Insight.user_id == current_user.id,
        Insight.trigger_type == "activity",
        Insight.trigger_id == activity.id,
    ).delete()
    db.commit()

    from app.ai_coach import enqueue_job
    job_id = enqueue_job("analyze_feedback", {"activity_id": activity_id}, current_user.id)
    return AIJobEnqueuedResponse(status="queued", job_id=job_id)
