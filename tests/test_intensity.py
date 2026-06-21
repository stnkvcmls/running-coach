"""Tests for app.intensity — time-in-zone aggregation and context formatting."""
from __future__ import annotations

import json
from datetime import date, datetime, timedelta

import pytest

from app.intensity import (
    _parse_garmin_zones,
    _polarization,
    aggregate_weekly_intensity,
    compute_zone_distribution_from_streams,
    format_intensity_context,
)
from app.models import Activity, ZoneConfig


def _zone_configs(zone_type: str = "hr") -> list[ZoneConfig]:
    bounds = [(None, 75), (75, 85), (85, 95), (95, 105), (105, None)]
    return [
        ZoneConfig(
            zone_type=zone_type,
            zone_number=i + 1,
            zone_name=f"Zone {i + 1}",
            zone_color="#fff",
            min_pct=lo,
            max_pct=hi,
        )
        for i, (lo, hi) in enumerate(bounds)
    ]


def _make_activity(db, day: date, hr_zones: dict | None = None):
    zones_json = json.dumps([
        {"zoneNumber": k, "secsInZone": v}
        for k, v in (hr_zones or {1: 600, 2: 1200, 3: 300, 4: 60, 5: 30}).items()
    ])
    act = Activity(
        garmin_id=abs(hash(str(day))) % (10**9),
        activity_type="running",
        name="Easy Run",
        started_at=datetime.combine(day, datetime.min.time()),
        hr_zones_json=zones_json,
    )
    db.add(act)
    db.flush()
    return act


class TestParseGarminZones:
    def test_valid_json(self):
        raw = json.dumps([
            {"zoneNumber": 1, "secsInZone": 600},
            {"zoneNumber": 2, "secsInZone": 1200},
            {"zoneNumber": 3, "secsInZone": 0},
        ])
        result = _parse_garmin_zones(raw)
        assert result == {1: 600.0, 2: 1200.0}

    def test_none_input(self):
        assert _parse_garmin_zones(None) == {}

    def test_invalid_json(self):
        assert _parse_garmin_zones("not-json") == {}

    def test_non_list(self):
        assert _parse_garmin_zones(json.dumps({"a": 1})) == {}


class TestPolarization:
    def test_well_polarized(self):
        secs = {1: 3600, 2: 3600, 3: 600, 4: 600, 5: 600}
        easy, mod, hard = _polarization(secs)
        assert easy == pytest.approx(80.0, abs=0.5)
        assert mod == pytest.approx(7.0, abs=1)
        assert hard == pytest.approx(13.0, abs=1)

    def test_empty(self):
        assert _polarization({}) == (None, None, None)

    def test_only_easy(self):
        easy, mod, hard = _polarization({1: 1000, 2: 1000})
        assert easy == 100.0
        assert mod == 0.0
        assert hard == 0.0


class TestComputeZoneDistributionFromStreams:
    def _make_streams(self, hr_vals: list[float]) -> dict:
        n = len(hr_vals)
        return {
            "time": list(range(n)),
            "hr": hr_vals,
            "speed": [3.0] * n,
        }

    def test_basic_hr_classification(self):
        configs = _zone_configs("hr")
        threshold = 160.0
        # All samples at 128 bpm → 80% of 160 → Zone 2 (75–85%)
        streams = self._make_streams([128.0] * 10)
        result = compute_zone_distribution_from_streams(streams, configs, threshold, "hr")
        assert 2 in result
        assert result[2] > 0

    def test_no_threshold(self):
        configs = _zone_configs("hr")
        streams = self._make_streams([130.0] * 5)
        assert compute_zone_distribution_from_streams(streams, configs, None, "hr") == {}

    def test_empty_configs(self):
        streams = self._make_streams([130.0] * 5)
        assert compute_zone_distribution_from_streams(streams, [], 160.0, "hr") == {}

    def test_mixed_zones(self):
        configs = _zone_configs("hr")
        threshold = 160.0
        # 5 samples at 112 (70% → Zone 1) and 5 at 152 (95% → Zone 4)
        hr_vals = [112.0] * 5 + [152.0] * 5
        streams = self._make_streams(hr_vals)
        result = compute_zone_distribution_from_streams(streams, configs, threshold, "hr")
        assert 1 in result
        assert 4 in result


class TestAggregateWeeklyIntensity:
    def test_basic_aggregation(self, db):
        today = date(2026, 6, 16)  # Monday
        _make_activity(db, today)
        _make_activity(db, today + timedelta(days=1))
        db.commit()

        weeks = aggregate_weekly_intensity(db, days=14, zone_type="hr", as_of=today + timedelta(days=2))
        assert len(weeks) >= 1
        week = weeks[-1]
        assert "zone_seconds" in week
        assert week["total_seconds"] > 0
        assert week["easy_pct"] is not None

    def test_empty_result(self, db):
        weeks = aggregate_weekly_intensity(db, days=7, zone_type="hr", as_of=date(2000, 1, 1))
        assert weeks == []

    def test_power_zones_fallback(self, db):
        today = date(2026, 6, 16)
        zones_json = json.dumps([
            {"zoneNumber": 1, "secsInZone": 300},
            {"zoneNumber": 2, "secsInZone": 600},
        ])
        act = Activity(
            garmin_id=99999,
            activity_type="running",
            name="Run",
            started_at=datetime.combine(today, datetime.min.time()),
            power_zones_json=zones_json,
        )
        db.add(act)
        db.commit()

        weeks = aggregate_weekly_intensity(db, days=7, zone_type="power", as_of=today + timedelta(days=1))
        assert len(weeks) == 1
        assert weeks[0]["total_seconds"] == 900.0

    def test_weeks_sorted_ascending(self, db):
        monday = date(2026, 6, 8)
        for offset in [0, 7]:
            _make_activity(db, monday + timedelta(days=offset))
        db.commit()

        weeks = aggregate_weekly_intensity(db, days=21, zone_type="hr", as_of=monday + timedelta(days=14))
        starts = [w["week_start"] for w in weeks]
        assert starts == sorted(starts)


class TestFormatIntensityContext:
    def _make_week(self, week_start: date, easy: float, mod: float, hard: float) -> dict:
        total = easy + mod + hard
        return {
            "week_start": week_start,
            "zone_seconds": {"1": easy * 0.6, "2": easy * 0.4, "3": mod, "4": hard * 0.7, "5": hard * 0.3},
            "total_seconds": total,
            "easy_pct": round(100 * easy / total, 1),
            "moderate_pct": round(100 * mod / total, 1),
            "hard_pct": round(100 * hard / total, 1),
        }

    def test_output_contains_weeks(self):
        weeks = [self._make_week(date(2026, 6, 1) + timedelta(weeks=i), 5400, 600, 600) for i in range(4)]
        ctx = format_intensity_context(weeks)
        assert "Intensity Distribution" in ctx
        assert "Week of" in ctx

    def test_empty_weeks(self):
        assert format_intensity_context([]) == ""

    def test_shows_at_most_4_weeks(self):
        weeks = [self._make_week(date(2026, 1, 1) + timedelta(weeks=i), 5400, 600, 600) for i in range(10)]
        ctx = format_intensity_context(weeks)
        assert ctx.count("Week of") == 4

    def test_api_endpoint(self, client):
        resp = client.get("/api/v1/intensity-trends", params={"days": 30, "zone_type": "hr"})
        assert resp.status_code == 200
        body = resp.json()
        assert "weeks" in body
        assert body["zone_type"] == "hr"
        assert body["days"] == 30

    def test_api_endpoint_power(self, client):
        resp = client.get("/api/v1/intensity-trends", params={"days": 30, "zone_type": "power"})
        assert resp.status_code == 200
        assert resp.json()["zone_type"] == "power"

    def test_api_endpoint_invalid_zone_type_defaults_to_hr(self, client):
        resp = client.get("/api/v1/intensity-trends", params={"days": 30, "zone_type": "invalid"})
        assert resp.status_code == 200
        assert resp.json()["zone_type"] == "hr"
