import json
import logging
from datetime import datetime, date, timedelta

from fastapi import APIRouter, Depends, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Activity, DailySummary, Insight, Race, SyncStatus

logger = logging.getLogger(__name__)

router = APIRouter()
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
templates.env.globals["now"] = datetime.utcnow


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

    # Weekly mileage (last 8 weeks)
    weekly_data = []
    for w in range(7, -1, -1):
        week_start = date.today() - timedelta(days=date.today().weekday() + 7 * w)
        week_end = week_start + timedelta(days=7)
        result = (
            db.query(func.sum(Activity.distance_m))
            .filter(
                Activity.started_at >= datetime.combine(week_start, datetime.min.time()),
                Activity.started_at < datetime.combine(week_end, datetime.min.time()),
            )
            .scalar()
        )
        weekly_data.append({
            "label": week_start.strftime("%b %d"),
            "km": round((result or 0) / 1000, 1),
        })

    # Next race
    next_race = (
        db.query(Race)
        .filter(Race.date >= date.today())
        .order_by(Race.date.asc())
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
    laps = None
    if activity.laps_json:
        try:
            laps_data = json.loads(activity.laps_json)
            if isinstance(laps_data, dict):
                laps = laps_data
            elif isinstance(laps_data, list):
                laps = laps_data
        except (json.JSONDecodeError, TypeError):
            pass

    splits = None
    if activity.splits_json:
        try:
            splits = json.loads(activity.splits_json)
        except (json.JSONDecodeError, TypeError):
            pass

    hr_zones = None
    if activity.hr_zones_json:
        try:
            hr_zones = json.loads(activity.hr_zones_json)
        except (json.JSONDecodeError, TypeError):
            pass

    weather = None
    if activity.weather_json:
        try:
            weather = json.loads(activity.weather_json)
        except (json.JSONDecodeError, TypeError):
            pass

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
        "insight": insight,
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

    # All races
    all_races = db.query(Race).order_by(Race.date.asc()).all()
    races_by_date = {r.date: r for r in all_races}

    # Upcoming races
    upcoming_races = [r for r in all_races if r.date >= date.today()]

    # Build calendar grid
    import calendar
    cal = calendar.Calendar(firstweekday=0)  # Monday start
    month_days = list(cal.itermonthdays2(view_date.year, view_date.month))

    prev_month = view_date - timedelta(days=1)
    prev_month = prev_month.replace(day=1)

    return templates.TemplateResponse("calendar.html", {
        "request": request,
        "view_date": view_date,
        "month_days": month_days,
        "activities_by_date": activities_by_date,
        "races_by_date": races_by_date,
        "upcoming_races": upcoming_races,
        "prev_month": prev_month.strftime("%Y-%m"),
        "next_month": next_month.strftime("%Y-%m"),
        "today": date.today(),
        "page": "calendar",
    })


@router.post("/races/add")
def add_race(
    name: str = Form(...),
    race_date: str = Form(...),
    distance_label: str = Form(...),
    custom_distance_km: float | None = Form(None),
    goal_hours: int | None = Form(None),
    goal_minutes: int | None = Form(None),
    goal_seconds: int | None = Form(None),
    notes: str | None = Form(None),
    db: Session = Depends(get_db),
):
    distance_map = {
        "5K": 5000,
        "10K": 10000,
        "Half Marathon": 21097.5,
        "Marathon": 42195,
    }

    if distance_label == "Custom" and custom_distance_km:
        distance_m = custom_distance_km * 1000
    else:
        distance_m = distance_map.get(distance_label, 0)

    goal_time_sec = None
    if goal_hours or goal_minutes or goal_seconds:
        goal_time_sec = (goal_hours or 0) * 3600 + (goal_minutes or 0) * 60 + (goal_seconds or 0)

    race = Race(
        name=name,
        date=datetime.strptime(race_date, "%Y-%m-%d").date(),
        distance_m=distance_m,
        distance_label=distance_label if distance_label != "Custom" else f"{custom_distance_km}km",
        goal_time_sec=goal_time_sec,
        notes=notes or None,
        created_at=datetime.utcnow(),
    )
    db.add(race)
    db.commit()
    return RedirectResponse(url="/calendar", status_code=303)


@router.post("/races/{race_id}/delete")
def delete_race(race_id: int, db: Session = Depends(get_db)):
    race = db.query(Race).filter(Race.id == race_id).first()
    if race:
        db.delete(race)
        db.commit()
    return RedirectResponse(url="/calendar", status_code=303)


# --- Settings ---

@router.get("/settings", response_class=HTMLResponse)
def settings_page(request: Request, db: Session = Depends(get_db)):
    sync_statuses = {s.key: s for s in db.query(SyncStatus).all()}
    activity_count = db.query(func.count(Activity.id)).scalar()
    daily_count = db.query(func.count(DailySummary.id)).scalar()
    insight_count = db.query(func.count(Insight.id)).scalar()

    return templates.TemplateResponse("settings.html", {
        "request": request,
        "sync_statuses": sync_statuses,
        "activity_count": activity_count,
        "daily_count": daily_count,
        "insight_count": insight_count,
        "page": "settings",
    })


@router.post("/sync/activities")
def trigger_activity_sync():
    """Manually trigger activity sync."""
    import threading
    from app.main import _scheduled_activity_sync
    threading.Thread(target=_scheduled_activity_sync, daemon=True).start()
    return RedirectResponse(url="/settings", status_code=303)


@router.post("/sync/daily")
def trigger_daily_sync():
    """Manually trigger daily summary sync."""
    import threading
    from app.main import _scheduled_daily_sync
    threading.Thread(target=_scheduled_daily_sync, daemon=True).start()
    return RedirectResponse(url="/settings", status_code=303)
