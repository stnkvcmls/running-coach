"""Today dashboard, daily summaries, insights feed, and sync/job triggers."""
import threading
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    AIJob,
    Activity,
    AthleteProfile,
    DailySummary,
    GarminCalendarEvent,
    Insight,
    SyncStatus,
    TrainingPlanDay,
    User,
)
from app.schemas import (
    AIJobEnqueuedResponse,
    AIJobResponse,
    ActivitySummary,
    DailySummaryDetail,
    DailySummaryResponse,
    InsightResponse,
    RaceInfo,
    TodayResponse,
    WeeklyMileage,
)
from app import training_load
from app import plan_adaptation as plan_adaptation_mod
from app.routers._shared import _enrich_event_with_steps, _parse_date

router = APIRouter()


@router.get("/today", response_model=TodayResponse)
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

    # Readiness-driven plan adaptation suggestion for the selected day's plan day
    plan_day = (
        db.query(TrainingPlanDay)
        .filter(TrainingPlanDay.user_id == uid, TrainingPlanDay.day_date == selected)
        .first()
    )
    plan_adaptation = plan_adaptation_mod.suggest_adaptation(plan_day, readiness)
    if plan_adaptation is not None:
        dismissed = (
            db.query(SyncStatus)
            .filter(
                SyncStatus.user_id == uid,
                SyncStatus.key == f"plan_adaptation_dismissed:{plan_day.id}",
            )
            .first()
        )
        if dismissed:
            plan_adaptation = None

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
        plan_adaptation=plan_adaptation,
    )


# --- Daily Summaries ---

@router.get("/daily-summaries", response_model=list[DailySummaryResponse])
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


@router.get("/daily-summaries/{summary_id}", response_model=DailySummaryDetail)
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


# --- Insights ---

@router.get("/insights", response_model=list[InsightResponse])
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


# --- Sync trigger + job polling ---

@router.post("/sync/{sync_type}")
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


@router.get("/jobs/{job_id}", response_model=AIJobResponse)
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
