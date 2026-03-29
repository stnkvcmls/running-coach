import calendar as cal_mod
import json
import logging
import threading
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Activity, DailySummary, GarminCalendarEvent, Insight, MetricZone, SyncStatus
from app.schemas import (
    ActivityDetail,
    ActivitySummary,
    CalendarDay,
    CalendarEventResponse,
    DailySummaryDetail,
    DailySummaryResponse,
    InsightResponse,
    MetricZoneResponse,
    RaceInfo,
    SettingsResponse,
    TodayResponse,
    WeeklyMileage,
)
from app.utils import safe_json_loads, parse_activity_charts

logger = logging.getLogger(__name__)

api_router = APIRouter(prefix="/api/v1", tags=["api"])


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

    # Weekly mileage (last 8 weeks)
    week_start_base = date.today() - timedelta(days=date.today().weekday())
    eight_weeks_ago = week_start_base - timedelta(weeks=7)
    all_distances = (
        db.query(Activity.started_at, Activity.distance_m)
        .filter(
            Activity.started_at >= datetime.combine(eight_weeks_ago, datetime.min.time()),
            Activity.distance_m.isnot(None),
        )
        .all()
    )
    weekly_buckets: dict[date, float] = {}
    for w in range(7, -1, -1):
        ws = week_start_base - timedelta(weeks=w)
        weekly_buckets[ws] = 0.0
    for a_started, a_dist in all_distances:
        if a_started is None:
            continue
        a_date = a_started.date() if isinstance(a_started, datetime) else a_started
        days_from_base = (week_start_base - a_date).days
        week_idx = days_from_base // 7
        ws = week_start_base - timedelta(weeks=week_idx)
        if ws in weekly_buckets:
            weekly_buckets[ws] += a_dist or 0
    weekly_data = [
        WeeklyMileage(label=ws.strftime("%b %d"), km=round(dist / 1000, 1))
        for ws, dist in sorted(weekly_buckets.items())
    ]

    # Latest insights
    latest_insights = (
        db.query(Insight).order_by(Insight.created_at.desc()).limit(5).all()
    )

    # Next race
    next_race_row = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.event_type == "race",
            GarminCalendarEvent.date >= date.today(),
        )
        .order_by(GarminCalendarEvent.date.asc())
        .first()
    )
    next_race = None
    if next_race_row:
        next_race = RaceInfo(
            id=next_race_row.id,
            title=next_race_row.title,
            date=next_race_row.date,
            distance_label=next_race_row.distance_label,
            days_away=(next_race_row.date - date.today()).days,
        )

    return TodayResponse(
        selected_date=selected,
        activities=[ActivitySummary.model_validate(a) for a in activities],
        daily_summary=DailySummaryResponse.model_validate(daily_summary) if daily_summary else None,
        weekly_data=weekly_data,
        insights=[InsightResponse.model_validate(i) for i in latest_insights],
        next_race=next_race,
    )


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

    result = ActivityDetail.model_validate(activity)
    result.splits = splits
    result.hr_zones = hr_zones
    result.weather = weather
    result.power_zones = power_zones
    result.chart_data = chart_data
    result.metric_zones = metric_zones
    result.insight = InsightResponse.model_validate(insight) if insight else None
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
            events=[CalendarEventResponse.model_validate(e) for e in events_by_date.get(d, [])],
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
            events=[CalendarEventResponse.model_validate(e) for e in events_by_date.get(d, [])],
        ))
    return result


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


# --- Actions ---

@api_router.post("/activities/{activity_id}/analyze")
def api_trigger_analysis(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    from app.ai_coach import analyze_activity_force
    threading.Thread(target=analyze_activity_force, args=(activity_id,), daemon=True).start()
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


# --- Helpers ---

def _parse_date(s: str | None) -> date:
    if not s:
        return date.today()
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        return date.today()
