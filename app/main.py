import ctypes
import logging
import os
import threading

from contextlib import asynccontextmanager

from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_EXECUTED
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

_libc = None


def _trim_memory():
    """Release freed heap pages back to the OS.

    Sync jobs allocate large, bursty stream/JSON buffers; glibc keeps the
    freed memory in its arenas rather than returning it, so RSS stays pinned
    at its high-water mark. Calling malloc_trim once the work is done lets the
    resident set fall back down after each peak. No-op on non-glibc platforms.
    """
    global _libc
    try:
        if _libc is None:
            _libc = ctypes.CDLL("libc.so.6")
        _libc.malloc_trim(0)
    except (OSError, AttributeError):
        pass


def _trim_after_job(_event):
    """APScheduler listener: trim memory after each job finishes."""
    _trim_memory()


def _scheduled_activity_sync():
    """Scheduled job: sync activities and calendar."""
    from app.garmin_sync import sync_activities, sync_calendar

    sync_activities()

    try:
        sync_calendar()
    except Exception:
        logger.exception("Calendar sync failed")


def _scheduled_daily_sync():
    """Scheduled job: sync daily summary and trigger AI."""
    from app.garmin_sync import sync_athlete_profile, sync_daily_summary
    from app.ai_coach import analyze_daily_summary

    try:
        sync_athlete_profile()
    except Exception:
        logger.exception("Athlete profile sync failed")

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


def _scheduled_plan_generation():
    """Scheduled job: regenerate the training plan each week."""
    from app.ai_coach import generate_training_plan

    generate_training_plan()


def _run_backfill():
    """Run historical backfill in a background thread."""
    from app.garmin_sync import backfill_activities, backfill_daily_summaries, sync_athlete_profile
    from app.ai_coach import weekly_review

    logger.info("Starting historical backfill...")
    try:
        sync_athlete_profile()
    except Exception:
        logger.exception("Athlete profile sync failed")
    backfill_activities()
    backfill_daily_summaries()
    logger.info("Backfill complete. Generating initial training summary...")
    try:
        weekly_review()
    except Exception:
        logger.exception("Initial weekly review failed")
    finally:
        # Backfill is the largest one-time allocation burst; hand the freed
        # pages back to the OS so startup RSS settles instead of staying high.
        _trim_memory()


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

    # Regenerate training plan on Sundays at 9am (after weekly review)
    scheduler.add_job(
        _scheduled_plan_generation,
        CronTrigger(day_of_week="sun", hour=9, minute=0, timezone=tz),
        id="plan_generation",
        name="Training Plan Generation",
        replace_existing=True,
    )

    scheduler.add_listener(_trim_after_job, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
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


# SPA: serve React index.html for all non-API, non-static paths
from fastapi.responses import FileResponse  # noqa: E402


@app.get("/{full_path:path}", include_in_schema=False)
async def spa_catch_all(full_path: str):
    """Serve the React SPA for client-side routing."""
    if full_path.startswith("api/") or full_path.startswith("static/") or full_path.startswith("assets/"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path, media_type="text/html")
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Not found")
