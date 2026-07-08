"""Tests for the P3-3 custom chart builder endpoints."""
from datetime import date, datetime, timedelta

from app.models import Activity, DailySummary


def _add_activity(db, started_at, *, distance_m=10000.0, avg_hr=150, user_id=1):
    db.add(Activity(
        user_id=user_id,
        garmin_id=int(started_at.timestamp()),
        activity_type="running",
        name="Run",
        started_at=started_at,
        distance_m=distance_m,
        avg_hr=avg_hr,
        duration_sec=3000,
    ))
    db.commit()


def _add_daily_summary(db, day, *, sleep_score=80.0, user_id=1):
    db.add(DailySummary(user_id=user_id, date=day, sleep_score=sleep_score))
    db.commit()


def test_metrics_endpoint_lists_known_metrics(client, db):
    resp = client.get("/api/v1/custom-charts/metrics")
    assert resp.status_code == 200
    by_id = {m["id"]: m for m in resp.json()["metrics"]}
    assert by_id["avg_hr"]["group"] == "activity"
    assert by_id["sleep_score"]["group"] == "wellness"
    assert by_id["ctl"]["group"] == "load"
    assert by_id["distance_km"]["unit"] == "km"


def test_data_endpoint_rejects_unknown_metric(client, db):
    resp = client.get("/api/v1/custom-charts/data?metrics=not_a_real_metric&days=30")
    assert resp.status_code == 400


def test_data_endpoint_requires_metrics_param(client, db):
    resp = client.get("/api/v1/custom-charts/data?days=30")
    assert resp.status_code == 422


def test_data_endpoint_rejects_days_out_of_bounds(client, db):
    assert client.get("/api/v1/custom-charts/data?metrics=avg_hr&days=1").status_code == 422
    assert client.get("/api/v1/custom-charts/data?metrics=avg_hr&days=1000").status_code == 422


def test_data_endpoint_aggregates_activity_metrics_per_day(client, db):
    day = datetime(2026, 6, 10, 7, 0)
    _add_activity(db, day, distance_m=8000.0, avg_hr=140)
    _add_activity(db, day + timedelta(hours=8), distance_m=2000.0, avg_hr=160)

    resp = client.get("/api/v1/custom-charts/data?metrics=distance_km,avg_hr&days=30")
    assert resp.status_code == 200
    points = resp.json()["points"]
    point = next(p for p in points if p["date"] == "2026-06-10")
    assert point["values"]["distance_km"] == 10.0  # summed
    assert point["values"]["avg_hr"] == 150.0       # averaged


def test_data_endpoint_wellness_passthrough(client, db):
    _add_daily_summary(db, date(2026, 6, 11), sleep_score=87.5)
    resp = client.get("/api/v1/custom-charts/data?metrics=sleep_score&days=30")
    assert resp.status_code == 200
    points = resp.json()["points"]
    point = next(p for p in points if p["date"] == "2026-06-11")
    assert point["values"]["sleep_score"] == 87.5


def test_data_endpoint_merges_multiple_sources_by_date_with_nulls(client, db):
    day = date(2026, 6, 12)
    _add_activity(db, datetime.combine(day, datetime.min.time()).replace(hour=7), distance_m=5000.0)
    # No DailySummary row for this date.

    resp = client.get("/api/v1/custom-charts/data?metrics=distance_km,sleep_score&days=30")
    assert resp.status_code == 200
    point = next(p for p in resp.json()["points"] if p["date"] == "2026-06-12")
    assert point["values"]["distance_km"] == 5.0
    assert point["values"]["sleep_score"] is None


def test_data_endpoint_load_metrics_present(client, db):
    base = datetime(2026, 6, 1, 7, 0)
    for i in range(10):
        _add_activity(db, base + timedelta(days=i), distance_m=10000.0)
        db.query(Activity).filter(Activity.started_at == base + timedelta(days=i)).update(
            {"training_stress_score": 70.0}
        )
        db.commit()

    resp = client.get("/api/v1/custom-charts/data?metrics=ctl,tsb&days=30")
    assert resp.status_code == 200
    points = resp.json()["points"]
    assert len(points) > 0
    last = points[-1]
    assert last["values"]["ctl"] is not None
    assert last["values"]["tsb"] is not None


def test_data_endpoint_scopes_to_current_user(client, db):
    day = datetime(2026, 6, 13, 7, 0)
    _add_activity(db, day, distance_m=5000.0, user_id=2)  # other user
    resp = client.get("/api/v1/custom-charts/data?metrics=distance_km&days=30")
    assert resp.status_code == 200
    dates = [p["date"] for p in resp.json()["points"]]
    assert "2026-06-13" not in dates


def test_data_endpoint_without_compare_omits_compare_points(client, db):
    resp = client.get("/api/v1/custom-charts/data?metrics=avg_hr&days=30")
    assert resp.status_code == 200
    assert resp.json()["compare_points"] is None


def test_data_endpoint_compare_returns_prior_period_aligned_by_day_index(client, db):
    today = date.today()
    current_day = datetime.combine(today - timedelta(days=1), datetime.min.time()).replace(hour=7)
    _add_activity(db, current_day, distance_m=10000.0)
    # Same day-index (1 day before period end) in the prior 30-day period.
    prior_period_day = current_day - timedelta(days=30)
    _add_activity(db, prior_period_day, distance_m=6000.0)

    resp = client.get("/api/v1/custom-charts/data?metrics=distance_km&days=30&compare=true")
    assert resp.status_code == 200
    body = resp.json()
    assert body["compare_points"] is not None

    current_point = next(p for p in body["points"] if p["values"]["distance_km"] == 10.0)
    compare_point = next(p for p in body["compare_points"] if p["values"]["distance_km"] == 6.0)
    assert current_point["day_index"] == compare_point["day_index"]
