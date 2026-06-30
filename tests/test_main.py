from contextlib import contextmanager
from types import SimpleNamespace
from unittest.mock import MagicMock

import app.main as main


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


def test_scheduled_activity_sync_survives_one_user_error(monkeypatch):
    users = [_user(1), _user(2)]
    monkeypatch.setattr(main, "_iter_garmin_users", lambda: users)

    def run(uid):
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
    monkeypatch.setattr(garmin_sync, "sync_daily_summary", MagicMock(return_value=None))
    analyze = MagicMock()
    monkeypatch.setattr(ai_coach, "analyze_daily_summary", analyze)

    main.run_daily_sync_for_user(3)

    analyze.assert_not_called()


# --- weekly review / plan generation fan out -------------------------------

def test_scheduled_weekly_review_delegates_per_user(monkeypatch):
    import app.ai_coach as ai_coach
    monkeypatch.setattr(main, "_iter_garmin_users", lambda: [_user(5)])
    review = MagicMock()
    monkeypatch.setattr(ai_coach, "weekly_review", review)
    main._scheduled_weekly_review()
    review.assert_called_once_with(user_id=5)


def test_scheduled_plan_generation_delegates_per_user(monkeypatch):
    import app.ai_coach as ai_coach
    monkeypatch.setattr(main, "_iter_garmin_users", lambda: [_user(5)])
    gen = MagicMock()
    monkeypatch.setattr(ai_coach, "generate_training_plan", gen)
    main._scheduled_plan_generation()
    gen.assert_called_once_with(user_id=5)


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

def test_security_guard_warns_when_auth_disabled_on_public_host(monkeypatch, caplog):
    import logging
    monkeypatch.setattr(main.settings, "auth_enabled", False)
    monkeypatch.setattr(main.settings, "bind_host", "0.0.0.0")
    with caplog.at_level(logging.CRITICAL, logger="app.main"):
        main._check_security_config()
    assert any("SECURITY WARNING" in r.message for r in caplog.records)
    assert any(r.levelno == logging.CRITICAL for r in caplog.records)


def test_security_guard_silent_when_auth_disabled_on_loopback(monkeypatch, caplog):
    import logging
    monkeypatch.setattr(main.settings, "auth_enabled", False)
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
    with caplog.at_level(logging.CRITICAL, logger="app.main"):
        main._check_security_config()
    assert not any(r.levelno == logging.CRITICAL for r in caplog.records)
