import json
import logging
import threading
import time
from datetime import datetime, date, timedelta, timezone

from garminconnect import Garmin
from sqlalchemy.orm import Session

from app.config import settings
from app.database import db_session
from app.models import Activity, DailySummary, GarminCalendarEvent, SyncStatus

logger = logging.getLogger(__name__)

_garmin_client: Garmin | None = None
_garmin_lock = threading.Lock()


def get_garmin_client() -> Garmin:
    """Get or create an authenticated Garmin client."""
    global _garmin_client
    with _garmin_lock:
        if _garmin_client is not None:
            try:
                _garmin_client.get_full_name()
                return _garmin_client
            except Exception:
                logger.info("Garmin session expired, re-authenticating")
                _garmin_client = None

        client = Garmin(settings.garmin_email, settings.garmin_password)
        try:
            client.login(settings.garmin_token_dir)
        except Exception:
            logger.info("Token login failed, doing fresh login")
            client.login()
            client.garth.dump(settings.garmin_token_dir)
        _garmin_client = client
        logger.info("Garmin authenticated as %s", client.get_full_name())
        return client


def _get_sync_status(db: Session, key: str) -> str | None:
    row = db.query(SyncStatus).filter(SyncStatus.key == key).first()
    return row.value if row else None


def _set_sync_status(db: Session, key: str, value: str):
    row = db.query(SyncStatus).filter(SyncStatus.key == key).first()
    if row:
        row.value = value
        row.updated_at = datetime.now(timezone.utc)
    else:
        row = SyncStatus(key=key, value=value, updated_at=datetime.now(timezone.utc))
        db.add(row)
    db.commit()


def _extract_activity_fields(summary: dict, details: dict | None = None) -> dict:
    """Extract relevant fields from Garmin activity data."""
    activity_id = summary.get("activityId")
    duration = summary.get("duration")
    distance = summary.get("distance")

    avg_pace = None
    if distance and duration and distance > 0:
        avg_pace = (duration / 60) / (distance / 1000)  # min/km

    fields = {
        "garmin_id": activity_id,
        "activity_type": summary.get("activityType", {}).get("typeKey", "unknown"),
        "name": summary.get("activityName", ""),
        "started_at": _parse_garmin_ts(summary.get("startTimeLocal")),
        "duration_sec": duration,
        "distance_m": distance,
        "avg_hr": summary.get("averageHR"),
        "max_hr": summary.get("maxHR"),
        "avg_pace_min_km": avg_pace,
        "calories": summary.get("calories"),
        "elevation_gain": summary.get("elevationGain"),
        "elevation_loss": summary.get("elevationLoss"),
        "avg_cadence": summary.get("averageRunningCadenceInStepsPerMinute"),
        "avg_stride": summary.get("avgStrideLength"),
        "training_effect_aerobic": summary.get("aerobicTrainingEffect"),
        "training_effect_anaerobic": summary.get("anaerobicTrainingEffect"),
        "vo2max": summary.get("vO2MaxValue"),
        "avg_power": summary.get("avgPower"),
    }

    # Extract additional fields from full activity summary (get_activity response)
    act_summary = details.get("activity_summary") if details else None
    # Merge: prefer detailed summary, fall back to list summary for some fields
    src = act_summary or summary
    fields.update({
        "avg_ground_contact_time": src.get("avgGroundContactTime"),
        "avg_vertical_oscillation": src.get("avgVerticalOscillation"),
        "avg_vertical_ratio": src.get("avgVerticalRatio"),
        "normalized_power": src.get("normPower"),
        "training_stress_score": src.get("trainingStressScore"),
        "intensity_factor": src.get("intensityFactor"),
        "avg_respiration_rate": src.get("avgRespirationRate"),
        "max_respiration_rate": src.get("maxRespirationRate"),
        "avg_speed": src.get("averageSpeed"),
        "max_speed": src.get("maxSpeed"),
        "min_hr": src.get("minHR"),
        "max_elevation": src.get("maxElevation"),
        "min_elevation": src.get("minElevation"),
        "max_cadence": src.get("maxRunningCadenceInStepsPerMinute"),
    })

    return fields


def _parse_garmin_ts(ts_str: str | None) -> datetime | None:
    if not ts_str:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(ts_str, fmt)
        except (ValueError, TypeError):
            continue
    return None


def _fetch_activity_details(client: Garmin, activity_id) -> dict:
    """Fetch all detail endpoints for an activity."""
    details = {}
    try:
        details["activity_summary"] = client.get_activity(activity_id)
    except Exception as e:
        logger.debug("No activity summary for %s: %s", activity_id, e)

    try:
        details["splits"] = client.get_activity_splits(activity_id)
    except Exception as e:
        logger.debug("No splits for %s: %s", activity_id, e)

    try:
        details["hr_zones"] = client.get_activity_hr_in_timezones(activity_id)
    except Exception as e:
        logger.debug("No HR zones for %s: %s", activity_id, e)

    try:
        details["weather"] = client.get_activity_weather(activity_id)
    except Exception as e:
        logger.debug("No weather for %s: %s", activity_id, e)

    try:
        details["split_summaries"] = client.get_activity_split_summaries(activity_id)
    except Exception as e:
        logger.debug("No split summaries for %s: %s", activity_id, e)

    try:
        details["typed_splits"] = client.get_activity_typed_splits(activity_id)
    except Exception as e:
        logger.debug("No typed splits for %s: %s", activity_id, e)

    return details


def _store_activity(db: Session, summary: dict, details: dict, skip_ai: bool = False) -> Activity | None:
    """Store an activity in the database. Returns the Activity if newly created."""
    garmin_id = summary.get("activityId")
    if not garmin_id:
        return None

    existing = db.query(Activity).filter(Activity.garmin_id == garmin_id).first()
    if existing:
        return None

    fields = _extract_activity_fields(summary, details or {})

    # Parse run/walk times from typed splits
    run_time_sec = None
    walk_time_sec = None
    typed_splits = details.get("typed_splits")
    if isinstance(typed_splits, list):
        run_secs = 0.0
        walk_secs = 0.0
        for s in typed_splits:
            split_type = (s.get("splitType") or "").upper()
            dur = s.get("totalElapsedDuration") or 0
            if "RUNNING" in split_type:
                run_secs += dur
            elif "WALKING" in split_type or "WALK" in split_type:
                walk_secs += dur
        if run_secs > 0:
            run_time_sec = run_secs
        if walk_secs > 0:
            walk_time_sec = walk_secs

    # Extract power zones from full activity summary
    act_summary = (details or {}).get("activity_summary") or {}
    power_zones = act_summary.get("powerZoneSummaries")

    # Fetch laps from the summary's built-in laps if available
    laps = None
    try:
        client = get_garmin_client()
        laps_data = client.get_activity_details(garmin_id)
        laps = laps_data
    except Exception as e:
        logger.debug("No detailed data for %s: %s", garmin_id, e)

    activity = Activity(
        **fields,
        run_time_sec=run_time_sec,
        walk_time_sec=walk_time_sec,
        laps_json=json.dumps(laps) if laps else None,
        splits_json=json.dumps(details.get("splits")) if details.get("splits") else None,
        hr_zones_json=json.dumps(details.get("hr_zones")) if details.get("hr_zones") else None,
        weather_json=json.dumps(details.get("weather")) if details.get("weather") else None,
        typed_splits_json=json.dumps(typed_splits) if typed_splits else None,
        power_zones_json=json.dumps(power_zones) if power_zones else None,
        raw_json=json.dumps(summary, default=str),
        synced_at=datetime.now(timezone.utc),
        ai_analyzed=skip_ai,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    logger.info("Stored activity %s: %s (%s)", garmin_id, fields["name"], fields["activity_type"])
    return activity


def sync_activities() -> list[Activity]:
    """Poll for recent activities. Returns list of newly added activities."""
    logger.info("Syncing recent activities...")
    client = get_garmin_client()
    new_activities = []

    with db_session() as db:
        try:
            activities = client.get_activities(0, 20)
            for summary in activities:
                garmin_id = summary.get("activityId")
                if not garmin_id:
                    continue

                existing = db.query(Activity).filter(Activity.garmin_id == garmin_id).first()
                if existing:
                    continue

                time.sleep(0.3)
                details = _fetch_activity_details(client, garmin_id)
                activity = _store_activity(db, summary, details, skip_ai=False)
                if activity:
                    new_activities.append(activity)

            _set_sync_status(db, "last_activity_sync", datetime.now(timezone.utc).isoformat())
            logger.info("Activity sync complete. %d new activities.", len(new_activities))
        except Exception:
            logger.exception("Activity sync failed")

    return new_activities


def _daily_summary_fields(stats: dict, stress_avg, sleep_seconds, sleep_score, raw: dict) -> dict:
    """Build field dict for DailySummary create/update."""
    return {
        "steps": stats.get("totalSteps"),
        "total_calories": stats.get("totalKilocalories"),
        "active_calories": stats.get("activeKilocalories"),
        "resting_hr": stats.get("restingHeartRate"),
        "max_hr": stats.get("maxHeartRate"),
        "stress_avg": stress_avg,
        "sleep_seconds": sleep_seconds,
        "sleep_score": sleep_score,
        "body_battery_high": stats.get("bodyBatteryHighestValue"),
        "body_battery_low": stats.get("bodyBatteryLowestValue"),
        "intensity_minutes": (
            (stats.get("moderateIntensityMinutes") or 0)
            + (stats.get("vigorousIntensityMinutes") or 0)
        ),
        "floors_climbed": stats.get("floorsAscended"),
        "raw_json": json.dumps(raw, default=str),
        "synced_at": datetime.now(timezone.utc),
        "ai_analyzed": False,
    }


def sync_daily_summary(target_date: date | None = None) -> DailySummary | None:
    """Sync daily summary for a given date (defaults to yesterday)."""
    if target_date is None:
        target_date = date.today() - timedelta(days=1)

    date_str = target_date.strftime("%Y-%m-%d")
    logger.info("Syncing daily summary for %s", date_str)
    client = get_garmin_client()

    with db_session() as db:
        try:
            stats = client.get_stats(date_str)
            user_summary = client.get_user_summary(date_str)

            raw = {"stats": stats, "user_summary": user_summary}

            # Try to get additional data
            try:
                raw["heart_rates"] = client.get_heart_rates(date_str)
            except Exception:
                pass
            try:
                raw["sleep"] = client.get_sleep_data(date_str)
            except Exception:
                pass
            try:
                raw["stress"] = client.get_all_day_stress(date_str)
            except Exception:
                pass

            sleep_seconds = None
            sleep_score = None
            if raw.get("sleep"):
                sleep_data = raw["sleep"]
                sleep_seconds = sleep_data.get("dailySleepDTO", {}).get("sleepTimeSeconds")
                sleep_score = sleep_data.get("dailySleepDTO", {}).get("sleepScores", {}).get("overall", {}).get("value")

            stress_avg = None
            if stats.get("averageStressLevel"):
                stress_avg = stats["averageStressLevel"]

            fields = _daily_summary_fields(stats, stress_avg, sleep_seconds, sleep_score, raw)

            existing = db.query(DailySummary).filter(DailySummary.date == target_date).first()
            if existing:
                for key, value in fields.items():
                    setattr(existing, key, value)
                db.commit()
                db.refresh(existing)
                summary = existing
            else:
                summary = DailySummary(date=target_date, **fields)
                db.add(summary)
                db.commit()
                db.refresh(summary)

            _set_sync_status(db, "last_daily_sync", datetime.now(timezone.utc).isoformat())
            logger.info("Daily summary synced for %s", date_str)
            return summary

        except Exception:
            logger.exception("Daily summary sync failed for %s", date_str)
            return None


def backfill_activities():
    """Backfill all historical activities on first start."""
    with db_session() as db:
        try:
            status = _get_sync_status(db, "backfill_activities")
            if status == "complete":
                logger.info("Activity backfill already complete")
                return

            start_page = 0
            if status and status != "complete":
                try:
                    start_page = int(status)
                except ValueError:
                    start_page = 0

            client = get_garmin_client()
            page_size = 100
            page = start_page

            while True:
                logger.info("Backfilling activities page %d (offset %d)...", page, page * page_size)
                activities = client.get_activities(page * page_size, page_size)
                if not activities:
                    break

                for summary in activities:
                    garmin_id = summary.get("activityId")
                    if not garmin_id:
                        continue

                    existing = db.query(Activity).filter(Activity.garmin_id == garmin_id).first()
                    if existing:
                        continue

                    time.sleep(0.5)
                    try:
                        details = _fetch_activity_details(client, garmin_id)
                        _store_activity(db, summary, details, skip_ai=True)
                    except Exception:
                        logger.exception("Failed to backfill activity %s", garmin_id)

                page += 1
                _set_sync_status(db, "backfill_activities", str(page))

                if len(activities) < page_size:
                    break

            _set_sync_status(db, "backfill_activities", "complete")
            logger.info("Activity backfill complete")

        except Exception:
            logger.exception("Activity backfill failed")


def backfill_daily_summaries():
    """Backfill last 365 days of daily summaries on first start."""
    with db_session() as db:
        try:
            status = _get_sync_status(db, "backfill_daily")
            if status == "complete":
                logger.info("Daily summary backfill already complete")
                return

            start_days_ago = 1
            if status and status != "complete":
                try:
                    start_days_ago = int(status)
                except ValueError:
                    start_days_ago = 1

            today = date.today()
            for days_ago in range(start_days_ago, 366):
                target = today - timedelta(days=days_ago)

                existing = db.query(DailySummary).filter(DailySummary.date == target).first()
                if existing:
                    continue

                time.sleep(0.5)
                try:
                    summary = sync_daily_summary(target)
                    if summary:
                        summary.ai_analyzed = True
                        db.merge(summary)
                        db.commit()
                except Exception:
                    logger.debug("No daily summary for %s", target)

                if days_ago % 30 == 0:
                    _set_sync_status(db, "backfill_daily", str(days_ago))
                    logger.info("Daily backfill progress: %d/365 days", days_ago)

            _set_sync_status(db, "backfill_daily", "complete")
            logger.info("Daily summary backfill complete")

        except Exception:
            logger.exception("Daily summary backfill failed")


def _parse_calendar_date(value) -> date | None:
    """Parse a date from various Garmin calendar formats."""
    if value is None:
        return None
    if isinstance(value, date):
        return value
    if isinstance(value, (int, float)):
        # Epoch timestamp in milliseconds
        try:
            return datetime.fromtimestamp(value / 1000, tz=timezone.utc).date()
        except (ValueError, OSError):
            return None
    if isinstance(value, str):
        for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S"):
            try:
                return datetime.strptime(value[:len(fmt.replace('%', 'X'))], fmt).date()
            except (ValueError, TypeError):
                continue
        # Try just first 10 chars as YYYY-MM-DD
        try:
            return datetime.strptime(value[:10], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return None
    return None


def _parse_race_priority(raw) -> str | None:
    """Normalize Garmin race priority to A/B/C."""
    if raw is None:
        return None
    if isinstance(raw, int):
        return {1: "A", 2: "B", 3: "C"}.get(raw)
    if isinstance(raw, str):
        raw_upper = raw.strip().upper()
        if raw_upper in ("A", "B", "C"):
            return raw_upper
        priority_map = {
            "PRIMARY": "A", "GOAL": "A",
            "SECONDARY": "B", "SUPPORTING": "B",
            "TERTIARY": "C", "FUN": "C",
        }
        return priority_map.get(raw_upper, raw_upper[0] if raw_upper else None)
    return None


def _parse_calendar_response(data: dict) -> list[dict]:
    """Parse Garmin calendar API response into event dicts."""
    events = []
    items = data.get("calendarItems", [])

    # Log item types for debugging
    if items:
        type_counts = {}
        for item in items:
            t = item.get("itemType") or "unknown"
            type_counts[t] = type_counts.get(t, 0) + 1
        logger.info("Calendar items: %d total, types: %s", len(items), type_counts)
    else:
        logger.info("Calendar response has 0 calendarItems (keys: %s)", list(data.keys()))

    for item in items:
        item_type = (item.get("itemType") or "").lower()
        # Try multiple date field names
        date_raw = item.get("date") or item.get("startDate") or item.get("startTimestampLocal")
        event_date = _parse_calendar_date(date_raw)
        if not event_date:
            continue
        if item_type not in ("race", "event", "workout"):
            continue

        if item_type in ("race", "event"):
            event_id = item.get("eventId") or item.get("id") or ""
            garmin_id = f"race_{event_id}_{event_date.isoformat()}"

            # Distance: try multiple field names used by Garmin API
            distance_m = item.get("distance") or item.get("raceDistance")
            completion_target = item.get("completionTarget") or {}
            # completionTarget.value with unit "meter" is distance, not time
            ct_value = completion_target.get("value")
            ct_unit = (completion_target.get("unit") or "").lower()
            if not distance_m and ct_value and ct_unit in ("meter", "meters", "m"):
                distance_m = float(ct_value)
            distance_label = _race_distance_label(distance_m)

            # Goal time: check dedicated time fields first
            goal_time_sec = None
            goal_time_raw = (
                item.get("goalTimeInSeconds")
                or item.get("raceGoalTime")
                or item.get("duration")
            )
            # Only use completionTarget if its unit indicates time, not distance
            if not goal_time_raw and ct_value and ct_unit in ("second", "seconds", "s", "millisecond", "milliseconds", "ms"):
                goal_time_raw = ct_value
            if goal_time_raw and isinstance(goal_time_raw, (int, float)):
                # Garmin may return milliseconds; if value > 24h in seconds, assume ms
                goal_time_sec = int(goal_time_raw / 1000) if goal_time_raw > 86400 else int(goal_time_raw)

            # Priority: try multiple field names.
            # Garmin calendar API uses "primaryEvent": true/false rather than a priority string.
            priority_raw = item.get("priority") or item.get("racePriority") or item.get("eventPriority")
            if priority_raw is None:
                primary_event = item.get("primaryEvent")
                if primary_event is True:
                    priority_raw = "PRIMARY"
                elif primary_event is False:
                    priority_raw = "SECONDARY"
            priority = _parse_race_priority(priority_raw)
            if not priority and item.get("primaryEvent") is True:
                priority = "A"

            logger.info(
                "Calendar race/event: id=%s title=%r priority_raw=%r priority=%s goal=%s dist=%s",
                event_id, item.get("title"), priority_raw, priority, goal_time_sec, distance_m
            )

            events.append({
                "garmin_id": garmin_id,
                "event_type": "race",
                "date": event_date,
                "title": item.get("title") or item.get("eventName") or "Race",
                "distance_m": distance_m,
                "distance_label": distance_label,
                "goal_time_sec": goal_time_sec,
                "priority": priority,
                "workout_type": None,
                "workout_description": None,
                "raw_json": json.dumps(item, default=str),
            })

        elif item_type == "workout":
            workout_id = item.get("workoutId") or item.get("id") or ""
            garmin_id = f"workout_{workout_id}_{event_date.isoformat()}"
            workout_type = item.get("workoutType") or item.get("sportType")
            description = item.get("workoutDescription") or ""
            if not description:
                # Try to build description from workout steps
                steps = item.get("workoutSteps") or item.get("steps") or []
                if isinstance(steps, list):
                    step_parts = []
                    for s in steps:
                        step_name = s.get("stepName") or s.get("type") or ""
                        duration = s.get("endConditionValue") or ""
                        if step_name:
                            step_parts.append(f"{step_name}: {duration}" if duration else step_name)
                    description = " → ".join(step_parts) if step_parts else ""

            events.append({
                "garmin_id": garmin_id,
                "event_type": "workout",
                "date": event_date,
                "title": item.get("title") or item.get("workoutName") or "Workout",
                "distance_m": item.get("distance"),
                "distance_label": None,
                "goal_time_sec": None,
                "priority": None,
                "workout_type": workout_type,
                "workout_description": description or None,
                "raw_json": json.dumps(item, default=str),
            })

    return events


def _race_distance_label(distance_m: float | None) -> str | None:
    """Convert distance in meters to a standard label."""
    if not distance_m:
        return None
    thresholds = [
        (5000, "5K"),
        (10000, "10K"),
        (21097.5, "Half Marathon"),
        (42195, "Marathon"),
    ]
    for threshold, label in thresholds:
        if abs(distance_m - threshold) < 500:
            return label
    return f"{distance_m / 1000:.1f}km"


def _fetch_workout_details(client: Garmin, workout_id) -> dict | None:
    """Fetch full workout details including steps from Garmin workout service."""
    try:
        data = client.connectapi(f"/workout-service/workout/{workout_id}")
        if isinstance(data, dict):
            return data
    except Exception as e:
        logger.debug("Failed to fetch workout details for %s: %s", workout_id, e)
    return None


def _fetch_race_event_details(client: Garmin, event_item: dict) -> dict | None:
    """Fetch full race/event details from Garmin shareable event endpoint."""
    uuid = event_item.get("shareableEventUuid") or event_item.get("eventUuid")
    if not uuid:
        logger.debug("No shareableEventUuid for race detail fetch")
        return None

    endpoint = f"/calendar-service/event/{uuid}/shareable"
    try:
        data = client.connectapi(endpoint)
        if isinstance(data, dict):
            logger.info("Race detail response keys: %s", list(data.keys()))
            return data
        logger.debug("Race detail response was not a dict: type=%s", type(data).__name__)
    except Exception as e:
        logger.info("Failed to fetch race details from %s: %s", endpoint, e)
    return None


def _extract_goal_time_from_details(detail: dict) -> int | None:
    """Extract goal time in seconds from a race event detail response."""
    # Primary: eventCustomization.customGoal (from /shareable endpoint)
    customization = detail.get("eventCustomization") or {}
    custom_goal = customization.get("customGoal") or {}
    cg_val = custom_goal.get("value")
    cg_unit = (custom_goal.get("unitType") or custom_goal.get("unit") or "").lower()
    if cg_val and isinstance(cg_val, (int, float)) and cg_unit == "time":
        logger.info("Found goal time via customGoal: %.0fs", cg_val)
        return int(cg_val)

    # Fallback: top-level time fields
    for field in ("goalTimeInSeconds", "raceGoalTime", "goalTime", "targetTime"):
        val = detail.get(field)
        if val and isinstance(val, (int, float)):
            result = int(val / 1000) if val > 86400 else int(val)
            logger.info("Found goal time via field %s: %ds", field, result)
            return result

    logger.debug("No goal time found in detail response")
    return None


def sync_calendar() -> int:
    """Sync Garmin calendar events (races + workouts). Returns count of upserted events."""
    logger.info("Syncing Garmin calendar...")
    client = get_garmin_client()
    today = date.today()

    # Fetch current month + next 2 months
    months_to_fetch = []
    for offset in range(3):
        m = today.month + offset
        y = today.year
        if m > 12:
            m -= 12
            y += 1
        months_to_fetch.append((y, m))

    all_events = []
    for year, month in months_to_fetch:
        try:
            # Garmin API uses 0-indexed months
            data = client.connectapi(f"/calendar-service/year/{year}/month/{month - 1}")
            parsed = _parse_calendar_response(data)
            all_events.extend(parsed)
            time.sleep(0.3)
        except Exception:
            logger.exception("Failed to fetch calendar for %d-%02d", year, month)

    # Fetch full workout details (including steps) for workout events
    for evt in all_events:
        if evt["event_type"] != "workout":
            continue
        raw = json.loads(evt["raw_json"]) if evt["raw_json"] else {}
        workout_id = raw.get("workoutId") or raw.get("id")
        if not workout_id:
            continue
        # Skip if raw_json already has workout steps data (re-sync case)
        if raw.get("workoutSteps") or raw.get("workoutSegments"):
            continue
        time.sleep(0.3)
        workout_data = _fetch_workout_details(client, workout_id)
        if workout_data:
            # Store the full workout response as raw_json so step parsing can find the data
            evt["raw_json"] = json.dumps(workout_data, default=str)

    # Fetch full details for race events to get goal time and priority
    race_events = [e for e in all_events if e["event_type"] == "race"]
    logger.info("Found %d race events to fetch details for", len(race_events))
    for evt in race_events:
        raw = json.loads(evt["raw_json"]) if evt["raw_json"] else {}
        uuid = raw.get("shareableEventUuid")
        if not uuid:
            logger.debug("Race %r has no shareableEventUuid, skipping detail fetch", evt["title"])
            continue
        time.sleep(0.3)
        detail = _fetch_race_event_details(client, raw)
        if not detail:
            logger.info("No detail response for race %r", evt["title"])
            continue

        # Extract goal time from eventCustomization.customGoal
        if not evt.get("goal_time_sec"):
            goal_time = _extract_goal_time_from_details(detail)
            if goal_time:
                evt["goal_time_sec"] = goal_time
                logger.info("Race %r: goal_time=%ds", evt["title"], goal_time)

        # Extract priority from isPrimaryEvent
        customization = detail.get("eventCustomization") or {}
        if not evt.get("priority") and customization.get("isPrimaryEvent") is True:
            evt["priority"] = "A"
            logger.info("Race %r: set priority=A from isPrimaryEvent", evt["title"])

        # Log race predictions if available
        projected = customization.get("projectedRaceTimeDurationSeconds")
        predicted = customization.get("predictedRaceTimeDurationSeconds")
        if projected or predicted:
            logger.info("Race %r: projected=%s predicted=%s", evt["title"], projected, predicted)

        # Store detail in raw_json for future reference
        raw["_eventDetail"] = detail
        evt["raw_json"] = json.dumps(raw, default=str)

    with db_session() as db:
        try:
            seen_garmin_ids = set()
            for evt in all_events:
                seen_garmin_ids.add(evt["garmin_id"])
                # Upsert
                existing = db.query(GarminCalendarEvent).filter(
                    GarminCalendarEvent.garmin_id == evt["garmin_id"]
                ).first()
                if existing:
                    for key, value in evt.items():
                        if key != "garmin_id":
                            setattr(existing, key, value)
                    existing.synced_at = datetime.now(timezone.utc)
                else:
                    db.add(GarminCalendarEvent(**evt, synced_at=datetime.now(timezone.utc)))

            # Remove stale future events no longer in API response
            stale_query = db.query(GarminCalendarEvent).filter(
                GarminCalendarEvent.date >= today,
            )
            if seen_garmin_ids:
                stale_query = stale_query.filter(
                    ~GarminCalendarEvent.garmin_id.in_(seen_garmin_ids)
                )
            stale_count = stale_query.delete(synchronize_session="fetch")
            if stale_count:
                logger.info("Removed %d stale calendar events", stale_count)

            db.commit()
            _set_sync_status(db, "last_calendar_sync", datetime.now(timezone.utc).isoformat())
            logger.info("Calendar sync complete. %d events.", len(seen_garmin_ids))
        except Exception:
            logger.exception("Calendar sync failed")

    return len(all_events)
