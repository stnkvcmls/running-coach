from datetime import date

from app.models import AthleteProfile
from app.utils import calculate_age


def test_get_returns_null_when_absent(client):
    resp = client.get("/api/v1/athlete-profile")
    assert resp.status_code == 200
    assert resp.json() is None


def test_post_creates_profile_with_editable_fields(client):
    payload = {
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
    assert body["goal_race"] == "Berlin Marathon"
    assert body["max_hr"] == 190

    # GET round-trips the same data
    fetched = client.get("/api/v1/athlete-profile").json()
    assert fetched["goal_race"] == "Berlin Marathon"
    assert fetched["resting_hr"] == 48


def test_post_ignores_garmin_managed_fields(client, db):
    """Name, DOB, and weight are sourced from Garmin and must not be set via POST."""
    # Seed Garmin-managed values as the sync would.
    db.add(AthleteProfile(name="Garmin Name", date_of_birth=date(1990, 6, 15), weight_kg=68.5))
    db.commit()

    resp = client.post(
        "/api/v1/athlete-profile",
        json={
            "name": "Hacker",
            "date_of_birth": "2000-01-01",
            "weight_kg": 99.9,
            "max_hr": 190,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    # Garmin-managed fields untouched; editable field applied.
    assert body["name"] == "Garmin Name"
    assert body["date_of_birth"] == "1990-06-15"
    assert body["weight_kg"] == 68.5
    assert body["max_hr"] == 190
    assert body["age"] == calculate_age(date(1990, 6, 15))


def test_post_does_not_create_garmin_fields(client):
    """Posting only Garmin-managed fields creates a row without those values."""
    resp = client.post(
        "/api/v1/athlete-profile",
        json={"name": "Ignore", "weight_kg": 80.0},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] is None
    assert body["weight_kg"] is None


def test_second_post_updates_in_place(client, db):
    client.post("/api/v1/athlete-profile", json={"goal_race": "First", "max_hr": 185})
    resp = client.post("/api/v1/athlete-profile", json={"goal_race": "Second", "max_hr": 188})
    assert resp.status_code == 200
    assert resp.json()["goal_race"] == "Second"
    # Singleton: exactly one row, not a duplicate insert.
    assert db.query(AthleteProfile).count() == 1


def test_partial_post_preserves_unspecified_fields(client):
    client.post(
        "/api/v1/athlete-profile",
        json={"resting_hr": 50, "goal_race": "10K PB"},
    )
    # Update only one field; the others must remain.
    client.post("/api/v1/athlete-profile", json={"resting_hr": 46})
    body = client.get("/api/v1/athlete-profile").json()
    assert body["resting_hr"] == 46
    assert body["goal_race"] == "10K PB"
