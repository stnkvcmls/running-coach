"""Race pacing strategy generation and Garmin push."""
import logging
from datetime import date, datetime, timedelta, timezone
from statistics import median

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Activity, GarminCalendarEvent, User
from app.schemas import PacingPushRequest, PacingStrategyResponse, PushWorkoutResponse
from app import threshold as threshold_mod
from app import streams as streams_mod
from app import weather as weather_mod
from app.utils import safe_json_loads

logger = logging.getLogger(__name__)

router = APIRouter()

_CONDITIONS_LOOKBACK_DAYS = 14
_CONDITIONS_SAMPLE_LIMIT = 5


def _estimated_race_conditions(user_id: int, db: Session) -> tuple[float | None, float | None]:
    """Median (temp_c, dew_point_c) from the athlete's recent weathered runs.

    Used to pre-fill the expected race-day conditions inputs — no forecast API,
    just the same weather data already synced from Garmin for past runs.
    """
    cutoff = datetime.combine(
        date.today() - timedelta(days=_CONDITIONS_LOOKBACK_DAYS), datetime.min.time(), tzinfo=timezone.utc
    )
    recent = (
        db.query(Activity)
        .filter(
            Activity.user_id == user_id,
            Activity.weather_json.isnot(None),
            Activity.started_at >= cutoff,
        )
        .order_by(Activity.started_at.desc())
        .limit(_CONDITIONS_SAMPLE_LIMIT)
        .all()
    )
    temps: list[float] = []
    dew_points: list[float] = []
    for act in recent:
        weather = weather_mod.parse_weather(act.weather_json)
        temp, dp = weather_mod.extract_temp_dewpoint_c(weather)
        if temp is not None:
            temps.append(temp)
        if dp is not None:
            dew_points.append(dp)
    return (median(temps) if temps else None, median(dew_points) if dew_points else None)


def _get_race_event(race_id: int, user_id: int, db: Session) -> GarminCalendarEvent:
    race = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.id == race_id,
            GarminCalendarEvent.user_id == user_id,
            GarminCalendarEvent.event_type == "race",
        )
        .first()
    )
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")
    return race


_MIN_COURSE_PROFILE_SAMPLES = 10


def _matched_course_profile(
    race: GarminCalendarEvent, user_id: int, db: Session,
) -> tuple[list[tuple[float, float]], Activity] | None:
    """Find the athlete's closest-distance past run with a usable elevation stream
    and build a (distance_m, elevation_m) course profile from it.
    """
    candidates = (
        db.query(Activity)
        .filter(
            Activity.user_id == user_id,
            Activity.activity_type == "running",
            Activity.laps_json.isnot(None),
            Activity.distance_m.isnot(None),
        )
        .order_by(func.abs(Activity.distance_m - race.distance_m))
        .limit(20)
        .all()
    )
    for act in candidates:
        details = safe_json_loads(act.laps_json)
        parsed = streams_mod.parse_streams(details)
        if not parsed:
            continue
        profile = sorted(
            (d, e)
            for d, e in zip(parsed["distance"], parsed["elevation"])
            if isinstance(d, (int, float)) and isinstance(e, (int, float))
        )
        if len(profile) < _MIN_COURSE_PROFILE_SAMPLES or profile[-1][0] - profile[0][0] <= 0:
            continue
        return profile, act
    return None


@router.get("/races/{race_id}/pacing", response_model=PacingStrategyResponse)
def api_race_pacing(
    race_id: int,
    strategy: str = Query("even", pattern="^(even|negative_split|terrain)$"),
    split_unit: str = Query("km", pattern="^(km|mile)$"),
    target_time_sec: int | None = Query(None),
    expected_temp_c: float | None = Query(None),
    expected_dew_point_c: float | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a race-day split-by-split pacing strategy.

    target_time_sec overrides goal_time_sec; if neither is set, falls back to
    the CV-model prediction from the performance curve. "terrain" strategy
    sources an elevation profile from the athlete's closest-distance past run.
    expected_temp_c/expected_dew_point_c scale every split for expected race-day
    heat/humidity (composes with the terrain strategy); the response always
    includes a median estimate from recent weathered runs for the UI to pre-fill.
    """
    from app import pacing as pacing_mod

    race = _get_race_event(race_id, current_user.id, db)
    if not race.distance_m or race.distance_m <= 0:
        raise HTTPException(status_code=422, detail="Race has no distance set")

    # Determine target time + source
    source = "custom"
    effective_target = target_time_sec
    if effective_target is None:
        if race.goal_time_sec:
            effective_target = race.goal_time_sec
            source = "goal"
        else:
            # Fall back to CV model prediction for this distance
            try:
                curve = threshold_mod.get_performance_curve_data(db, user_id=current_user.id)
                match = next(
                    (p for p in curve.race_predictions if abs(p.distance_m - race.distance_m) < 500),
                    None,
                )
                if match:
                    effective_target = int(match.predicted_time_sec)
                    source = "predicted"
            except Exception:
                logger.debug("CV model unavailable for race pacing fallback", exc_info=True)
        if effective_target is None:
            raise HTTPException(
                status_code=422,
                detail="No target time available: set a goal time on the race or connect enough training data for a CV model prediction.",
            )

    # Optionally include CV model prediction as reference
    predicted_time: float | None = None
    if source != "predicted":
        try:
            curve = threshold_mod.get_performance_curve_data(db, user_id=current_user.id)
            match = next(
                (p for p in curve.race_predictions if abs(p.distance_m - race.distance_m) < 500),
                None,
            )
            if match:
                predicted_time = match.predicted_time_sec
        except Exception:
            pass

    course_activity: Activity | None = None
    elevation_profile: list[tuple[float, float]] | None = None
    if strategy == "terrain":
        match = _matched_course_profile(race, current_user.id, db)
        if not match:
            raise HTTPException(
                status_code=422,
                detail="No terrain profile available: sync a past run with elevation data close to this race's distance.",
            )
        elevation_profile, course_activity = match

    plan = pacing_mod.generate_pacing_strategy(
        distance_m=race.distance_m,
        target_time_sec=float(effective_target),
        strategy=strategy,
        split_unit=split_unit,
        predicted_time_sec=predicted_time,
        source=source,
        elevation_profile=elevation_profile,
        expected_temp_c=expected_temp_c,
        expected_dew_point_c=expected_dew_point_c,
    )
    estimated_temp_c, estimated_dew_point_c = _estimated_race_conditions(current_user.id, db)

    return PacingStrategyResponse(
        race_id=race_id,
        race_name=race.title,
        distance_m=race.distance_m,
        distance_label=race.distance_label,
        race_date=race.date,
        target_time_sec=plan.target_time_sec,
        target_pace_min_km=plan.target_pace_min_km,
        strategy=plan.strategy,
        split_unit=plan.split_unit,
        splits=[
            {
                "split_number": s.split_number,
                "split_distance_m": s.split_distance_m,
                "cumulative_distance_m": s.cumulative_distance_m,
                "target_pace_min_km": s.target_pace_min_km,
                "split_time_sec": s.split_time_sec,
                "cumulative_time_sec": s.cumulative_time_sec,
                "grade_pct": s.grade_pct,
            }
            for s in plan.splits
        ],
        predicted_time_sec=plan.predicted_time_sec,
        source=plan.source,
        course_activity_id=course_activity.id if course_activity else None,
        course_activity_name=course_activity.name if course_activity else None,
        conditions_temp_c=plan.conditions_temp_c,
        conditions_dew_point_c=plan.conditions_dew_point_c,
        conditions_penalty_pct=plan.conditions_penalty_pct,
        adjusted_target_time_sec=plan.adjusted_target_time_sec,
        estimated_temp_c=estimated_temp_c,
        estimated_dew_point_c=estimated_dew_point_c,
    )


@router.post("/races/{race_id}/pacing/push", response_model=PushWorkoutResponse)
def api_push_race_pacing(
    race_id: int,
    body: PacingPushRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Push a race pacing plan as a structured workout to the user's Garmin device."""
    from app import pacing as pacing_mod
    from app import garmin_sync

    if not getattr(current_user, "garmin_oauth_data", None) and not getattr(current_user, "garmin_email", None):
        raise HTTPException(
            status_code=422,
            detail="Garmin account not connected. Connect in Settings first.",
        )

    race = _get_race_event(race_id, current_user.id, db)
    if not race.distance_m or race.distance_m <= 0:
        raise HTTPException(status_code=422, detail="Race has no distance set")

    effective_target = body.target_time_sec
    if effective_target is None:
        if race.goal_time_sec:
            effective_target = race.goal_time_sec
        else:
            try:
                curve = threshold_mod.get_performance_curve_data(db, user_id=current_user.id)
                match = next(
                    (p for p in curve.race_predictions if abs(p.distance_m - race.distance_m) < 500),
                    None,
                )
                if match:
                    effective_target = int(match.predicted_time_sec)
            except Exception:
                pass
        if effective_target is None:
            raise HTTPException(
                status_code=422,
                detail="No target time available to build pacing plan.",
            )

    elevation_profile: list[tuple[float, float]] | None = None
    if body.strategy == "terrain":
        match = _matched_course_profile(race, current_user.id, db)
        if not match:
            raise HTTPException(
                status_code=422,
                detail="No terrain profile available: sync a past run with elevation data close to this race's distance.",
            )
        elevation_profile, _course_activity = match

    plan = pacing_mod.generate_pacing_strategy(
        distance_m=race.distance_m,
        target_time_sec=float(effective_target),
        strategy=body.strategy,
        elevation_profile=elevation_profile,
        split_unit=body.split_unit,
        expected_temp_c=body.expected_temp_c,
        expected_dew_point_c=body.expected_dew_point_c,
    )

    try:
        result = garmin_sync.push_race_pacing_to_garmin(
            current_user,
            race_name=race.title or "Race",
            race_date=race.date,
            splits=plan.splits,
        )
    except RuntimeError as exc:
        logger.error("Garmin race pacing push failed for race %s: %s", race_id, exc)
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error pushing race pacing %s to Garmin", race_id)
        raise HTTPException(status_code=502, detail=f"Garmin error: {exc}")
    return result
