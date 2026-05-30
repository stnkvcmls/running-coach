from datetime import date

from app.models import AthleteProfile
from app.utils import calculate_age


def test_get_returns_null_when_absent(client):
    resp = client.get("/api/v1/athlete-profile")
    assert resp.status_code == 200
    assert resp.json() is None


def test_post_creates_profile_and_computes_age(client):
    dob = "1990-06-15"
    payload = {
        "name": "Sam Runner",
        "date_of_birth": dob,
        "weight_kg": 68.5,
        "goal_race": "Berlin Marathon",
        "goal_race_date": "2026-09-27",
        "threshold_hr": 168,
        "max_hr": 190,
        "resting_hr": 48,
    }
    resp = client.post("/api/v1/athlete-profile", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] >= 1
    assert body["name"] == "Sam Runner"
    assert body["age"] == calculate_age(date.fromisoformat(dob))

    # GET round-trips the same data
    fetched = client.get("/api/v1/athlete-profile").json()
    assert fetched["goal_race"] == "Berlin Marathon"
    assert fetched["age"] == body["age"]


def test_second_post_updates_in_place(client, db):
    client.post("/api/v1/athlete-profile", json={"name": "First", "max_hr": 185})
    resp = client.post("/api/v1/athlete-profile", json={"name": "Second", "max_hr": 188})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Second"
    # Singleton: exactly one row, not a duplicate insert.
    assert db.query(AthleteProfile).count() == 1


def test_partial_post_preserves_unspecified_fields(client):
    client.post(
        "/api/v1/athlete-profile",
        json={"name": "Keep Me", "resting_hr": 50, "goal_race": "10K PB"},
    )
    # Update only one field; the others must remain.
    client.post("/api/v1/athlete-profile", json={"resting_hr": 46})
    body = client.get("/api/v1/athlete-profile").json()
    assert body["resting_hr"] == 46
    assert body["name"] == "Keep Me"
    assert body["goal_race"] == "10K PB"
