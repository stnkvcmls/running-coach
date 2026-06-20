"""Generate a realistic, committed SQLite database for the performance suite.

Builds ``perf/perf.db`` directly from the app's SQLAlchemy models so the schema
can never drift from production. The data models a single amateur marathon
runner over three years:

  * ~260 running days/year (easy / interval / tempo / long), >2000 km/year
  * 365 daily health summaries per year (1095 total)
  * matching calendar workouts, a periodised training plan, AI insights,
    races, and sync metadata so every API endpoint has data to return.

The generation is deterministic (``random.seed``) so regenerating the database
produces a stable, reviewable artifact. Run with::

    python -m perf.seed_perf_db

DB_PATH is set to ``perf/perf.db`` before importing the app, so ``init_db`` and
the session factory bind to the file we are building.
"""

from __future__ import annotations

import json
import math
import os
import random
from datetime import date, datetime, time, timedelta
from pathlib import Path

PERF_DIR = Path(__file__).resolve().parent
DB_FILE = PERF_DIR / "perf.db"

# Bind the app's engine to the file we are seeding *before* importing app code.
os.environ["DB_PATH"] = str(DB_FILE)
os.environ.setdefault("GARMIN_TOKEN_DIR", str(PERF_DIR / ".garmin_tokens"))
os.environ.setdefault("AUTH_ENABLED", "false")

from app.database import SessionLocal, engine, init_db  # noqa: E402
from app.models import (  # noqa: E402
    Activity,
    AthleteProfile,
    DailySummary,
    GarminCalendarEvent,
    Insight,
    SyncStatus,
    TrainingPlan,
    TrainingPlanDay,
    User,
)

YEARS = 3
DAYS = YEARS * 365
DEV_EMAIL = "dev@localhost"

# Weekday → workout type (Mon=0 … Sun=6). Five running days/week (~260/year).
WEEKLY_PLAN = {
    0: "easy",
    1: "interval",
    2: "easy",
    3: "tempo",
    4: "rest",
    5: "easy",
    6: "long",
}

# Per-type generation profile: distance window (m), avg HR window, base pace
# (min/km), avg power (W) and training stress. Tuned for a sub-3:30 amateur.
WORKOUT_PROFILE = {
    "easy": dict(dist=(8000, 11000), hr=(132, 146), pace=5.7, power=250, tss=48),
    "interval": dict(dist=(8000, 10000), hr=(152, 166), pace=4.9, power=292, tss=82),
    "tempo": dict(dist=(10000, 13000), hr=(158, 169), pace=4.6, power=286, tss=92),
    "long": dict(dist=(18000, 30000), hr=(138, 151), pace=5.6, power=256, tss=140),
}

# Mean-maximal reference curves (best value per duration in seconds). Slightly
# perturbed per activity; the threshold estimator takes the frontier across all
# runs, yielding CP ≈ 285 W and CV ≈ 4.2 m/s (threshold pace ≈ 3:58/km).
_POWER_CURVE = {5: 420, 30: 360, 60: 340, 120: 325, 300: 310, 600: 300, 1200: 292, 1800: 288}
_GAP_SPEED_CURVE = {5: 6.2, 30: 5.6, 60: 5.3, 300: 4.7, 600: 4.5, 1200: 4.25, 1800: 4.15}

# Heavy per-sample detail streams are only attached to the most recent N runs so
# the activity-detail endpoint exercises full chart parsing without bloating the
# committed database. Older runs keep only lightweight lap/zone blobs.
RECENT_DETAIL_DAYS = 90
CALENDAR_EVENT_DAYS = 70  # workout/race events for the trailing window


def _rint(lo: int, hi: int) -> int:
    return random.randint(lo, hi)


def _seasonal_factor(d: date) -> float:
    """Mild seasonal volume swing (peak late spring, trough mid-winter)."""
    day_of_year = d.timetuple().tm_yday
    return 1.0 + 0.12 * math.sin((day_of_year / 365.0) * 2 * math.pi)


def _build_lap_splits(workout: str, distance_m: float, pace_min_km: float, avg_hr: int) -> str:
    """Garmin ``lapDTOs`` used by adherence + the detail 'splits' view."""
    laps = []
    if workout == "interval":
        # warmup, 6×(work/rest), cooldown
        laps.append({"distance": 1500, "duration": 1500 / 1000 * 5.8 * 60,
                     "intensityType": "WARMUP", "averageHR": avg_hr - 20})
        for _ in range(6):
            laps.append({"distance": 800, "duration": 800 / 1000 * 4.0 * 60,
                         "intensityType": "ACTIVE", "averageHR": avg_hr + 8})
            laps.append({"distance": 400, "duration": 400 / 1000 * 6.5 * 60,
                         "intensityType": "REST", "averageHR": avg_hr - 15})
        laps.append({"distance": 1300, "duration": 1300 / 1000 * 5.8 * 60,
                     "intensityType": "COOLDOWN", "averageHR": avg_hr - 18})
    else:
        n = max(3, int(distance_m // 1000))
        per = distance_m / n
        for _ in range(n):
            laps.append({"distance": round(per, 1), "duration": per / 1000 * pace_min_km * 60,
                         "intensityType": "ACTIVE", "averageHR": avg_hr + _rint(-4, 4)})
    return json.dumps({"lapDTOs": laps})


def _build_detail_streams(n: int, avg_hr: int, max_hr: int, pace_min_km: float, power: int) -> str:
    """Per-sample detail metrics consumed by ``parse_activity_charts``."""
    descriptors = [
        {"key": "directHeartRate", "metricsIndex": 0},
        {"key": "directElevation", "metricsIndex": 1},
        {"key": "directSpeed", "metricsIndex": 2},
        {"key": "directRunCadence", "metricsIndex": 3},
        {"key": "directPower", "metricsIndex": 4},
        {"key": "directGroundContactTime", "metricsIndex": 5},
        {"key": "directVerticalOscillation", "metricsIndex": 6},
        {"key": "directVerticalRatio", "metricsIndex": 7},
        {"key": "directStrideLength", "metricsIndex": 8},
    ]
    speed = 1000.0 / (pace_min_km * 60.0)  # m/s
    metrics = []
    for i in range(n):
        frac = i / max(1, n - 1)
        hr = round(avg_hr + (max_hr - avg_hr) * 0.6 * math.sin(frac * math.pi) + _rint(-3, 3))
        metrics.append({"metrics": [
            hr,
            round(40 + 15 * math.sin(frac * 4 * math.pi), 1),         # elevation
            round(speed * (0.95 + 0.1 * random.random()), 3),          # speed m/s
            round(85 + _rint(-3, 3)),                                   # half-cadence
            round(power * (0.9 + 0.2 * random.random())),              # power
            round(245 + _rint(-15, 15)),                               # GCT ms
            round(8.0 + random.random(), 1),                           # vert osc cm
            round(7.5 + random.random(), 1),                           # vert ratio %
            round(1.15 + 0.1 * random.random(), 2),                    # stride m
        ]})
    return json.dumps({"metricDescriptors": descriptors, "activityDetailMetrics": metrics})


def _build_mean_max(intensity: float) -> str:
    power = {str(k): round(v * intensity * (0.98 + 0.04 * random.random())) for k, v in _POWER_CURVE.items()}
    gap = {str(k): round(v * intensity * (0.98 + 0.04 * random.random()), 3) for k, v in _GAP_SPEED_CURVE.items()}
    return json.dumps({"power": power, "gap_speed": gap, "is_treadmill": False})


def _build_hr_zones(avg_hr: int) -> str:
    return json.dumps([
        {"zoneNumber": z, "secsInZone": _rint(120, 1200), "zoneLowBoundary": 100 + z * 15}
        for z in range(1, 6)
    ])


def _build_weather() -> str:
    return json.dumps({
        "temp": _rint(2, 26),
        "apparentTemp": _rint(1, 27),
        "relativeHumidity": _rint(40, 90),
        "windSpeed": _rint(0, 25),
        "weatherTypeDesc": random.choice(["Clear", "Cloudy", "Light rain", "Partly cloudy"]),
    })


def _build_workout_raw_json(workout: str) -> str:
    """Structured Garmin workout steps for calendar events (parsed by adherence)."""
    if workout == "interval":
        steps = [
            {"stepType": "warmup", "endCondition": "distance", "endConditionValue": 1500,
             "targetType": "open"},
            {"stepType": "repeat", "numberOfIterations": 6, "workoutSteps": [
                {"stepType": "interval", "endCondition": "distance", "endConditionValue": 800,
                 "targetType": "pace", "targetValueOne": 4.16},
                {"stepType": "rest", "endCondition": "distance", "endConditionValue": 400,
                 "targetType": "open"},
            ]},
            {"stepType": "cooldown", "endCondition": "distance", "endConditionValue": 1300,
             "targetType": "open"},
        ]
    elif workout == "tempo":
        steps = [
            {"stepType": "warmup", "endCondition": "distance", "endConditionValue": 2000,
             "targetType": "open"},
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 8000,
             "targetType": "pace", "targetValueOne": 3.7},
            {"stepType": "cooldown", "endCondition": "distance", "endConditionValue": 2000,
             "targetType": "open"},
        ]
    elif workout == "long":
        steps = [{"stepType": "interval", "endCondition": "distance", "endConditionValue": 22000,
                  "targetType": "pace", "targetValueOne": 2.98}]
    else:  # easy
        steps = [{"stepType": "interval", "endCondition": "distance", "endConditionValue": 9000,
                  "targetType": "open"}]
    return json.dumps({"workoutSteps": steps})


def _make_activity(d: date, workout: str, garmin_id: int, with_detail: bool) -> Activity:
    prof = WORKOUT_PROFILE[workout]
    season = _seasonal_factor(d)
    distance_m = round(_rint(*prof["dist"]) * season)
    pace = prof["pace"] * (0.97 + 0.06 * random.random())
    avg_hr = _rint(*prof["hr"])
    max_hr = avg_hr + _rint(8, 18)
    duration = distance_m / 1000 * pace * 60
    power = prof["power"] + _rint(-8, 8)
    intensity = {"easy": 0.9, "interval": 1.02, "tempo": 1.0, "long": 0.93}[workout]
    started = datetime.combine(d, time(hour=_rint(6, 18), minute=_rint(0, 59)))

    return Activity(
        garmin_id=garmin_id,
        activity_type="running",
        name=f"{workout.title()} Run",
        started_at=started,
        duration_sec=round(duration, 1),
        distance_m=distance_m,
        avg_hr=avg_hr,
        max_hr=max_hr,
        min_hr=avg_hr - _rint(20, 35),
        avg_pace_min_km=round(pace, 2),
        avg_speed=round(1000.0 / (pace * 60.0), 3),
        max_speed=round(1000.0 / (pace * 60.0) * 1.25, 3),
        calories=round(distance_m / 1000 * 65),
        elevation_gain=round(_rint(20, 220) * season, 1),
        elevation_loss=round(_rint(20, 220) * season, 1),
        max_elevation=round(_rint(60, 320), 1),
        min_elevation=round(_rint(0, 50), 1),
        avg_cadence=round(_rint(168, 182)),
        max_cadence=round(_rint(184, 196)),
        avg_stride=round(1.1 + 0.2 * random.random(), 2),
        avg_ground_contact_time=round(240 + _rint(-15, 15)),
        avg_vertical_oscillation=round(7.5 + random.random() * 2, 1),
        avg_vertical_ratio=round(7.0 + random.random(), 1),
        avg_power=power,
        normalized_power=power + _rint(2, 14),
        training_stress_score=round(prof["tss"] * season + _rint(-6, 6)),
        intensity_factor=round(0.7 + 0.2 * random.random(), 2),
        avg_respiration_rate=round(34 + random.random() * 8, 1),
        max_respiration_rate=round(44 + random.random() * 8, 1),
        training_effect_aerobic=round(2.0 + random.random() * 2.5, 1),
        training_effect_anaerobic=round(random.random() * 2.5, 1),
        vo2max=round(50 + random.random() * 4, 1),
        run_time_sec=round(duration * 0.97, 1),
        walk_time_sec=round(duration * 0.03, 1),
        splits_json=_build_lap_splits(workout, distance_m, pace, avg_hr),
        laps_json=_build_detail_streams(120, avg_hr, max_hr, pace, power) if with_detail else None,
        hr_zones_json=_build_hr_zones(avg_hr),
        power_zones_json=_build_hr_zones(avg_hr),
        typed_splits_json=json.dumps({"workout": workout}),
        weather_json=_build_weather(),
        mean_max_json=_build_mean_max(intensity),
        ai_analyzed=random.random() < 0.5,
    )


def _make_daily(d: date, trained: bool) -> DailySummary:
    return DailySummary(
        date=d,
        steps=_rint(9000, 22000) if trained else _rint(5000, 12000),
        total_calories=_rint(2400, 3400),
        active_calories=_rint(500, 1500) if trained else _rint(150, 600),
        resting_hr=_rint(42, 52),
        max_hr=_rint(150, 188) if trained else _rint(110, 140),
        stress_avg=_rint(22, 48),
        sleep_seconds=_rint(5 * 3600, 9 * 3600),
        sleep_score=round(_rint(55, 95) + random.random(), 1),
        body_battery_high=_rint(70, 100),
        body_battery_low=_rint(5, 35),
        intensity_minutes=_rint(30, 120) if trained else _rint(0, 30),
        floors_climbed=_rint(3, 25),
        raw_json=json.dumps({"source": "perf-seed"}),
        ai_analyzed=random.random() < 0.3,
    )


def seed() -> dict:
    random.seed(42)

    # Start clean so reruns are reproducible.
    for suffix in ("", "-wal", "-shm"):
        p = Path(str(DB_FILE) + suffix)
        if p.exists():
            p.unlink()

    init_db()  # create tables + seed metric_zones / zone_configs

    end = date.today()
    start = end - timedelta(days=DAYS - 1)

    session = SessionLocal()
    try:
        session.add(User(email=DEV_EMAIL, full_name="Alex Marathoner"))

        session.add(AthleteProfile(
            name="Alex Marathoner",
            date_of_birth=date(1990, 4, 12),
            weight_kg=68.0,
            goal_race="Berlin Marathon",
            goal_race_date=end + timedelta(days=90),
            threshold_pace_min_km=4.3,
            threshold_hr=170,
            threshold_power=300,
            max_hr=190,
            resting_hr=48,
            injury_history="Mild left achilles tendinopathy (2024), fully recovered.",
            weekly_availability="6 days, ~6-8 hours",
            training_preferences=json.dumps({"long_run_day": "Sunday", "surface": "road"}),
        ))
        session.flush()

        activities: list[Activity] = []
        garmin_id = 1_000_000_000
        # Bucket by rolling 365-day window from ``start`` (calendar years are
        # partial at the ends of the 3-year span and would understate totals).
        run_days_per_year: dict[int, int] = {}
        km_per_year: dict[int, float] = {}

        d = start
        while d <= end:
            window = (d - start).days // 365
            workout = WEEKLY_PLAN[d.weekday()]
            trained = workout != "rest"
            # Occasional unplanned rest (~6%) to look human, but stay > 250/yr.
            if trained and random.random() < 0.06:
                trained = False
            session.add(_make_daily(d, trained))
            if trained:
                with_detail = (end - d).days <= RECENT_DETAIL_DAYS
                act = _make_activity(d, workout, garmin_id, with_detail)
                garmin_id += 1
                session.add(act)
                activities.append(act)
                run_days_per_year[window] = run_days_per_year.get(window, 0) + 1
                km_per_year[window] = km_per_year.get(window, 0.0) + act.distance_m / 1000
            d += timedelta(days=1)

        session.flush()  # assign activity ids

        # --- Insights: latest ~180 activities + a sampling of daily summaries ---
        for act in activities[-180:]:
            session.add(Insight(
                created_at=act.started_at,
                trigger_type="activity",
                trigger_id=act.id,
                category=random.choice(["workout_analysis", "recovery", "trend", "recommendation"]),
                summary=f"{act.name}: solid session, controlled effort.",
                content=(
                    f"Your {act.name.lower()} covered {act.distance_m/1000:.1f} km at "
                    f"{act.avg_pace_min_km:.2f} min/km, avg HR {act.avg_hr}. Aerobic decoupling "
                    "stayed low — a sign of good durability. Keep the easy days easy."
                ),
            ))

        recent_dailies = (
            session.query(DailySummary).order_by(DailySummary.date.desc()).limit(60).all()
        )
        for ds in recent_dailies[::3]:
            session.add(Insight(
                created_at=datetime.combine(ds.date, time(8, 0)),
                trigger_type="daily_summary",
                trigger_id=ds.id,
                category="recovery",
                summary="Recovery trending well.",
                content=f"Resting HR {ds.resting_hr} bpm with a sleep score of {ds.sleep_score}.",
            ))

        # --- Calendar workout events for the trailing window + future races ---
        d = end - timedelta(days=CALENDAR_EVENT_DAYS)
        ev_id = 0
        while d <= end + timedelta(days=14):
            workout = WEEKLY_PLAN[d.weekday()]
            if workout != "rest":
                ev_id += 1
                session.add(GarminCalendarEvent(
                    garmin_id=f"wo-{ev_id}",
                    event_type="workout",
                    date=d,
                    title=f"{workout.title()} Run",
                    workout_type=workout,
                    workout_description=f"Planned {workout} session",
                    raw_json=_build_workout_raw_json(workout),
                ))
            d += timedelta(days=1)

        races = [
            ("Spring 10K Tune-up", 18, 10000, "10K", 2400, "B"),
            ("Half Marathon Championship", 45, 21097, "Half Marathon", 5400, "B"),
            ("Berlin Marathon", 90, 42195, "Marathon", 12000, "A"),
        ]
        for title, days_out, dist, label, goal, prio in races:
            ev_id += 1
            session.add(GarminCalendarEvent(
                garmin_id=f"race-{ev_id}",
                event_type="race",
                date=end + timedelta(days=days_out),
                title=title,
                distance_m=dist,
                distance_label=label,
                goal_time_sec=goal,
                priority=prio,
                raw_json=json.dumps({"eventType": "race"}),
            ))

        # --- Periodised 4-week training plan covering the current block ---
        week_start = end - timedelta(days=end.weekday())
        plan = TrainingPlan(
            generated_at=datetime.combine(end, time(9, 0)),
            week_start=week_start,
            plan_weeks=4,
            phase="build",
            overview="Four-week build block sharpening marathon-specific endurance "
                     "with controlled tempo volume and a midblock long-run progression.",
            raw_json=json.dumps({"source": "perf-seed"}),
        )
        session.add(plan)
        session.flush()

        themes = ["Aerobic Build", "Threshold Focus", "Marathon Pace", "Recovery & Sharpen"]
        for wk in range(4):
            for offset in range(7):
                day_date = week_start + timedelta(days=wk * 7 + offset)
                workout = WEEKLY_PLAN[day_date.weekday()]
                prof = WORKOUT_PROFILE.get(workout)
                target_dist = (sum(prof["dist"]) / 2) if prof else None
                session.add(TrainingPlanDay(
                    plan_id=plan.id,
                    day_date=day_date,
                    day_of_week=day_date.strftime("%A"),
                    week_number=wk + 1,
                    workout_type=workout,
                    target_distance_m=target_dist,
                    target_pace_min_km=prof["pace"] if prof else None,
                    target_pace_display=f"{int(prof['pace'])}:{int((prof['pace']%1)*60):02d}/km" if prof else None,
                    description=f"{workout.title()} session" if workout != "rest" else "Rest day",
                    notes="Hydrate and keep easy days easy." if workout != "rest" else None,
                    week_theme=themes[wk],
                ))

        # --- Sync metadata for /settings and /ai-config ---
        now_iso = datetime.utcnow().isoformat()
        for key, value in [
            ("ai_provider", "claude"),
            ("ai_model", "claude-sonnet-4-6"),
            ("last_activity_sync", now_iso),
            ("last_daily_sync", now_iso),
            ("last_calendar_sync", now_iso),
        ]:
            session.add(SyncStatus(key=key, value=value))

        session.commit()

        counts = {
            "activities": session.query(Activity).count(),
            "daily_summaries": session.query(DailySummary).count(),
            "insights": session.query(Insight).count(),
            "calendar_events": session.query(GarminCalendarEvent).count(),
            "training_plan_days": session.query(TrainingPlanDay).count(),
        }
    finally:
        session.close()

    # Collapse the WAL into the main file so a single .db is committed.
    with engine.connect() as conn:
        conn.exec_driver_sql("PRAGMA wal_checkpoint(TRUNCATE)")
    engine.dispose()
    for suffix in ("-wal", "-shm"):
        p = Path(str(DB_FILE) + suffix)
        if p.exists():
            p.unlink()

    # --- Validate the data meets the brief ---
    min_run_days = min(run_days_per_year.values())
    min_km = min(km_per_year.values())
    assert min_run_days >= 250, f"Only {min_run_days} running days in a year (need >=250)"
    assert min_km >= 2000, f"Only {min_km:.0f} km in a year (need >=2000)"
    assert counts["daily_summaries"] == DAYS, counts["daily_summaries"]

    print(f"Seeded {DB_FILE} ({DB_FILE.stat().st_size / 1_000_000:.1f} MB)")
    print(f"  date range: {start} → {end} ({YEARS} years)")
    for w in sorted(run_days_per_year):
        print(f"  year {w + 1}: {run_days_per_year[w]} running days, {km_per_year[w]:.0f} km")
    for k, v in counts.items():
        print(f"  {k}: {v}")
    return counts


if __name__ == "__main__":
    seed()
