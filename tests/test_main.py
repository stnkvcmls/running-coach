from unittest.mock import MagicMock

import app.main as main


def test_scheduled_activity_sync_runs_both(monkeypatch):
    sync_activities = MagicMock()
    sync_calendar = MagicMock()
    import app.garmin_sync as garmin_sync
    monkeypatch.setattr(garmin_sync, "sync_activities", sync_activities)
    monkeypatch.setattr(garmin_sync, "sync_calendar", sync_calendar)

    main._scheduled_activity_sync()

    sync_activities.assert_called_once()
    sync_calendar.assert_called_once()


def test_scheduled_activity_sync_survives_calendar_error(monkeypatch):
    import app.garmin_sync as garmin_sync
    monkeypatch.setattr(garmin_sync, "sync_activities", MagicMock())
    monkeypatch.setattr(garmin_sync, "sync_calendar", MagicMock(side_effect=RuntimeError("boom")))
    # Should swallow the calendar failure, not raise.
    main._scheduled_activity_sync()


def test_scheduled_daily_sync_syncs_window_and_analyzes_today(monkeypatch):
    from datetime import date

    import app.garmin_sync as garmin_sync
    import app.ai_coach as ai_coach

    monkeypatch.setattr(main.settings, "daily_sync_window_days", 3)
    monkeypatch.setattr(garmin_sync, "sync_athlete_profile", MagicMock())

    # Return a distinct summary per requested date so we can verify which one
    # is handed to the AI (the newest — today).
    summaries = {}

    def fake_sync(target):
        s = MagicMock(id=target.toordinal(), date=target)
        summaries[target] = s
        return s

    sync = MagicMock(side_effect=fake_sync)
    monkeypatch.setattr(garmin_sync, "sync_daily_summary", sync)
    analyze = MagicMock()
    monkeypatch.setattr(ai_coach, "analyze_daily_summary", analyze)

    main._scheduled_daily_sync()

    # Rolling window: today + the prior 2 days.
    assert sync.call_count == 3
    synced_dates = {c.args[0] for c in sync.call_args_list}
    assert date.today() in synced_dates
    # AI runs only on today's (newest) summary.
    analyze.assert_called_once_with(summaries[date.today()])


def test_scheduled_daily_sync_no_summary_skips_ai(monkeypatch):
    import app.garmin_sync as garmin_sync
    import app.ai_coach as ai_coach
    monkeypatch.setattr(garmin_sync, "sync_athlete_profile", MagicMock())
    monkeypatch.setattr(garmin_sync, "sync_daily_summary", MagicMock(return_value=None))
    analyze = MagicMock()
    monkeypatch.setattr(ai_coach, "analyze_daily_summary", analyze)

    main._scheduled_daily_sync()

    analyze.assert_not_called()


def test_scheduled_weekly_review_delegates(monkeypatch):
    import app.ai_coach as ai_coach
    review = MagicMock()
    monkeypatch.setattr(ai_coach, "weekly_review", review)
    main._scheduled_weekly_review()
    review.assert_called_once()


def test_run_backfill_runs_all_steps(monkeypatch):
    import app.garmin_sync as garmin_sync
    import app.ai_coach as ai_coach
    backfill_activities = MagicMock()
    backfill_daily = MagicMock()
    weekly = MagicMock()
    monkeypatch.setattr(garmin_sync, "backfill_activities", backfill_activities)
    monkeypatch.setattr(garmin_sync, "backfill_daily_summaries", backfill_daily)
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
