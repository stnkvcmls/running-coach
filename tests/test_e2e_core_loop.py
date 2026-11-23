"""End-to-end tests of the core coaching loop (T1).

Exercises the real FastAPI endpoints, real SQLite DB, and real AI job pipeline
with only the outermost provider seams mocked.
"""
from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

import anthropic

from app import ai_coach
from app import database as database_mod
from app.coach import plans as plans_mod
from app.coach.providers import AITransientError
from app.models import AIJob, ChatMessage, TrainingPlan, TrainingPlanDay, User


def _resolve_user_id(client, db) -> int:
    resp = client.get("/api/v1/me")
    assert resp.status_code == 200
    user = db.query(User).order_by(User.id.asc()).first()
    assert user is not None
    return user.id


def _build_plan_dict(week_start: date, override_date: date, override_type: str) -> dict:
    weeks = []
    for w in range(4):
        days = []
        for d in range(7):
            day = week_start + timedelta(days=w * 7 + d)
            wtype = override_type if day == override_date else "easy"
            days.append({
                "date": day.isoformat(),
                "day_of_week": day.strftime("%A"),
                "workout_type": wtype,
                "target_distance_km": None if wtype == "rest" else 8.0,
                "target_pace_display": None if wtype == "rest" else "5:30/km",
                "description": "Rest day" if wtype == "rest" else "Easy aerobic run",
                "notes": None,
                "routine_id": None,
            })
        weeks.append({"week_number": w + 1, "theme": "Base", "notes": "Build steadily", "days": days})
    return {"phase": "base", "overview": "Freshly regenerated plan.", "weeks": weeks}


def test_e2e_plan_regeneration_updates_today_and_training_plan(
    client, db, patch_db_session, monkeypatch
):
    """Regenerating a plan via the real job path makes /today and /training-plan agree."""
    patch_db_session(ai_coach)
    uid = _resolve_user_id(client, db)

    week_start = plans_mod._next_monday(date.today())
    target_day = week_start + timedelta(days=2)

    # Seed an older plan where target_day is an "easy" run.
    old_plan = TrainingPlan(
        user_id=uid,
        generated_at=datetime.now(timezone.utc) - timedelta(days=7),
        week_start=week_start,
        plan_weeks=4,
        phase="build",
        overview="Old plan",
    )
    db.add(old_plan)
    db.flush()
    old_day = TrainingPlanDay(
        user_id=uid,
        plan_id=old_plan.id,
        day_date=target_day,
        day_of_week=target_day.strftime("%A"),
        week_number=1,
        workout_type="easy",
        target_distance_m=8000,
        description="Old easy run",
    )
    db.add(old_day)
    db.commit()
    db.refresh(old_day)

    # Mock only the outermost Anthropic SDK client so the real generate_training_plan runs.
    new_plan_dict = _build_plan_dict(week_start, override_date=target_day, override_type="rest")
    tool_block = SimpleNamespace(type="tool_use", name="generate_plan", input=new_plan_dict)
    fake_client = MagicMock()
    fake_client.messages.create.return_value = SimpleNamespace(content=[tool_block])
    monkeypatch.setattr(anthropic, "Anthropic", lambda **kw: fake_client)

    job_id = ai_coach.enqueue_job("generate_plan", {}, uid)
    claimed = ai_coach._claim_pending_jobs(limit=5)
    assert [c["job_id"] for c in claimed] == [job_id]
    ai_coach._run_claimed_job(claimed[0])

    db.expire_all()
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    assert job is not None
    assert job.status == "done"

    today_resp = client.get(f"/api/v1/today?date={target_day.isoformat()}")
    assert today_resp.status_code == 200
    today_plan_day_id = today_resp.json()["plan_day_id"]
    assert today_plan_day_id is not None
    assert today_plan_day_id != old_day.id

    plan_resp = client.get("/api/v1/training-plan")
    assert plan_resp.status_code == 200
    days_by_date = {
        day["day_date"]: day
        for week in plan_resp.json()["weeks"]
        for day in week["days"]
    }
    new_day = days_by_date[target_day.isoformat()]
    assert new_day["workout_type"] == "rest"
    assert today_plan_day_id == new_day["id"]


def test_e2e_transient_job_failure_surfaces_in_health_detail(
    client, db, patch_db_session, monkeypatch
):
    """Repeated AITransientError transitions a real job pending -> failed and surfaces in /health-detail."""
    patch_db_session(ai_coach)
    uid = _resolve_user_id(client, db)

    fake_client = MagicMock()
    fake_client.messages.create.side_effect = AITransientError("upstream 429")
    monkeypatch.setattr(anthropic, "Anthropic", lambda **kw: fake_client)
    monkeypatch.setattr(plans_mod.time, "sleep", lambda *_: None)

    job_id = ai_coach.enqueue_job("generate_plan", {}, uid)

    # First two attempts return the job to pending; third exhausts max_attempts -> failed.
    for expected_attempt, expected_status in [(1, "pending"), (2, "pending"), (3, "failed")]:
        claimed = ai_coach._claim_pending_jobs(limit=5)
        assert [c["job_id"] for c in claimed] == [job_id]
        ai_coach._run_claimed_job(claimed[0])
        db.expire_all()
        job = db.query(AIJob).filter(AIJob.id == job_id).first()
        assert job.attempts == expected_attempt
        assert job.status == expected_status

    health_resp = client.get("/api/v1/health-detail")
    assert health_resp.status_code == 200
    failed_jobs = health_resp.json()["recent_failed_jobs"]
    assert any(j["id"] == job_id and j["status"] == "failed" for j in failed_jobs)


def test_e2e_chat_continuity_sends_newest_messages(
    client, db, patch_db_session, monkeypatch
):
    """POST /api/v1/chat sends the newest 20 prior messages (ending at 29th/30th), oldest-first."""
    patch_db_session(database_mod)
    uid = _resolve_user_id(client, db)

    base = datetime(2026, 6, 1, 9, 0, tzinfo=timezone.utc)
    for i in range(1, 31):
        db.add(ChatMessage(
            user_id=uid,
            role="user" if i % 2 == 1 else "assistant",
            content=f"msg-{i}",
            created_at=base + timedelta(minutes=i),
        ))
    db.commit()

    captured: dict = {}

    def fake_chat_stream(session, new_message, history, user_id, activity_id):
        captured["new_message"] = new_message
        captured["history"] = history
        yield {"type": "token", "text": "Got it."}

    monkeypatch.setattr(ai_coach, "chat_stream", fake_chat_stream)

    resp = client.post("/api/v1/chat", json={"message": "msg-31"})
    assert resp.status_code == 200
    assert "[DONE]" in resp.text

    history_contents = [m["content"] for m in captured["history"]]
    assert len(history_contents) == 20
    assert history_contents[-2:] == ["msg-29", "msg-30"]
    assert history_contents[0] == "msg-11"
    assert "msg-1" not in history_contents
