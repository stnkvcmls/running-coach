"""Training load, wellness/intensity trends, performance curve, and custom charts."""
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Activity, DailySummary, User
from app.schemas import (
    AerobicTrendPoint,
    AerobicTrendsResponse,
    CustomChartDataResponse,
    CustomChartMetric,
    CustomChartMetricsResponse,
    CustomChartPoint,
    DailySummaryResponse,
    IntensityTrendsResponse,
    IntensityWeek,
    PerformanceCurvePoint,
    PerformanceCurveResponse,
    RacePrediction,
    TrainingLoadResponse,
)
from app import training_load
from app import threshold as threshold_mod
from app import intensity as intensity_mod
from app import streams as streams_mod
from app.routers._shared import _parse_date

router = APIRouter()


# --- Training Load (CTL/ATL/TSB) ---

@router.get("/training-load", response_model=TrainingLoadResponse)
def api_training_load(
    days: int = Query(90, ge=7, le=365),
    date_str: str = Query(None, alias="date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    end_date = _parse_date(date_str) if date_str else date.today()
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
    cutoff = date.today() - timedelta(days=days)
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

@router.get("/performance-curve", response_model=PerformanceCurveResponse)
def api_get_performance_curve(
    days: int = Query(90, ge=30, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Power-duration and pace-duration curves with CP/CV model fit and race predictions."""
    data = threshold_mod.get_performance_curve_data(db, lookback_days=days, user_id=current_user.id)
    return PerformanceCurveResponse(
        power_points=[
            PerformanceCurvePoint(
                duration_sec=p.duration_sec,
                actual_value=p.actual_value,
                model_value=p.model_value,
            )
            for p in data.power_points
        ],
        pace_points=[
            PerformanceCurvePoint(
                duration_sec=p.duration_sec,
                actual_value=p.actual_value,
                model_value=p.model_value,
            )
            for p in data.pace_points
        ],
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


# --- Custom Charts ---

# Registry of chartable metrics, spanning the three stored time-series sources:
# per-run Activity rows (aggregated to one point per day), DailySummary
# wellness rows (already one row per day), and the CTL/ATL/TSB/ACWR series
# (computed/cached by app.training_load).
_CUSTOM_CHART_METRICS: dict[str, dict] = {
    "distance_km": {"label": "Distance", "unit": "km", "group": "activity", "column": Activity.distance_m, "agg": "sum", "scale": 0.001},
    "duration_min": {"label": "Duration", "unit": "min", "group": "activity", "column": Activity.duration_sec, "agg": "sum", "scale": 1 / 60},
    "avg_pace": {"label": "Avg Pace", "unit": "min/km", "group": "activity", "column": Activity.avg_pace_min_km, "agg": "avg"},
    "avg_hr": {"label": "Avg Heart Rate", "unit": "bpm", "group": "activity", "column": Activity.avg_hr, "agg": "avg"},
    "avg_cadence": {"label": "Avg Cadence", "unit": "spm", "group": "activity", "column": Activity.avg_cadence, "agg": "avg"},
    "elevation_gain": {"label": "Elevation Gain", "unit": "m", "group": "activity", "column": Activity.elevation_gain, "agg": "sum"},
    "calories": {"label": "Calories", "unit": "kcal", "group": "activity", "column": Activity.calories, "agg": "sum"},
    "vo2max": {"label": "VO2max", "unit": "ml/kg/min", "group": "activity", "column": Activity.vo2max, "agg": "avg"},
    "training_stress_score": {"label": "Training Stress Score", "unit": "TSS", "group": "activity", "column": Activity.training_stress_score, "agg": "sum"},
    "efficiency_factor": {"label": "Efficiency Factor", "unit": "", "group": "activity", "column": Activity.efficiency_factor, "agg": "avg"},
    "decoupling_pct": {"label": "Aerobic Decoupling", "unit": "%", "group": "activity", "column": Activity.decoupling_pct, "agg": "avg"},
    "resting_hr": {"label": "Resting Heart Rate", "unit": "bpm", "group": "wellness", "column": DailySummary.resting_hr},
    "sleep_score": {"label": "Sleep Score", "unit": "", "group": "wellness", "column": DailySummary.sleep_score},
    "stress_avg": {"label": "Stress", "unit": "", "group": "wellness", "column": DailySummary.stress_avg},
    "body_battery_high": {"label": "Body Battery (high)", "unit": "", "group": "wellness", "column": DailySummary.body_battery_high},
    "hrv_avg": {"label": "HRV", "unit": "ms", "group": "wellness", "column": DailySummary.hrv_avg},
    "steps": {"label": "Steps", "unit": "", "group": "wellness", "column": DailySummary.steps},
    "ctl": {"label": "Fitness (CTL)", "unit": "", "group": "load", "attr": "ctl"},
    "atl": {"label": "Fatigue (ATL)", "unit": "", "group": "load", "attr": "atl"},
    "tsb": {"label": "Form (TSB)", "unit": "", "group": "load", "attr": "tsb"},
    "acwr": {"label": "ACWR", "unit": "", "group": "load", "attr": "acwr"},
}

_CUSTOM_CHART_RUN_TYPES = ("running", "trail_running", "treadmill_running", "indoor_running")


@router.get("/custom-charts/metrics", response_model=CustomChartMetricsResponse)
def api_custom_chart_metrics():
    return CustomChartMetricsResponse(
        metrics=[
            CustomChartMetric(id=metric_id, label=m["label"], unit=m["unit"], group=m["group"])
            for metric_id, m in _CUSTOM_CHART_METRICS.items()
        ]
    )


@router.get("/custom-charts/data", response_model=CustomChartDataResponse)
def api_custom_chart_data(
    metrics: str = Query(..., description="Comma-separated metric ids"),
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Merge one or more registered metrics into a unified daily time series."""
    metric_ids = [m.strip() for m in metrics.split(",") if m.strip()]
    if not metric_ids:
        raise HTTPException(status_code=400, detail="At least one metric is required")
    unknown = [m for m in metric_ids if m not in _CUSTOM_CHART_METRICS]
    if unknown:
        raise HTTPException(status_code=400, detail=f"Unknown metric id(s): {', '.join(unknown)}")

    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    by_date: dict[str, dict[str, float | None]] = {}

    def _set(d: date, metric_id: str, value) -> None:
        by_date.setdefault(d.isoformat(), {})[metric_id] = round(value, 4) if value is not None else None

    load_points_cache = None

    for metric_id in metric_ids:
        m = _CUSTOM_CHART_METRICS[metric_id]
        if m["group"] == "activity":
            date_col = func.date(Activity.started_at)
            agg_fn = func.avg(m["column"]) if m["agg"] == "avg" else func.sum(m["column"])
            rows = (
                db.query(date_col.label("d"), agg_fn.label("v"))
                .filter(
                    Activity.user_id == current_user.id,
                    Activity.started_at >= datetime.combine(start_date, datetime.min.time()),
                    Activity.started_at < datetime.combine(end_date + timedelta(days=1), datetime.min.time()),
                    func.lower(Activity.activity_type).in_(_CUSTOM_CHART_RUN_TYPES),
                    m["column"].isnot(None),
                )
                .group_by(date_col)
                .all()
            )
            scale = m.get("scale", 1.0)
            for r in rows:
                d = r.d if isinstance(r.d, date) else datetime.strptime(str(r.d)[:10], "%Y-%m-%d").date()
                _set(d, metric_id, r.v * scale if r.v is not None else None)
        elif m["group"] == "wellness":
            rows = (
                db.query(DailySummary.date.label("d"), m["column"].label("v"))
                .filter(
                    DailySummary.user_id == current_user.id,
                    DailySummary.date >= start_date,
                    DailySummary.date <= end_date,
                    m["column"].isnot(None),
                )
                .all()
            )
            for r in rows:
                _set(r.d, metric_id, r.v)
        else:  # load
            if load_points_cache is None:
                load_points_cache = training_load.compute_load_series(
                    db, end_date=end_date, days=days, user_id=current_user.id
                )
            for p in load_points_cache:
                _set(p.date, metric_id, getattr(p, m["attr"]))

    result_points = [
        CustomChartPoint(date=d, values={mid: by_date[d].get(mid) for mid in metric_ids})
        for d in sorted(by_date.keys())
    ]
    return CustomChartDataResponse(points=result_points, days=days)
