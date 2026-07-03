"""The AIJob durable queue and its job handlers (activity/daily insights).

``db_session()`` opens, the ``_call_ai`` provider dispatch, and execute_job's
dispatch to analyze_activity_force/analyze_activity_with_feedback/
generate_training_plan/weekly_review are routed through the ``app.ai_coach``
shim rather than called as bare names. Tests monkeypatch these on
``app.ai_coach`` (e.g. ``patch_db_session(ai_coach)``,
``monkeypatch.setattr(ai_coach, "generate_training_plan", ...)``); a bare
in-module call would resolve against this module's own globals and silently
ignore that patch.
"""
import json
import logging
from datetime import datetime, timezone, timedelta

from app.models import (
    DEFAULT_USER_ID,
    Activity,
    DailySummary,
    GarminCalendarEvent,
    Insight,
)
from app import adherence as adherence_mod
from app.coach.context import (
    _build_context,
    _format_activity_context,
    _format_daily_context,
    _load_zones,
    _load_zone_configs,
)
from app.coach.providers import AITransientError, AIFatalError

logger = logging.getLogger(__name__)


def enqueue_job(task_type: str, payload: dict, user_id: int) -> int:
    """Persist a pending AIJob and return its id.

    Called from API request handlers to hand off AI work to the background
    worker instead of blocking the request or spawning a daemon thread.
    """
    from app import ai_coach as _shim
    from app.models import AIJob

    job = AIJob(
        user_id=user_id,
        task_type=task_type,
        payload_json=json.dumps(payload),
        status="pending",
        attempts=0,
        max_attempts=3,
    )
    with _shim.db_session() as db:
        db.add(job)
        db.commit()
        db.refresh(job)
        return job.id


def execute_job(job_id: int) -> None:
    """Claim and execute a single AIJob. Called by the APScheduler worker.

    Atomically marks the job running, dispatches to the appropriate AI
    function, then records done or schedules a retry (up to max_attempts).
    """
    from app import ai_coach as _shim
    from app.models import AIJob

    with _shim.db_session() as db:
        job = db.query(AIJob).filter(AIJob.id == job_id).first()
        if job is None or job.status not in ("pending",):
            return
        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        job.attempts += 1
        db.commit()
        task_type = job.task_type
        payload = json.loads(job.payload_json or "{}")
        attempts = job.attempts
        max_attempts = job.max_attempts
        user_id = job.user_id

    try:
        if task_type == "analyze_activity":
            _shim.analyze_activity_force(payload["activity_id"])
        elif task_type == "analyze_feedback":
            _shim.analyze_activity_with_feedback(payload["activity_id"])
        elif task_type == "generate_plan":
            _shim.generate_training_plan(user_id=user_id, note=payload.get("note"))
        elif task_type == "weekly_review":
            _shim.weekly_review(user_id=user_id)
        else:
            raise ValueError(f"Unknown task_type: {task_type!r}")

        with _shim.db_session() as db:
            job = db.query(AIJob).filter(AIJob.id == job_id).first()
            if job:
                job.status = "done"
                job.completed_at = datetime.now(timezone.utc)
                db.commit()
    except Exception as exc:
        logger.exception("Job %s (%s) failed on attempt %s/%s", job_id, task_type, attempts, max_attempts)
        with _shim.db_session() as db:
            job = db.query(AIJob).filter(AIJob.id == job_id).first()
            if job:
                job.error_message = str(exc)[:1000]
                job.completed_at = datetime.now(timezone.utc)
                job.status = "failed" if attempts >= max_attempts else "pending"
                db.commit()


def analyze_activity(activity: Activity):
    """Generate AI insight for a new activity."""
    from app import ai_coach as _shim

    user_id = activity.user_id or DEFAULT_USER_ID
    with _shim.db_session() as db:
        try:
            activity_date = activity.started_at.date() if isinstance(activity.started_at, datetime) else activity.started_at
            zones_by_metric = _load_zones(db)
            zc = _load_zone_configs(db, user_id)
            activity_context = _format_activity_context(
                activity, zones_by_metric,
                hr_zone_configs=zc["hr"], pace_zone_configs=zc["pace"],
                threshold_hr=zc["threshold_hr"], threshold_pace=zc["threshold_pace"],
            )

            # Append workout adherence section if a workout was scheduled for this date
            workout_event = (
                db.query(GarminCalendarEvent)
                .filter(
                    GarminCalendarEvent.user_id == user_id,
                    GarminCalendarEvent.date == activity_date,
                    GarminCalendarEvent.event_type == "workout",
                )
                .first()
            )
            if workout_event and workout_event.raw_json:
                workout_steps = adherence_mod.parse_workout_steps(workout_event.raw_json)
                adherence_result = adherence_mod.compute_adherence(activity, workout_steps)
                if adherence_result:
                    activity_context += "\n\n" + adherence_mod.format_adherence_context(adherence_result)

            full_context = _build_context(
                db, "activity", activity_context, reference_date=activity_date, user_id=user_id
            )
            content, summary, category = _shim._call_ai(db, full_context, "activity", user_id)

            insight = Insight(
                user_id=user_id,
                created_at=datetime.now(timezone.utc),
                trigger_type="activity",
                trigger_id=activity.id,
                content=content,
                summary=summary,
                category=category,
            )
            db.add(insight)

            db_activity = db.query(Activity).get(activity.id)
            if db_activity:
                db_activity.ai_analyzed = True

            db.commit()
            logger.info("AI analysis complete for activity %s: %s", activity.id, summary[:80])
        except Exception:
            logger.exception("AI analysis failed for activity %s", activity.id)


def analyze_daily_summary(daily: DailySummary):
    """Generate AI insight for a daily summary."""
    from app import ai_coach as _shim

    user_id = daily.user_id or DEFAULT_USER_ID
    with _shim.db_session() as db:
        try:
            daily_context = _format_daily_context(daily)
            full_context = _build_context(
                db, "daily_summary", daily_context, reference_date=daily.date, user_id=user_id
            )
            content, summary, category = _shim._call_ai(db, full_context, "daily_summary", user_id)

            insight = Insight(
                user_id=user_id,
                created_at=datetime.now(timezone.utc),
                trigger_type="daily_summary",
                trigger_id=daily.id,
                content=content,
                summary=summary,
                category=category,
            )
            db.add(insight)

            db_daily = db.query(DailySummary).get(daily.id)
            if db_daily:
                db_daily.ai_analyzed = True

            db.commit()
            logger.info("AI analysis complete for daily summary %s: %s", daily.date, summary[:80])
        except Exception:
            logger.exception("AI analysis failed for daily summary %s", daily.id)


def analyze_activity_force(activity_id: int):
    """Generate AI insight for an activity, replacing any existing insight."""
    from app import ai_coach as _shim

    with _shim.db_session() as db:
        try:
            activity = db.query(Activity).get(activity_id)
            if not activity:
                logger.warning("Activity %s not found for re-analysis", activity_id)
                return
            user_id = activity.user_id or DEFAULT_USER_ID

            # Delete existing insight for this activity
            db.query(Insight).filter(
                Insight.user_id == user_id,
                Insight.trigger_type == "activity",
                Insight.trigger_id == activity.id,
            ).delete()

            activity_date = activity.started_at.date() if isinstance(activity.started_at, datetime) else activity.started_at
            zones_by_metric = _load_zones(db)
            zc = _load_zone_configs(db, user_id)
            activity_context = _format_activity_context(
                activity, zones_by_metric,
                hr_zone_configs=zc["hr"], pace_zone_configs=zc["pace"],
                threshold_hr=zc["threshold_hr"], threshold_pace=zc["threshold_pace"],
            )
            full_context = _build_context(
                db, "activity", activity_context, reference_date=activity_date, user_id=user_id
            )
            content, summary, category = _shim._call_ai(db, full_context, "activity", user_id)

            insight = Insight(
                user_id=user_id,
                created_at=datetime.now(timezone.utc),
                trigger_type="activity",
                trigger_id=activity.id,
                content=content,
                summary=summary,
                category=category,
            )
            db.add(insight)
            activity.ai_analyzed = True
            db.commit()
            logger.info("AI re-analysis complete for activity %s: %s", activity.id, summary[:80])
        except Exception as exc:
            logger.exception("AI re-analysis failed for activity %s", activity_id)
            _shim._save_error_insight(activity_id, exc, _shim._activity_user_id(activity_id))


def analyze_activity_with_feedback(activity_id: int):
    """Generate AI insight for an activity, incorporating user feedback."""
    from app import ai_coach as _shim

    with _shim.db_session() as db:
        try:
            activity = db.query(Activity).get(activity_id)
            if not activity:
                logger.warning("Activity %s not found for feedback analysis", activity_id)
                return
            user_id = activity.user_id or DEFAULT_USER_ID

            # Delete existing insight for this activity
            db.query(Insight).filter(
                Insight.user_id == user_id,
                Insight.trigger_type == "activity",
                Insight.trigger_id == activity.id,
            ).delete()

            zones_by_metric = _load_zones(db)
            zc = _load_zone_configs(db, user_id)
            activity_context = _format_activity_context(
                activity, zones_by_metric,
                hr_zone_configs=zc["hr"], pace_zone_configs=zc["pace"],
                threshold_hr=zc["threshold_hr"], threshold_pace=zc["threshold_pace"],
            )

            # Append user feedback to context
            feedback_parts = []
            if activity.feedback_rating == "good":
                feedback_parts.append("The runner reported this workout went well.")
            elif activity.feedback_rating == "bad":
                feedback_parts.append("The runner reported issues with this workout.")
                if activity.feedback_tags:
                    try:
                        tags = json.loads(activity.feedback_tags)
                        if tags:
                            feedback_parts.append(f"Issues reported: {', '.join(tags)}")
                    except (json.JSONDecodeError, TypeError):
                        pass
                if activity.feedback_text:
                    feedback_parts.append(f'Additional comments: "{activity.feedback_text}"')

            if feedback_parts:
                activity_context += "\n\n## User Feedback\n" + "\n".join(feedback_parts)

            activity_date = activity.started_at.date() if isinstance(activity.started_at, datetime) else activity.started_at
            full_context = _build_context(
                db, "activity", activity_context, reference_date=activity_date, user_id=user_id
            )
            content, summary, category = _shim._call_ai(db, full_context, "activity", user_id)

            insight = Insight(
                user_id=user_id,
                created_at=datetime.now(timezone.utc),
                trigger_type="activity",
                trigger_id=activity.id,
                content=content,
                summary=summary,
                category=category,
            )
            db.add(insight)
            activity.ai_analyzed = True
            db.commit()
            logger.info("AI feedback analysis complete for activity %s: %s", activity.id, summary[:80])
        except Exception as exc:
            logger.exception("AI feedback analysis failed for activity %s", activity_id)
            _shim._save_error_insight(activity_id, exc, _shim._activity_user_id(activity_id))


def backfill_missing_insights(user_id: int = DEFAULT_USER_ID):
    """Analyze past 7 days of activities and daily summaries that lack insights."""
    from app import ai_coach as _shim

    with _shim.db_session() as db:
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)

        # Activities in past 7 days without insights
        activities = (
            db.query(Activity)
            .filter(
                Activity.user_id == user_id,
                Activity.started_at >= cutoff,
                Activity.ai_analyzed == False,
            )
            .order_by(Activity.started_at.asc())
            .all()
        )
        logger.info("Backfilling insights for %d activities", len(activities))
        for activity in activities:
            try:
                analyze_activity(activity)
            except Exception:
                logger.exception("Insight backfill failed for activity %s", activity.id)

        # Daily summaries in past 7 days without insights
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=7)).date()
        summaries = (
            db.query(DailySummary)
            .filter(
                DailySummary.user_id == user_id,
                DailySummary.date >= cutoff_date,
                DailySummary.ai_analyzed == False,
            )
            .order_by(DailySummary.date.asc())
            .all()
        )
        logger.info("Backfilling insights for %d daily summaries", len(summaries))
        for summary in summaries:
            try:
                analyze_daily_summary(summary)
            except Exception:
                logger.exception("Insight backfill failed for daily summary %s", summary.id)

        logger.info("Insight backfill complete")


def _activity_user_id(activity_id: int) -> int:
    """Best-effort lookup of an activity's owner (for error-path insight writes)."""
    from app import ai_coach as _shim

    try:
        with _shim.db_session() as db:
            row = db.query(Activity.user_id).filter(Activity.id == activity_id).first()
            return (row[0] if row and row[0] else DEFAULT_USER_ID)
    except Exception:
        return DEFAULT_USER_ID


def _save_error_insight(
    activity_id: int, exc: Exception, user_id: int = DEFAULT_USER_ID
) -> None:
    """Persist a failure insight so the UI can show an error and allow retry."""
    from app import ai_coach as _shim

    if isinstance(exc, AITransientError):
        content = (
            "**Analysis temporarily unavailable**\n\n"
            "The AI service returned a rate-limit or server error after multiple retries. "
            "This is usually short-lived — use **Re-analyze** to try again in a moment."
        )
        summary = "AI service temporarily unavailable — use Re-analyze to retry"
    elif isinstance(exc, AIFatalError):
        content = (
            "**Analysis configuration error**\n\n"
            "The AI request was rejected due to a credential or model error. "
            "Check your API key and model selection in **Settings**, then use **Re-analyze**."
        )
        summary = "AI configuration error — check Settings and use Re-analyze"
    else:
        content = (
            "**Analysis failed unexpectedly**\n\n"
            "An unexpected error occurred. Use **Re-analyze** to retry, "
            "or check Settings if the problem persists."
        )
        summary = "Analysis failed — use Re-analyze to retry"
    try:
        with _shim.db_session() as db:
            db.query(Insight).filter(
                Insight.user_id == user_id,
                Insight.trigger_type == "activity",
                Insight.trigger_id == activity_id,
            ).delete()
            db.add(Insight(
                user_id=user_id,
                created_at=datetime.now(timezone.utc),
                trigger_type="activity",
                trigger_id=activity_id,
                content=content,
                summary=summary,
                category="recommendation",
            ))
            db.commit()
    except Exception:
        logger.exception("Failed to save error insight for activity %s", activity_id)
