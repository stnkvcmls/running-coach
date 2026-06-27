import json
import logging
import os
import shutil
import threading
import time
from datetime import datetime, date, timedelta, timezone

from garminconnect import Garmin
from sqlalchemy.orm import Session

from app import crypto, streams
from app.config import settings
from app.database import db_session
from app.models import (
    DEFAULT_USER_ID,
    Activity,
    AthleteProfile,
    DailySummary,
    GarminCalendarEvent,
    SyncStatus,
    User,
)

logger = logging.getLogger(__name__)

# Authenticated Garmin clients keyed by user id (id 0 = legacy env-only client
# used before a User row exists). Replaces the former single global client.
_garmin_clients: dict[int, Garmin] = {}
_garmin_lock = threading.Lock()

# Pending interactive MFA logins keyed by user id: (Garmin, email, password,
# started_at). garminconnect 0.3.2 keeps MFA state on the client instance, so
# the same object must survive between the connect and code-submission requests.
_mfa_sessions: dict[int, tuple] = {}
_mfa_lock = threading.Lock()
_MFA_TTL = 300  # seconds — a connect code must be entered within 5 minutes


def _bootstrap_identity_email() -> str:
    """Identity (login) email of the bootstrap user #1, mirroring auth.py."""
    return settings.dev_user_email or settings.garmin_email or "dev@localhost"


def _user_token_dir(user_id: int) -> str:
    """Per-user OAuth token directory under the configured token root."""
    return os.path.join(settings.garmin_token_dir, str(user_id))


def _user_credentials(user: User) -> tuple[str, str]:
    """Return (email, password) for a user, falling back to env for bootstrap.

    A user with no stored encrypted password (e.g. the pre-encryption homelab
    deployment) falls back to the env GARMIN_PASSWORD so existing setups keep
    working without an encryption key.
    """
    email = user.garmin_email or settings.garmin_email
    if user.garmin_password_encrypted:
        password = crypto.decrypt(user.garmin_password_encrypted)
    else:
        password = settings.garmin_password
    return email, password


def _build_client(user_id: int, email: str, password: str, token_dir: str) -> Garmin:
    """Authenticate a Garmin client, loading dumped tokens from token_dir."""
    os.makedirs(token_dir, exist_ok=True)
    client = Garmin(email, password)
    client.login(token_dir)
    logger.info("Garmin authenticated as %s (user %s)", client.get_full_name(), user_id)
    return client


def _get_client_for(user_id: int, email: str, password: str, token_dir: str) -> Garmin:
    """Return a cached live client for user_id, rebuilding if the session died."""
    with _garmin_lock:
        client = _garmin_clients.get(user_id)
        if client is not None:
            try:
                client.get_full_name()
                return client
            except Exception:
                logger.info("Garmin session expired for user %s, re-authenticating", user_id)
                _garmin_clients.pop(user_id, None)

        client = _build_client(user_id, email, password, token_dir)
        _garmin_clients[user_id] = client
        return client


def _find_bootstrap_user(db: Session) -> User | None:
    """Locate user #1 — the account seeded from env GARMIN_EMAIL/PASSWORD."""
    return db.query(User).filter(User.email == _bootstrap_identity_email()).first()


def _scope_uid(db: Session, user: User | None) -> int:
    """Resolve the ``user_id`` to scope sync reads/writes to.

    With an explicit user, that user's id. Otherwise the bootstrap user #1, or
    ``DEFAULT_USER_ID`` when no User row exists yet (pre-seed / tests).
    """
    if user is not None:
        return user.id
    bootstrap = _find_bootstrap_user(db)
    return bootstrap.id if bootstrap else DEFAULT_USER_ID


def _get_bootstrap_client() -> Garmin:
    """Client for the global sync jobs (Phase 3 makes these per-user)."""
    creds = None
    with db_session() as db:
        user = _find_bootstrap_user(db)
        if user is not None:
            email, password = _user_credentials(user)
            creds = (user.id, email, password, _user_token_dir(user.id))
    if creds is not None:
        return _get_client_for(*creds)
    # No User row yet (pre-seed / no creds): use env creds + the flat token dir.
    return _get_client_for(0, settings.garmin_email, settings.garmin_password, settings.garmin_token_dir)


def get_garmin_client(user: User | None = None) -> Garmin:
    """Get or create an authenticated Garmin client.

    With an explicit ``user``, builds from that user's decrypted credentials and
    per-user token dir. With no user (the existing global sync jobs), resolves
    the bootstrap user #1 so those keep working unchanged in Phase 2.
    """
    if user is not None:
        email, password = _user_credentials(user)
        return _get_client_for(user.id, email, password, _user_token_dir(user.id))
    return _get_bootstrap_client()


# --- Connect flow (interactive, MFA-aware) ---------------------------------

def _purge_expired_mfa_sessions() -> None:
    now = time.time()
    with _mfa_lock:
        stale = [uid for uid, (_g, _e, _p, started) in _mfa_sessions.items() if now - started > _MFA_TTL]
        for uid in stale:
            _mfa_sessions.pop(uid, None)


def _store_credentials(db: Session, user: User, email: str, password: str) -> None:
    """Persist Garmin email + encrypted password on the user row."""
    user.garmin_email = email
    user.garmin_password_encrypted = crypto.encrypt(password)
    db.commit()


def connect_garmin_start(db: Session, user: User, email: str, password: str) -> str:
    """Begin a Garmin connect. Returns "connected" or "mfa_required".

    On a clean (MFA-off) login, tokens are dumped and credentials stored. When
    the account requires MFA, the in-progress client is stashed and the caller
    must follow up with :func:`connect_garmin_mfa`.
    """
    _purge_expired_mfa_sessions()
    garmin = Garmin(email, password, return_on_mfa=True)
    # No tokenstore → forces the credential login path.
    result, _ = garmin.login()

    if result == "needs_mfa":
        with _mfa_lock:
            _mfa_sessions[user.id] = (garmin, email, password, time.time())
        return "mfa_required"

    _finalize_connect(db, user, garmin, email, password)
    return "connected"


def connect_garmin_mfa(db: Session, user: User, code: str) -> str:
    """Complete an MFA connect with the user's one-time code. Returns "connected"."""
    with _mfa_lock:
        entry = _mfa_sessions.pop(user.id, None)
    if entry is None:
        raise ValueError("No pending Garmin MFA login; restart the connect flow.")
    garmin, email, password, started = entry
    if time.time() - started > _MFA_TTL:
        raise ValueError("MFA session expired; restart the connect flow.")

    garmin.resume_login(None, code)  # client_state is held on the client instance
    _finalize_connect(db, user, garmin, email, password)
    return "connected"


def _finalize_connect(db: Session, user: User, garmin: Garmin, email: str, password: str) -> None:
    """Dump fresh tokens to the per-user dir and persist credentials."""
    token_dir = _user_token_dir(user.id)
    os.makedirs(token_dir, exist_ok=True)
    # garminconnect 0.3.2 exposes the token store via ``.client``; older
    # garth-backed releases used ``.garth``. Support whichever is present.
    token_client = getattr(garmin, "client", None) or getattr(garmin, "garth", None)
    token_client.dump(token_dir)
    _store_credentials(db, user, email, password)
    # A successful interactive (re)connect clears any pending re-auth flag.
    user.garmin_needs_reauth = False
    db.commit()
    # Drop any stale cached client so the next call rebuilds from new tokens.
    with _garmin_lock:
        _garmin_clients.pop(user.id, None)
    logger.info("Garmin connected for user %s (%s)", user.id, email)


def disconnect_garmin(db: Session, user: User) -> None:
    """Clear a user's Garmin credentials, cached client, and token dir."""
    user.garmin_email = None
    user.garmin_password_encrypted = None
    user.garmin_needs_reauth = False
    db.commit()
    with _mfa_lock:
        _mfa_sessions.pop(user.id, None)
    with _garmin_lock:
        _garmin_clients.pop(user.id, None)
    shutil.rmtree(_user_token_dir(user.id), ignore_errors=True)
    logger.info("Garmin disconnected for user %s", user.id)


def garmin_connection_status(user: User) -> dict:
    """Report a user's Garmin connection state for the Settings UI."""
    with _mfa_lock:
        mfa_pending = user.id in _mfa_sessions
    return {
        "connected": bool(user.garmin_email),
        "garmin_email": user.garmin_email,
        "mfa_pending": mfa_pending,
        "needs_reauth": bool(user.garmin_needs_reauth),
    }


def mark_garmin_needs_reauth(user_id: int, value: bool = True) -> None:
    """Flag/unflag a user's Garmin connection as needing an interactive reconnect.

    Called by background syncs when a user's tokens are gone/expired and Garmin
    wants an MFA code a cron can't supply.
    """
    with db_session() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if user is not None and bool(user.garmin_needs_reauth) != value:
            user.garmin_needs_reauth = value
            db.commit()


# --- Bootstrap (env account → user #1) + token-dir migration ---------------

def _migrate_flat_token_dir(user_id: int) -> None:
    """Move legacy flat-dir OAuth token files into the per-user token dir."""
    base = settings.garmin_token_dir
    user_dir = _user_token_dir(user_id)
    if os.path.isdir(user_dir) and os.listdir(user_dir):
        return  # already migrated
    if not os.path.isdir(base):
        return
    token_files = [f for f in os.listdir(base) if os.path.isfile(os.path.join(base, f))]
    if not token_files:
        return
    os.makedirs(user_dir, exist_ok=True)
    for fname in token_files:
        shutil.move(os.path.join(base, fname), os.path.join(user_dir, fname))
    logger.info("Migrated %d Garmin token file(s) into %s", len(token_files), user_dir)


def seed_bootstrap_user() -> None:
    """Seed user #1 from env GARMIN_EMAIL/PASSWORD and migrate the token dir.

    Idempotent: only attaches credentials the first time and only migrates the
    flat token dir once. The env password is encrypted at rest when an
    encryption key is configured; otherwise it stays in env (backward compatible).
    """
    if not settings.garmin_email:
        return  # nothing to bootstrap

    with db_session() as db:
        user = db.query(User).filter(User.email == _bootstrap_identity_email()).first()
        if user is None:
            user = User(email=_bootstrap_identity_email())
            db.add(user)
            db.flush()
        if not user.garmin_email:
            user.garmin_email = settings.garmin_email
        if (
            not user.garmin_password_encrypted
            and settings.garmin_password
            and crypto.is_configured()
        ):
            try:
                user.garmin_password_encrypted = crypto.encrypt(settings.garmin_password)
            except Exception:
                logger.exception("Failed to encrypt bootstrap Garmin password")
        db.commit()
        user_id = user.id

    _migrate_flat_token_dir(user_id)


def _get_sync_status(db: Session, key: str, user_id: int = DEFAULT_USER_ID) -> str | None:
    row = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == user_id, SyncStatus.key == key)
        .first()
    )
    return row.value if row else None


def _set_sync_status(db: Session, key: str, value: str, user_id: int = DEFAULT_USER_ID):
    row = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == user_id, SyncStatus.key == key)
        .first()
    )
    if row:
        row.value = value
        row.updated_at = datetime.now(timezone.utc)
    else:
        row = SyncStatus(
            user_id=user_id, key=key, value=value, updated_at=datetime.now(timezone.utc)
        )
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
        "avg_stride": summary.get("avgStrideLength") / 100 if summary.get("avgStrideLength") is not None else None,
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


def _store_activity(
    db: Session,
    summary: dict,
    details: dict,
    skip_ai: bool = False,
    user_id: int = DEFAULT_USER_ID,
    client: Garmin | None = None,
) -> Activity | None:
    """Store an activity in the database. Returns the Activity if newly created."""
    garmin_id = summary.get("activityId")
    if not garmin_id:
        return None

    existing = (
        db.query(Activity)
        .filter(Activity.user_id == user_id, Activity.garmin_id == garmin_id)
        .first()
    )
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

    # Fetch the per-sample detail streams (power/speed/HR/elevation time series).
    # Request high chart resolution so short-duration efforts aren't smoothed
    # away (needed for accurate mean-maximal curves). Include the GPS polyline
    # (maxpoly>0) so directLatitude/directLongitude land in activityDetailMetrics,
    # aligned with the other streams, for the route silhouette on the detail view.
    laps = None
    try:
        detail_client = client or get_garmin_client()
        laps = detail_client.get_activity_details(garmin_id, maxchart=10000, maxpoly=10000)
    except Exception as e:
        logger.debug("No detailed data for %s: %s", garmin_id, e)

    # Mean-maximal curves derived from those streams.
    mean_max = None
    decoupling_pct = None
    efficiency_factor = None
    if laps:
        try:
            curves = streams.compute_curves_from_details(laps, fields.get("activity_type"))
            if curves:
                mean_max = json.dumps(curves)
        except Exception as e:
            logger.debug("Could not compute mean-max curves for %s: %s", garmin_id, e)
        try:
            decoupling_pct, efficiency_factor = streams.compute_aerobic_metrics_from_details(laps)
        except Exception as e:
            logger.debug("Could not compute aerobic metrics for %s: %s", garmin_id, e)

    activity = Activity(
        **fields,
        user_id=user_id,
        run_time_sec=run_time_sec,
        walk_time_sec=walk_time_sec,
        laps_json=json.dumps(laps) if laps else None,
        splits_json=json.dumps(details.get("splits")) if details.get("splits") else None,
        hr_zones_json=json.dumps(details.get("hr_zones")) if details.get("hr_zones") else None,
        weather_json=json.dumps(details.get("weather")) if details.get("weather") else None,
        typed_splits_json=json.dumps(typed_splits) if typed_splits else None,
        power_zones_json=json.dumps(power_zones) if power_zones else None,
        mean_max_json=mean_max,
        decoupling_pct=decoupling_pct,
        efficiency_factor=efficiency_factor,
        raw_json=json.dumps(summary, default=str),
        synced_at=datetime.now(timezone.utc),
        ai_analyzed=skip_ai,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    logger.info("Stored activity %s: %s (%s)", garmin_id, fields["name"], fields["activity_type"])
    return activity


def sync_activities(user: User | None = None) -> list[Activity]:
    """Poll for recent activities. Returns list of newly added activities."""
    logger.info("Syncing recent activities...")
    client = get_garmin_client(user)
    new_activities = []

    with db_session() as db:
        uid = _scope_uid(db, user)
        try:
            activities = client.get_activities(0, 20)
            for summary in activities:
                garmin_id = summary.get("activityId")
                if not garmin_id:
                    continue

                existing = (
                    db.query(Activity)
                    .filter(Activity.user_id == uid, Activity.garmin_id == garmin_id)
                    .first()
                )
                if existing:
                    continue

                time.sleep(0.3)
                details = _fetch_activity_details(client, garmin_id)
                activity = _store_activity(
                    db, summary, details, skip_ai=False, user_id=uid, client=client
                )
                if activity:
                    new_activities.append(activity)

            _set_sync_status(
                db, "last_activity_sync", datetime.now(timezone.utc).isoformat(), user_id=uid
            )
            logger.info("Activity sync complete. %d new activities.", len(new_activities))
        except Exception:
            logger.exception("Activity sync failed")

    return new_activities


def _daily_summary_fields(
    stats: dict,
    stress_avg,
    sleep_seconds,
    sleep_score,
    raw: dict,
    hrv_avg=None,
    hrv_weekly_avg=None,
    hrv_status=None,
) -> dict:
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
        "hrv_avg": hrv_avg,
        "hrv_weekly_avg": hrv_weekly_avg,
        "hrv_status": hrv_status,
        "raw_json": json.dumps(raw, default=str),
        "synced_at": datetime.now(timezone.utc),
        "ai_analyzed": False,
    }


def sync_daily_summary(
    target_date: date | None = None, user: User | None = None
) -> DailySummary | None:
    """Sync daily summary for a given date (defaults to yesterday)."""
    if target_date is None:
        target_date = date.today() - timedelta(days=1)

    date_str = target_date.strftime("%Y-%m-%d")
    logger.info("Syncing daily summary for %s", date_str)
    client = get_garmin_client(user)

    with db_session() as db:
        uid = _scope_uid(db, user)
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
            try:
                raw["hrv"] = client.get_hrv_data(date_str)
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

            # Overnight HRV is attributed by Garmin to the wake-up day (same date).
            hrv_avg = None
            hrv_weekly_avg = None
            hrv_status = None
            if raw.get("hrv"):
                hrv_summary = (raw["hrv"] or {}).get("hrvSummary", {}) or {}
                hrv_avg = hrv_summary.get("lastNightAvg")
                hrv_weekly_avg = hrv_summary.get("weeklyAvg")
                hrv_status = hrv_summary.get("status")

            fields = _daily_summary_fields(
                stats,
                stress_avg,
                sleep_seconds,
                sleep_score,
                raw,
                hrv_avg=hrv_avg,
                hrv_weekly_avg=hrv_weekly_avg,
                hrv_status=hrv_status,
            )

            existing = (
                db.query(DailySummary)
                .filter(DailySummary.user_id == uid, DailySummary.date == target_date)
                .first()
            )
            if existing:
                for key, value in fields.items():
                    setattr(existing, key, value)
                db.commit()
                db.refresh(existing)
                summary = existing
            else:
                summary = DailySummary(user_id=uid, date=target_date, **fields)
                db.add(summary)
                db.commit()
                db.refresh(summary)

            # Detach the fully-loaded object before writing sync status. That
            # write commits, and with expire_on_commit the commit would expire
            # summary's attributes -- leaving the returned, now session-less
            # object unreadable (DetachedInstanceError on first attribute
            # access). Expunging first preserves its loaded state for the caller.
            db.expunge(summary)
            _set_sync_status(
                db, "last_daily_sync", datetime.now(timezone.utc).isoformat(), user_id=uid
            )
            logger.info("Daily summary synced for %s", date_str)
            return summary

        except Exception:
            logger.exception("Daily summary sync failed for %s", date_str)
            return None


# Athlete profile fields that are always sourced from Garmin (read-only in the UI).
GARMIN_PROFILE_FIELDS = ("name", "date_of_birth", "weight_kg")


def _fetch_latest_garmin_weight(client: Garmin) -> float | None:
    """Return the most recent weight (in grams) from Garmin body composition."""
    try:
        today = date.today()
        start = today - timedelta(days=30)
        data = client.get_body_composition(start.isoformat(), today.isoformat()) or {}
        latest = None
        for measurement in data.get("dateWeightList") or []:
            weight = measurement.get("weight")
            if weight:
                latest = weight  # list is chronological; keep the last non-null
        return latest
    except Exception:
        logger.debug("Could not fetch Garmin body composition weight", exc_info=True)
        return None


def _fetch_garmin_profile_fields(client: Garmin) -> dict:
    """Pull name, date of birth, weight (kg), and resting HR from Garmin."""
    fields: dict = {}

    try:
        name = client.get_full_name()
        if name:
            fields["name"] = name
    except Exception:
        logger.debug("Could not fetch Garmin full name", exc_info=True)

    user_data: dict = {}
    try:
        settings_data = client.get_user_profile() or {}
        user_data = settings_data.get("userData") or {}
    except Exception:
        logger.debug("Could not fetch Garmin user settings", exc_info=True)

    dob = _parse_calendar_date(user_data.get("birthDate"))
    if dob:
        fields["date_of_birth"] = dob

    weight_g = user_data.get("weight") or _fetch_latest_garmin_weight(client)
    if weight_g:
        fields["weight_kg"] = round(weight_g / 1000, 1)

    # Resting HR: try today then yesterday (today's value may not be available yet)
    try:
        for delta in (0, 1):
            day_str = (date.today() - timedelta(days=delta)).isoformat()
            stats = client.get_stats(day_str) or {}
            rhr = stats.get("restingHeartRate")
            if rhr:
                fields["resting_hr"] = rhr
                break
    except Exception:
        logger.debug("Could not fetch Garmin resting HR", exc_info=True)

    return fields


def sync_athlete_profile(user: User | None = None) -> AthleteProfile | None:
    """Sync name, date of birth, weight, and resting HR from Garmin into the athlete profile.

    These fields are Garmin-managed (read-only in the UI), so the local
    values are always overwritten to stay in sync with Garmin.
    """
    logger.info("Syncing athlete profile from Garmin...")
    client = get_garmin_client(user)

    with db_session() as db:
        uid = _scope_uid(db, user)
        try:
            fields = _fetch_garmin_profile_fields(client)
            if not fields:
                logger.info("No Garmin profile fields available to sync")
                return None

            profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == uid).first()
            if profile is None:
                profile = AthleteProfile(user_id=uid, **fields)
                db.add(profile)
            else:
                for key, value in fields.items():
                    setattr(profile, key, value)

            db.commit()
            db.refresh(profile)
            _set_sync_status(
                db, "last_profile_sync", datetime.now(timezone.utc).isoformat(), user_id=uid
            )
            logger.info("Athlete profile synced from Garmin: %s", ", ".join(fields))
            return profile
        except Exception:
            logger.exception("Athlete profile sync failed")
            return None


def backfill_activities():
    """Backfill all historical activities on first start."""
    with db_session() as db:
        uid = _scope_uid(db, None)
        try:
            status = _get_sync_status(db, "backfill_activities", user_id=uid)
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

                    existing = (
                        db.query(Activity)
                        .filter(Activity.user_id == uid, Activity.garmin_id == garmin_id)
                        .first()
                    )
                    if existing:
                        continue

                    time.sleep(0.5)
                    try:
                        details = _fetch_activity_details(client, garmin_id)
                        _store_activity(
                            db, summary, details, skip_ai=True, user_id=uid, client=client
                        )
                    except Exception:
                        logger.exception("Failed to backfill activity %s", garmin_id)

                page += 1
                _set_sync_status(db, "backfill_activities", str(page), user_id=uid)

                if len(activities) < page_size:
                    break

            _set_sync_status(db, "backfill_activities", "complete", user_id=uid)
            logger.info("Activity backfill complete")

        except Exception:
            logger.exception("Activity backfill failed")


def backfill_daily_summaries():
    """Backfill last 365 days of daily summaries on first start."""
    with db_session() as db:
        uid = _scope_uid(db, None)
        try:
            status = _get_sync_status(db, "backfill_daily", user_id=uid)
            if status == "complete":
                logger.info("Daily summary backfill already complete")
                return

            # Start at 0 (today) so a fresh start also captures last night's
            # sleep/HRV, which Garmin attributes to today's wake-up date.
            start_days_ago = 0
            if status and status != "complete":
                try:
                    start_days_ago = int(status)
                except ValueError:
                    start_days_ago = 0

            today = date.today()
            for days_ago in range(start_days_ago, 366):
                target = today - timedelta(days=days_ago)

                existing = (
                    db.query(DailySummary)
                    .filter(DailySummary.user_id == uid, DailySummary.date == target)
                    .first()
                )
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
                    _set_sync_status(db, "backfill_daily", str(days_ago), user_id=uid)
                    logger.info("Daily backfill progress: %d/365 days", days_ago)

            _set_sync_status(db, "backfill_daily", "complete", user_id=uid)
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


def sync_calendar(user: User | None = None) -> int:
    """Sync Garmin calendar events (races + workouts). Returns count of upserted events."""
    logger.info("Syncing Garmin calendar...")
    client = get_garmin_client(user)
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

        # Store Garmin's projected/predicted finish times
        projected = customization.get("projectedRaceTimeDurationSeconds")
        predicted = customization.get("predictedRaceTimeDurationSeconds")
        if projected:
            try:
                evt["projected_race_time_sec"] = int(projected)
            except (TypeError, ValueError):
                pass
        if predicted:
            try:
                evt["predicted_race_time_sec"] = int(predicted)
            except (TypeError, ValueError):
                pass
        if projected or predicted:
            logger.info("Race %r: projected=%s predicted=%s", evt["title"], projected, predicted)

        # Store detail in raw_json for future reference
        raw["_eventDetail"] = detail
        evt["raw_json"] = json.dumps(raw, default=str)

    with db_session() as db:
        uid = _scope_uid(db, user)
        try:
            seen_garmin_ids = set()
            for evt in all_events:
                seen_garmin_ids.add(evt["garmin_id"])
                # Upsert
                existing = db.query(GarminCalendarEvent).filter(
                    GarminCalendarEvent.user_id == uid,
                    GarminCalendarEvent.garmin_id == evt["garmin_id"],
                ).first()
                if existing:
                    for key, value in evt.items():
                        if key != "garmin_id":
                            setattr(existing, key, value)
                    existing.synced_at = datetime.now(timezone.utc)
                else:
                    db.add(GarminCalendarEvent(user_id=uid, **evt, synced_at=datetime.now(timezone.utc)))

            # Remove stale future events no longer in API response
            stale_query = db.query(GarminCalendarEvent).filter(
                GarminCalendarEvent.user_id == uid,
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
            _set_sync_status(
                db, "last_calendar_sync", datetime.now(timezone.utc).isoformat(), user_id=uid
            )
            logger.info("Calendar sync complete. %d events.", len(seen_garmin_ids))
        except Exception:
            logger.exception("Calendar sync failed")

    return len(all_events)


# ---------------------------------------------------------------------------
# Structured-workout push
# ---------------------------------------------------------------------------

def _garth_post(client: Garmin, path: str, json_body: dict) -> dict:
    """POST to the Garmin Connect API using the underlying garth session.

    garminconnect stores its garth.Client as ``self.client``.  We use the
    same ``client.post("connectapi", path, json=payload)`` pattern used by
    all write methods in garminconnect (add_weigh_in, create_manual_activity…).
    """
    # garminconnect 0.3.x stores the garth Client as self.client
    garth_client = getattr(client, "client", None) or getattr(client, "garth", None)
    if garth_client is None:
        raise RuntimeError("Cannot access garth client from Garmin instance")

    try:
        resp = garth_client.post("connectapi", path, json=json_body)
    except Exception as exc:
        # Capture response body when available (httpx.HTTPStatusError etc.)
        body = getattr(getattr(exc, "response", None), "text", None)
        detail = f"{exc}" + (f" — response: {body}" if body else "")
        raise RuntimeError(f"Garmin API POST {path} failed: {detail}") from exc

    if hasattr(resp, "json"):
        return resp.json()
    return resp  # already decoded (dict/list)


def push_workout_to_garmin(
    user: User,
    plan_day_id: int,
) -> dict:
    """Upload a TrainingPlanDay as a structured workout to Garmin and schedule it.

    Returns a dict with keys: workout_name, garmin_workout_id, scheduled_date.
    Raises ValueError when the day is not pushable (rest/cross) or not found.
    Raises RuntimeError on Garmin API failures.
    """
    from app.adherence import parse_workout_steps  # noqa: F401 (imported for side-effect check)
    from app.workout_translator import translate_plan_day
    from app.models import AthleteProfile, TrainingPlanDay

    with db_session() as db:
        plan_day = (
            db.query(TrainingPlanDay)
            .filter(TrainingPlanDay.id == plan_day_id, TrainingPlanDay.user_id == user.id)
            .first()
        )
        if plan_day is None:
            raise ValueError(f"TrainingPlanDay {plan_day_id} not found")

        profile = (
            db.query(AthleteProfile)
            .filter(AthleteProfile.user_id == user.id)
            .first()
        )

        workout_payload = translate_plan_day(plan_day, profile)
        if workout_payload is None:
            raise ValueError(
                f"Workout type '{plan_day.workout_type}' is not pushable to Garmin "
                "(rest and cross-training days are skipped)"
            )

        scheduled_date = plan_day.day_date.isoformat()
        workout_name = workout_payload["workoutName"]

    client = get_garmin_client(user)

    # 1. Create the workout on Garmin using the library's upload_workout method
    logger.debug("Pushing workout payload to Garmin: %s", workout_payload)
    try:
        create_resp = client.upload_workout(workout_payload)
    except Exception as exc:
        raise RuntimeError(f"Failed to create workout on Garmin: {exc}") from exc

    if not isinstance(create_resp, dict):
        raise RuntimeError(
            f"Garmin returned unexpected response type: {type(create_resp).__name__!r} — {create_resp!r}"
        )
    garmin_workout_id = create_resp.get("workoutId")
    if not garmin_workout_id:
        raise RuntimeError(
            f"Garmin did not return a workoutId. Response: {create_resp!r}"
        )
    logger.info(
        "Created Garmin workout %s ('%s') for user %s",
        garmin_workout_id, workout_name, user.id,
    )

    # 2. Schedule the workout on the plan day's date
    try:
        client.schedule_workout(garmin_workout_id, scheduled_date)
    except Exception as exc:
        # Scheduling failure is non-fatal: the workout exists on Garmin even if
        # not yet pinned to the calendar date.
        logger.warning(
            "Workout %s created but scheduling failed for date %s: %s",
            garmin_workout_id, scheduled_date, exc,
        )

    logger.info(
        "Scheduled Garmin workout %s on %s for user %s",
        garmin_workout_id, scheduled_date, user.id,
    )
    return {
        "workout_name": workout_name,
        "garmin_workout_id": garmin_workout_id,
        "scheduled_date": scheduled_date,
    }


def push_race_pacing_to_garmin(
    user: User,
    race_name: str,
    race_date,
    splits: list,
) -> dict:
    """Upload a race pacing plan as a structured workout to Garmin and schedule it.

    Returns a dict with keys: workout_name, garmin_workout_id, scheduled_date.
    Raises RuntimeError on Garmin API failures.
    """
    from app.workout_translator import translate_race_pacing

    workout_payload = translate_race_pacing(race_name, race_date, splits)
    workout_name = workout_payload["workoutName"]
    scheduled_date = race_date.isoformat()

    client = get_garmin_client(user)

    logger.debug("Pushing race pacing payload to Garmin: %s", workout_payload)
    try:
        create_resp = client.upload_workout(workout_payload)
    except Exception as exc:
        raise RuntimeError(f"Failed to create race pacing workout on Garmin: {exc}") from exc

    if not isinstance(create_resp, dict):
        raise RuntimeError(
            f"Garmin returned unexpected response type: {type(create_resp).__name__!r} — {create_resp!r}"
        )
    garmin_workout_id = create_resp.get("workoutId")
    if not garmin_workout_id:
        raise RuntimeError(
            f"Garmin did not return a workoutId. Response: {create_resp!r}"
        )
    logger.info(
        "Created Garmin race pacing workout %s ('%s') for user %s",
        garmin_workout_id, workout_name, user.id,
    )

    try:
        client.schedule_workout(garmin_workout_id, scheduled_date)
    except Exception as exc:
        logger.warning(
            "Race pacing workout %s created but scheduling failed for date %s: %s",
            garmin_workout_id, scheduled_date, exc,
        )

    logger.info(
        "Scheduled Garmin race pacing workout %s on %s for user %s",
        garmin_workout_id, scheduled_date, user.id,
    )
    return {
        "workout_name": workout_name,
        "garmin_workout_id": garmin_workout_id,
        "scheduled_date": scheduled_date,
    }
