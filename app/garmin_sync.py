import json
import logging
import threading
import time
from datetime import datetime, date, timedelta, timezone

from garminconnect import Garmin
from sqlalchemy.orm import Session

from app.config import settings
from app.database import db_session
from app.models import Activity, DailySummary, SyncStatus

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
