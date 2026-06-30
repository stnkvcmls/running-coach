import calendar as cal_mod
import csv
import io
import json
import logging
import threading
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    AIJob,
    Activity,
    AthleteProfile,
    ChatMessage,
    DailySummary,
    GarminCalendarEvent,
    Insight,
    MetricZone,
    SyncStatus,
    TrainingPlan,
    TrainingPlanDay,
    User,
    ZoneConfig,
)
from app.schemas import (
    ActivityDetail,
    ActivitySummary,
    AiConfigRequest,
    AiConfigResponse,
    AthleteProfileRequest,
    AthleteProfileResponse,
    CalendarDay,
    CalendarEventResponse,
    ChatHistoryResponse,
    ChatMessageResponse,
    ChatRequest,
    DailySummaryDetail,
    DailySummaryResponse,
    FeedbackRequest,
    GarminConnectResult,
    GarminConnectionStatus,
    GarminCredentialsRequest,
    GarminMfaRequest,
    InsightResponse,
    IntensityTrendsResponse,
    IntensityWeek,
    MetricZoneResponse,
    PacingPushRequest,
    PacingStrategyResponse,
    PerformanceCurvePoint,
    PerformanceCurveResponse,
    RaceInfo,
    RacePrediction,
    SettingsResponse,
    StrengthRoutine,
    TodayResponse,
    TrainingLoadResponse,
    MissedPlanSession,
    PlanRealignmentRequest,
    PlanRealignmentStatus,
    TrainingPlanDayResponse,
    TrainingPlanResponse,
    TrainingPlanWeek,
    TrainingReadiness,
    UserResponse,
    WeeklyMileage,
    WorkoutAdherence,
    WorkoutStepResponse,
    ThresholdApplyRequest,
    ThresholdEstimateField,
    ThresholdEstimateResponse,
    ZoneConfigBulkUpdate,
    ZoneConfigResponse,
    ZoneConfigsResponse,
    PushWorkoutResponse,
    AerobicTrendPoint,
    AerobicTrendsResponse,
    AIJobEnqueuedResponse,
    AIJobResponse,
)
from app.strength_routines import ROUTINE_LIBRARY, get_routine
from app import training_load
from app import threshold as threshold_mod
from app import adherence as adherence_mod
from app import intensity as intensity_mod
from app import streams as streams_mod
from app.config import settings as app_settings
from app.utils import safe_json_loads, parse_activity_charts, parse_activity_route, calculate_age

logger = logging.getLogger(__name__)

api_router = APIRouter(
    prefix="/api/v1",
    tags=["api"],
    dependencies=[Depends(get_current_user)],
)

@api_router.get("/me", response_model=UserResponse)
def api_me(current_user: User = Depends(get_current_user)):
    return current_user


# --- Today ---

@api_router.get("/today", response_model=TodayResponse)
def api_today(
    date_str: str = Query(None, alias="date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uid = current_user.id
    selected = _parse_date(date_str) if date_str else date.today()

    # Activities for the selected date
    day_start = datetime.combine(selected, datetime.min.time())
    day_end = datetime.combine(selected + timedelta(days=1), datetime.min.time())
    activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == uid,
            Activity.started_at >= day_start,
            Activity.started_at < day_end,
        )
        .order_by(Activity.started_at.desc())
        .all()
    )

    # Daily summary
    daily_summary = (
        db.query(DailySummary)
        .filter(DailySummary.user_id == uid, DailySummary.date == selected)
        .first()
    )

    # Weekly mileage (last 8 weeks) - split by activity type
    week_start_base = date.today() - timedelta(days=date.today().weekday())
    eight_weeks_ago = week_start_base - timedelta(weeks=7)
    all_activities = (
        db.query(Activity.started_at, Activity.distance_m, Activity.activity_type)
        .filter(
            Activity.user_id == uid,
            Activity.started_at >= datetime.combine(eight_weeks_ago, datetime.min.time()),
            Activity.distance_m.isnot(None),
        )
        .all()
    )

    # Initialize weekly buckets with activity type breakdowns
    weekly_buckets: dict[date, dict[str, float]] = {}
    for w in range(7, -1, -1):
        ws = week_start_base - timedelta(weeks=w)
        weekly_buckets[ws] = {}

    def _categorize_activity_type(activity_type: str | None) -> str:
        """Group similar activity types into categories."""
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
        return "other"

    for a_started, a_dist, a_type in all_activities:
        if a_started is None or not a_dist:
            continue
        a_date = a_started.date() if isinstance(a_started, datetime) else a_started
        # Calculate the Monday of the week containing this activity
        activity_week_start = a_date - timedelta(days=a_date.weekday())
        if activity_week_start not in weekly_buckets:
            continue
        category = _categorize_activity_type(a_type)
        weekly_buckets[activity_week_start][category] = weekly_buckets[activity_week_start].get(category, 0) + a_dist / 1000
    weekly_data = [
        WeeklyMileage(
            label=ws.strftime("%b %d"),
            km=round(sum(by_type.values()), 1),
            by_type={k: round(v, 1) for k, v in by_type.items()}
        )
        for ws, by_type in sorted(weekly_buckets.items())
    ]

    # Latest insights
    latest_insights = (
        db.query(Insight)
        .filter(Insight.user_id == uid)
        .order_by(Insight.created_at.desc())
        .limit(5)
        .all()
    )

    # Next 2 upcoming races — prefer Garmin calendar events, fall back to profile goal race
    next_race_rows = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.user_id == uid,
            GarminCalendarEvent.event_type == "race",
            GarminCalendarEvent.date >= date.today(),
        )
        .order_by(GarminCalendarEvent.date.asc())
        .limit(2)
        .all()
    )
    next_races = [
        RaceInfo(
            id=row.id,
            title=row.title,
            date=row.date,
            distance_label=row.distance_label,
            days_away=(row.date - date.today()).days,
            goal_time_sec=row.goal_time_sec,
            priority=row.priority,
        )
        for row in next_race_rows
    ]

    # Fallback: show profile goal race when the Garmin calendar has no race events
    if not next_races:
        profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == uid).first()
        if profile and profile.goal_race_date and profile.goal_race_date >= date.today():
            next_races = [
                RaceInfo(
                    id=0,  # sentinel: profile-sourced race, no Garmin calendar entry
                    title=profile.goal_race or "Goal Race",
                    date=profile.goal_race_date,
                    distance_label=None,
                    days_away=(profile.goal_race_date - date.today()).days,
                    goal_time_sec=None,
                    priority=None,
                )
            ]

    # Scheduled workout events for the selected date
    scheduled_events_rows = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.user_id == uid,
            GarminCalendarEvent.date == selected,
            GarminCalendarEvent.event_type == "workout",
        )
        .order_by(GarminCalendarEvent.id.asc())
        .all()
    )
    scheduled_events = [_enrich_event_with_steps(e) for e in scheduled_events_rows]

    # Current training load snapshot (Fitness/Fatigue/Form) as of the selected date
    current_load = training_load.current_load(db, as_of=selected, user_id=uid)

    # Resting HR from the 7 days before the selected date (for trend comparison)
    rhr_cutoff = selected - timedelta(days=7)
    recent_rhr_rows = (
        db.query(DailySummary.resting_hr)
        .filter(
            DailySummary.user_id == uid,
            DailySummary.date >= rhr_cutoff,
            DailySummary.date < selected,
            DailySummary.resting_hr.isnot(None),
        )
        .all()
    )
    recent_rhr = [row[0] for row in recent_rhr_rows]
    readiness = training_load.compute_readiness(daily_summary, current_load, recent_rhr)

    return TodayResponse(
        selected_date=selected,
        activities=[ActivitySummary.model_validate(a) for a in activities],
        daily_summary=DailySummaryResponse.model_validate(daily_summary) if daily_summary else None,
        weekly_data=weekly_data,
        insights=[InsightResponse.model_validate(i) for i in latest_insights],
        next_races=next_races,
        scheduled_events=scheduled_events,
        training_load=current_load,
        readiness=readiness,
    )


# --- Training Load (CTL/ATL/TSB) ---

@api_router.get("/training-load", response_model=TrainingLoadResponse)
def api_training_load(
    days: int = Query(90, ge=7, le=365),
    date_str: str = Query(None, alias="date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    end_date = _parse_date(date_str) if date_str else date.today()
    points = training_load.compute_load_series(
        db, end_date=end_date, days=days, user_id=current_user.id
    )
    return TrainingLoadResponse(points=points, current=points[-1] if points else None)


# --- Wellness Trends ---

@api_router.get("/wellness-trends", response_model=list[DailySummaryResponse])
def api_wellness_trends(
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cutoff = date.today() - timedelta(days=days)
    summaries = (
        db.query(DailySummary)
        .filter(DailySummary.user_id == current_user.id, DailySummary.date >= cutoff)
        .order_by(DailySummary.date.asc())
        .all()
    )
    return [DailySummaryResponse.model_validate(s) for s in summaries]


# --- Intensity Trends ---

@api_router.get("/intensity-trends", response_model=IntensityTrendsResponse)
def api_intensity_trends(
    days: int = Query(90, ge=7, le=365),
    zone_type: str = Query("hr"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if zone_type not in ("hr", "power"):
        zone_type = "hr"
    weeks_data = intensity_mod.aggregate_weekly_intensity(
        db, days=days, zone_type=zone_type, user_id=current_user.id
    )
    weeks = [IntensityWeek(**w) for w in weeks_data]
    return IntensityTrendsResponse(weeks=weeks, zone_type=zone_type, days=days)


# --- Activities ---

@api_router.get("/activities", response_model=list[ActivitySummary])
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


@api_router.get("/activities/{activity_id}", response_model=ActivityDetail)
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
    return result


# --- Daily Summaries ---

@api_router.get("/daily-summaries", response_model=list[DailySummaryResponse])
def api_daily_summaries(
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offset = (page - 1) * limit
    summaries = (
        db.query(DailySummary)
        .filter(DailySummary.user_id == current_user.id)
        .order_by(DailySummary.date.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [DailySummaryResponse.model_validate(s) for s in summaries]


@api_router.get("/daily-summaries/{summary_id}", response_model=DailySummaryDetail)
def api_daily_detail(
    summary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    summary = (
        db.query(DailySummary)
        .filter(DailySummary.id == summary_id, DailySummary.user_id == current_user.id)
        .first()
    )
    if not summary:
        raise HTTPException(status_code=404, detail="Daily summary not found")

    insight = (
        db.query(Insight)
        .filter(
            Insight.user_id == current_user.id,
            Insight.trigger_type == "daily_summary",
            Insight.trigger_id == summary.id,
        )
        .first()
    )

    day_activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == current_user.id,
            Activity.started_at >= datetime.combine(summary.date, datetime.min.time()),
            Activity.started_at < datetime.combine(summary.date + timedelta(days=1), datetime.min.time()),
        )
        .order_by(Activity.started_at.asc())
        .all()
    )

    return DailySummaryDetail(
        summary=DailySummaryResponse.model_validate(summary),
        activities=[ActivitySummary.model_validate(a) for a in day_activities],
        insight=InsightResponse.model_validate(insight) if insight else None,
    )


# --- Calendar ---

@api_router.get("/calendar", response_model=list[CalendarDay])
def api_calendar_month(
    month: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if month:
        try:
            view_date = datetime.strptime(month, "%Y-%m").date()
        except ValueError:
            view_date = date.today().replace(day=1)
    else:
        view_date = date.today().replace(day=1)

    if view_date.month == 12:
        next_month = view_date.replace(year=view_date.year + 1, month=1)
    else:
        next_month = view_date.replace(month=view_date.month + 1)

    month_activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == current_user.id,
            Activity.started_at >= datetime.combine(view_date, datetime.min.time()),
            Activity.started_at < datetime.combine(next_month, datetime.min.time()),
        )
        .order_by(Activity.started_at.asc())
        .all()
    )

    activities_by_date: dict[date, list] = {}
    for a in month_activities:
        if a.started_at:
            d = a.started_at.date()
            activities_by_date.setdefault(d, []).append(a)

    month_events = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.user_id == current_user.id,
            GarminCalendarEvent.date >= view_date,
            GarminCalendarEvent.date < next_month,
        )
        .order_by(GarminCalendarEvent.date.asc())
        .all()
    )
    events_by_date: dict[date, list] = {}
    for e in month_events:
        events_by_date.setdefault(e.date, []).append(e)

    # Build all days of the month
    cal = cal_mod.Calendar(firstweekday=0)
    result = []
    for day_num, _ in cal.itermonthdays2(view_date.year, view_date.month):
        if day_num == 0:
            continue
        d = date(view_date.year, view_date.month, day_num)
        result.append(CalendarDay(
            date=d,
            activities=[ActivitySummary.model_validate(a) for a in activities_by_date.get(d, [])],
            events=[_enrich_event_with_steps(e) for e in events_by_date.get(d, [])],
        ))
    return result


@api_router.get("/calendar/week", response_model=list[CalendarDay])
def api_calendar_week(
    date_str: str = Query(None, alias="date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = _parse_date(date_str) if date_str else date.today()
    # Monday of the week
    week_start = target - timedelta(days=target.weekday())
    week_end = week_start + timedelta(days=7)

    activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == current_user.id,
            Activity.started_at >= datetime.combine(week_start, datetime.min.time()),
            Activity.started_at < datetime.combine(week_end, datetime.min.time()),
        )
        .order_by(Activity.started_at.asc())
        .all()
    )
    activities_by_date: dict[date, list] = {}
    for a in activities:
        if a.started_at:
            d = a.started_at.date()
            activities_by_date.setdefault(d, []).append(a)

    events = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.user_id == current_user.id,
            GarminCalendarEvent.date >= week_start,
            GarminCalendarEvent.date < week_end,
        )
        .all()
    )
    events_by_date: dict[date, list] = {}
    for e in events:
        events_by_date.setdefault(e.date, []).append(e)

    result = []
    for i in range(7):
        d = week_start + timedelta(days=i)
        result.append(CalendarDay(
            date=d,
            activities=[ActivitySummary.model_validate(a) for a in activities_by_date.get(d, [])],
            events=[_enrich_event_with_steps(e) for e in events_by_date.get(d, [])],
        ))
    return result


# --- Calendar Event Detail ---

@api_router.get("/calendar-events/{event_id}", response_model=CalendarEventResponse)
def api_calendar_event_detail(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = (
        db.query(GarminCalendarEvent)
        .filter(GarminCalendarEvent.id == event_id, GarminCalendarEvent.user_id == current_user.id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    return _enrich_event_with_steps(event)


# --- Insights ---

@api_router.get("/insights", response_model=list[InsightResponse])
def api_insights(
    category: str = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Insight)
        .filter(Insight.user_id == current_user.id)
        .order_by(Insight.created_at.desc())
    )
    if category:
        query = query.filter(Insight.category == category)
    return [InsightResponse.model_validate(i) for i in query.limit(limit).all()]


# --- Settings ---

_INTERNAL_SYNC_KEYS = {"threshold_estimate", "training_load_series"}

@api_router.get("/settings", response_model=SettingsResponse)
def api_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uid = current_user.id
    sync_statuses = {}
    for s in db.query(SyncStatus).filter(SyncStatus.user_id == uid).all():
        if s.key in _INTERNAL_SYNC_KEYS:
            continue
        sync_statuses[s.key] = {"value": s.value, "updated_at": str(s.updated_at) if s.updated_at else None}

    counts = {
        "activities": db.query(func.count(Activity.id)).filter(Activity.user_id == uid).scalar() or 0,
        "daily_summaries": db.query(func.count(DailySummary.id)).filter(DailySummary.user_id == uid).scalar() or 0,
        "insights": db.query(func.count(Insight.id)).filter(Insight.user_id == uid).scalar() or 0,
        "calendar_events": db.query(func.count(GarminCalendarEvent.id)).filter(GarminCalendarEvent.user_id == uid).scalar() or 0,
    }
    return SettingsResponse(sync_statuses=sync_statuses, counts=counts)


@api_router.get("/ai-config", response_model=AiConfigResponse)
def api_get_ai_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    provider_row = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == current_user.id, SyncStatus.key == "ai_provider")
        .first()
    )
    model_row = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == current_user.id, SyncStatus.key == "ai_model")
        .first()
    )
    provider = provider_row.value if provider_row else "claude"
    model = model_row.value if model_row else app_settings.ai_model
    return AiConfigResponse(
        provider=provider,
        model=model,
        available_providers=list(app_settings.available_models.keys()),
        available_models=app_settings.available_models,
    )


@api_router.post("/ai-config", response_model=AiConfigResponse)
def api_set_ai_config(
    config: AiConfigRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if config.provider not in app_settings.available_models:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {config.provider}")
    if config.model not in app_settings.available_models[config.provider]:
        raise HTTPException(status_code=400, detail=f"Model {config.model} not valid for {config.provider}")

    for key, value in [("ai_provider", config.provider), ("ai_model", config.model)]:
        row = (
            db.query(SyncStatus)
            .filter(SyncStatus.user_id == current_user.id, SyncStatus.key == key)
            .first()
        )
        if row:
            row.value = value
        else:
            db.add(SyncStatus(user_id=current_user.id, key=key, value=value))
    db.commit()

    return AiConfigResponse(
        provider=config.provider,
        model=config.model,
        available_providers=list(app_settings.available_models.keys()),
        available_models=app_settings.available_models,
    )


# --- Garmin Credentials (per-user data source) ---

@api_router.get("/garmin-credentials/status", response_model=GarminConnectionStatus)
def api_garmin_status(current_user: User = Depends(get_current_user)):
    from app import garmin_sync
    return GarminConnectionStatus(**garmin_sync.garmin_connection_status(current_user))


@api_router.post("/garmin-credentials", response_model=GarminConnectResult)
def api_connect_garmin(
    creds: GarminCredentialsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app import crypto, garmin_sync
    if not crypto.is_configured():
        raise HTTPException(
            status_code=400,
            detail="Server is missing ENCRYPTION_KEY; set it before connecting Garmin.",
        )
    try:
        status = garmin_sync.connect_garmin_start(
            db, current_user, creds.email, creds.password
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.info("Garmin connect failed for user %s: %s", current_user.id, exc)
        raise HTTPException(status_code=400, detail=f"Garmin login failed: {exc}")
    return GarminConnectResult(status=status)


@api_router.post("/garmin-credentials/mfa", response_model=GarminConnectResult)
def api_connect_garmin_mfa(
    body: GarminMfaRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app import garmin_sync
    try:
        status = garmin_sync.connect_garmin_mfa(db, current_user, body.code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.info("Garmin MFA failed for user %s: %s", current_user.id, exc)
        raise HTTPException(status_code=400, detail=f"Garmin MFA failed: {exc}")
    return GarminConnectResult(status=status)


@api_router.delete("/garmin-credentials", response_model=GarminConnectionStatus)
def api_disconnect_garmin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app import garmin_sync
    garmin_sync.disconnect_garmin(db, current_user)
    return GarminConnectionStatus(**garmin_sync.garmin_connection_status(current_user))


# --- Athlete Profile ---


def _profile_response(profile: AthleteProfile) -> AthleteProfileResponse:
    """Build a response, deriving age from date_of_birth."""
    result = AthleteProfileResponse.model_validate(profile)
    result.age = calculate_age(profile.date_of_birth)
    return result


@api_router.get("/athlete-profile", response_model=AthleteProfileResponse | None)
def api_get_athlete_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == current_user.id).first()
    return _profile_response(profile) if profile else None


# Name, date of birth, and weight are always sourced from Garmin and are not
# user-editable, so ignore any client-supplied values for these fields.
GARMIN_MANAGED_PROFILE_FIELDS = {"name", "date_of_birth", "weight_kg"}


@api_router.post("/athlete-profile", response_model=AthleteProfileResponse)
def api_set_athlete_profile(
    profile_data: AthleteProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updates = {
        key: value
        for key, value in profile_data.model_dump(exclude_unset=True).items()
        if key not in GARMIN_MANAGED_PROFILE_FIELDS
    }
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == current_user.id).first()
    if profile is None:
        profile = AthleteProfile(user_id=current_user.id, **updates)
        db.add(profile)
    else:
        for key, value in updates.items():
            setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return _profile_response(profile)


# --- Zone Configs ---

def _compute_zone_bounds(zones: list, threshold: float | None) -> list[ZoneConfigResponse]:
    """Build ZoneConfigResponse list, computing absolute bound values from the threshold."""
    result = []
    for z in zones:
        resp = ZoneConfigResponse.model_validate(z)
        if threshold is not None and threshold > 0:
            if z.min_pct is not None:
                resp.computed_min = round(threshold * z.min_pct / 100, 1)
            if z.max_pct is not None:
                resp.computed_max = round(threshold * z.max_pct / 100, 1)
        result.append(resp)
    return result


def _build_zones_response(db: Session, user_id: int) -> ZoneConfigsResponse:
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    threshold_hr = profile.threshold_hr if profile else None
    threshold_pace = profile.threshold_pace_min_km if profile else None
    threshold_power = profile.threshold_power if profile else None

    all_zones = (
        db.query(ZoneConfig)
        .filter(ZoneConfig.user_id == user_id)
        .order_by(ZoneConfig.zone_type, ZoneConfig.zone_number)
        .all()
    )

    return ZoneConfigsResponse(
        hr=_compute_zone_bounds([z for z in all_zones if z.zone_type == "hr"], threshold_hr),
        pace=_compute_zone_bounds([z for z in all_zones if z.zone_type == "pace"], threshold_pace),
        power=_compute_zone_bounds([z for z in all_zones if z.zone_type == "power"], threshold_power),
        threshold_hr=threshold_hr,
        threshold_pace_min_km=threshold_pace,
        threshold_power=threshold_power,
    )


@api_router.get("/zones", response_model=ZoneConfigsResponse)
def api_get_zones(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _build_zones_response(db, current_user.id)


@api_router.put("/zones", response_model=ZoneConfigsResponse)
def api_update_zones(
    update: ZoneConfigBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for zu in update.zones:
        zone = (
            db.query(ZoneConfig)
            .filter(
                ZoneConfig.user_id == current_user.id,
                ZoneConfig.zone_type == zu.zone_type,
                ZoneConfig.zone_number == zu.zone_number,
            )
            .first()
        )
        if zone is None:
            continue
        if zu.zone_name is not None:
            zone.zone_name = zu.zone_name
        if zu.zone_color is not None:
            zone.zone_color = zu.zone_color
        if "min_pct" in zu.model_fields_set:
            zone.min_pct = zu.min_pct
        if "max_pct" in zu.model_fields_set:
            zone.max_pct = zu.max_pct
    db.commit()
    return _build_zones_response(db, current_user.id)


# --- Threshold / Critical Power estimation ---

def _field(est: "threshold_mod.FieldEstimate") -> ThresholdEstimateField:
    return ThresholdEstimateField(
        value=est.value,
        method=est.method,
        confidence=est.confidence,
        sample_size=est.sample_size,
        note=est.note,
    )


def _build_threshold_response(
    estimate: "threshold_mod.ThresholdEstimate", profile: AthleteProfile | None
) -> ThresholdEstimateResponse:
    return ThresholdEstimateResponse(
        critical_power=_field(estimate.critical_power),
        w_prime=estimate.w_prime,
        pmax=estimate.pmax,
        threshold_pace_min_km=_field(estimate.threshold_pace_min_km),
        threshold_hr=_field(estimate.threshold_hr),
        max_hr=_field(estimate.max_hr),
        lookback_days=estimate.lookback_days,
        activities_analyzed=estimate.activities_analyzed,
        current_threshold_power=profile.threshold_power if profile else None,
        current_threshold_pace_min_km=profile.threshold_pace_min_km if profile else None,
        current_threshold_hr=profile.threshold_hr if profile else None,
        current_max_hr=profile.max_hr if profile else None,
    )


@api_router.get("/threshold-estimate", response_model=ThresholdEstimateResponse)
def api_get_threshold_estimate(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    estimate = threshold_mod.estimate_thresholds(db, user_id=current_user.id)
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == current_user.id).first()
    return _build_threshold_response(estimate, profile)


@api_router.post("/threshold-estimate/apply", response_model=AthleteProfileResponse)
def api_apply_threshold_estimate(
    req: ThresholdApplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    estimate = threshold_mod.estimate_thresholds(db, user_id=current_user.id)
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == current_user.id).first()
    if profile is None:
        profile = AthleteProfile(user_id=current_user.id)
        db.add(profile)
    fields = req.fields if req.fields else None
    applied = threshold_mod.apply_estimate_to_profile(profile, estimate, fields)
    if not applied:
        raise HTTPException(status_code=400, detail="No estimated thresholds available to apply")
    db.commit()
    db.refresh(profile)
    return _profile_response(profile)


# --- Performance Curve ---

@api_router.get("/performance-curve", response_model=PerformanceCurveResponse)
def api_get_performance_curve(
    days: int = Query(90, ge=30, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Power-duration and pace-duration curves with CP/CV model fit and race predictions."""
    data = threshold_mod.get_performance_curve_data(db, lookback_days=days, user_id=current_user.id)
    return PerformanceCurveResponse(
        power_points=[
            PerformanceCurvePoint(
                duration_sec=p.duration_sec,
                actual_value=p.actual_value,
                model_value=p.model_value,
            )
            for p in data.power_points
        ],
        pace_points=[
            PerformanceCurvePoint(
                duration_sec=p.duration_sec,
                actual_value=p.actual_value,
                model_value=p.model_value,
            )
            for p in data.pace_points
        ],
        critical_power=data.critical_power,
        w_prime=data.w_prime,
        critical_velocity=data.critical_velocity,
        d_prime=data.d_prime,
        race_predictions=[
            RacePrediction(
                distance_label=r.distance_label,
                distance_m=r.distance_m,
                predicted_time_sec=r.predicted_time_sec,
                predicted_pace_min_km=r.predicted_pace_min_km,
            )
            for r in data.race_predictions
        ],
        lookback_days=data.lookback_days,
        activities_analyzed=data.activities_analyzed,
    )


# --- Aerobic Trends ---

@api_router.get("/aerobic-trends", response_model=AerobicTrendsResponse)
def api_get_aerobic_trends(
    days: int = Query(90, ge=30, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aerobic decoupling % and efficiency factor trend per run."""
    try:
        streams_mod.backfill_missing_aerobic_metrics(db, user_id=current_user.id)
    except Exception:
        pass
    cutoff = datetime.utcnow() - timedelta(days=days)
    RUN_TYPES = ("running", "trail_running", "treadmill_running", "indoor_running")
    activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == current_user.id,
            Activity.started_at >= cutoff,
            func.lower(Activity.activity_type).in_(RUN_TYPES),
            func.coalesce(Activity.decoupling_pct, Activity.efficiency_factor).isnot(None),
        )
        .order_by(Activity.started_at)
        .all()
    )
    return AerobicTrendsResponse(
        points=[
            AerobicTrendPoint(
                date=a.started_at.date().isoformat() if isinstance(a.started_at, datetime) else str(a.started_at)[:10],
                activity_name=a.name or "",
                duration_sec=a.duration_sec or 0,
                decoupling_pct=a.decoupling_pct,
                efficiency_factor=a.efficiency_factor,
            )
            for a in activities
        ],
        days=days,
    )


# --- Training Plan ---

def _day_to_response(d: TrainingPlanDay) -> TrainingPlanDayResponse:
    """Convert a TrainingPlanDay ORM row to its response schema, hydrating routine."""
    resp = TrainingPlanDayResponse.model_validate(d)
    if d.routine_id:
        raw = get_routine(d.routine_id)
        if raw:
            resp.routine = StrengthRoutine.model_validate(raw)
    return resp


def _build_plan_response(plan: TrainingPlan, db: Session) -> TrainingPlanResponse:
    """Assemble a TrainingPlanResponse with nested week/day structure."""
    days = (
        db.query(TrainingPlanDay)
        .filter(TrainingPlanDay.plan_id == plan.id, TrainingPlanDay.user_id == plan.user_id)
        .order_by(TrainingPlanDay.day_date.asc())
        .all()
    )

    # Group days by week_number
    weeks_map: dict[int, list[TrainingPlanDay]] = {}
    for d in days:
        weeks_map.setdefault(d.week_number, []).append(d)

    plan_weeks: list[TrainingPlanWeek] = []
    for week_num in sorted(weeks_map):
        week_days = weeks_map[week_num]
        sorted_days = sorted(week_days, key=lambda d: d.day_date)
        week_start_date = sorted_days[0].day_date
        week_end_date = sorted_days[-1].day_date
        theme = sorted_days[0].week_theme if sorted_days else None
        plan_weeks.append(TrainingPlanWeek(
            week_number=week_num,
            week_start=week_start_date,
            week_end=week_end_date,
            theme=theme,
            days=[_day_to_response(d) for d in sorted_days],
        ))

    return TrainingPlanResponse(
        id=plan.id,
        generated_at=plan.generated_at,
        week_start=plan.week_start,
        plan_weeks=plan.plan_weeks,
        phase=plan.phase,
        overview=plan.overview,
        weeks=plan_weeks,
    )


@api_router.get("/strength-routines", response_model=list[StrengthRoutine])
def api_get_strength_routines():
    """Return the full catalog of strength & mobility routines."""
    return [StrengthRoutine.model_validate(r) for r in ROUTINE_LIBRARY.values()]


@api_router.get("/training-plan", response_model=TrainingPlanResponse | None)
def api_get_training_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the most recently generated training plan, or null if none exists."""
    plan = (
        db.query(TrainingPlan)
        .filter(TrainingPlan.user_id == current_user.id)
        .order_by(TrainingPlan.generated_at.desc())
        .first()
    )
    if not plan:
        return None
    return _build_plan_response(plan, db)


@api_router.post("/training-plan/generate", response_model=AIJobEnqueuedResponse)
def api_generate_training_plan(current_user: User = Depends(get_current_user)):
    """Enqueue AI plan generation and return the job id for polling.

    Clients poll GET /api/v1/jobs/{job_id} until status is 'done', then
    refresh the training plan via GET /api/v1/training-plan.
    """
    from app.ai_coach import enqueue_job
    job_id = enqueue_job("generate_plan", {}, current_user.id)
    return AIJobEnqueuedResponse(status="queued", job_id=job_id)


@api_router.get("/training-plan/realignment-status", response_model=PlanRealignmentStatus)
def api_get_realignment_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return whether the current plan has enough missed sessions to warrant realignment."""
    from app.ai_coach import detect_plan_realignment
    result = detect_plan_realignment(db, date.today(), user_id=current_user.id)
    return PlanRealignmentStatus(
        should_prompt=result["should_prompt"],
        missed_count=result["missed_count"],
        total_scheduled=result["total_scheduled"],
        missed_sessions=[
            MissedPlanSession(
                date=s["date"],
                workout_type=s["workout_type"],
                target_distance_km=s["target_distance_km"],
            )
            for s in result["missed_sessions"]
        ],
    )


@api_router.post("/training-plan/realign")
def api_realign_plan(
    body: PlanRealignmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Handle plan realignment: regenerate the plan or dismiss the banner for 7 days."""
    if body.action == "dismiss":
        dismiss_until = (date.today() + timedelta(days=7)).isoformat()
        row = db.query(SyncStatus).filter(
            SyncStatus.user_id == current_user.id,
            SyncStatus.key == "plan_realignment_dismissed_until",
        ).first()
        if row:
            row.value = dismiss_until
        else:
            db.add(SyncStatus(
                user_id=current_user.id,
                key="plan_realignment_dismissed_until",
                value=dismiss_until,
            ))
        db.commit()
        return {"status": "dismissed", "until": dismiss_until}

    # action == "regenerate" — enqueue and return job id for polling
    from app.ai_coach import enqueue_job
    # Clear any existing dismiss snooze when the user triggers regeneration
    row = db.query(SyncStatus).filter(
        SyncStatus.user_id == current_user.id,
        SyncStatus.key == "plan_realignment_dismissed_until",
    ).first()
    if row:
        db.delete(row)
        db.commit()
    job_id = enqueue_job("generate_plan", {}, current_user.id)
    return AIJobEnqueuedResponse(status="queued", job_id=job_id)


@api_router.post("/training-plan/days/{day_id}/push-to-garmin", response_model=PushWorkoutResponse)
def api_push_workout_to_garmin(
    day_id: int,
    current_user: User = Depends(get_current_user),
):
    """Upload a plan day as a structured workout to the user's Garmin device.

    Creates the workout on Garmin Connect and schedules it on the plan day's
    date so it appears on the watch. Rest and cross-training days are rejected
    with 422; Garmin API failures surface as 502.
    """
    from app import garmin_sync

    if not current_user.garmin_email:
        raise HTTPException(
            status_code=422,
            detail="Garmin account not connected. Connect in Settings first.",
        )
    try:
        result = garmin_sync.push_workout_to_garmin(current_user, day_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc:
        logger.error("Garmin push failed for day %s: %s", day_id, exc)
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error pushing workout %s to Garmin", day_id)
        raise HTTPException(status_code=502, detail=f"Garmin error: {exc}")
    return result


# --- Race pacing ---

def _get_race_event(race_id: int, user_id: int, db: Session) -> GarminCalendarEvent:
    race = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.id == race_id,
            GarminCalendarEvent.user_id == user_id,
            GarminCalendarEvent.event_type == "race",
        )
        .first()
    )
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")
    return race


@api_router.get("/races/{race_id}/pacing", response_model=PacingStrategyResponse)
def api_race_pacing(
    race_id: int,
    strategy: str = Query("even", pattern="^(even|negative_split)$"),
    split_unit: str = Query("km", pattern="^(km|mile)$"),
    target_time_sec: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a race-day split-by-split pacing strategy.

    target_time_sec overrides goal_time_sec; if neither is set, falls back to
    the CV-model prediction from the performance curve.
    """
    from app import pacing as pacing_mod

    race = _get_race_event(race_id, current_user.id, db)
    if not race.distance_m or race.distance_m <= 0:
        raise HTTPException(status_code=422, detail="Race has no distance set")

    # Determine target time + source
    source = "custom"
    effective_target = target_time_sec
    if effective_target is None:
        if race.goal_time_sec:
            effective_target = race.goal_time_sec
            source = "goal"
        else:
            # Fall back to CV model prediction for this distance
            try:
                curve = threshold_mod.get_performance_curve_data(db, user_id=current_user.id)
                match = next(
                    (p for p in curve.race_predictions if abs(p.distance_m - race.distance_m) < 500),
                    None,
                )
                if match:
                    effective_target = int(match.predicted_time_sec)
                    source = "predicted"
            except Exception:
                logger.debug("CV model unavailable for race pacing fallback", exc_info=True)
        if effective_target is None:
            raise HTTPException(
                status_code=422,
                detail="No target time available: set a goal time on the race or connect enough training data for a CV model prediction.",
            )

    # Optionally include CV model prediction as reference
    predicted_time: float | None = None
    if source != "predicted":
        try:
            curve = threshold_mod.get_performance_curve_data(db, user_id=current_user.id)
            match = next(
                (p for p in curve.race_predictions if abs(p.distance_m - race.distance_m) < 500),
                None,
            )
            if match:
                predicted_time = match.predicted_time_sec
        except Exception:
            pass

    plan = pacing_mod.generate_pacing_strategy(
        distance_m=race.distance_m,
        target_time_sec=float(effective_target),
        strategy=strategy,
        split_unit=split_unit,
        predicted_time_sec=predicted_time,
        source=source,
    )

    return PacingStrategyResponse(
        race_id=race_id,
        race_name=race.title,
        distance_m=race.distance_m,
        distance_label=race.distance_label,
        race_date=race.date,
        target_time_sec=plan.target_time_sec,
        target_pace_min_km=plan.target_pace_min_km,
        strategy=plan.strategy,
        split_unit=plan.split_unit,
        splits=[
            {
                "split_number": s.split_number,
                "split_distance_m": s.split_distance_m,
                "cumulative_distance_m": s.cumulative_distance_m,
                "target_pace_min_km": s.target_pace_min_km,
                "split_time_sec": s.split_time_sec,
                "cumulative_time_sec": s.cumulative_time_sec,
            }
            for s in plan.splits
        ],
        predicted_time_sec=plan.predicted_time_sec,
        source=plan.source,
    )


@api_router.post("/races/{race_id}/pacing/push", response_model=PushWorkoutResponse)
def api_push_race_pacing(
    race_id: int,
    body: PacingPushRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Push a race pacing plan as a structured workout to the user's Garmin device."""
    from app import pacing as pacing_mod
    from app import garmin_sync

    if not getattr(current_user, "garmin_oauth_data", None) and not getattr(current_user, "garmin_email", None):
        raise HTTPException(
            status_code=422,
            detail="Garmin account not connected. Connect in Settings first.",
        )

    race = _get_race_event(race_id, current_user.id, db)
    if not race.distance_m or race.distance_m <= 0:
        raise HTTPException(status_code=422, detail="Race has no distance set")

    effective_target = body.target_time_sec
    if effective_target is None:
        if race.goal_time_sec:
            effective_target = race.goal_time_sec
        else:
            try:
                curve = threshold_mod.get_performance_curve_data(db, user_id=current_user.id)
                match = next(
                    (p for p in curve.race_predictions if abs(p.distance_m - race.distance_m) < 500),
                    None,
                )
                if match:
                    effective_target = int(match.predicted_time_sec)
            except Exception:
                pass
        if effective_target is None:
            raise HTTPException(
                status_code=422,
                detail="No target time available to build pacing plan.",
            )

    plan = pacing_mod.generate_pacing_strategy(
        distance_m=race.distance_m,
        target_time_sec=float(effective_target),
        strategy=body.strategy,
        split_unit=body.split_unit,
    )

    try:
        result = garmin_sync.push_race_pacing_to_garmin(
            current_user,
            race_name=race.title or "Race",
            race_date=race.date,
            splits=plan.splits,
        )
    except RuntimeError as exc:
        logger.error("Garmin race pacing push failed for race %s: %s", race_id, exc)
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error pushing race pacing %s to Garmin", race_id)
        raise HTTPException(status_code=502, detail=f"Garmin error: {exc}")
    return result


# --- Actions ---

@api_router.post("/activities/{activity_id}/analyze")
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


@api_router.post("/activities/{activity_id}/feedback")
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


@api_router.post("/sync/{sync_type}")
def api_trigger_sync(sync_type: str, current_user: User = Depends(get_current_user)):
    # Manual syncs are scoped to the calling user only (the scheduler is what
    # fans a sync out across all connected users).
    from app.main import run_activity_sync_for_user, run_daily_sync_for_user

    uid = current_user.id
    if sync_type == "activities":
        threading.Thread(target=run_activity_sync_for_user, args=(uid,), daemon=True).start()
    elif sync_type == "daily":
        threading.Thread(target=run_daily_sync_for_user, args=(uid,), daemon=True).start()
    elif sync_type == "calendar":
        threading.Thread(target=_sync_calendar_for_user, args=(uid,), daemon=True).start()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown sync type: {sync_type}")
    return {"status": "accepted"}


@api_router.get("/jobs/{job_id}", response_model=AIJobResponse)
def api_get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the status of an AI background job owned by the current user."""
    job = db.query(AIJob).filter(AIJob.id == job_id, AIJob.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def _sync_calendar_for_user(user_id: int) -> None:
    """Resolve a user by id and sync their Garmin calendar (background thread)."""
    from app.database import db_session as make_session
    from app.garmin_sync import sync_calendar
    with make_session() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if user is not None:
            sync_calendar(user)


# --- Data Export ---

@api_router.get("/export/activities")
def api_export_activities(
    format: str = Query("csv", pattern="^(csv|json)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activities = (
        db.query(Activity)
        .filter(Activity.user_id == current_user.id)
        .order_by(Activity.started_at.desc())
        .all()
    )

    if format == "json":
        data = [ActivitySummary.model_validate(a).model_dump() for a in activities]
        content = json.dumps(data, default=str, indent=2)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=activities.json"},
        )

    fields = [
        "id", "garmin_id", "activity_type", "name", "started_at",
        "duration_sec", "distance_m", "avg_hr", "max_hr",
        "avg_pace_min_km", "calories", "elevation_gain",
    ]
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for a in activities:
        row = ActivitySummary.model_validate(a).model_dump()
        writer.writerow({k: ("" if row[k] is None else str(row[k])) for k in fields})
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=activities.csv"},
    )


@api_router.get("/export/insights")
def api_export_insights(
    format: str = Query("csv", pattern="^(csv|json)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    insights = (
        db.query(Insight)
        .filter(Insight.user_id == current_user.id)
        .order_by(Insight.created_at.desc())
        .all()
    )

    if format == "json":
        data = [InsightResponse.model_validate(i).model_dump() for i in insights]
        content = json.dumps(data, default=str, indent=2)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=insights.json"},
        )

    fields = ["id", "created_at", "trigger_type", "trigger_id", "category", "summary", "content"]
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for i in insights:
        row = InsightResponse.model_validate(i).model_dump()
        writer.writerow({k: ("" if row[k] is None else str(row[k])) for k in fields})
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=insights.csv"},
    )


# --- Workout Step Parsing (delegated to app.adherence) ---

def _enrich_event_with_steps(event: GarminCalendarEvent) -> CalendarEventResponse:
    """Convert a GarminCalendarEvent to CalendarEventResponse with parsed workout steps."""
    resp = CalendarEventResponse.model_validate(event)
    if event.event_type == "workout" and event.raw_json:
        steps = adherence_mod.parse_workout_steps(event.raw_json)
        if steps:
            resp.workout_steps = steps
    return resp


# --- Chat ---

@api_router.get("/chat", response_model=ChatHistoryResponse)
def api_get_chat(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .all()
    )
    return ChatHistoryResponse(
        messages=[ChatMessageResponse.model_validate(m) for m in messages]
    )


@api_router.delete("/chat")
def api_clear_chat(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.commit()
    return {"cleared": True}


@api_router.post("/chat")
def api_post_chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.ai_coach import chat_stream as _chat_stream
    from app.database import db_session as make_session

    # Save user message immediately
    user_msg = ChatMessage(
        user_id=current_user.id,
        role="user",
        content=req.message,
        activity_id=req.activity_id,
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Fetch conversation history (up to 20 prior turns) for multi-turn context
    history_rows = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == current_user.id,
            ChatMessage.id < user_msg.id,
        )
        .order_by(ChatMessage.created_at.asc())
        .limit(20)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in history_rows]

    user_id = current_user.id
    new_message = req.message
    activity_id = req.activity_id

    def generate():
        full_response: list[str] = []
        try:
            with make_session() as session:
                token_iter = _chat_stream(session, new_message, history, user_id, activity_id)
                for token in token_iter:
                    full_response.append(token)
                    yield f"data: {json.dumps({'token': token})}\n\n"

                # Persist the complete AI response
                assistant_msg = ChatMessage(
                    user_id=user_id,
                    role="assistant",
                    content="".join(full_response),
                )
                session.add(assistant_msg)
                session.commit()
        except Exception as exc:
            logger.exception("Chat streaming error")
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# --- Helpers ---

def _parse_date(s: str | None) -> date:
    if not s:
        return date.today()
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        return date.today()
