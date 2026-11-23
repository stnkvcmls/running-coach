"""Training load, wellness/intensity trends, and performance curve."""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Activity, DailySummary, User
from app.schemas import (
    AerobicTrendPoint,
    AerobicTrendsResponse,
    ComparisonDeltaResponse,
    DailySummaryResponse,
    IntensityTrendsResponse,
    IntensityWeek,
    PerformanceCurveComparisonResponse,
    PerformanceCurvePoint,
    PerformanceCurveResponse,
    PersonalRecordResponse,
    PersonalRecordsResponse,
    RacePrediction,
    TrainingLoadResponse,
)
from app import training_load
from app import threshold as threshold_mod
from app import intensity as intensity_mod
from app import streams as streams_mod
from app import records as records_mod
from app.routers._shared import _parse_date, _to_pr_response
from app.utils import local_today

router = APIRouter()


# --- Training Load (CTL/ATL/TSB) ---

@router.get("/training-load", response_model=TrainingLoadResponse)
def api_training_load(
    days: int = Query(90, ge=7, le=365),
    date_str: str = Query(None, alias="date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    end_date = _parse_date(date_str) if date_str else local_today()
    points = training_load.compute_load_series(
        db, end_date=end_date, days=days, user_id=current_user.id
    )
    return TrainingLoadResponse(points=points, current=points[-1] if points else None)


# --- Wellness Trends ---

@router.get("/wellness-trends", response_model=list[DailySummaryResponse])
def api_wellness_trends(
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cutoff = local_today() - timedelta(days=days)
    summaries = (
        db.query(DailySummary)
        .filter(DailySummary.user_id == current_user.id, DailySummary.date >= cutoff)
        .order_by(DailySummary.date.asc())
        .all()
    )
    return [DailySummaryResponse.model_validate(s) for s in summaries]


# --- Intensity Trends ---

@router.get("/intensity-trends", response_model=IntensityTrendsResponse)
def api_intensity_trends(
    days: int = Query(90, ge=7, le=365),
    zone_type: str = Query("hr"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if zone_type not in ("hr", "power"):
        zone_type = "hr"
    weeks_data = intensity_mod.aggregate_weekly_intensity(
        db, days=days, zone_type=zone_type, user_id=current_user.id
    )
    weeks = [IntensityWeek(**w) for w in weeks_data]
    return IntensityTrendsResponse(weeks=weeks, zone_type=zone_type, days=days)


# --- Performance Curve ---

def _curve_points(points) -> list[PerformanceCurvePoint]:
    return [
        PerformanceCurvePoint(duration_sec=p.duration_sec, actual_value=p.actual_value, model_value=p.model_value)
        for p in points
    ]


@router.get("/performance-curve", response_model=PerformanceCurveResponse)
def api_get_performance_curve(
    days: int = Query(90, ge=30, le=365),
    compare: str | None = Query(None, description="'previous_period' | 'year_ago' | 'custom'"),
    compare_start: str | None = Query(None, alias="compareStart", description="ISO date, required if compare=custom"),
    compare_end: str | None = Query(None, alias="compareEnd", description="ISO date, required if compare=custom"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Power-duration and pace-duration curves with CP/CV model fit and race predictions.

    With ``compare`` set, also fits a second window (previous period, same period
    last year, or a custom range) and returns it alongside delta callouts.
    """
    custom_start_dt = custom_end_dt = None
    if compare == "custom":
        if not compare_start or not compare_end:
            raise HTTPException(status_code=400, detail="compareStart and compareEnd are required for compare=custom")
        try:
            custom_start_dt = datetime.strptime(compare_start, "%Y-%m-%d")
            custom_end_dt = datetime.strptime(compare_end, "%Y-%m-%d") + timedelta(days=1)
        except ValueError:
            raise HTTPException(status_code=400, detail="compareStart/compareEnd must be ISO dates (YYYY-MM-DD)")

    try:
        data = threshold_mod.get_performance_curve_data(
            db, lookback_days=days, user_id=current_user.id,
            compare=compare, custom_compare_start=custom_start_dt, custom_compare_end=custom_end_dt,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    comparison = None
    if data.comparison is not None:
        c = data.comparison
        comparison = PerformanceCurveComparisonResponse(
            label=c.label, start=c.start, end=c.end,
            power_points=_curve_points(c.power_points),
            pace_points=_curve_points(c.pace_points),
            critical_power=c.critical_power,
            w_prime=c.w_prime,
            critical_velocity=c.critical_velocity,
            d_prime=c.d_prime,
            activities_analyzed=c.activities_analyzed,
        )

    return PerformanceCurveResponse(
        power_points=_curve_points(data.power_points),
        pace_points=_curve_points(data.pace_points),
        critical_power=data.critical_power,
        w_prime=data.w_prime,
        critical_velocity=data.critical_velocity,
        d_prime=data.d_prime,
        race_predictions=[
            RacePrediction(
                distance_label=r.distance_label,
                distance_m=r.distance_m,
                predicted_time_sec=r.predicted_time_sec,
                predicted_pace_min_km=r.predicted_pace_min_km,
            )
            for r in data.race_predictions
        ],
        lookback_days=data.lookback_days,
        activities_analyzed=data.activities_analyzed,
        comparison=comparison,
        deltas=[
            ComparisonDeltaResponse(
                metric=d.metric, label=d.label, current_value=d.current_value,
                previous_value=d.previous_value, delta=d.delta, unit=d.unit,
            )
            for d in data.deltas
        ],
    )


# --- Personal Records / Peak Performances ---

@router.get("/personal-records", response_model=PersonalRecordsResponse)
def api_personal_records(
    days: int = Query(90, ge=1, le=3650),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """All-time bests plus a recent-history feed, for the Peak Performances panel."""
    records_mod.ensure_records_backfilled(db, user_id=current_user.id)
    current_bests = records_mod.get_current_bests(db, user_id=current_user.id)
    recent = records_mod.get_recent_records(db, user_id=current_user.id, days=days)
    distance_top_n = records_mod.get_distance_top_n(db, user_id=current_user.id)
    return PersonalRecordsResponse(
        current_bests=sorted(
            [_to_pr_response(r) for r in current_bests],
            key=lambda r: (r.record_type, r.duration_sec or 0, r.distance_label or ""),
        ),
        recent=[_to_pr_response(r) for r in recent],
        recent_days=days,
        distance_bests={
            label: [_to_pr_response(r) for r in recs]
            for label, recs in distance_top_n.items()
        },
        distance_labels=records_mod.RACE_DISTANCE_LABELS,
    )


# --- Aerobic Trends ---

@router.get("/aerobic-trends", response_model=AerobicTrendsResponse)
def api_get_aerobic_trends(
    days: int = Query(90, ge=30, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aerobic decoupling % and efficiency factor trend per run."""
    try:
        streams_mod.backfill_missing_aerobic_metrics(db, user_id=current_user.id)
    except Exception:
        pass
    cutoff = datetime.utcnow() - timedelta(days=days)
    RUN_TYPES = ("running", "trail_running", "treadmill_running", "indoor_running")
    activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == current_user.id,
            Activity.started_at >= cutoff,
            func.lower(Activity.activity_type).in_(RUN_TYPES),
            func.coalesce(Activity.decoupling_pct, Activity.efficiency_factor).isnot(None),
        )
        .order_by(Activity.started_at)
        .all()
    )
    return AerobicTrendsResponse(
        points=[
            AerobicTrendPoint(
                date=a.started_at.date().isoformat() if isinstance(a.started_at, datetime) else str(a.started_at)[:10],
                activity_name=a.name or "",
                duration_sec=a.duration_sec or 0,
                decoupling_pct=a.decoupling_pct,
                efficiency_factor=a.efficiency_factor,
            )
            for a in activities
        ],
        days=days,
    )
