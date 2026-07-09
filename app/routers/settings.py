"""Account info, app settings, AI config, Garmin credentials, athlete profile,
zone configs, and threshold/CP estimation.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    Activity,
    AIJob,
    AthleteProfile,
    DailySummary,
    GarminCalendarEvent,
    Insight,
    SyncStatus,
    User,
    ZoneConfig,
)
from app.schemas import (
    AiConfigRequest,
    AiConfigResponse,
    AthleteProfileRequest,
    AthleteProfileResponse,
    CanaryStatusEntry,
    GarminConnectResult,
    GarminConnectionStatus,
    GarminCredentialsRequest,
    GarminMfaRequest,
    SettingsResponse,
    SystemHealthResponse,
    ThresholdApplyRequest,
    ThresholdEstimateField,
    ThresholdEstimateResponse,
    UserResponse,
    ZoneConfigBulkUpdate,
    ZoneConfigResponse,
    ZoneConfigsResponse,
)
from app import threshold as threshold_mod
from app.config import settings as app_settings
from app.utils import calculate_age

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def api_me(current_user: User = Depends(get_current_user)):
    return current_user


# --- Settings ---

_INTERNAL_SYNC_KEYS = {"threshold_estimate", "training_load_series"}


@router.get("/settings", response_model=SettingsResponse)
def api_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uid = current_user.id
    sync_statuses = {}
    for s in db.query(SyncStatus).filter(SyncStatus.user_id == uid).all():
        if s.key in _INTERNAL_SYNC_KEYS:
            continue
        sync_statuses[s.key] = {"value": s.value, "updated_at": str(s.updated_at) if s.updated_at else None}

    counts = {
        "activities": db.query(func.count(Activity.id)).filter(Activity.user_id == uid).scalar() or 0,
        "daily_summaries": db.query(func.count(DailySummary.id)).filter(DailySummary.user_id == uid).scalar() or 0,
        "insights": db.query(func.count(Insight.id)).filter(Insight.user_id == uid).scalar() or 0,
        "calendar_events": db.query(func.count(GarminCalendarEvent.id)).filter(GarminCalendarEvent.user_id == uid).scalar() or 0,
    }
    return SettingsResponse(sync_statuses=sync_statuses, counts=counts)


# Curated "last sync per job" keys -> display label, out of the full
# SyncStatus dump (which also carries backfill progress markers, cached
# threshold estimates, dedup flags, etc.).
_LAST_SYNC_KEYS = {
    "activities": "last_activity_sync",
    "daily": "last_daily_sync",
    "profile": "last_profile_sync",
    "calendar": "last_calendar_sync",
}

_MAX_FAILED_JOBS = 10


@router.get("/health-detail", response_model=SystemHealthResponse)
def api_health_detail(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ops observability surface (P3-4): last sync per job, canary status,
    and recent failed AI jobs, over data already tracked elsewhere.
    """
    from app import garmin_sync

    uid = current_user.id
    sync_rows = {
        row.key: row.value
        for row in db.query(SyncStatus).filter(
            SyncStatus.user_id == uid, SyncStatus.key.in_(_LAST_SYNC_KEYS.values())
        )
    }
    last_sync = {label: sync_rows.get(key) for label, key in _LAST_SYNC_KEYS.items()}

    canary = {
        source: CanaryStatusEntry(**result)
        for source, result in garmin_sync.get_canary_status().items()
    }
    canary_ok = all(entry.ok for entry in canary.values())

    failed_jobs = (
        db.query(AIJob)
        .filter(AIJob.user_id == uid, AIJob.status == "failed")
        .order_by(AIJob.completed_at.desc())
        .limit(_MAX_FAILED_JOBS)
        .all()
    )

    return SystemHealthResponse(
        last_sync=last_sync,
        canary_ok=canary_ok,
        canary=canary,
        recent_failed_jobs=failed_jobs,
    )


@router.get("/ai-config", response_model=AiConfigResponse)
def api_get_ai_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    provider_row = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == current_user.id, SyncStatus.key == "ai_provider")
        .first()
    )
    model_row = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == current_user.id, SyncStatus.key == "ai_model")
        .first()
    )
    provider = provider_row.value if provider_row else "claude"
    model = model_row.value if model_row else app_settings.ai_model
    return AiConfigResponse(
        provider=provider,
        model=model,
        available_providers=list(app_settings.available_models.keys()),
        available_models=app_settings.available_models,
    )


@router.post("/ai-config", response_model=AiConfigResponse)
def api_set_ai_config(
    config: AiConfigRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if config.provider not in app_settings.available_models:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {config.provider}")
    if config.model not in app_settings.available_models[config.provider]:
        raise HTTPException(status_code=400, detail=f"Model {config.model} not valid for {config.provider}")

    for key, value in [("ai_provider", config.provider), ("ai_model", config.model)]:
        row = (
            db.query(SyncStatus)
            .filter(SyncStatus.user_id == current_user.id, SyncStatus.key == key)
            .first()
        )
        if row:
            row.value = value
        else:
            db.add(SyncStatus(user_id=current_user.id, key=key, value=value))
    db.commit()

    return AiConfigResponse(
        provider=config.provider,
        model=config.model,
        available_providers=list(app_settings.available_models.keys()),
        available_models=app_settings.available_models,
    )


# --- Garmin Credentials (per-user data source) ---

@router.get("/garmin-credentials/status", response_model=GarminConnectionStatus)
def api_garmin_status(current_user: User = Depends(get_current_user)):
    from app import garmin_sync
    return GarminConnectionStatus(**garmin_sync.garmin_connection_status(current_user))


@router.post("/garmin-credentials", response_model=GarminConnectResult)
def api_connect_garmin(
    creds: GarminCredentialsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app import crypto, garmin_sync
    if not crypto.is_configured():
        raise HTTPException(
            status_code=400,
            detail="Server is missing ENCRYPTION_KEY; set it before connecting Garmin.",
        )
    try:
        status = garmin_sync.connect_garmin_start(
            db, current_user, creds.email, creds.password
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.info("Garmin connect failed for user %s: %s", current_user.id, exc)
        raise HTTPException(status_code=400, detail=f"Garmin login failed: {exc}")
    return GarminConnectResult(status=status)


@router.post("/garmin-credentials/mfa", response_model=GarminConnectResult)
def api_connect_garmin_mfa(
    body: GarminMfaRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app import garmin_sync
    try:
        status = garmin_sync.connect_garmin_mfa(db, current_user, body.code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.info("Garmin MFA failed for user %s: %s", current_user.id, exc)
        raise HTTPException(status_code=400, detail=f"Garmin MFA failed: {exc}")
    return GarminConnectResult(status=status)


@router.delete("/garmin-credentials", response_model=GarminConnectionStatus)
def api_disconnect_garmin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app import garmin_sync
    garmin_sync.disconnect_garmin(db, current_user)
    return GarminConnectionStatus(**garmin_sync.garmin_connection_status(current_user))


# --- Athlete Profile ---


def _profile_response(profile: AthleteProfile) -> AthleteProfileResponse:
    """Build a response, deriving age from date_of_birth."""
    result = AthleteProfileResponse.model_validate(profile)
    result.age = calculate_age(profile.date_of_birth)
    return result


@router.get("/athlete-profile", response_model=AthleteProfileResponse | None)
def api_get_athlete_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == current_user.id).first()
    return _profile_response(profile) if profile else None


# Name, date of birth, and weight are always sourced from Garmin and are not
# user-editable, so ignore any client-supplied values for these fields.
GARMIN_MANAGED_PROFILE_FIELDS = {"name", "date_of_birth", "weight_kg"}


@router.post("/athlete-profile", response_model=AthleteProfileResponse)
def api_set_athlete_profile(
    profile_data: AthleteProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updates = {
        key: value
        for key, value in profile_data.model_dump(exclude_unset=True).items()
        if key not in GARMIN_MANAGED_PROFILE_FIELDS
    }
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == current_user.id).first()
    if profile is None:
        profile = AthleteProfile(user_id=current_user.id, **updates)
        db.add(profile)
    else:
        for key, value in updates.items():
            setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return _profile_response(profile)


# --- Zone Configs ---

def _compute_zone_bounds(zones: list, threshold: float | None) -> list[ZoneConfigResponse]:
    """Build ZoneConfigResponse list, computing absolute bound values from the threshold."""
    result = []
    for z in zones:
        resp = ZoneConfigResponse.model_validate(z)
        if threshold is not None and threshold > 0:
            if z.min_pct is not None:
                resp.computed_min = round(threshold * z.min_pct / 100, 1)
            if z.max_pct is not None:
                resp.computed_max = round(threshold * z.max_pct / 100, 1)
        result.append(resp)
    return result


def _build_zones_response(db: Session, user_id: int) -> ZoneConfigsResponse:
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    threshold_hr = profile.threshold_hr if profile else None
    threshold_pace = profile.threshold_pace_min_km if profile else None
    threshold_power = profile.threshold_power if profile else None

    all_zones = (
        db.query(ZoneConfig)
        .filter(ZoneConfig.user_id == user_id)
        .order_by(ZoneConfig.zone_type, ZoneConfig.zone_number)
        .all()
    )

    return ZoneConfigsResponse(
        hr=_compute_zone_bounds([z for z in all_zones if z.zone_type == "hr"], threshold_hr),
        pace=_compute_zone_bounds([z for z in all_zones if z.zone_type == "pace"], threshold_pace),
        power=_compute_zone_bounds([z for z in all_zones if z.zone_type == "power"], threshold_power),
        threshold_hr=threshold_hr,
        threshold_pace_min_km=threshold_pace,
        threshold_power=threshold_power,
    )


@router.get("/zones", response_model=ZoneConfigsResponse)
def api_get_zones(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _build_zones_response(db, current_user.id)


@router.put("/zones", response_model=ZoneConfigsResponse)
def api_update_zones(
    update: ZoneConfigBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for zu in update.zones:
        zone = (
            db.query(ZoneConfig)
            .filter(
                ZoneConfig.user_id == current_user.id,
                ZoneConfig.zone_type == zu.zone_type,
                ZoneConfig.zone_number == zu.zone_number,
            )
            .first()
        )
        if zone is None:
            continue
        if zu.zone_name is not None:
            zone.zone_name = zu.zone_name
        if zu.zone_color is not None:
            zone.zone_color = zu.zone_color
        if "min_pct" in zu.model_fields_set:
            zone.min_pct = zu.min_pct
        if "max_pct" in zu.model_fields_set:
            zone.max_pct = zu.max_pct
    db.commit()
    return _build_zones_response(db, current_user.id)


# --- Threshold / Critical Power estimation ---

def _field(est: "threshold_mod.FieldEstimate") -> ThresholdEstimateField:
    return ThresholdEstimateField(
        value=est.value,
        method=est.method,
        confidence=est.confidence,
        sample_size=est.sample_size,
        note=est.note,
    )


def _build_threshold_response(
    estimate: "threshold_mod.ThresholdEstimate", profile: AthleteProfile | None
) -> ThresholdEstimateResponse:
    return ThresholdEstimateResponse(
        critical_power=_field(estimate.critical_power),
        w_prime=estimate.w_prime,
        pmax=estimate.pmax,
        threshold_pace_min_km=_field(estimate.threshold_pace_min_km),
        threshold_hr=_field(estimate.threshold_hr),
        max_hr=_field(estimate.max_hr),
        lookback_days=estimate.lookback_days,
        activities_analyzed=estimate.activities_analyzed,
        current_threshold_power=profile.threshold_power if profile else None,
        current_threshold_pace_min_km=profile.threshold_pace_min_km if profile else None,
        current_threshold_hr=profile.threshold_hr if profile else None,
        current_max_hr=profile.max_hr if profile else None,
    )


@router.get("/threshold-estimate", response_model=ThresholdEstimateResponse)
def api_get_threshold_estimate(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    estimate = threshold_mod.estimate_thresholds(db, user_id=current_user.id)
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == current_user.id).first()
    return _build_threshold_response(estimate, profile)


@router.post("/threshold-estimate/apply", response_model=AthleteProfileResponse)
def api_apply_threshold_estimate(
    req: ThresholdApplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    estimate = threshold_mod.estimate_thresholds(db, user_id=current_user.id)
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == current_user.id).first()
    if profile is None:
        profile = AthleteProfile(user_id=current_user.id)
        db.add(profile)
    fields = req.fields if req.fields else None
    applied = threshold_mod.apply_estimate_to_profile(profile, estimate, fields)
    if not applied:
        raise HTTPException(status_code=400, detail="No estimated thresholds available to apply")
    db.commit()
    db.refresh(profile)
    return _profile_response(profile)
