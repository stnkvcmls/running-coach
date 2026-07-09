"""Tests for the durable AI job queue (P2-1) and worker concurrency (P3-2)."""
import json
import threading
import time
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock

import pytest

from app.models import AIJob, Activity, TrainingPlan, TrainingPlanDay
from app.ai_coach import enqueue_job, execute_job


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_activity(db, user_id=1):
    act = Activity(
        user_id=user_id,
        garmin_id=123456,
        activity_type="running",
        name="Test Run",
        started_at=datetime(2026, 6, 1, 7, 0),
        duration_sec=3600,
        distance_m=10000,
    )
    db.add(act)
    db.commit()
    db.refresh(act)
    return act


# ---------------------------------------------------------------------------
# enqueue_job
# ---------------------------------------------------------------------------

def test_enqueue_job_creates_pending_row(db, patch_db_session):
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    job_id = enqueue_job("analyze_activity", {"activity_id": 99}, user_id=1)

    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    assert job is not None
    assert job.status == "pending"
    assert job.task_type == "analyze_activity"
    assert json.loads(job.payload_json) == {"activity_id": 99}
    assert job.attempts == 0
    assert job.max_attempts == 3
    assert job.user_id == 1


def test_enqueue_job_returns_integer_id(db, patch_db_session):
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    job_id = enqueue_job("generate_plan", {}, user_id=2)
    assert isinstance(job_id, int)
    assert job_id > 0


# ---------------------------------------------------------------------------
# execute_job — dispatch routing
# ---------------------------------------------------------------------------

def test_execute_job_dispatches_analyze_activity(db, patch_db_session):
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    act = _make_activity(db)
    job_id = enqueue_job("analyze_activity", {"activity_id": act.id}, user_id=1)

    with patch.object(ai_mod, "analyze_activity_force") as mock_fn:
        execute_job(job_id)

    mock_fn.assert_called_once_with(act.id)
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    assert job.status == "done"
    assert job.attempts == 1
    assert job.completed_at is not None


def test_execute_job_dispatches_analyze_feedback(db, patch_db_session):
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    act = _make_activity(db)
    job_id = enqueue_job("analyze_feedback", {"activity_id": act.id}, user_id=1)

    with patch.object(ai_mod, "analyze_activity_with_feedback") as mock_fn:
        execute_job(job_id)

    mock_fn.assert_called_once_with(act.id)
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    assert job.status == "done"


def test_execute_job_dispatches_generate_plan(db, patch_db_session):
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    job_id = enqueue_job("generate_plan", {}, user_id=1)

    with patch.object(ai_mod, "generate_training_plan") as mock_fn:
        execute_job(job_id)

    mock_fn.assert_called_once_with(user_id=1, note=None)
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    assert job.status == "done"


def test_execute_job_dispatches_generate_plan_with_note(db, patch_db_session):
    """A note in the job payload (e.g. from the chat adjust_upcoming_week tool) is threaded through."""
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    job_id = enqueue_job("generate_plan", {"note": "travelling next week"}, user_id=1)

    with patch.object(ai_mod, "generate_training_plan") as mock_fn:
        execute_job(job_id)

    mock_fn.assert_called_once_with(user_id=1, note="travelling next week")
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    assert job.status == "done"


def test_execute_job_dispatches_weekly_review(db, patch_db_session):
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    job_id = enqueue_job("weekly_review", {}, user_id=5)

    with patch.object(ai_mod, "weekly_review") as mock_fn:
        execute_job(job_id)

    mock_fn.assert_called_once_with(user_id=5)
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    assert job.status == "done"


def test_execute_job_dispatches_generate_briefing(db, patch_db_session):
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    job_id = enqueue_job("generate_briefing", {"plan_day_id": 42}, user_id=1)

    with patch.object(ai_mod, "generate_briefing") as mock_fn:
        execute_job(job_id)

    mock_fn.assert_called_once_with(42)
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    assert job.status == "done"


# ---------------------------------------------------------------------------
# execute_job — retry and failure logic
# ---------------------------------------------------------------------------

def test_execute_job_marks_pending_on_first_failure(db, patch_db_session):
    """A job that fails before max_attempts should become pending for retry."""
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    job_id = enqueue_job("generate_plan", {}, user_id=1)

    with patch.object(ai_mod, "generate_training_plan", side_effect=RuntimeError("timeout")):
        execute_job(job_id)

    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    assert job.status == "pending"   # retry eligible
    assert job.attempts == 1
    assert "timeout" in job.error_message


def test_execute_job_marks_failed_when_max_attempts_reached(db, patch_db_session):
    """A job that exhausts all retries should be permanently failed."""
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    job_id = enqueue_job("generate_plan", {}, user_id=1)

    # Exhaust all 3 attempts
    for _ in range(3):
        with patch.object(ai_mod, "generate_training_plan", side_effect=RuntimeError("boom")):
            execute_job(job_id)
        db.expire_all()  # refresh from DB between attempts

    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    assert job.status == "failed"
    assert job.attempts == 3


def test_execute_job_failed_pushes_system_health_notification(db, patch_db_session, monkeypatch):
    """Exhausting retries (P3-4) should push a system_health alert exactly once."""
    import app.ai_coach as ai_mod
    from app import notifications as notifications_mod

    patch_db_session(ai_mod)
    notify = MagicMock()
    monkeypatch.setattr(notifications_mod, "notify", notify)

    job_id = enqueue_job("generate_plan", {}, user_id=1)

    for _ in range(3):
        with patch.object(ai_mod, "generate_training_plan", side_effect=RuntimeError("boom")):
            execute_job(job_id)
        db.expire_all()

    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    assert job.status == "failed"
    notify.assert_called_once()
    assert notify.call_args.args[1] == 1
    assert notify.call_args.args[2] == "system_health"


def test_execute_job_pending_retry_does_not_push_notification(db, patch_db_session, monkeypatch):
    """A retry-eligible failure (attempts < max_attempts) should not alert yet."""
    import app.ai_coach as ai_mod
    from app import notifications as notifications_mod

    patch_db_session(ai_mod)
    notify = MagicMock()
    monkeypatch.setattr(notifications_mod, "notify", notify)

    job_id = enqueue_job("generate_plan", {}, user_id=1)
    with patch.object(ai_mod, "generate_training_plan", side_effect=RuntimeError("timeout")):
        execute_job(job_id)

    notify.assert_not_called()


def test_execute_job_ignores_already_running_or_done_job(db, patch_db_session):
    """execute_job is a no-op for jobs not in 'pending' status."""
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    job_id = enqueue_job("generate_plan", {}, user_id=1)

    # Mark it done manually
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    job.status = "done"
    db.commit()

    with patch.object(ai_mod, "generate_training_plan") as mock_fn:
        execute_job(job_id)

    mock_fn.assert_not_called()


def test_execute_job_raises_on_unknown_task_type(db, patch_db_session):
    """An unknown task_type should be marked failed immediately."""
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    job_id = enqueue_job("unknown_type", {}, user_id=1)
    # Force attempts to max so it hits 'failed' on first error
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    job.attempts = 2  # next attempt = 3 = max_attempts
    db.commit()

    execute_job(job_id)

    db.expire_all()
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    assert job.status == "failed"
    assert "unknown_type" in job.error_message.lower()


# ---------------------------------------------------------------------------
# _claim_pending_jobs — atomic batch claim (P3-2)
# ---------------------------------------------------------------------------

def test_claim_pending_jobs_marks_running_and_returns_dispatch_fields(db, patch_db_session):
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    job_id = enqueue_job("generate_plan", {"note": "hi"}, user_id=7)

    claimed = ai_mod._claim_pending_jobs(limit=5)

    assert len(claimed) == 1
    assert claimed[0] == {
        "job_id": job_id,
        "task_type": "generate_plan",
        "payload": {"note": "hi"},
        "attempts": 1,
        "max_attempts": 3,
        "user_id": 7,
    }
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    assert job.status == "running"
    assert job.started_at is not None


def test_claim_pending_jobs_respects_limit_and_ordering(db, patch_db_session):
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    ids = [enqueue_job("weekly_review", {}, user_id=1) for _ in range(4)]

    claimed = ai_mod._claim_pending_jobs(limit=2)

    assert [c["job_id"] for c in claimed] == ids[:2]
    statuses = {
        job_id: db.query(AIJob).filter(AIJob.id == job_id).first().status
        for job_id in ids
    }
    assert statuses[ids[0]] == "running"
    assert statuses[ids[1]] == "running"
    assert statuses[ids[2]] == "pending"
    assert statuses[ids[3]] == "pending"


def test_claim_pending_jobs_skips_already_running_and_exhausted(db, patch_db_session):
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    running_id = enqueue_job("weekly_review", {}, user_id=1)
    running_job = db.query(AIJob).filter(AIJob.id == running_id).first()
    running_job.status = "running"

    exhausted_id = enqueue_job("weekly_review", {}, user_id=1)
    exhausted_job = db.query(AIJob).filter(AIJob.id == exhausted_id).first()
    exhausted_job.attempts = 3  # == max_attempts, not retry-eligible
    db.commit()

    claimed = ai_mod._claim_pending_jobs(limit=5)

    assert claimed == []


# ---------------------------------------------------------------------------
# app.main._worker_run_pending_jobs — pool concurrency & per-job timeout (P3-2)
# ---------------------------------------------------------------------------

def test_worker_runs_claimed_jobs_concurrently(db, patch_db_session):
    """Two claimed jobs must actually run in parallel on the pool.

    Both dispatch calls rendezvous on a 2-party barrier. If the worker still
    ran them one at a time (the pre-P3-2 behavior), the first call would
    block on the barrier waiting for a second party that never arrives until
    it returns -- so it would time out and fail. Passing proves concurrency.
    """
    import app.ai_coach as ai_mod
    import app.main as main_mod
    patch_db_session(ai_mod)

    barrier = threading.Barrier(2, timeout=5)

    def blocking_review(**kwargs):
        barrier.wait()

    job1 = enqueue_job("weekly_review", {}, user_id=1)
    job2 = enqueue_job("weekly_review", {}, user_id=2)

    with patch.object(ai_mod, "weekly_review", side_effect=blocking_review):
        main_mod._worker_run_pending_jobs()

    db.expire_all()
    assert db.query(AIJob).filter(AIJob.id == job1).first().status == "done"
    assert db.query(AIJob).filter(AIJob.id == job2).first().status == "done"


def test_worker_moves_on_after_job_timeout(db, patch_db_session, monkeypatch):
    """A job that runs past the per-job timeout doesn't block the worker.

    The worker should stop waiting on it (returning promptly) rather than
    blocking the scheduler thread for the job's full duration; the job then
    finishes on its own pool thread shortly after and records its outcome.
    """
    import app.ai_coach as ai_mod
    import app.main as main_mod
    patch_db_session(ai_mod)
    monkeypatch.setattr(ai_mod, "_JOB_TIMEOUT_SECONDS", 0.1)

    release = threading.Event()

    def slow_review(**kwargs):
        release.wait(timeout=5)

    job_id = enqueue_job("weekly_review", {}, user_id=1)

    with patch.object(ai_mod, "weekly_review", side_effect=slow_review):
        start = time.monotonic()
        main_mod._worker_run_pending_jobs()
        elapsed = time.monotonic() - start

    assert elapsed < 2.0  # bounded by the timeout, not the job's full duration

    db.expire_all()
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    assert job.status == "running"  # still in flight; worker didn't touch it

    release.set()
    time.sleep(0.3)  # let the pool thread finish and record its own outcome

    db.expire_all()
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    assert job.status == "done"


def test_worker_claims_before_dispatch_no_double_claim_across_polls(db, patch_db_session):
    """A second poll fired while jobs are still running must not re-claim them.

    Regression guard for the atomic-claim requirement: claiming happens
    entirely up front (before any dispatch), so a job already "running"
    can never be selected by a subsequent claim.
    """
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    job_id = enqueue_job("weekly_review", {}, user_id=1)

    first_claim = ai_mod._claim_pending_jobs(limit=5)
    assert [c["job_id"] for c in first_claim] == [job_id]

    second_claim = ai_mod._claim_pending_jobs(limit=5)
    assert second_claim == []


# ---------------------------------------------------------------------------
# API endpoint: GET /jobs/{id}
# ---------------------------------------------------------------------------

def test_api_get_job_returns_status(client, db):
    job = AIJob(
        user_id=1,
        task_type="analyze_activity",
        payload_json='{"activity_id": 1}',
        status="pending",
        attempts=0,
        max_attempts=3,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    resp = client.get(f"/api/v1/jobs/{job.id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == job.id
    assert body["status"] == "pending"
    assert body["task_type"] == "analyze_activity"
    assert body["attempts"] == 0
    assert body["max_attempts"] == 3


def test_api_get_job_404_for_unknown(client):
    resp = client.get("/api/v1/jobs/99999")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# API endpoint: POST /jobs/{id}/retry (P3-4)
# ---------------------------------------------------------------------------

def test_api_retry_job_resets_failed_job_to_pending(client, db):
    job = AIJob(
        user_id=1, task_type="generate_plan", status="failed",
        attempts=3, max_attempts=3, error_message="boom",
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    resp = client.post(f"/api/v1/jobs/{job.id}/retry")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "pending"
    assert body["attempts"] == 0
    assert body["error_message"] is None

    db.expire_all()
    refreshed = db.query(AIJob).filter(AIJob.id == job.id).first()
    assert refreshed.status == "pending"
    assert refreshed.attempts == 0


def test_api_retry_job_404_for_unknown(client):
    resp = client.post("/api/v1/jobs/99999/retry")
    assert resp.status_code == 404


def test_api_retry_job_rejects_non_failed_job(client, db):
    job = AIJob(user_id=1, task_type="generate_plan", status="pending", attempts=0, max_attempts=3)
    db.add(job)
    db.commit()
    db.refresh(job)

    resp = client.post(f"/api/v1/jobs/{job.id}/retry")
    assert resp.status_code == 400


def test_api_retry_job_404_for_other_users_job(client, db):
    job = AIJob(user_id=2, task_type="generate_plan", status="failed", attempts=3, max_attempts=3)
    db.add(job)
    db.commit()
    db.refresh(job)

    resp = client.post(f"/api/v1/jobs/{job.id}/retry")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# API endpoint: POST /activities/{id}/analyze now returns job envelope
# ---------------------------------------------------------------------------

def test_api_analyze_returns_queued_job(client, db, patch_db_session):
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    act = _make_activity(db)
    resp = client.post(f"/api/v1/activities/{act.id}/analyze")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "queued"
    assert isinstance(body["job_id"], int)

    # Job row should exist in DB
    job = db.query(AIJob).filter(AIJob.id == body["job_id"]).first()
    assert job is not None
    assert job.task_type == "analyze_activity"
    assert json.loads(job.payload_json)["activity_id"] == act.id


# ---------------------------------------------------------------------------
# API endpoint: POST /training-plan/generate now returns job envelope
# ---------------------------------------------------------------------------

def test_api_generate_plan_returns_queued_job(client, db, patch_db_session):
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    resp = client.post("/api/v1/training-plan/generate")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "queued"
    assert isinstance(body["job_id"], int)

    job = db.query(AIJob).filter(AIJob.id == body["job_id"]).first()
    assert job is not None
    assert job.task_type == "generate_plan"


# ---------------------------------------------------------------------------
# API endpoint: POST /training-plan/days/{id}/briefing (P1-3)
# ---------------------------------------------------------------------------

def _make_plan_day(db, user_id=1):
    from datetime import date as _date
    plan = TrainingPlan(
        user_id=user_id,
        week_start=_date(2026, 7, 6),
        plan_weeks=4,
        phase="build",
    )
    db.add(plan)
    db.flush()
    plan_day = TrainingPlanDay(
        user_id=user_id,
        plan_id=plan.id,
        day_date=_date(2026, 7, 7),
        day_of_week="Tuesday",
        week_number=1,
        workout_type="easy",
        description="Easy run",
    )
    db.add(plan_day)
    db.commit()
    db.refresh(plan_day)
    return plan_day


def test_api_generate_briefing_returns_queued_job(client, db, patch_db_session):
    import app.ai_coach as ai_mod
    patch_db_session(ai_mod)

    plan_day = _make_plan_day(db)
    resp = client.post(f"/api/v1/training-plan/days/{plan_day.id}/briefing")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "queued"
    assert isinstance(body["job_id"], int)

    job = db.query(AIJob).filter(AIJob.id == body["job_id"]).first()
    assert job is not None
    assert job.task_type == "generate_briefing"
    assert json.loads(job.payload_json)["plan_day_id"] == plan_day.id


def test_api_generate_briefing_404_for_unknown_day(client):
    resp = client.post("/api/v1/training-plan/days/99999/briefing")
    assert resp.status_code == 404


def test_api_generate_briefing_404_for_other_users_day(client, db):
    plan_day = _make_plan_day(db, user_id=2)
    resp = client.post(f"/api/v1/training-plan/days/{plan_day.id}/briefing")
    assert resp.status_code == 404
