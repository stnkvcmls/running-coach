import json
from datetime import datetime, timedelta

from app import records
from app.models import Activity, PersonalRecord, SyncStatus

DEFAULT_USER_ID = 1


def _curve_json(*, power=None, gap_speed=None, distance_efforts=None, is_treadmill=False):
    return json.dumps({
        "power": power or {},
        "speed": {},
        "gap_speed": gap_speed or {},
        "hr": {},
        "is_treadmill": is_treadmill,
        "duration": 1800.0,
        "distance_efforts": distance_efforts or {},
    })


def _add_activity(db, *, days_ago, activity_type="running", mean_max=None,
                   distance_m=None, duration_sec=None, user_id=DEFAULT_USER_ID):
    started = datetime.utcnow() - timedelta(days=days_ago)
    act = Activity(
        garmin_id=int(started.timestamp() * 1000) + days_ago,
        user_id=user_id,
        activity_type=activity_type,
        name="Run",
        started_at=started,
        distance_m=distance_m,
        duration_sec=duration_sec,
        mean_max_json=mean_max,
    )
    db.add(act)
    db.commit()
    db.refresh(act)
    return act


# --- duration-based bests ---

def test_first_activity_sets_a_record_with_no_previous(db):
    act = _add_activity(db, days_ago=1, mean_max=_curve_json(power={"300": 300}))
    created = records.detect_new_records_for_activity(db, act)
    assert len(created) == 1
    assert created[0].record_type == "duration"
    assert created[0].metric == "power"
    assert created[0].duration_sec == 300
    assert created[0].value == 300
    assert created[0].previous_value is None


def test_beating_prior_best_creates_record_with_previous_value(db):
    _add_activity(db, days_ago=10, mean_max=_curve_json(power={"300": 280}))
    _add_activity(db, days_ago=5, mean_max=_curve_json(power={"300": 280}))  # ties, no PR
    newer = _add_activity(db, days_ago=1, mean_max=_curve_json(power={"300": 300}))

    created = records.detect_new_records_for_activity(db, newer)
    assert len(created) == 1
    assert created[0].value == 300
    assert created[0].previous_value == 280


def test_not_beating_prior_best_creates_no_record(db):
    _add_activity(db, days_ago=10, mean_max=_curve_json(power={"300": 320}))
    newer = _add_activity(db, days_ago=1, mean_max=_curve_json(power={"300": 300}))

    created = records.detect_new_records_for_activity(db, newer)
    assert created == []


def test_gap_speed_and_power_tracked_independently(db):
    _add_activity(db, days_ago=10, mean_max=_curve_json(power={"600": 250}, gap_speed={"600": 3.0}))
    newer = _add_activity(
        db, days_ago=1,
        mean_max=_curve_json(power={"600": 240}, gap_speed={"600": 3.2}),
    )
    created = records.detect_new_records_for_activity(db, newer)
    assert len(created) == 1
    assert created[0].metric == "gap_speed"
    assert created[0].value == 3.2


def test_non_running_activity_produces_no_records(db):
    act = _add_activity(db, days_ago=1, activity_type="cycling", mean_max=_curve_json(power={"300": 400}))
    created = records.detect_new_records_for_activity(db, act)
    assert created == []


# --- distance-based "Best Efforts" (rolling-window, not whole-activity) ---

def test_distance_effort_creates_record_with_no_previous(db):
    act = _add_activity(db, days_ago=1, mean_max=_curve_json(distance_efforts={"10K": 3000}))
    created = records.detect_new_records_for_activity(db, act)
    assert len(created) == 1
    assert created[0].record_type == "distance"
    assert created[0].distance_label == "10K"
    assert created[0].value == 3000
    assert created[0].previous_value is None


def test_half_marathon_activity_also_yields_a_10k_and_5k_effort(db):
    """The whole point of Strava-style Best Efforts: a half marathon race
    contains a 5K and 10K sub-effort, not just a Half Marathon one."""
    act = _add_activity(db, days_ago=1, mean_max=_curve_json(distance_efforts={
        "5K": 1450, "10K": 2950, "Half Marathon": 6480,
    }))
    created = records.detect_new_records_for_activity(db, act)
    labels = {r.distance_label for r in created}
    assert labels == {"5K", "10K", "Half Marathon"}


def test_faster_effort_beats_prior_at_same_distance(db):
    _add_activity(db, days_ago=10, mean_max=_curve_json(distance_efforts={"5K": 1300}))
    newer = _add_activity(db, days_ago=1, mean_max=_curve_json(distance_efforts={"5K": 1200}))

    created = records.detect_new_records_for_activity(db, newer)
    assert len(created) == 1
    assert created[0].distance_label == "5K"
    assert created[0].value == 1200
    assert created[0].previous_value == 1300


def test_slower_effort_at_same_distance_creates_no_record(db):
    _add_activity(db, days_ago=10, mean_max=_curve_json(distance_efforts={"5K": 1200}))
    newer = _add_activity(db, days_ago=1, mean_max=_curve_json(distance_efforts={"5K": 1300}))

    created = records.detect_new_records_for_activity(db, newer)
    assert created == []


def test_distance_labels_are_tracked_independently(db):
    _add_activity(db, days_ago=10, mean_max=_curve_json(distance_efforts={"5K": 1300, "10K": 2700}))
    newer = _add_activity(
        db, days_ago=1,
        mean_max=_curve_json(distance_efforts={"5K": 1250, "10K": 2800}),  # 5K PR, 10K not
    )
    created = records.detect_new_records_for_activity(db, newer)
    assert len(created) == 1
    assert created[0].distance_label == "5K"


# --- chronological correctness (backfill ordering) ---

def test_incremental_detection_is_order_sensitive_by_insertion(db):
    """Out-of-order insertion (as in backfill's newest-first pages) can produce a
    stale PR for a later-inserted-but-earlier activity — this is exactly why
    rebuild_personal_records exists."""
    newer = _add_activity(db, days_ago=2, mean_max=_curve_json(distance_efforts={"5K": 1200}))
    created_newer = records.detect_new_records_for_activity(db, newer)
    assert len(created_newer) == 1 and created_newer[0].previous_value is None

    # A faster, older run inserted afterwards (simulating backfill order).
    older = _add_activity(db, days_ago=10, mean_max=_curve_json(distance_efforts={"5K": 1100}))
    created_older = records.detect_new_records_for_activity(db, older)
    # Nothing precedes `older` chronologically yet (in the DB), so it also looks
    # like a fresh PR from the incremental function's point of view.
    assert len(created_older) == 1 and created_older[0].previous_value is None

    assert (
        db.query(PersonalRecord).filter(PersonalRecord.distance_label == "5K").count() == 2
    )


def test_rebuild_fixes_chronological_ordering(db):
    newer = _add_activity(db, days_ago=2, mean_max=_curve_json(distance_efforts={"5K": 1200}))
    records.detect_new_records_for_activity(db, newer)
    older = _add_activity(db, days_ago=10, mean_max=_curve_json(distance_efforts={"5K": 1100}))
    records.detect_new_records_for_activity(db, older)

    created = records.rebuild_personal_records(db)
    assert created == 1  # only the older (faster, and chronologically first) run is a real PR

    remaining = db.query(PersonalRecord).filter(PersonalRecord.distance_label == "5K").all()
    assert len(remaining) == 1
    assert remaining[0].activity_id == older.id
    assert remaining[0].value == 1100


def test_rebuild_replays_duration_bests_in_order(db):
    _add_activity(db, days_ago=20, mean_max=_curve_json(power={"300": 260}))
    _add_activity(db, days_ago=10, mean_max=_curve_json(power={"300": 300}))
    _add_activity(db, days_ago=5, mean_max=_curve_json(power={"300": 280}))  # not a PR

    created = records.rebuild_personal_records(db)
    assert created == 2  # day-20 (first) and day-10 (beats it); day-5 doesn't beat 300

    bests = records.get_current_bests(db)
    assert len(bests) == 1
    assert bests[0].value == 300


def test_rebuild_scopes_to_user(db):
    _add_activity(db, days_ago=5, mean_max=_curve_json(power={"300": 300}), user_id=1)
    _add_activity(db, days_ago=5, mean_max=_curve_json(power={"300": 999}), user_id=2)

    created = records.rebuild_personal_records(db, user_id=1)
    assert created == 1
    assert db.query(PersonalRecord).filter(PersonalRecord.user_id == 2).count() == 0


# --- queries ---

def test_get_current_bests_returns_latest_per_key(db):
    _add_activity(db, days_ago=20, mean_max=_curve_json(power={"300": 260}))
    latest = _add_activity(db, days_ago=1, mean_max=_curve_json(power={"300": 310}))
    records.rebuild_personal_records(db)

    bests = records.get_current_bests(db)
    assert len(bests) == 1
    assert bests[0].activity_id == latest.id
    assert bests[0].value == 310


def test_get_recent_records_filters_by_window(db):
    _add_activity(db, days_ago=200, mean_max=_curve_json(power={"300": 260}))
    recent_act = _add_activity(db, days_ago=5, mean_max=_curve_json(power={"300": 310}))
    records.rebuild_personal_records(db)

    recent = records.get_recent_records(db, days=90)
    assert len(recent) == 1
    assert recent[0].activity_id == recent_act.id


def test_get_distance_top_n_ranks_fastest_first(db):
    _add_activity(db, days_ago=30, mean_max=_curve_json(distance_efforts={"5K": 1400}))
    _add_activity(db, days_ago=20, mean_max=_curve_json(distance_efforts={"5K": 1300}))
    _add_activity(db, days_ago=10, mean_max=_curve_json(distance_efforts={"5K": 1250}))
    _add_activity(db, days_ago=5, mean_max=_curve_json(distance_efforts={"5K": 1230}))
    records.rebuild_personal_records(db)

    top_n = records.get_distance_top_n(db, top_n=3)
    values = [r.value for r in top_n["5K"]]
    assert values == [1230, 1250, 1300]  # fastest first, only top 3


def test_get_distance_top_n_scoped_to_distance_type(db):
    _add_activity(db, days_ago=1, mean_max=_curve_json(power={"300": 300}, distance_efforts={"5K": 1200}))
    records.rebuild_personal_records(db)

    top_n = records.get_distance_top_n(db)
    assert list(top_n.keys()) == ["5K"]


# --- lazy backfill (pre-existing history synced before this feature shipped) ---

def test_ensure_records_backfilled_mines_pre_existing_history(db):
    """Simulates an account whose Garmin backfill completed long before this
    feature existed: activities exist, but no PersonalRecord rows do, and
    rebuild_personal_records was never triggered (only fires at the end of a
    fresh backfill). The lazy check should mine that history on first call."""
    _add_activity(db, days_ago=20, mean_max=_curve_json(power={"300": 260}))
    newer = _add_activity(db, days_ago=1, mean_max=_curve_json(power={"300": 300}))

    assert db.query(PersonalRecord).count() == 0
    records.ensure_records_backfilled(db)

    bests = records.get_current_bests(db)
    assert len(bests) == 1
    assert bests[0].activity_id == newer.id
    assert bests[0].value == 300


def test_ensure_records_backfilled_records_version_and_is_a_noop_after(db, monkeypatch):
    _add_activity(db, days_ago=1, mean_max=_curve_json(power={"300": 300}))
    records.ensure_records_backfilled(db)

    status = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == DEFAULT_USER_ID, SyncStatus.key == "personal_records_backfill_version")
        .first()
    )
    assert status is not None
    assert int(status.value) == records._BACKFILL_VERSION

    called = []
    monkeypatch.setattr(records, "rebuild_personal_records", lambda *a, **k: called.append(1))
    records.ensure_records_backfilled(db)
    assert called == []


def test_ensure_records_backfilled_is_a_noop_with_no_history(db, monkeypatch):
    called = []
    monkeypatch.setattr(records, "rebuild_personal_records", lambda *a, **k: called.append(1))
    records.ensure_records_backfilled(db)
    assert called == []
    # No history to version either way, but should not raise or loop forever
    # on a second call.
    records.ensure_records_backfilled(db)
    assert called == []


def test_personal_records_endpoint_backfills_pre_existing_activities(client, session_factory):
    """Reproduces the reported bug: activities synced before this feature
    existed should still surface on the Peak Performances panel, not just
    activities synced after it."""
    db = session_factory()
    _add_activity(db, days_ago=200, mean_max=_curve_json(power={"300": 260}))
    _add_activity(db, days_ago=100, mean_max=_curve_json(power={"300": 310}))
    db.close()

    resp = client.get("/api/v1/personal-records")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["current_bests"]) == 1
    assert body["current_bests"][0]["value"] == 310


# --- formatting ---

def test_format_activity_pr_context_includes_new_and_previous_values(db):
    _add_activity(db, days_ago=10, mean_max=_curve_json(power={"300": 280}))
    newer = _add_activity(db, days_ago=1, mean_max=_curve_json(power={"300": 300}))
    records.detect_new_records_for_activity(db, newer)

    context = records.format_activity_pr_context(db, newer.id)
    assert "300 W" in context
    assert "280 W" in context
    assert "5-min power" in context


def test_format_activity_pr_context_empty_when_no_records(db):
    act = _add_activity(db, days_ago=1, mean_max=_curve_json(power={"300": 100}))
    _add_activity(db, days_ago=5, mean_max=_curve_json(power={"300": 500}))
    # act doesn't beat anything, so no PR was ever created for it.
    assert records.format_activity_pr_context(db, act.id) == ""


def test_record_label_and_display_value_for_distance():
    r = PersonalRecord(
        user_id=1, record_type="distance", distance_label="Half Marathon",
        value=5530.0, activity_id=1, achieved_at=datetime.utcnow(),
    )
    assert records.record_label(r) == "Half Marathon"
    assert records.record_display_value(r) == "1:32:10"


def test_record_label_and_display_value_for_duration_pace():
    r = PersonalRecord(
        user_id=1, record_type="duration", metric="gap_speed", duration_sec=1200,
        value=1000.0 / (4 * 60) / 1.0 * 1.0,  # placeholder, overwritten below
        activity_id=1, achieved_at=datetime.utcnow(),
    )
    r.value = 1000 / (4.0 * 60)  # 4:00/km pace -> speed in m/s
    assert records.record_label(r) == "20-min GAP-pace"
    assert records.record_display_value(r) == "4:00/km"


# --- API ---

def test_personal_records_endpoint_returns_current_and_recent(client, session_factory):
    db = session_factory()
    _add_activity(db, days_ago=200, mean_max=_curve_json(power={"300": 260}))
    _add_activity(db, days_ago=5, mean_max=_curve_json(power={"300": 310}))
    records.rebuild_personal_records(db)
    db.close()

    resp = client.get("/api/v1/personal-records")
    assert resp.status_code == 200
    body = resp.json()
    assert body["recent_days"] == 90
    assert len(body["current_bests"]) == 1
    assert body["current_bests"][0]["value"] == 310
    assert body["current_bests"][0]["label"] == "5-min power"
    assert body["current_bests"][0]["display_value"] == "310 W"
    assert len(body["recent"]) == 1  # only the day-5 activity falls in the 90-day window


def test_personal_records_endpoint_returns_distance_bests_and_labels(client, session_factory):
    db = session_factory()
    _add_activity(db, days_ago=10, mean_max=_curve_json(distance_efforts={"5K": 1300}))
    _add_activity(db, days_ago=1, mean_max=_curve_json(distance_efforts={"5K": 1200}))
    records.rebuild_personal_records(db)
    db.close()

    resp = client.get("/api/v1/personal-records")
    assert resp.status_code == 200
    body = resp.json()
    assert body["distance_labels"][:3] == ["400m", "1/2 mile", "1K"]
    assert "Marathon" in body["distance_labels"]
    assert len(body["distance_bests"]["5K"]) == 2
    assert body["distance_bests"]["5K"][0]["value"] == 1200  # fastest first
    assert body["distance_bests"]["5K"][1]["value"] == 1300


def test_activity_detail_includes_personal_records(client, session_factory):
    db = session_factory()
    # Oldest activity establishes the initial baseline PR (nothing preceded it).
    baseline = _add_activity(db, days_ago=20, mean_max=_curve_json(power={"300": 280}))
    # A weaker effort in between never beats the baseline, so it sets no record.
    slower = _add_activity(db, days_ago=10, mean_max=_curve_json(power={"300": 260}))
    newer = _add_activity(db, days_ago=1, mean_max=_curve_json(power={"300": 300}))
    slower_id, newer_id = slower.id, newer.id
    db.close()

    resp = client.get(f"/api/v1/activities/{newer_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["personal_records"] is not None
    assert len(body["personal_records"]) == 1
    assert body["personal_records"][0]["value"] == 300
    assert body["personal_records"][0]["previous_value"] == 280

    resp2 = client.get(f"/api/v1/activities/{slower_id}")
    assert resp2.json()["personal_records"] is None
