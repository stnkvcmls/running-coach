import json
from datetime import date, datetime
from unittest.mock import MagicMock

import pytest

from app import garmin_sync
from app.models import Activity, AthleteProfile, DailySummary, GarminCalendarEvent, SyncStatus, User


# --- _parse_garmin_ts ---

def test_parse_garmin_ts_space_format():
    assert garmin_sync._parse_garmin_ts("2026-06-10 07:30:00") == datetime(2026, 6, 10, 7, 30, 0)


def test_parse_garmin_ts_iso_with_micros():
    assert garmin_sync._parse_garmin_ts("2026-06-10T07:30:00.500") == datetime(2026, 6, 10, 7, 30, 0, 500000)


def test_parse_garmin_ts_none_and_invalid():
    assert garmin_sync._parse_garmin_ts(None) is None
    assert garmin_sync._parse_garmin_ts("nonsense") is None


# --- _extract_activity_fields ---

def test_extract_activity_fields_basic_and_pace():
    summary = {
        "activityId": 12345,
        "activityType": {"typeKey": "running"},
        "activityName": "Morning Run",
        "startTimeLocal": "2026-06-10 07:00:00",
        "duration": 1800,       # 30 min
        "distance": 5000,       # 5 km
        "averageHR": 150,
        "maxHR": 170,
        "calories": 350,
    }
    fields = garmin_sync._extract_activity_fields(summary)
    assert fields["garmin_id"] == 12345
    assert fields["activity_type"] == "running"
    assert fields["name"] == "Morning Run"
    # 30 min over 5 km = 6 min/km
    assert fields["avg_pace_min_km"] == pytest.approx(6.0)
    assert fields["avg_hr"] == 150


def test_extract_activity_fields_no_distance_no_pace():
    fields = garmin_sync._extract_activity_fields({"activityId": 1, "duration": 600})
    assert fields["avg_pace_min_km"] is None
    assert fields["activity_type"] == "unknown"


def test_extract_activity_fields_prefers_detail_summary():
    summary = {"activityId": 1, "normPower": 100}
    details = {"activity_summary": {"normPower": 250, "trainingStressScore": 88}}
    fields = garmin_sync._extract_activity_fields(summary, details)
    assert fields["normalized_power"] == 250
    assert fields["training_stress_score"] == 88


# --- _daily_summary_fields ---

def test_daily_summary_fields_intensity_minutes_sum():
    stats = {
        "totalSteps": 8000,
        "totalKilocalories": 2200,
        "restingHeartRate": 50,
        "moderateIntensityMinutes": 20,
        "vigorousIntensityMinutes": 10,
        "floorsAscended": 12,
    }
    fields = garmin_sync._daily_summary_fields(stats, 35, 27000, 80, {"x": 1})
    assert fields["steps"] == 8000
    assert fields["intensity_minutes"] == 30
    assert fields["stress_avg"] == 35
    assert fields["sleep_seconds"] == 27000
    assert fields["ai_analyzed"] is False


# --- _parse_calendar_date ---

def test_parse_calendar_date_variants():
    assert garmin_sync._parse_calendar_date(None) is None
    assert garmin_sync._parse_calendar_date(date(2026, 6, 10)) == date(2026, 6, 10)
    assert garmin_sync._parse_calendar_date("2026-06-10") == date(2026, 6, 10)
    assert garmin_sync._parse_calendar_date("2026-06-10T07:00:00") == date(2026, 6, 10)


def test_parse_calendar_date_epoch_millis():
    # 2026-06-10 00:00 UTC in ms
    ms = datetime(2026, 6, 10, tzinfo=garmin_sync.timezone.utc).timestamp() * 1000
    assert garmin_sync._parse_calendar_date(ms) == date(2026, 6, 10)


def test_parse_calendar_date_invalid_string():
    assert garmin_sync._parse_calendar_date("garbage") is None


# --- _parse_race_priority ---

@pytest.mark.parametrize("raw,expected", [
    (None, None),
    (1, "A"),
    (2, "B"),
    (3, "C"),
    ("A", "A"),
    ("b", "B"),
    ("PRIMARY", "A"),
    ("SECONDARY", "B"),
    ("FUN", "C"),
])
def test_parse_race_priority(raw, expected):
    assert garmin_sync._parse_race_priority(raw) == expected


# --- _race_distance_label ---

@pytest.mark.parametrize("meters,label", [
    (None, None),
    (5000, "5K"),
    (10000, "10K"),
    (21097.5, "Half Marathon"),
    (42195, "Marathon"),
    (3000, "3.0km"),
])
def test_race_distance_label(meters, label):
    assert garmin_sync._race_distance_label(meters) == label


# --- _extract_goal_time_from_details ---

def test_extract_goal_time_from_custom_goal():
    detail = {"eventCustomization": {"customGoal": {"value": 5400, "unitType": "time"}}}
    assert garmin_sync._extract_goal_time_from_details(detail) == 5400


def test_extract_goal_time_from_top_level_field_ms():
    # value > 86400 is treated as milliseconds.
    detail = {"goalTimeInSeconds": 5400000}
    assert garmin_sync._extract_goal_time_from_details(detail) == 5400


def test_extract_goal_time_none():
    assert garmin_sync._extract_goal_time_from_details({}) is None


# --- _parse_calendar_response ---

def test_parse_calendar_response_race():
    data = {"calendarItems": [{
        "itemType": "race",
        "date": "2026-09-27",
        "eventId": 99,
        "title": "Berlin Marathon",
        "distance": 42195,
        "primaryEvent": True,
    }]}
    events = garmin_sync._parse_calendar_response(data)
    assert len(events) == 1
    evt = events[0]
    assert evt["event_type"] == "race"
    assert evt["distance_label"] == "Marathon"
    assert evt["priority"] == "A"
    assert evt["title"] == "Berlin Marathon"


def test_parse_calendar_response_workout_builds_description():
    data = {"calendarItems": [{
        "itemType": "workout",
        "date": "2026-06-17",
        "workoutId": 5,
        "title": "Intervals",
        "workoutSteps": [
            {"stepName": "Warmup", "endConditionValue": 600},
            {"stepName": "Repeats"},
        ],
    }]}
    events = garmin_sync._parse_calendar_response(data)
    assert len(events) == 1
    evt = events[0]
    assert evt["event_type"] == "workout"
    assert "Warmup: 600" in evt["workout_description"]


def test_parse_calendar_response_skips_unknown_type_and_undated():
    data = {"calendarItems": [
        {"itemType": "sleep", "date": "2026-06-17"},
        {"itemType": "race", "date": None},
    ]}
    assert garmin_sync._parse_calendar_response(data) == []


def test_parse_calendar_response_empty():
    assert garmin_sync._parse_calendar_response({}) == []


# --- sync status helpers (DB) ---

def test_get_set_sync_status_roundtrip(db):
    assert garmin_sync._get_sync_status(db, "missing") is None
    garmin_sync._set_sync_status(db, "k", "v1")
    assert garmin_sync._get_sync_status(db, "k") == "v1"
    # Update in place.
    garmin_sync._set_sync_status(db, "k", "v2")
    assert garmin_sync._get_sync_status(db, "k") == "v2"
    assert db.query(SyncStatus).filter(SyncStatus.key == "k").count() == 1


# --- _store_activity (Garmin client mocked) ---

def test_store_activity_creates_row(db, monkeypatch):
    fake_client = MagicMock()
    fake_client.get_activity_details.return_value = {"metricDescriptors": []}
    monkeypatch.setattr(garmin_sync, "get_garmin_client", lambda: fake_client)

    summary = {
        "activityId": 555,
        "activityType": {"typeKey": "running"},
        "activityName": "Run",
        "startTimeLocal": "2026-06-10 07:00:00",
        "duration": 1800,
        "distance": 5000,
    }
    details = {
        "splits": [{"distance": 1000}],
        "typed_splits": [
            {"splitType": "RUNNING", "totalElapsedDuration": 1500},
            {"splitType": "WALKING", "totalElapsedDuration": 300},
        ],
    }
    activity = garmin_sync._store_activity(db, summary, details, skip_ai=True)
    assert activity is not None
    assert activity.garmin_id == 555
    assert activity.run_time_sec == 1500
    assert activity.walk_time_sec == 300
    assert activity.ai_analyzed is True
    assert json.loads(activity.splits_json) == [{"distance": 1000}]


def test_store_activity_skips_duplicate(db, monkeypatch):
    monkeypatch.setattr(garmin_sync, "get_garmin_client", lambda: MagicMock())
    db.add(Activity(garmin_id=777, name="Existing", activity_type="running"))
    db.commit()
    result = garmin_sync._store_activity(db, {"activityId": 777}, {}, skip_ai=True)
    assert result is None


def test_store_activity_no_id_returns_none(db):
    assert garmin_sync._store_activity(db, {}, {}) is None


# --- sync_calendar orchestration (client + db mocked) ---

def test_get_garmin_client_fresh_login(monkeypatch, tmp_path):
    # Empty the per-user client cache so a fresh login path runs.
    garmin_sync._garmin_clients.clear()
    monkeypatch.setattr(garmin_sync.settings, "garmin_token_dir", str(tmp_path))

    fake_client = MagicMock()
    fake_client.get_full_name.return_value = "Sam Runner"
    monkeypatch.setattr(garmin_sync, "Garmin", lambda *a, **k: fake_client)

    user = User(id=7, email="sam@example.com", garmin_email="sam@garmin.com")
    client = garmin_sync.get_garmin_client(user)
    assert client is fake_client
    fake_client.login.assert_called()


def test_get_garmin_client_reuses_live_session(monkeypatch):
    live = MagicMock()
    live.get_full_name.return_value = "Sam"
    garmin_sync._garmin_clients.clear()
    garmin_sync._garmin_clients[7] = live
    # Should return the cached client without constructing a new one.
    monkeypatch.setattr(garmin_sync, "Garmin", lambda *a, **k: pytest.fail("should not re-create"))
    user = User(id=7, email="sam@example.com", garmin_email="sam@garmin.com")
    assert garmin_sync.get_garmin_client(user) is live


def test_fetch_activity_details_tolerates_failures():
    client = MagicMock()
    client.get_activity.return_value = {"summary": 1}
    client.get_activity_splits.side_effect = RuntimeError("no splits")
    client.get_activity_hr_in_timezones.return_value = [{"zone": 1}]
    client.get_activity_weather.return_value = {"temp": 20}
    client.get_activity_split_summaries.return_value = []
    client.get_activity_typed_splits.return_value = []

    details = garmin_sync._fetch_activity_details(client, 123)
    assert details["activity_summary"] == {"summary": 1}
    # Endpoint that raised is simply absent.
    assert "splits" not in details
    assert details["weather"] == {"temp": 20}


def test_fetch_workout_details_returns_dict():
    client = MagicMock()
    client.connectapi.return_value = {"workoutSteps": []}
    assert garmin_sync._fetch_workout_details(client, 5) == {"workoutSteps": []}


def test_fetch_workout_details_handles_error():
    client = MagicMock()
    client.connectapi.side_effect = RuntimeError("boom")
    assert garmin_sync._fetch_workout_details(client, 5) is None


def test_fetch_race_event_details_no_uuid():
    assert garmin_sync._fetch_race_event_details(MagicMock(), {}) is None


def test_sync_activities_stores_new(db, patch_db_session, monkeypatch):
    patch_db_session(garmin_sync)
    monkeypatch.setattr(garmin_sync.time, "sleep", lambda *a, **k: None)

    fake_client = MagicMock()
    fake_client.get_activities.return_value = [
        {"activityId": 1001, "activityType": {"typeKey": "running"},
         "activityName": "Run", "startTimeLocal": "2026-06-10 07:00:00",
         "duration": 1800, "distance": 5000},
    ]
    fake_client.get_activity_details.return_value = {"metricDescriptors": []}
    monkeypatch.setattr(garmin_sync, "get_garmin_client", lambda: fake_client)
    monkeypatch.setattr(garmin_sync, "_fetch_activity_details", lambda c, gid: {})

    new = garmin_sync.sync_activities()
    assert len(new) == 1
    assert db.query(Activity).filter(Activity.garmin_id == 1001).count() == 1
    # Sync status was recorded.
    assert garmin_sync._get_sync_status(db, "last_activity_sync") is not None


def test_sync_activities_skips_existing(db, patch_db_session, monkeypatch):
    patch_db_session(garmin_sync)
    monkeypatch.setattr(garmin_sync.time, "sleep", lambda *a, **k: None)
    db.add(Activity(garmin_id=2002, name="Old", activity_type="running"))
    db.commit()

    fake_client = MagicMock()
    fake_client.get_activities.return_value = [{"activityId": 2002}]
    monkeypatch.setattr(garmin_sync, "get_garmin_client", lambda: fake_client)

    new = garmin_sync.sync_activities()
    assert new == []


def test_sync_daily_summary_creates_row(db, patch_db_session, monkeypatch):
    patch_db_session(garmin_sync)

    fake_client = MagicMock()
    fake_client.get_stats.return_value = {
        "totalSteps": 9000, "restingHeartRate": 49, "averageStressLevel": 28,
    }
    fake_client.get_user_summary.return_value = {}
    fake_client.get_sleep_data.return_value = {
        "dailySleepDTO": {"sleepTimeSeconds": 27000,
                          "sleepScores": {"overall": {"value": 82}}}
    }
    fake_client.get_heart_rates.return_value = {}
    fake_client.get_all_day_stress.return_value = {}
    fake_client.get_hrv_data.return_value = {
        "hrvSummary": {"lastNightAvg": 46, "weeklyAvg": 42, "status": "BALANCED"}
    }
    monkeypatch.setattr(garmin_sync, "get_garmin_client", lambda: fake_client)

    summary = garmin_sync.sync_daily_summary(date(2026, 6, 10))
    assert summary is not None
    # The returned object is read by the AI analysis after its session has
    # closed (analyze_daily_summary -> _format_daily_context accesses .date).
    # Touch attributes here to guard against a DetachedInstanceError regression.
    assert summary.date == date(2026, 6, 10)
    assert summary.id is not None
    assert summary.steps == 9000
    stored = db.query(DailySummary).filter(DailySummary.date == date(2026, 6, 10)).first()
    assert stored.steps == 9000
    assert stored.sleep_seconds == 27000
    assert stored.sleep_score == 82
    assert stored.stress_avg == 28
    assert stored.hrv_avg == 46
    assert stored.hrv_weekly_avg == 42
    assert stored.hrv_status == "BALANCED"


def test_sync_daily_summary_updates_existing(db, patch_db_session, monkeypatch):
    patch_db_session(garmin_sync)
    db.add(DailySummary(date=date(2026, 6, 10), steps=1))
    db.commit()

    fake_client = MagicMock()
    fake_client.get_stats.return_value = {"totalSteps": 9999}
    fake_client.get_user_summary.return_value = {}
    fake_client.get_sleep_data.return_value = {}
    fake_client.get_heart_rates.return_value = {}
    fake_client.get_all_day_stress.return_value = {}
    fake_client.get_hrv_data.return_value = {}
    monkeypatch.setattr(garmin_sync, "get_garmin_client", lambda: fake_client)

    garmin_sync.sync_daily_summary(date(2026, 6, 10))
    db.expire_all()
    assert db.query(DailySummary).filter(DailySummary.date == date(2026, 6, 10)).count() == 1
    assert db.query(DailySummary).filter(DailySummary.date == date(2026, 6, 10)).first().steps == 9999


# --- athlete profile sync (Garmin client mocked) ---

def _profile_client(weight_grams=70500, birth="1990-04-15"):
    fake_client = MagicMock()
    fake_client.get_full_name.return_value = "Jane Runner"
    fake_client.get_user_profile.return_value = {
        "userData": {"birthDate": birth, "weight": weight_grams}
    }
    fake_client.get_stats.return_value = {}
    return fake_client


def test_fetch_garmin_profile_fields_from_user_data():
    fields = garmin_sync._fetch_garmin_profile_fields(_profile_client())
    assert fields["name"] == "Jane Runner"
    assert fields["date_of_birth"] == date(1990, 4, 15)
    assert fields["weight_kg"] == 70.5


def test_fetch_garmin_profile_fields_weight_fallback():
    fake_client = _profile_client(weight_grams=None)
    fake_client.get_body_composition.return_value = {
        "dateWeightList": [
            {"date": "2026-06-01", "weight": 71000},
            {"date": "2026-06-10", "weight": 70200},
        ]
    }
    fields = garmin_sync._fetch_garmin_profile_fields(fake_client)
    assert fields["weight_kg"] == 70.2  # latest non-null entry


def test_fetch_garmin_profile_fields_tolerates_missing_data():
    fake_client = MagicMock()
    fake_client.get_full_name.return_value = None
    fake_client.get_user_profile.return_value = {}
    fake_client.get_body_composition.return_value = {}
    fake_client.get_stats.return_value = {}
    assert garmin_sync._fetch_garmin_profile_fields(fake_client) == {}


def test_sync_athlete_profile_creates_row(db, patch_db_session, monkeypatch):
    patch_db_session(garmin_sync)
    monkeypatch.setattr(garmin_sync, "get_garmin_client", _profile_client)

    profile = garmin_sync.sync_athlete_profile()
    assert profile is not None
    stored = db.query(AthleteProfile).first()
    assert stored.name == "Jane Runner"
    assert stored.date_of_birth == date(1990, 4, 15)
    assert stored.weight_kg == 70.5


def test_sync_athlete_profile_overwrites_garmin_fields_but_keeps_others(db, patch_db_session, monkeypatch):
    patch_db_session(garmin_sync)
    db.add(AthleteProfile(name="Old Name", weight_kg=80.0, goal_race="Berlin Marathon"))
    db.commit()

    monkeypatch.setattr(garmin_sync, "get_garmin_client", _profile_client)
    garmin_sync.sync_athlete_profile()
    db.expire_all()

    stored = db.query(AthleteProfile).first()
    assert db.query(AthleteProfile).count() == 1
    assert stored.name == "Jane Runner"
    assert stored.weight_kg == 70.5
    assert stored.goal_race == "Berlin Marathon"  # non-Garmin field untouched


def test_backfill_activities_walks_pages(db, patch_db_session, monkeypatch):
    patch_db_session(garmin_sync)
    monkeypatch.setattr(garmin_sync.time, "sleep", lambda *a, **k: None)
    monkeypatch.setattr(garmin_sync, "_fetch_activity_details", lambda c, gid: {})

    fake_client = MagicMock()
    # First page returns one activity (< page_size) so the loop stops after it.
    fake_client.get_activities.side_effect = [
        [{"activityId": 3001, "activityType": {"typeKey": "running"},
          "activityName": "Run", "startTimeLocal": "2026-06-10 07:00:00",
          "duration": 1800, "distance": 5000}],
    ]
    fake_client.get_activity_details.return_value = {"metricDescriptors": []}
    monkeypatch.setattr(garmin_sync, "get_garmin_client", lambda: fake_client)

    garmin_sync.backfill_activities()
    assert db.query(Activity).filter(Activity.garmin_id == 3001).count() == 1
    assert garmin_sync._get_sync_status(db, "backfill_activities") == "complete"


def test_backfill_activities_skips_when_complete(db, patch_db_session, monkeypatch):
    patch_db_session(garmin_sync)
    garmin_sync._set_sync_status(db, "backfill_activities", "complete")
    monkeypatch.setattr(garmin_sync, "get_garmin_client",
                        lambda: pytest.fail("client should not be created"))
    garmin_sync.backfill_activities()  # returns immediately


def test_backfill_daily_summaries_completes(db, patch_db_session, monkeypatch):
    patch_db_session(garmin_sync)
    monkeypatch.setattr(garmin_sync.time, "sleep", lambda *a, **k: None)
    # Stub the per-day sync so we don't hit Garmin; return None to skip storage.
    monkeypatch.setattr(garmin_sync, "sync_daily_summary", lambda target: None)

    garmin_sync.backfill_daily_summaries()
    assert garmin_sync._get_sync_status(db, "backfill_daily") == "complete"


def test_backfill_daily_summaries_includes_today(db, patch_db_session, monkeypatch):
    # Garmin dates last night's sleep to the wake-up day, so backfill must start
    # at today (days_ago=0) to capture it on a fresh start.
    patch_db_session(garmin_sync)
    monkeypatch.setattr(garmin_sync.time, "sleep", lambda *a, **k: None)
    targets = []
    monkeypatch.setattr(garmin_sync, "sync_daily_summary", lambda target: targets.append(target))

    garmin_sync.backfill_daily_summaries()
    assert date.today() in targets


def test_backfill_daily_summaries_skips_when_complete(db, patch_db_session, monkeypatch):
    patch_db_session(garmin_sync)
    garmin_sync._set_sync_status(db, "backfill_daily", "complete")
    called = MagicMock()
    monkeypatch.setattr(garmin_sync, "sync_daily_summary", called)
    garmin_sync.backfill_daily_summaries()
    called.assert_not_called()


def test_sync_calendar_upserts_events(db, patch_db_session, monkeypatch):
    patch_db_session(garmin_sync)

    fake_client = MagicMock()

    def fake_connectapi(endpoint):
        if "calendar-service/year" in endpoint:
            return {"calendarItems": [{
                "itemType": "race",
                "date": "2099-09-27",
                "eventId": 1,
                "title": "Future Race",
                "distance": 10000,
            }]}
        return {}

    fake_client.connectapi.side_effect = fake_connectapi
    monkeypatch.setattr(garmin_sync, "get_garmin_client", lambda: fake_client)
    monkeypatch.setattr(garmin_sync.time, "sleep", lambda *a, **k: None)

    count = garmin_sync.sync_calendar()
    assert count >= 1
    races = db.query(GarminCalendarEvent).filter(GarminCalendarEvent.event_type == "race").all()
    assert any(r.title == "Future Race" for r in races)
