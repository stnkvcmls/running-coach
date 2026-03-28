import calendar
import json
import logging
import threading
from datetime import datetime, date, timedelta, timezone

from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Activity, DailySummary, GarminCalendarEvent, Insight, SyncStatus
from app.utils import safe_json_loads

logger = logging.getLogger(__name__)

router = APIRouter()


def _parse_activity_charts(laps_data) -> dict:
    """Extract time-series chart data from activity details (laps_json)."""
    if not laps_data or not isinstance(laps_data, dict):
        return {}

    descriptors = laps_data.get("metricDescriptors", [])
    metrics = laps_data.get("activityDetailMetrics", [])
    if not descriptors or not metrics:
        return {}

    # Build column index map
    col_map = {}
    for desc in descriptors:
        key = desc.get("key", "")
        idx = desc.get("metricsIndex")
        if idx is not None:
            col_map[key] = idx

    charts = {}
    # Sample ~200 points max for performance
    step = max(1, len(metrics) // 200)
    sampled = metrics[::step]

    series_defs = [
        ("heart_rate",  "directHeartRate",            "Heart Rate",  "bpm"),
        ("elevation",   "directElevation",            "Elevation",   "m"),
        ("pace",        "directSpeed",                "Pace",        "min/km"),
        ("cadence",     "directRunCadence",           "Cadence",     "spm"),
        ("power",       "directPower",                "Power",       "W"),
        ("gct",         "directGroundContactTime",    "GCT",         "ms"),
        ("vert_osc",    "directVerticalOscillation",  "Vert. Osc.",  "cm"),
        ("vert_ratio",  "directVerticalRatio",        "Vert. Ratio", "%"),
        ("stride",      "directStrideLength",         "Stride",      "m"),
        ("perf_cond",   "directPerformanceCondition", "Perf. Cond.", ""),
        ("stamina",     "directCurrentStamina",       "Stamina",     "%"),
    ]

    for chart_key, garmin_key, label, unit in series_defs:
        if garmin_key not in col_map:
            continue
        idx = col_map[garmin_key]
        values = []
        for m in sampled:
            metrics_arr = m.get("metrics", [])
            if idx < len(metrics_arr) and metrics_arr[idx] is not None:
                values.append(metrics_arr[idx])
            else:
                values.append(None)
        if any(v is not None for v in values):
            charts[chart_key] = {"label": label, "unit": unit, "data": values}

    # Convert speed (m/s) to pace (min/km)
    if "pace" in charts:
        charts["pace"]["data"] = [
            round(1000 / (60 * v), 2) if v and v > 0 else None
            for v in charts["pace"]["data"]
        ]

    # Double cadence for running (Garmin reports half-cadence)
    if "cadence" in charts:
        charts["cadence"]["data"] = [
            round(v * 2) if v is not None else None
            for v in charts["cadence"]["data"]
        ]

    return charts
templates = Jinja2Templates(directory="app/templates")


def _pace_str(pace_min_km: float | None) -> str:
    if not pace_min_km or pace_min_km <= 0:
        return "-"
    mins = int(pace_min_km)
    secs = int((pace_min_km - mins) * 60)
    return f"{mins}:{secs:02d}"


def _duration_str(seconds: float | None) -> str:
    if not seconds:
        return "-"
    seconds = int(seconds)
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def _distance_str(meters: float | None) -> str:
    if not meters:
        return "-"
    km = meters / 1000
    if km >= 10:
        return f"{km:.1f}"
    return f"{km:.2f}"


# Register template filters
templates.env.filters["pace"] = _pace_str
templates.env.filters["duration"] = _duration_str
templates.env.filters["distance_km"] = _distance_str
templates.env.globals["now"] = lambda: datetime.now(timezone.utc)


# --- Dashboard ---

@router.get("/", response_class=HTMLResponse)
def dashboard(request: Request, db: Session = Depends(get_db)):
    # Recent activities
    recent_activities = (
        db.query(Activity)
        .order_by(Activity.started_at.desc())
        .limit(10)
        .all()
    )

    # Latest insights
    latest_insights = (
        db.query(Insight)
        .order_by(Insight.created_at.desc())
        .limit(5)
        .all()
    )

    # Today's daily summary
    today_summary = (
        db.query(DailySummary)
        .filter(DailySummary.date == date.today())
        .first()
    )
    # If no today, try yesterday
    if not today_summary:
        today_summary = (
            db.query(DailySummary)
            .filter(DailySummary.date == date.today() - timedelta(days=1))
            .first()
        )

    # Weekly mileage (last 8 weeks) - single query
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

    # Bucket into weeks
    weekly_buckets = {}
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
        {"label": ws.strftime("%b %d"), "km": round(dist / 1000, 1)}
        for ws, dist in sorted(weekly_buckets.items())
    ]

    # Next race (from Garmin calendar)
    next_race = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.event_type == "race",
            GarminCalendarEvent.date >= date.today(),
        )
        .order_by(GarminCalendarEvent.date.asc())
        .first()
    )
    days_to_race = (next_race.date - date.today()).days if next_race else None

    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "activities": recent_activities,
        "insights": latest_insights,
        "daily": today_summary,
        "weekly_data": json.dumps(weekly_data),
        "next_race": next_race,
        "days_to_race": days_to_race,
        "page": "dashboard",
    })


# --- Activity Detail ---

@router.get("/activity/{activity_id}", response_class=HTMLResponse)
def activity_detail(request: Request, activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Parse JSON fields
    laps = safe_json_loads(activity.laps_json)
    splits = safe_json_loads(activity.splits_json)
    hr_zones = safe_json_loads(activity.hr_zones_json)
    weather = safe_json_loads(activity.weather_json)
    power_zones = safe_json_loads(activity.power_zones_json)

    # Parse time-series data for area charts
    chart_data = _parse_activity_charts(laps)

    # Get AI insight for this activity
    insight = (
        db.query(Insight)
        .filter(Insight.trigger_type == "activity", Insight.trigger_id == activity.id)
        .first()
    )

    return templates.TemplateResponse("activity.html", {
        "request": request,
        "activity": activity,
        "laps": laps,
        "splits": splits,
        "hr_zones": hr_zones,
        "weather": weather,
        "power_zones": power_zones,
        "chart_data": json.dumps(chart_data),
        "insight": insight,
        "page": "dashboard",
    })


# --- Daily Summaries ---

@router.get("/daily", response_class=HTMLResponse)
def daily_list(request: Request, db: Session = Depends(get_db)):
    summaries = (
        db.query(DailySummary)
        .order_by(DailySummary.date.desc())
        .limit(30)
        .all()
    )
    return templates.TemplateResponse("daily_list.html", {
        "request": request,
        "summaries": summaries,
        "page": "dashboard",
    })


@router.get("/daily/{summary_id}", response_class=HTMLResponse)
def daily_detail(request: Request, summary_id: int, db: Session = Depends(get_db)):
    summary = db.query(DailySummary).filter(DailySummary.id == summary_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Daily summary not found")

    # Get AI insight for this daily summary
    insight = (
        db.query(Insight)
        .filter(Insight.trigger_type == "daily_summary", Insight.trigger_id == summary.id)
        .first()
    )

    # Get activities for this day
    day_activities = (
        db.query(Activity)
        .filter(
            Activity.started_at >= datetime.combine(summary.date, datetime.min.time()),
            Activity.started_at < datetime.combine(summary.date + timedelta(days=1), datetime.min.time()),
        )
        .order_by(Activity.started_at.asc())
        .all()
    )

    return templates.TemplateResponse("daily_detail.html", {
        "request": request,
        "summary": summary,
        "insight": insight,
        "activities": day_activities,
        "page": "dashboard",
    })


# --- Insights ---

@router.get("/insights", response_class=HTMLResponse)
def insights_list(request: Request, category: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Insight).order_by(Insight.created_at.desc())
    if category:
        query = query.filter(Insight.category == category)
    all_insights = query.limit(50).all()

    categories = (
        db.query(Insight.category, func.count(Insight.id))
        .group_by(Insight.category)
        .all()
    )

    return templates.TemplateResponse("insights.html", {
        "request": request,
        "insights": all_insights,
        "categories": categories,
        "current_category": category,
        "page": "insights",
    })


# --- Calendar ---

@router.get("/calendar", response_class=HTMLResponse)
def calendar_view(request: Request, month: str | None = None, db: Session = Depends(get_db)):
    if month:
        try:
            view_date = datetime.strptime(month, "%Y-%m").date()
        except ValueError:
            view_date = date.today().replace(day=1)
    else:
        view_date = date.today().replace(day=1)

    # Get month boundaries
    if view_date.month == 12:
        next_month = view_date.replace(year=view_date.year + 1, month=1)
    else:
        next_month = view_date.replace(month=view_date.month + 1)

    # Activities this month
    month_activities = (
        db.query(Activity)
        .filter(
            Activity.started_at >= datetime.combine(view_date, datetime.min.time()),
            Activity.started_at < datetime.combine(next_month, datetime.min.time()),
        )
        .order_by(Activity.started_at.asc())
        .all()
    )

    # Group activities by date
    activities_by_date = {}
    for a in month_activities:
        if a.started_at:
            d = a.started_at.date()
            activities_by_date.setdefault(d, []).append(a)

    # Garmin calendar events this month
    month_events = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.date >= view_date,
            GarminCalendarEvent.date < next_month,
        )
        .order_by(GarminCalendarEvent.date.asc())
        .all()
    )
    events_by_date = {}
    for e in month_events:
        events_by_date.setdefault(e.date, []).append(e)

    # Upcoming races
    upcoming_races = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.event_type == "race",
            GarminCalendarEvent.date >= date.today(),
        )
        .order_by(GarminCalendarEvent.date.asc())
        .all()
    )

    # Upcoming workouts
    upcoming_workouts = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.event_type == "workout",
            GarminCalendarEvent.date >= date.today(),
        )
        .order_by(GarminCalendarEvent.date.asc())
        .limit(10)
        .all()
    )

    # Build calendar grid
    cal = calendar.Calendar(firstweekday=0)  # Monday start
    month_days = list(cal.itermonthdays2(view_date.year, view_date.month))

    prev_month = view_date - timedelta(days=1)
    prev_month = prev_month.replace(day=1)

    return templates.TemplateResponse("calendar.html", {
        "request": request,
        "view_date": view_date,
        "month_days": month_days,
        "activities_by_date": activities_by_date,
        "events_by_date": events_by_date,
        "upcoming_races": upcoming_races,
        "upcoming_workouts": upcoming_workouts,
        "prev_month": prev_month.strftime("%Y-%m"),
        "next_month": next_month.strftime("%Y-%m"),
        "today": date.today(),
        "page": "calendar",
    })


# --- Settings ---

@router.get("/settings", response_class=HTMLResponse)
def settings_page(request: Request, db: Session = Depends(get_db)):
    sync_statuses = {s.key: s for s in db.query(SyncStatus).all()}
    activity_count = db.query(func.count(Activity.id)).scalar()
    daily_count = db.query(func.count(DailySummary.id)).scalar()
    insight_count = db.query(func.count(Insight.id)).scalar()
    calendar_event_count = db.query(func.count(GarminCalendarEvent.id)).scalar()

    return templates.TemplateResponse("settings.html", {
        "request": request,
        "sync_statuses": sync_statuses,
        "activity_count": activity_count,
        "daily_count": daily_count,
        "insight_count": insight_count,
        "calendar_event_count": calendar_event_count,
        "page": "settings",
    })


@router.post("/activity/{activity_id}/analyze")
def trigger_activity_analysis(activity_id: int, db: Session = Depends(get_db)):
    """Manually trigger AI analysis for an activity (creates or replaces insight)."""
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    from app.ai_coach import analyze_activity_force
    threading.Thread(target=analyze_activity_force, args=(activity_id,), daemon=True).start()
    return RedirectResponse(url=f"/activity/{activity_id}", status_code=303)


@router.post("/sync/activities")
def trigger_activity_sync():
    """Manually trigger activity sync."""
    from app.main import _scheduled_activity_sync
    threading.Thread(target=_scheduled_activity_sync, daemon=True).start()
    return RedirectResponse(url="/settings", status_code=303)


@router.post("/sync/daily")
def trigger_daily_sync():
    """Manually trigger daily summary sync."""
    from app.main import _scheduled_daily_sync
    threading.Thread(target=_scheduled_daily_sync, daemon=True).start()
    return RedirectResponse(url="/settings", status_code=303)


@router.post("/sync/calendar")
def trigger_calendar_sync():
    """Manually trigger calendar sync."""
    from app.garmin_sync import sync_calendar
    threading.Thread(target=sync_calendar, daemon=True).start()
    return RedirectResponse(url="/settings", status_code=303)
