"""Tests for the durable AI job queue (P2-1)."""
import json
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock

import pytest

from app.models import AIJob, Activity
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

    mock_fn.assert_called_once_with(user_id=1)
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
