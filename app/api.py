import calendar as cal_mod
import json
import logging
import threading
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Activity,
    AthleteProfile,
    DailySummary,
    GarminCalendarEvent,
    Insight,
    MetricZone,
    SyncStatus,
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
    DailySummaryDetail,
    DailySummaryResponse,
    FeedbackRequest,
    InsightResponse,
    MetricZoneResponse,
    RaceInfo,
    SettingsResponse,
    TodayResponse,
    TrainingLoadResponse,
    TrainingReadiness,
    WeeklyMileage,
    WorkoutAdherence,
    WorkoutStepResponse,
    ThresholdApplyRequest,
    ThresholdEstimateField,
    ThresholdEstimateResponse,
    ZoneConfigBulkUpdate,
    ZoneConfigResponse,
    ZoneConfigsResponse,
)
from app import training_load
from app import threshold as threshold_mod
from app import adherence as adherence_mod
from app.utils import safe_json_loads, parse_activity_charts, calculate_age

logger = logging.getLogger(__name__)

api_router = APIRouter(prefix="/api/v1", tags=["api"])

AVAILABLE_MODELS: dict[str, list[str]] = {
    "claude": ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
    "gemini": [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-3-flash",
        "gemini-3.1-flash-lite",
        "gemma-2-2b-it",
        "gemma-4-26b-it",
        "gemma-4-31b-it",
    ],
}


# --- Today ---

@api_router.get("/today", response_model=TodayResponse)
def api_today(
    date_str: str = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    selected = _parse_date(date_str) if date_str else date.today()

    # Activities for the selected date
    day_start = datetime.combine(selected, datetime.min.time())
    day_end = datetime.combine(selected + timedelta(days=1), datetime.min.time())
    activities = (
        db.query(Activity)
        .filter(Activity.started_at >= day_start, Activity.started_at < day_end)
        .order_by(Activity.started_at.desc())
        .all()
    )

    # Daily summary
    daily_summary = db.query(DailySummary).filter(DailySummary.date == selected).first()

    # Weekly mileage (last 8 weeks) - split by activity type
    week_start_base = date.today() - timedelta(days=date.today().weekday())
    eight_weeks_ago = week_start_base - timedelta(weeks=7)
    all_activities = (
        db.query(Activity.started_at, Activity.distance_m, Activity.activity_type)
        .filter(
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
        db.query(Insight).order_by(Insight.created_at.desc()).limit(5).all()
    )

    # Next 2 upcoming races
    next_race_rows = (
        db.query(GarminCalendarEvent)
        .filter(
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

    # Scheduled workout events for the selected date
    scheduled_events_rows = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.date == selected,
            GarminCalendarEvent.event_type == "workout",
        )
        .order_by(GarminCalendarEvent.id.asc())
        .all()
    )
    scheduled_events = [_enrich_event_with_steps(e) for e in scheduled_events_rows]

    # Current training load snapshot (Fitness/Fatigue/Form) as of the selected date
    current_load = training_load.current_load(db, as_of=selected)

    # Resting HR from the 7 days before the selected date (for trend comparison)
    rhr_cutoff = selected - timedelta(days=7)
    recent_rhr_rows = (
        db.query(DailySummary.resting_hr)
        .filter(
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
):
    end_date = _parse_date(date_str) if date_str else date.today()
    points = training_load.compute_load_series(db, end_date=end_date, days=days)
    return TrainingLoadResponse(points=points, current=points[-1] if points else None)


# --- Wellness Trends ---

@api_router.get("/wellness-trends", response_model=list[DailySummaryResponse])
def api_wellness_trends(
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
):
    cutoff = date.today() - timedelta(days=days)
    summaries = (
        db.query(DailySummary)
        .filter(DailySummary.date >= cutoff)
        .order_by(DailySummary.date.asc())
        .all()
    )
    return [DailySummaryResponse.model_validate(s) for s in summaries]


# --- Activities ---

@api_router.get("/activities", response_model=list[ActivitySummary])
def api_activities(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type: str = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Activity).order_by(Activity.started_at.desc())
    if type:
        query = query.filter(Activity.activity_type == type)
    offset = (page - 1) * limit
    activities = query.offset(offset).limit(limit).all()
    return [ActivitySummary.model_validate(a) for a in activities]


@api_router.get("/activities/{activity_id}", response_model=ActivityDetail)
def api_activity_detail(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    splits = safe_json_loads(activity.splits_json)
    hr_zones = safe_json_loads(activity.hr_zones_json)
    weather = safe_json_loads(activity.weather_json)
    power_zones = safe_json_loads(activity.power_zones_json)
    laps = safe_json_loads(activity.laps_json)
    chart_data = parse_activity_charts(laps)

    insight = (
        db.query(Insight)
        .filter(Insight.trigger_type == "activity", Insight.trigger_id == activity.id)
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
):
    offset = (page - 1) * limit
    summaries = (
        db.query(DailySummary)
        .order_by(DailySummary.date.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [DailySummaryResponse.model_validate(s) for s in summaries]


@api_router.get("/daily-summaries/{summary_id}", response_model=DailySummaryDetail)
def api_daily_detail(summary_id: int, db: Session = Depends(get_db)):
    summary = db.query(DailySummary).filter(DailySummary.id == summary_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Daily summary not found")

    insight = (
        db.query(Insight)
        .filter(Insight.trigger_type == "daily_summary", Insight.trigger_id == summary.id)
        .first()
    )

    day_activities = (
        db.query(Activity)
        .filter(
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
):
    target = _parse_date(date_str) if date_str else date.today()
    # Monday of the week
    week_start = target - timedelta(days=target.weekday())
    week_end = week_start + timedelta(days=7)

    activities = (
        db.query(Activity)
        .filter(
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
def api_calendar_event_detail(event_id: int, db: Session = Depends(get_db)):
    event = db.query(GarminCalendarEvent).filter(GarminCalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    return _enrich_event_with_steps(event)


# --- Insights ---

@api_router.get("/insights", response_model=list[InsightResponse])
def api_insights(
    category: str = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Insight).order_by(Insight.created_at.desc())
    if category:
        query = query.filter(Insight.category == category)
    return [InsightResponse.model_validate(i) for i in query.limit(limit).all()]


# --- Settings ---

@api_router.get("/settings", response_model=SettingsResponse)
def api_settings(db: Session = Depends(get_db)):
    sync_statuses = {}
    for s in db.query(SyncStatus).all():
        sync_statuses[s.key] = {"value": s.value, "updated_at": str(s.updated_at) if s.updated_at else None}

    counts = {
        "activities": db.query(func.count(Activity.id)).scalar() or 0,
        "daily_summaries": db.query(func.count(DailySummary.id)).scalar() or 0,
        "insights": db.query(func.count(Insight.id)).scalar() or 0,
        "calendar_events": db.query(func.count(GarminCalendarEvent.id)).scalar() or 0,
    }
    return SettingsResponse(sync_statuses=sync_statuses, counts=counts)


@api_router.get("/ai-config", response_model=AiConfigResponse)
def api_get_ai_config(db: Session = Depends(get_db)):
    from app.config import settings as app_settings
    provider_row = db.query(SyncStatus).filter(SyncStatus.key == "ai_provider").first()
    model_row = db.query(SyncStatus).filter(SyncStatus.key == "ai_model").first()
    provider = provider_row.value if provider_row else "claude"
    model = model_row.value if model_row else app_settings.ai_model
    return AiConfigResponse(
        provider=provider,
        model=model,
        available_providers=list(AVAILABLE_MODELS.keys()),
        available_models=AVAILABLE_MODELS,
    )


@api_router.post("/ai-config", response_model=AiConfigResponse)
def api_set_ai_config(config: AiConfigRequest, db: Session = Depends(get_db)):
    if config.provider not in AVAILABLE_MODELS:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {config.provider}")
    if config.model not in AVAILABLE_MODELS[config.provider]:
        raise HTTPException(status_code=400, detail=f"Model {config.model} not valid for {config.provider}")

    for key, value in [("ai_provider", config.provider), ("ai_model", config.model)]:
        row = db.query(SyncStatus).filter(SyncStatus.key == key).first()
        if row:
            row.value = value
        else:
            db.add(SyncStatus(key=key, value=value))
    db.commit()

    return AiConfigResponse(
        provider=config.provider,
        model=config.model,
        available_providers=list(AVAILABLE_MODELS.keys()),
        available_models=AVAILABLE_MODELS,
    )


# --- Athlete Profile ---


def _profile_response(profile: AthleteProfile) -> AthleteProfileResponse:
    """Build a response, deriving age from date_of_birth."""
    result = AthleteProfileResponse.model_validate(profile)
    result.age = calculate_age(profile.date_of_birth)
    return result


@api_router.get("/athlete-profile", response_model=AthleteProfileResponse | None)
def api_get_athlete_profile(db: Session = Depends(get_db)):
    profile = db.query(AthleteProfile).first()
    return _profile_response(profile) if profile else None


# Name, date of birth, and weight are always sourced from Garmin and are not
# user-editable, so ignore any client-supplied values for these fields.
GARMIN_MANAGED_PROFILE_FIELDS = {"name", "date_of_birth", "weight_kg"}


@api_router.post("/athlete-profile", response_model=AthleteProfileResponse)
def api_set_athlete_profile(profile_data: AthleteProfileRequest, db: Session = Depends(get_db)):
    updates = {
        key: value
        for key, value in profile_data.model_dump(exclude_unset=True).items()
        if key not in GARMIN_MANAGED_PROFILE_FIELDS
    }
    profile = db.query(AthleteProfile).first()
    if profile is None:
        profile = AthleteProfile(**updates)
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


def _build_zones_response(db: Session) -> ZoneConfigsResponse:
    profile = db.query(AthleteProfile).first()
    threshold_hr = profile.threshold_hr if profile else None
    threshold_pace = profile.threshold_pace_min_km if profile else None
    threshold_power = profile.threshold_power if profile else None

    all_zones = db.query(ZoneConfig).order_by(ZoneConfig.zone_type, ZoneConfig.zone_number).all()

    return ZoneConfigsResponse(
        hr=_compute_zone_bounds([z for z in all_zones if z.zone_type == "hr"], threshold_hr),
        pace=_compute_zone_bounds([z for z in all_zones if z.zone_type == "pace"], threshold_pace),
        power=_compute_zone_bounds([z for z in all_zones if z.zone_type == "power"], threshold_power),
        threshold_hr=threshold_hr,
        threshold_pace_min_km=threshold_pace,
        threshold_power=threshold_power,
    )


@api_router.get("/zones", response_model=ZoneConfigsResponse)
def api_get_zones(db: Session = Depends(get_db)):
    return _build_zones_response(db)


@api_router.put("/zones", response_model=ZoneConfigsResponse)
def api_update_zones(update: ZoneConfigBulkUpdate, db: Session = Depends(get_db)):
    for zu in update.zones:
        zone = (
            db.query(ZoneConfig)
            .filter(ZoneConfig.zone_type == zu.zone_type, ZoneConfig.zone_number == zu.zone_number)
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
    return _build_zones_response(db)


# --- Threshold / Critical Power estimation ---

def _field(est: "threshold_mod.FieldEstimate") -> ThresholdEstimateField:
    return ThresholdEstimateField(
        value=est.value,
        method=est.method,
        confidence=est.confidence,
        sample_size=est.sample_size,
    )


def _build_threshold_response(
    estimate: "threshold_mod.ThresholdEstimate", profile: AthleteProfile | None
) -> ThresholdEstimateResponse:
    return ThresholdEstimateResponse(
        critical_power=_field(estimate.critical_power),
        w_prime=estimate.w_prime,
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
def api_get_threshold_estimate(db: Session = Depends(get_db)):
    estimate = threshold_mod.estimate_thresholds(db)
    profile = db.query(AthleteProfile).first()
    return _build_threshold_response(estimate, profile)


@api_router.post("/threshold-estimate/apply", response_model=AthleteProfileResponse)
def api_apply_threshold_estimate(
    req: ThresholdApplyRequest, db: Session = Depends(get_db)
):
    estimate = threshold_mod.estimate_thresholds(db)
    profile = db.query(AthleteProfile).first()
    if profile is None:
        profile = AthleteProfile()
        db.add(profile)
    fields = req.fields if req.fields else None
    applied = threshold_mod.apply_estimate_to_profile(profile, estimate, fields)
    if not applied:
        raise HTTPException(status_code=400, detail="No estimated thresholds available to apply")
    db.commit()
    db.refresh(profile)
    return _profile_response(profile)


# --- Actions ---

@api_router.post("/activities/{activity_id}/analyze")
def api_trigger_analysis(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    from app.ai_coach import analyze_activity_force
    threading.Thread(target=analyze_activity_force, args=(activity_id,), daemon=True).start()
    return {"status": "accepted"}


@api_router.post("/activities/{activity_id}/feedback")
def api_submit_feedback(activity_id: int, feedback: FeedbackRequest, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity.feedback_rating = feedback.rating
    activity.feedback_tags = json.dumps(feedback.tags) if feedback.tags else None
    activity.feedback_text = feedback.text
    activity.ai_analyzed = False

    # Delete existing insight
    db.query(Insight).filter(
        Insight.trigger_type == "activity",
        Insight.trigger_id == activity.id,
    ).delete()
    db.commit()

    from app.ai_coach import analyze_activity_with_feedback
    threading.Thread(target=analyze_activity_with_feedback, args=(activity_id,), daemon=True).start()
    return {"status": "accepted"}


@api_router.post("/sync/{sync_type}")
def api_trigger_sync(sync_type: str):
    if sync_type == "activities":
        from app.main import _scheduled_activity_sync
        threading.Thread(target=_scheduled_activity_sync, daemon=True).start()
    elif sync_type == "daily":
        from app.main import _scheduled_daily_sync
        threading.Thread(target=_scheduled_daily_sync, daemon=True).start()
    elif sync_type == "calendar":
        from app.garmin_sync import sync_calendar
        threading.Thread(target=sync_calendar, daemon=True).start()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown sync type: {sync_type}")
    return {"status": "accepted"}


# --- Workout Step Parsing (delegated to app.adherence) ---

def _enrich_event_with_steps(event: GarminCalendarEvent) -> CalendarEventResponse:
    """Convert a GarminCalendarEvent to CalendarEventResponse with parsed workout steps."""
    resp = CalendarEventResponse.model_validate(event)
    if event.event_type == "workout" and event.raw_json:
        steps = adherence_mod.parse_workout_steps(event.raw_json)
        if steps:
            resp.workout_steps = steps
    return resp


# --- Helpers ---

def _parse_date(s: str | None) -> date:
    if not s:
        return date.today()
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        return date.today()
