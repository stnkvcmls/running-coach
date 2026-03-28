import logging
import os
import threading

from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import pytz

from app.config import settings
from app.database import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def _scheduled_activity_sync():
    """Scheduled job: sync activities, calendar, and trigger AI for new ones."""
    from app.garmin_sync import sync_activities, sync_calendar
    from app.ai_coach import analyze_activity

    new_activities = sync_activities()
    for activity in new_activities:
        try:
            analyze_activity(activity)
        except Exception:
            logger.exception("AI analysis failed for activity %s", activity.id)

    try:
        sync_calendar()
    except Exception:
        logger.exception("Calendar sync failed")


def _scheduled_daily_sync():
    """Scheduled job: sync daily summary and trigger AI."""
    from app.garmin_sync import sync_daily_summary
    from app.ai_coach import analyze_daily_summary

    summary = sync_daily_summary()
    if summary:
        try:
            analyze_daily_summary(summary)
        except Exception:
            logger.exception("AI analysis failed for daily summary %s", summary.id)


def _scheduled_weekly_review():
    """Scheduled job: weekly training review."""
    from app.ai_coach import weekly_review

    weekly_review()


def _run_backfill():
    """Run historical backfill in a background thread."""
    from app.garmin_sync import backfill_activities, backfill_daily_summaries
    from app.ai_coach import weekly_review, backfill_missing_insights

    logger.info("Starting historical backfill...")
    backfill_activities()
    backfill_daily_summaries()
    logger.info("Backfill complete. Generating initial training summary...")
    try:
        weekly_review()
    except Exception:
        logger.exception("Initial weekly review failed")
    logger.info("Backfilling missing AI insights for recent data...")
    try:
        backfill_missing_insights()
    except Exception:
        logger.exception("Insight backfill failed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    os.makedirs(settings.garmin_token_dir, exist_ok=True)
    logger.info("Database initialized")

    tz = pytz.timezone(settings.timezone)

    # Schedule activity sync every N minutes
    scheduler.add_job(
        _scheduled_activity_sync,
        IntervalTrigger(minutes=settings.activity_poll_minutes),
        id="activity_sync",
        name="Activity Sync",
        replace_existing=True,
    )

    # Schedule daily summary sync at configured hour
    scheduler.add_job(
        _scheduled_daily_sync,
        CronTrigger(hour=settings.daily_sync_hour, minute=0, timezone=tz),
        id="daily_sync",
        name="Daily Summary Sync",
        replace_existing=True,
    )

    # Schedule weekly review on Sundays at 8am
    scheduler.add_job(
        _scheduled_weekly_review,
        CronTrigger(day_of_week="sun", hour=8, minute=0, timezone=tz),
        id="weekly_review",
        name="Weekly Review",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(
        "Scheduler started (activities every %dm, daily at %d:00 %s)",
        settings.activity_poll_minutes,
        settings.daily_sync_hour,
        settings.timezone,
    )

    # Run backfill in background thread to not block startup
    if settings.garmin_email and settings.garmin_password:
        backfill_thread = threading.Thread(target=_run_backfill, daemon=True)
        backfill_thread.start()

    yield

    # Shutdown
    scheduler.shutdown(wait=False)
    logger.info("Scheduler stopped")


app = FastAPI(title="Running Coach", lifespan=lifespan)

# Mount static files
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Mount React build assets if available
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.isdir(os.path.join(frontend_dist, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="react-assets")

# Import and mount API router
from app.api import api_router  # noqa: E402

app.include_router(api_router)

# Import HTML routes (legacy Jinja2 templates) under /legacy prefix
from app.routes import router  # noqa: E402

app.include_router(router, prefix="/legacy")


# SPA: serve React index.html for all non-API, non-static paths
from fastapi.responses import FileResponse  # noqa: E402


@app.get("/{full_path:path}", include_in_schema=False)
async def spa_catch_all(full_path: str):
    """Serve the React SPA for client-side routing."""
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path, media_type="text/html")
    # Fall back to 404 if React build not available
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Not found")
