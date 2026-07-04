import ctypes
import logging
import os
import threading

from contextlib import asynccontextmanager
from datetime import date, timedelta

from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_EXECUTED
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import pytz

from app.config import settings
from app.database import db_session, init_db
from app.models import DailySummary, GarminCalendarEvent, SyncStatus, TrainingPlanDay, User

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

_LOOPBACK_HOSTS: frozenset[str] = frozenset({"127.0.0.1", "::1", "localhost"})


def _check_security_config() -> None:
    """Refuse to start when auth is disabled on a non-loopback bind address.

    Auth-disabled mode trusts a synthetic dev user for every request — anyone
    who can reach the socket gets full data access.  That is fine on loopback
    (only local processes can connect) but catastrophic on 0.0.0.0 or any
    public interface.  This guard fires once at startup so the unsafe
    combination is caught before the app ever accepts a request; set
    ALLOW_INSECURE_BIND=true to explicitly opt out (e.g. a trusted, firewalled
    private network) and downgrade this back to a warning.
    """
    if not settings.auth_enabled and settings.bind_host not in _LOOPBACK_HOSTS:
        logger.critical(
            "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n"
            "  SECURITY WARNING\n"
            "  auth_enabled=False  AND  bind_host=%r (non-loopback)\n"
            "  Every request is accepted without authentication.\n"
            "  All user data is publicly readable and writable.\n"
            "  Set AUTH_ENABLED=true (with Cloudflare Access) or restrict\n"
            "  BIND_HOST to 127.0.0.1 before exposing this instance.\n"
            "  Refusing to start. Set ALLOW_INSECURE_BIND=true to override.\n"
            "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
            settings.bind_host,
        )
        if not settings.allow_insecure_bind:
            raise RuntimeError(
                f"Refusing to start: auth_enabled=False and bind_host={settings.bind_host!r} "
                "(non-loopback). Set AUTH_ENABLED=true or BIND_HOST=127.0.0.1, or set "
                "ALLOW_INSECURE_BIND=true to override."
            )

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


def _iter_garmin_users() -> list[User]:
    """Return all users with a Garmin connection, scoped for per-user sync.

    Excludes users flagged ``garmin_needs_reauth`` — a cron can't answer their
    MFA prompt, so they're skipped until they reconnect from Settings. Returned
    objects are detached but carry the id + credential fields the sync path
    needs (no further DB access required).
    """
    with db_session() as db:
        users = (
            db.query(User)
            .filter(
                User.garmin_email.isnot(None),
                User.garmin_needs_reauth == False,  # noqa: E712
            )
            .all()
        )
        for u in users:
            db.expunge(u)
        return users


def _authenticate_or_flag(user: User) -> bool:
    """Verify a user's Garmin client authenticates; flag for re-auth if not.

    A cron can't satisfy an interactive MFA prompt, so when a user's tokens are
    gone/expired and login fails we mark them ``needs_reauth`` and skip — the
    Settings UI surfaces a Reconnect action. Returns True when authenticated.
    """
    from app.garmin_sync import get_garmin_client, mark_garmin_needs_reauth

    try:
        get_garmin_client(user)
        return True
    except Exception:
        logger.exception("Garmin auth failed for user %s; flagging needs_reauth", user.id)
        mark_garmin_needs_reauth(user.id, True)
        return False


def run_activity_sync_for_user(user_id: int) -> None:
    """Sync one user's activities + calendar (used by the API manual trigger)."""
    from app.garmin_sync import sync_activities, sync_calendar

    with db_session() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            return
        db.expunge(user)

    if not _authenticate_or_flag(user):
        return
    sync_activities(user)
    try:
        sync_calendar(user)
    except Exception:
        logger.exception("Calendar sync failed for user %s", user_id)


def run_daily_sync_for_user(user_id: int) -> None:
    """Sync one user's rolling window of daily summaries and analyze today.

    Garmin attributes overnight metrics (sleep, HRV, resting HR) to the wake-up
    day, so we sync *today* to capture last night's data on the correct date, and
    re-sync the prior days in the window so their full-day totals finalize. AI
    analysis runs only on today's (newest) summary.
    """
    from app.garmin_sync import sync_athlete_profile, sync_daily_summary
    from app.ai_coach import analyze_daily_summary

    with db_session() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            return
        db.expunge(user)

    if not _authenticate_or_flag(user):
        return

    try:
        sync_athlete_profile(user)
    except Exception:
        logger.exception("Athlete profile sync failed for user %s", user_id)

    window = max(1, settings.daily_sync_window_days)
    today = date.today()
    today_summary = None
    for offset in range(window):
        target = today - timedelta(days=offset)
        summary = sync_daily_summary(target, user)
        if offset == 0:
            today_summary = summary

    if today_summary:
        try:
            analyze_daily_summary(today_summary)
        except Exception:
            logger.exception("AI analysis failed for daily summary %s", today_summary.id)

    try:
        _push_plan_adaptation_if_needed(user_id, today_summary)
    except Exception:
        logger.exception("Plan-adaptation push check failed for user %s", user_id)

    try:
        _push_race_week_reminders(user_id)
    except Exception:
        logger.exception("Race-week reminder push check failed for user %s", user_id)


def _push_plan_adaptation_if_needed(user_id: int, today_summary: DailySummary | None) -> None:
    """Push a readiness-driven plan-adaptation suggestion once per plan day.

    Mirrors the same computation ``GET /today`` does live (readiness x today's
    ``TrainingPlanDay``), but runs once during the morning sync so a downgrade
    suggestion reaches the athlete's phone before they open the app. Dedupes
    per plan day via ``SyncStatus`` so a later re-run of the daily sync (or a
    manual trigger) doesn't push the same suggestion twice.
    """
    from app import plan_adaptation as plan_adaptation_mod
    from app import training_load
    from app import notifications as notifications_mod

    if today_summary is None:
        return
    today = date.today()

    with db_session() as db:
        plan_day = (
            db.query(TrainingPlanDay)
            .filter(TrainingPlanDay.user_id == user_id, TrainingPlanDay.day_date == today)
            .first()
        )
        if plan_day is None:
            return

        dedup_key = f"push_sent:plan_adaptation:{plan_day.id}"
        already_sent = (
            db.query(SyncStatus)
            .filter(SyncStatus.user_id == user_id, SyncStatus.key == dedup_key)
            .first()
        )
        if already_sent:
            return

        current_load = training_load.current_load(db, as_of=today, user_id=user_id)
        rhr_cutoff = today - timedelta(days=7)
        recent_rhr = [
            row[0] for row in db.query(DailySummary.resting_hr)
            .filter(
                DailySummary.user_id == user_id,
                DailySummary.date >= rhr_cutoff,
                DailySummary.date < today,
                DailySummary.resting_hr.isnot(None),
            )
            .all()
        ]
        readiness = training_load.compute_readiness(today_summary, current_load, recent_rhr)
        suggestion = plan_adaptation_mod.suggest_adaptation(plan_day, readiness)
        if suggestion is None:
            return

        title = (
            "Consider easing off today" if suggestion.direction == "downgrade"
            else "You're primed for more today"
        )
        notifications_mod.notify(
            db, user_id, "plan_adaptation", title=title, body=suggestion.reason, url="/",
        )
        db.add(SyncStatus(user_id=user_id, key=dedup_key, value=today.isoformat()))
        db.commit()


def _push_race_week_reminders(user_id: int, days_out: int = 7) -> None:
    """Push a one-time reminder when a race lands exactly ``days_out`` days away.

    Reuses the same "next race" source as the Today dashboard (Garmin calendar
    race events); dedupes per calendar event via ``SyncStatus`` so a race only
    ever gets one reminder.
    """
    from app import notifications as notifications_mod

    target_date = date.today() + timedelta(days=days_out)
    with db_session() as db:
        races = (
            db.query(GarminCalendarEvent)
            .filter(
                GarminCalendarEvent.user_id == user_id,
                GarminCalendarEvent.event_type == "race",
                GarminCalendarEvent.date == target_date,
            )
            .all()
        )
        for race in races:
            dedup_key = f"push_sent:race_reminder:{race.id}"
            already_sent = (
                db.query(SyncStatus)
                .filter(SyncStatus.user_id == user_id, SyncStatus.key == dedup_key)
                .first()
            )
            if already_sent:
                continue
            notifications_mod.notify(
                db, user_id, "race_reminder",
                title="Race week!",
                body=f"{race.title or 'Your race'} is one week away ({race.date}).",
                url="/",
            )
            db.add(SyncStatus(user_id=user_id, key=dedup_key, value=date.today().isoformat()))
        db.commit()


def _scheduled_activity_sync():
    """Scheduled job: sync activities + calendar for every connected user."""
    for user in _iter_garmin_users():
        try:
            run_activity_sync_for_user(user.id)
        except Exception:
            logger.exception("Activity sync failed for user %s", user.id)


def _scheduled_daily_sync():
    """Scheduled job: per-user rolling daily-summary sync + AI analysis."""
    for user in _iter_garmin_users():
        try:
            run_daily_sync_for_user(user.id)
        except Exception:
            logger.exception("Daily sync failed for user %s", user.id)


def _scheduled_weekly_review():
    """Scheduled job: weekly training review for every connected user."""
    from app.ai_coach import weekly_review

    for user in _iter_garmin_users():
        try:
            weekly_review(user_id=user.id)
        except Exception:
            logger.exception("Weekly review failed for user %s", user.id)


def _scheduled_plan_generation():
    """Scheduled job: regenerate the training plan for every connected user."""
    from app.ai_coach import generate_training_plan

    for user in _iter_garmin_users():
        try:
            generate_training_plan(user_id=user.id)
        except Exception:
            logger.exception("Plan generation failed for user %s", user.id)


def _worker_run_pending_jobs():
    """APScheduler job: claim and execute pending AIJobs.

    Picks up at most 5 pending jobs per poll cycle (oldest first) and runs
    them synchronously in the scheduler thread. Each job atomically transitions
    pending → running → done|failed, with retries up to max_attempts.
    """
    from app.ai_coach import execute_job
    from app.models import AIJob

    with db_session() as db:
        pending = (
            db.query(AIJob)
            .filter(
                AIJob.status == "pending",
                AIJob.attempts < AIJob.max_attempts,
            )
            .order_by(AIJob.created_at)
            .limit(5)
            .all()
        )
        job_ids = [j.id for j in pending]

    for job_id in job_ids:
        try:
            execute_job(job_id)
        except Exception:
            logger.exception("Worker: unexpected error executing job %s", job_id)


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
    _check_security_config()
    init_db()
    os.makedirs(settings.garmin_token_dir, exist_ok=True)
    # Seed user #1 from env GARMIN_EMAIL/PASSWORD and migrate the flat token dir
    # into the per-user layout ({garmin_token_dir}/{user_id}/). Idempotent.
    from app.garmin_sync import seed_bootstrap_user
    try:
        seed_bootstrap_user()
    except Exception:
        logger.exception("Bootstrap user seeding failed")
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

    # Poll the AI job ledger every 30 seconds and execute pending jobs
    scheduler.add_job(
        _worker_run_pending_jobs,
        IntervalTrigger(seconds=30),
        id="ai_job_worker",
        name="AI Job Worker",
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
