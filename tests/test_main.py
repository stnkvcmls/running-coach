from contextlib import contextmanager
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

import app.main as main


@pytest.fixture(autouse=True)
def _clear_garmin_cooldown_state():
    main._garmin_cooldown_until.clear()
    main._garmin_cooldown_step.clear()
    yield
    main._garmin_cooldown_until.clear()
    main._garmin_cooldown_step.clear()


def _user(uid=1):
    return SimpleNamespace(id=uid, garmin_email="g@x.com", garmin_needs_reauth=False)


def _fake_db_session_returning(user):
    """A db_session() replacement whose query(...).first() yields ``user``."""
    @contextmanager
    def _cm():
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = user
        yield db
    return _cm


# --- scheduled jobs fan out across connected users -------------------------

def test_scheduled_activity_sync_delegates_per_user(monkeypatch):
    users = [_user(1), _user(2)]
    monkeypatch.setattr(main, "_iter_garmin_users", lambda: users)
    run = MagicMock()
    monkeypatch.setattr(main, "run_activity_sync_for_user", run)

    main._scheduled_activity_sync()

    assert run.call_count == 2
    assert {c.args[0] for c in run.call_args_list} == {1, 2}
    assert all(c.kwargs == {"include_calendar": False} for c in run.call_args_list)


def test_scheduled_activity_sync_survives_one_user_error(monkeypatch):
    users = [_user(1), _user(2)]
    monkeypatch.setattr(main, "_iter_garmin_users", lambda: users)

    def run(uid, include_calendar=True):
        if uid == 1:
            raise RuntimeError("boom")

    run_mock = MagicMock(side_effect=run)
    monkeypatch.setattr(main, "run_activity_sync_for_user", run_mock)
    # Should not raise; the second user is still processed.
    main._scheduled_activity_sync()
    assert run_mock.call_count == 2


# --- per-user activity sync ------------------------------------------------

def test_run_activity_sync_for_user_syncs_activities_and_calendar(monkeypatch):
    import app.garmin_sync as garmin_sync
    user = _user(7)
    monkeypatch.setattr(main, "db_session", _fake_db_session_returning(user))
    monkeypatch.setattr(main, "_authenticate_or_flag", lambda u: True)
    sync_activities = MagicMock()
    sync_calendar = MagicMock()
    monkeypatch.setattr(garmin_sync, "sync_activities", sync_activities)
    monkeypatch.setattr(garmin_sync, "sync_calendar", sync_calendar)

    main.run_activity_sync_for_user(7)

    sync_activities.assert_called_once_with(user)
    sync_calendar.assert_called_once_with(user)


def test_run_activity_sync_skips_when_auth_fails(monkeypatch):
    import app.garmin_sync as garmin_sync
    user = _user(7)
    monkeypatch.setattr(main, "db_session", _fake_db_session_returning(user))
    monkeypatch.setattr(main, "_authenticate_or_flag", lambda u: False)
    sync_activities = MagicMock()
    monkeypatch.setattr(garmin_sync, "sync_activities", sync_activities)

    main.run_activity_sync_for_user(7)

    sync_activities.assert_not_called()


# --- per-user daily sync ---------------------------------------------------

def test_run_daily_sync_for_user_window_and_analyzes_today(monkeypatch):
    from datetime import date

    import app.garmin_sync as garmin_sync
    import app.ai_coach as ai_coach

    user = _user(3)
    monkeypatch.setattr(main, "db_session", _fake_db_session_returning(user))
    monkeypatch.setattr(main, "_authenticate_or_flag", lambda u: True)
    monkeypatch.setattr(main.settings, "daily_sync_window_days", 3)
    monkeypatch.setattr(garmin_sync, "sync_athlete_profile", MagicMock())
    sync_calendar = MagicMock()
    monkeypatch.setattr(garmin_sync, "sync_calendar", sync_calendar)

    summaries = {}

    def fake_sync(target, user=None):
        s = MagicMock(id=target.toordinal(), date=target)
        summaries[target] = s
        return s

    sync = MagicMock(side_effect=fake_sync)
    monkeypatch.setattr(garmin_sync, "sync_daily_summary", sync)
    analyze = MagicMock()
    monkeypatch.setattr(ai_coach, "analyze_daily_summary", analyze)

    main.run_daily_sync_for_user(3)

    sync_calendar.assert_called_once_with(user)
    assert sync.call_count == 3
    synced_dates = {c.args[0] for c in sync.call_args_list}
    assert date.today() in synced_dates
    analyze.assert_called_once_with(summaries[date.today()])


def test_run_daily_sync_no_summary_skips_ai(monkeypatch):
    import app.garmin_sync as garmin_sync
    import app.ai_coach as ai_coach

    user = _user(3)
    monkeypatch.setattr(main, "db_session", _fake_db_session_returning(user))
    monkeypatch.setattr(main, "_authenticate_or_flag", lambda u: True)
    monkeypatch.setattr(garmin_sync, "sync_athlete_profile", MagicMock())
    monkeypatch.setattr(garmin_sync, "sync_calendar", MagicMock())
    monkeypatch.setattr(garmin_sync, "sync_daily_summary", MagicMock(return_value=None))
    analyze = MagicMock()
    monkeypatch.setattr(ai_coach, "analyze_daily_summary", analyze)

    main.run_daily_sync_for_user(3)

    analyze.assert_not_called()


# --- push notifications: plan adaptation + race-week reminders (P0-1) ------

def test_push_plan_adaptation_sends_once_then_dedupes(db, patch_db_session, monkeypatch):
    from datetime import date

    from app import notifications as notifications_mod
    from app import plan_adaptation as plan_adaptation_mod
    from app.models import DailySummary, TrainingPlan, TrainingPlanDay
    from app.schemas import PlanAdaptationSuggestion

    patch_db_session(main)

    plan = TrainingPlan(user_id=1, week_start=date.today(), plan_weeks=1)
    db.add(plan)
    db.flush()
    plan_day = TrainingPlanDay(
        user_id=1, plan_id=plan.id, day_date=date.today(), day_of_week="Monday",
        workout_type="tempo",
    )
    db.add(plan_day)
    db.commit()
    today_summary = DailySummary(user_id=1, date=date.today())
    db.add(today_summary)
    db.commit()
    db.refresh(plan_day)
    db.refresh(today_summary)

    suggestion = PlanAdaptationSuggestion(
        plan_day_id=plan_day.id, direction="downgrade", current_workout_type="tempo",
        suggested_workout_type="rest", reason="Readiness is low today.", readiness_score=20,
    )
    monkeypatch.setattr(plan_adaptation_mod, "suggest_adaptation", lambda *a, **k: suggestion)
    notify = MagicMock()
    monkeypatch.setattr(notifications_mod, "notify", notify)

    main._push_plan_adaptation_if_needed(1, today_summary)
    notify.assert_called_once()
    assert notify.call_args.args[2] == "plan_adaptation"

    # A second call the same day must not push again.
    notify.reset_mock()
    main._push_plan_adaptation_if_needed(1, today_summary)
    notify.assert_not_called()


def test_push_plan_adaptation_skips_without_plan_day(db, patch_db_session, monkeypatch):
    from datetime import date
    from app import notifications as notifications_mod
    from app.models import DailySummary

    patch_db_session(main)
    today_summary = DailySummary(user_id=1, date=date.today())
    db.add(today_summary)
    db.commit()

    notify = MagicMock()
    monkeypatch.setattr(notifications_mod, "notify", notify)

    main._push_plan_adaptation_if_needed(1, today_summary)
    notify.assert_not_called()


def test_push_plan_adaptation_skips_when_no_today_summary(db, patch_db_session, monkeypatch):
    from app import notifications as notifications_mod

    patch_db_session(main)
    notify = MagicMock()
    monkeypatch.setattr(notifications_mod, "notify", notify)

    main._push_plan_adaptation_if_needed(1, None)
    notify.assert_not_called()


def test_push_race_week_reminders_sends_once_then_dedupes(db, patch_db_session, monkeypatch):
    from datetime import date, timedelta
    from app import notifications as notifications_mod
    from app.models import GarminCalendarEvent

    patch_db_session(main)
    race = GarminCalendarEvent(
        user_id=1, garmin_id="race-1", event_type="race",
        date=date.today() + timedelta(days=7), title="City Marathon",
    )
    db.add(race)
    db.commit()

    notify = MagicMock()
    monkeypatch.setattr(notifications_mod, "notify", notify)

    main._push_race_week_reminders(1)
    notify.assert_called_once()
    assert notify.call_args.args[2] == "race_reminder"
    assert "City Marathon" in notify.call_args.kwargs["body"]

    notify.reset_mock()
    main._push_race_week_reminders(1)
    notify.assert_not_called()


def test_push_race_week_reminders_ignores_other_dates(db, patch_db_session, monkeypatch):
    from datetime import date, timedelta
    from app import notifications as notifications_mod
    from app.models import GarminCalendarEvent

    patch_db_session(main)
    race = GarminCalendarEvent(
        user_id=1, garmin_id="race-1", event_type="race",
        date=date.today() + timedelta(days=3), title="City Marathon",
    )
    db.add(race)
    db.commit()

    notify = MagicMock()
    monkeypatch.setattr(notifications_mod, "notify", notify)

    main._push_race_week_reminders(1)
    notify.assert_not_called()


# --- system-health canary alarms (P3-4) -------------------------------------

def test_push_canary_alarms_sends_once_then_dedupes(db, patch_db_session, monkeypatch):
    from app import garmin_sync
    from app import notifications as notifications_mod

    patch_db_session(main)
    monkeypatch.setattr(
        garmin_sync, "get_canary_status",
        lambda: {"activity_summary": {"ok": False, "missing": ["activityId"], "checked_at": "x"}},
    )
    notify = MagicMock()
    monkeypatch.setattr(notifications_mod, "notify", notify)

    main._push_canary_alarms_if_needed(1)
    notify.assert_called_once()
    assert notify.call_args.args[2] == "system_health"
    assert "activity_summary" in notify.call_args.kwargs["body"]

    # A second call with the same drifted source must not push again.
    notify.reset_mock()
    main._push_canary_alarms_if_needed(1)
    notify.assert_not_called()


def test_push_canary_alarms_pushes_again_for_newly_drifted_source(db, patch_db_session, monkeypatch):
    from app import garmin_sync
    from app import notifications as notifications_mod

    patch_db_session(main)
    notify = MagicMock()
    monkeypatch.setattr(notifications_mod, "notify", notify)

    monkeypatch.setattr(
        garmin_sync, "get_canary_status",
        lambda: {"activity_summary": {"ok": False, "missing": ["activityId"], "checked_at": "x"}},
    )
    main._push_canary_alarms_if_needed(1)
    notify.assert_called_once()

    notify.reset_mock()
    monkeypatch.setattr(
        garmin_sync, "get_canary_status",
        lambda: {
            "activity_summary": {"ok": False, "missing": ["activityId"], "checked_at": "x"},
            "daily_stats": {"ok": False, "missing": ["totalSteps"], "checked_at": "y"},
        },
    )
    main._push_canary_alarms_if_needed(1)
    notify.assert_called_once()
    assert "daily_stats" in notify.call_args.kwargs["body"]
    assert "activity_summary" not in notify.call_args.kwargs["body"]


def test_push_canary_alarms_skips_when_all_ok(db, patch_db_session, monkeypatch):
    from app import garmin_sync
    from app import notifications as notifications_mod

    patch_db_session(main)
    monkeypatch.setattr(
        garmin_sync, "get_canary_status",
        lambda: {"activity_summary": {"ok": True, "missing": [], "checked_at": "x"}},
    )
    notify = MagicMock()
    monkeypatch.setattr(notifications_mod, "notify", notify)

    main._push_canary_alarms_if_needed(1)
    notify.assert_not_called()


# --- pre-workout briefing enqueue (P1-3) ------------------------------------

def test_generate_briefing_if_needed_enqueues_once_then_dedupes(db, patch_db_session, monkeypatch):
    from datetime import date
    from app.models import TrainingPlan, TrainingPlanDay
    import app.ai_coach as ai_coach

    patch_db_session(main)
    plan = TrainingPlan(user_id=1, week_start=date.today(), plan_weeks=1)
    db.add(plan)
    db.flush()
    plan_day = TrainingPlanDay(
        user_id=1, plan_id=plan.id, day_date=date.today(), day_of_week="Monday",
        workout_type="tempo",
    )
    db.add(plan_day)
    db.commit()
    db.refresh(plan_day)

    enqueue = MagicMock(return_value=1)
    monkeypatch.setattr(ai_coach, "enqueue_job", enqueue)

    main._generate_briefing_if_needed(1)
    enqueue.assert_called_once_with("generate_briefing", {"plan_day_id": plan_day.id}, 1)

    enqueue.reset_mock()
    main._generate_briefing_if_needed(1)
    enqueue.assert_not_called()


def test_generate_briefing_if_needed_skips_without_plan_day(db, patch_db_session, monkeypatch):
    import app.ai_coach as ai_coach

    patch_db_session(main)
    enqueue = MagicMock()
    monkeypatch.setattr(ai_coach, "enqueue_job", enqueue)

    main._generate_briefing_if_needed(1)
    enqueue.assert_not_called()


def test_run_daily_sync_generates_briefing_for_todays_plan_day(monkeypatch):
    from datetime import date
    import app.garmin_sync as garmin_sync
    import app.ai_coach as ai_coach

    user = _user(3)
    monkeypatch.setattr(main, "db_session", _fake_db_session_returning(user))
    monkeypatch.setattr(main, "_authenticate_or_flag", lambda u: True)
    monkeypatch.setattr(garmin_sync, "sync_athlete_profile", MagicMock())
    monkeypatch.setattr(garmin_sync, "sync_calendar", MagicMock())
    monkeypatch.setattr(garmin_sync, "sync_daily_summary", MagicMock(return_value=None))
    monkeypatch.setattr(ai_coach, "analyze_daily_summary", MagicMock())

    briefing_check = MagicMock()
    monkeypatch.setattr(main, "_generate_briefing_if_needed", briefing_check)

    main.run_daily_sync_for_user(3)

    briefing_check.assert_called_once_with(3)


# --- weekly review / plan generation fan out -------------------------------

def test_scheduled_weekly_review_delegates_per_user(monkeypatch):
    import app.ai_coach as ai_coach
    monkeypatch.setattr(main, "_iter_garmin_users", lambda: [_user(5)])
    enqueue = MagicMock(return_value=1)
    monkeypatch.setattr(ai_coach, "enqueue_job", enqueue)
    main._scheduled_weekly_review()
    enqueue.assert_called_once_with("weekly_review", {}, 5)


def test_scheduled_plan_generation_delegates_per_user(monkeypatch):
    import app.ai_coach as ai_coach
    monkeypatch.setattr(main, "_iter_garmin_users", lambda: [_user(5)])
    enqueue = MagicMock(return_value=1)
    monkeypatch.setattr(ai_coach, "enqueue_job", enqueue)
    main._scheduled_plan_generation()
    enqueue.assert_called_once_with("generate_plan", {}, 5)


def test_run_backfill_runs_all_steps(monkeypatch):
    import app.garmin_sync as garmin_sync
    import app.ai_coach as ai_coach
    backfill_activities = MagicMock()
    backfill_daily = MagicMock()
    weekly = MagicMock()
    monkeypatch.setattr(garmin_sync, "backfill_activities", backfill_activities)
    monkeypatch.setattr(garmin_sync, "backfill_daily_summaries", backfill_daily)
    monkeypatch.setattr(garmin_sync, "sync_athlete_profile", MagicMock())
    monkeypatch.setattr(ai_coach, "weekly_review", weekly)

    main._run_backfill()

    backfill_activities.assert_called_once()
    backfill_daily.assert_called_once()
    weekly.assert_called_once()


def test_spa_catch_all_rejects_api_paths():
    import asyncio
    from fastapi import HTTPException

    with __import__("pytest").raises(HTTPException) as exc:
        asyncio.run(main.spa_catch_all("api/v1/today"))
    assert exc.value.status_code == 404


# --- _check_security_config ------------------------------------------------

def test_security_guard_refuses_when_auth_disabled_on_public_host(monkeypatch, caplog):
    import logging
    import pytest
    monkeypatch.setattr(main.settings, "auth_enabled", False)
    monkeypatch.setattr(main.settings, "bind_host", "0.0.0.0")
    monkeypatch.setattr(main.settings, "allow_insecure_bind", False)
    with caplog.at_level(logging.CRITICAL, logger="app.main"):
        with pytest.raises(RuntimeError, match="Refusing to start"):
            main._check_security_config()
    assert any("SECURITY WARNING" in r.message for r in caplog.records)
    assert any(r.levelno == logging.CRITICAL for r in caplog.records)


def test_security_guard_silent_when_auth_disabled_on_loopback(monkeypatch, caplog):
    import logging
    monkeypatch.setattr(main.settings, "auth_enabled", False)
    monkeypatch.setattr(main.settings, "allow_insecure_bind", False)
    for host in ("127.0.0.1", "::1", "localhost"):
        caplog.clear()
        monkeypatch.setattr(main.settings, "bind_host", host)
        with caplog.at_level(logging.CRITICAL, logger="app.main"):
            main._check_security_config()
        assert not any(r.levelno == logging.CRITICAL for r in caplog.records), (
            f"unexpected CRITICAL log for bind_host={host!r}"
        )


def test_security_guard_silent_when_auth_enabled_on_public_host(monkeypatch, caplog):
    import logging
    monkeypatch.setattr(main.settings, "auth_enabled", True)
    monkeypatch.setattr(main.settings, "bind_host", "0.0.0.0")
    monkeypatch.setattr(main.settings, "allow_insecure_bind", False)
    with caplog.at_level(logging.CRITICAL, logger="app.main"):
        main._check_security_config()
    assert not any(r.levelno == logging.CRITICAL for r in caplog.records)


def test_security_guard_warns_but_continues_when_insecure_bind_allowed(monkeypatch, caplog):
    import logging
    monkeypatch.setattr(main.settings, "auth_enabled", False)
    monkeypatch.setattr(main.settings, "bind_host", "0.0.0.0")
    monkeypatch.setattr(main.settings, "allow_insecure_bind", True)
    with caplog.at_level(logging.CRITICAL, logger="app.main"):
        main._check_security_config()  # must not raise
    assert any("SECURITY WARNING" in r.message for r in caplog.records)
    assert any(r.levelno == logging.CRITICAL for r in caplog.records)


# --- G2: selective needs_reauth flagging + 429 cooldown --------------------

def test_authenticate_or_flag_connection_error_does_not_flag(monkeypatch):
    from garminconnect.exceptions import GarminConnectConnectionError
    import app.garmin_sync as garmin_sync

    user = _user(10)
    flag = MagicMock()
    monkeypatch.setattr(garmin_sync, "mark_garmin_needs_reauth", flag)
    monkeypatch.setattr(
        garmin_sync,
        "get_garmin_client",
        MagicMock(side_effect=GarminConnectConnectionError("503 service unavailable")),
    )

    assert main._authenticate_or_flag(user) is False
    flag.assert_not_called()
    assert main._garmin_in_cooldown(10) is False


def test_authenticate_or_flag_auth_error_flags_reauth(monkeypatch):
    from garminconnect.exceptions import GarminConnectAuthenticationError
    import app.garmin_sync as garmin_sync

    user = _user(10)
    flag = MagicMock()
    monkeypatch.setattr(garmin_sync, "mark_garmin_needs_reauth", flag)
    monkeypatch.setattr(
        garmin_sync,
        "get_garmin_client",
        MagicMock(side_effect=GarminConnectAuthenticationError("401 unauthorized")),
    )

    assert main._authenticate_or_flag(user) is False
    flag.assert_called_once_with(10, True)


def test_authenticate_or_flag_invalid_token_flags_reauth(monkeypatch):
    from cryptography.fernet import InvalidToken
    import app.garmin_sync as garmin_sync

    user = _user(10)
    flag = MagicMock()
    monkeypatch.setattr(garmin_sync, "mark_garmin_needs_reauth", flag)
    monkeypatch.setattr(
        garmin_sync,
        "get_garmin_client",
        MagicMock(side_effect=InvalidToken()),
    )

    assert main._authenticate_or_flag(user) is False
    flag.assert_called_once_with(10, True)


def test_authenticate_or_flag_429_starts_cooldown_doubles_and_clears(monkeypatch):
    from unittest.mock import patch
    from garminconnect.exceptions import GarminConnectTooManyRequestsError
    import app.garmin_sync as garmin_sync

    now = [1000.0]
    monkeypatch.setattr(main.time, "monotonic", lambda: now[0])

    user = _user(11)
    flag = MagicMock()
    monkeypatch.setattr(garmin_sync, "mark_garmin_needs_reauth", flag)
    monkeypatch.setattr(
        garmin_sync,
        "get_garmin_client",
        MagicMock(side_effect=GarminConnectTooManyRequestsError("429 too many requests")),
    )

    assert main._authenticate_or_flag(user) is False
    flag.assert_not_called()
    assert main._garmin_in_cooldown(11) is True
    first_until = main._garmin_cooldown_until[11]
    assert first_until == pytest.approx(1000.0 + 30 * 60)

    # Scheduled loop skips the user while in cooldown.
    monkeypatch.setattr(main, "_iter_garmin_users", lambda: [user])
    with patch.object(main, "run_activity_sync_for_user") as run_activity:
        main._scheduled_activity_sync()
        run_activity.assert_not_called()

    # After cooldown expires, a second 429 doubles the wait to 60 min.
    now[0] = first_until + 1.0
    assert main._garmin_in_cooldown(11) is False
    assert main._authenticate_or_flag(user) is False
    assert main._garmin_cooldown_until[11] == pytest.approx(now[0] + 60 * 60)

    # A successful sync clears both the active cooldown and backoff step.
    monkeypatch.setattr(main, "db_session", _fake_db_session_returning(user))
    monkeypatch.setattr(main, "_authenticate_or_flag", lambda u: True)
    monkeypatch.setattr(garmin_sync, "sync_activities", MagicMock())
    monkeypatch.setattr(garmin_sync, "sync_calendar", MagicMock())
    main.run_activity_sync_for_user(11, include_calendar=False)

    assert main._garmin_in_cooldown(11) is False
    assert 11 not in main._garmin_cooldown_step


# --- G1: calendar sync decoupled from 5-min activity poll ------------------

def test_scheduled_activity_sync_does_not_call_sync_calendar(monkeypatch):
    import app.garmin_sync as garmin_sync

    user = _user(7)
    monkeypatch.setattr(main, "_iter_garmin_users", lambda: [user])
    monkeypatch.setattr(main, "db_session", _fake_db_session_returning(user))
    monkeypatch.setattr(main, "_authenticate_or_flag", lambda u: True)
    sync_activities = MagicMock()
    sync_calendar = MagicMock()
    monkeypatch.setattr(garmin_sync, "sync_activities", sync_activities)
    monkeypatch.setattr(garmin_sync, "sync_calendar", sync_calendar)

    main._scheduled_activity_sync()

    sync_activities.assert_called_once_with(user)
    sync_calendar.assert_not_called()


def test_scheduled_calendar_sync_calls_sync_calendar_per_user(monkeypatch):
    import app.garmin_sync as garmin_sync

    u1, u2 = _user(1), _user(2)
    monkeypatch.setattr(main, "_iter_garmin_users", lambda: [u1, u2])
    monkeypatch.setattr(main, "_authenticate_or_flag", lambda u: True)
    sync_calendar = MagicMock()
    monkeypatch.setattr(garmin_sync, "sync_calendar", sync_calendar)

    main._scheduled_calendar_sync()

    assert sync_calendar.call_count == 2
    assert {c.args[0].id for c in sync_calendar.call_args_list} == {1, 2}


# --- F1: root-scoped service worker ----------------------------------------

def test_service_worker_served_at_root_scope():
    from fastapi.testclient import TestClient

    client = TestClient(main.app)
    resp = client.get("/sw.js")
    assert resp.status_code == 200
    assert "javascript" in resp.headers["content-type"]
    assert resp.headers.get("service-worker-allowed") == "/"
    assert "addEventListener('push'" in resp.text
