"""Tests for the daily check-in endpoint and persistent-soreness niggle detection (P1-1)."""

from datetime import date

from app.models import CoachMemory, DailyCheckin


def test_submit_checkin_creates_row(client, db):
    resp = client.post(
        "/api/v1/daily-checkin?date=2026-06-17",
        json={"soreness": 4, "energy": 3, "mood": 5},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["date"] == "2026-06-17"
    assert body["soreness"] == 4
    assert body["energy"] == 3
    assert body["mood"] == 5
    assert db.query(DailyCheckin).count() == 1


def test_submit_checkin_defaults_to_today(client, db):
    resp = client.post("/api/v1/daily-checkin", json={"soreness": 3})
    assert resp.status_code == 200
    assert resp.json()["date"] == date.today().isoformat()


def test_submit_checkin_upserts_same_day(client, db):
    client.post("/api/v1/daily-checkin?date=2026-06-17", json={"soreness": 2, "energy": 2})
    resp = client.post("/api/v1/daily-checkin?date=2026-06-17", json={"soreness": 5, "mood": 4})
    assert resp.status_code == 200
    body = resp.json()
    assert body["soreness"] == 5
    assert body["energy"] is None  # overwritten, not merged
    assert body["mood"] == 4
    assert db.query(DailyCheckin).count() == 1


def test_submit_checkin_all_taps_optional(client, db):
    # An empty check-in (all taps skipped) is still a valid submission.
    resp = client.post("/api/v1/daily-checkin?date=2026-06-17", json={})
    assert resp.status_code == 200
    body = resp.json()
    assert body["soreness"] is None
    assert body["energy"] is None
    assert body["mood"] is None


def test_checkin_rejects_out_of_range_taps(client):
    resp = client.post("/api/v1/daily-checkin?date=2026-06-17", json={"soreness": 6})
    assert resp.status_code == 422


def test_checkin_accepts_soreness_note(client, db):
    resp = client.post(
        "/api/v1/daily-checkin?date=2026-06-17",
        json={"soreness": 2, "soreness_note": "left knee"},
    )
    assert resp.status_code == 200
    assert resp.json()["soreness_note"] == "left knee"


def test_today_endpoint_returns_null_checkin_when_none_logged(client, db):
    resp = client.get("/api/v1/today?date=2026-06-17")
    assert resp.status_code == 200
    assert resp.json()["daily_checkin"] is None


def test_today_endpoint_returns_logged_checkin(client, db):
    client.post("/api/v1/daily-checkin?date=2026-06-17", json={"soreness": 4, "energy": 4, "mood": 4})
    resp = client.get("/api/v1/today?date=2026-06-17")
    assert resp.json()["daily_checkin"]["soreness"] == 4


# --- Persistent soreness -> CoachMemory niggle ---

def test_persistent_sore_area_creates_niggle_after_three_checkins(client, db):
    for d in ("2026-06-15", "2026-06-16", "2026-06-17"):
        resp = client.post(
            f"/api/v1/daily-checkin?date={d}",
            json={"soreness": 2, "soreness_note": "left knee"},
        )
        assert resp.status_code == 200

    niggles = db.query(CoachMemory).filter(CoachMemory.category == "niggle").all()
    assert len(niggles) == 1
    assert niggles[0].tag == "left knee"
    assert niggles[0].active is True


def test_no_niggle_before_three_consecutive_checkins(client, db):
    for d in ("2026-06-16", "2026-06-17"):
        client.post(f"/api/v1/daily-checkin?date={d}", json={"soreness": 1, "soreness_note": "left knee"})
    assert db.query(CoachMemory).count() == 0


def test_no_niggle_without_soreness_note(client, db):
    for d in ("2026-06-15", "2026-06-16", "2026-06-17"):
        client.post(f"/api/v1/daily-checkin?date={d}", json={"soreness": 1})
    assert db.query(CoachMemory).count() == 0


def test_no_niggle_when_soreness_recovers(client, db):
    client.post("/api/v1/daily-checkin?date=2026-06-15", json={"soreness": 1, "soreness_note": "left knee"})
    client.post("/api/v1/daily-checkin?date=2026-06-16", json={"soreness": 1, "soreness_note": "left knee"})
    # Recovered on the third day - no niggle should be recorded.
    client.post("/api/v1/daily-checkin?date=2026-06-17", json={"soreness": 5, "soreness_note": "left knee"})
    assert db.query(CoachMemory).count() == 0


def test_no_niggle_when_area_changes(client, db):
    client.post("/api/v1/daily-checkin?date=2026-06-15", json={"soreness": 1, "soreness_note": "left knee"})
    client.post("/api/v1/daily-checkin?date=2026-06-16", json={"soreness": 1, "soreness_note": "right calf"})
    client.post("/api/v1/daily-checkin?date=2026-06-17", json={"soreness": 1, "soreness_note": "left knee"})
    assert db.query(CoachMemory).count() == 0


def test_niggle_not_duplicated_on_further_sore_checkins(client, db):
    for d in ("2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18"):
        client.post(f"/api/v1/daily-checkin?date={d}", json={"soreness": 2, "soreness_note": "left knee"})
    assert db.query(CoachMemory).filter(CoachMemory.category == "niggle").count() == 1
