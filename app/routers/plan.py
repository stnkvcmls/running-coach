"""Training plan CRUD, season plan, adaptation, realignment, and Garmin push."""
import logging
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    AthleteProfile,
    DailyCheckin,
    DailySummary,
    SeasonPlanWeek,
    SyncStatus,
    TrainingPlan,
    TrainingPlanDay,
    User,
)
from app.schemas import (
    AIJobEnqueuedResponse,
    FuellingGuidance,
    MissedPlanSession,
    PlanAdaptationRequest,
    PlanRealignmentRequest,
    PlanRealignmentStatus,
    PushWorkoutResponse,
    SeasonPlanResponse,
    SeasonPlanWeekResponse,
    StrengthRoutine,
    TrainingPlanDayResponse,
    TrainingPlanResponse,
    TrainingPlanWeek,
)
from app.strength_routines import ROUTINE_LIBRARY, get_routine, get_routine_for_week
from app import training_load
from app import plan_adaptation as plan_adaptation_mod
from app import nutrition as nutrition_mod

logger = logging.getLogger(__name__)

router = APIRouter()


def _day_to_response(
    d: TrainingPlanDay,
    weight_kg: float | None = None,
    heat_stress: bool = False,
) -> TrainingPlanDayResponse:
    """Convert a TrainingPlanDay ORM row to its response schema, hydrating routine."""
    resp = TrainingPlanDayResponse.model_validate(d)
    if d.routine_id:
        raw = get_routine_for_week(d.routine_id, d.week_number)
        if raw:
            resp.routine = StrengthRoutine.model_validate(raw)
    if d.workout_type == "long" and d.target_distance_m and d.target_pace_min_km:
        duration_sec = (d.target_distance_m / 1000.0) * d.target_pace_min_km * 60.0
        guidance = nutrition_mod.compute_fuelling_guidance(
            duration_sec=duration_sec,
            intensity="long",
            weight_kg=weight_kg,
            heat_stress=heat_stress,
        )
        if guidance:
            resp.fuelling_guidance = FuellingGuidance(**guidance.__dict__)
    return resp


def _build_plan_response(plan: TrainingPlan, db: Session) -> TrainingPlanResponse:
    """Assemble a TrainingPlanResponse with nested week/day structure."""
    from app.ai_coach import recent_heat_stress

    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == plan.user_id).first()
    weight_kg = profile.weight_kg if profile else None
    heat_stress = recent_heat_stress(db, date.today(), plan.user_id)

    days = (
        db.query(TrainingPlanDay)
        .filter(TrainingPlanDay.plan_id == plan.id, TrainingPlanDay.user_id == plan.user_id)
        .order_by(TrainingPlanDay.day_date.asc())
        .all()
    )

    # Group days by week_number
    weeks_map: dict[int, list[TrainingPlanDay]] = {}
    for d in days:
        weeks_map.setdefault(d.week_number, []).append(d)

    plan_weeks: list[TrainingPlanWeek] = []
    for week_num in sorted(weeks_map):
        week_days = weeks_map[week_num]
        sorted_days = sorted(week_days, key=lambda d: d.day_date)
        week_start_date = sorted_days[0].day_date
        week_end_date = sorted_days[-1].day_date
        theme = sorted_days[0].week_theme if sorted_days else None
        plan_weeks.append(TrainingPlanWeek(
            week_number=week_num,
            week_start=week_start_date,
            week_end=week_end_date,
            theme=theme,
            days=[_day_to_response(d, weight_kg, heat_stress) for d in sorted_days],
        ))

    return TrainingPlanResponse(
        id=plan.id,
        generated_at=plan.generated_at,
        week_start=plan.week_start,
        plan_weeks=plan.plan_weeks,
        phase=plan.phase,
        overview=plan.overview,
        weeks=plan_weeks,
    )


@router.get("/strength-routines", response_model=list[StrengthRoutine])
def api_get_strength_routines():
    """Return the full catalog of strength & mobility routines."""
    return [StrengthRoutine.model_validate(get_routine(rid)) for rid in ROUTINE_LIBRARY]


@router.get("/training-plan", response_model=TrainingPlanResponse | None)
def api_get_training_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the most recently generated training plan, or null if none exists."""
    plan = (
        db.query(TrainingPlan)
        .filter(TrainingPlan.user_id == current_user.id)
        .order_by(TrainingPlan.generated_at.desc())
        .first()
    )
    if not plan:
        return None
    return _build_plan_response(plan, db)


@router.post("/training-plan/generate", response_model=AIJobEnqueuedResponse)
def api_generate_training_plan(current_user: User = Depends(get_current_user)):
    """Enqueue AI plan generation and return the job id for polling.

    Clients poll GET /api/v1/jobs/{job_id} until status is 'done', then
    refresh the training plan via GET /api/v1/training-plan.
    """
    from app.ai_coach import enqueue_job
    job_id = enqueue_job("generate_plan", {}, current_user.id)
    return AIJobEnqueuedResponse(status="queued", job_id=job_id)


@router.post("/training-plan/days/{day_id}/briefing", response_model=AIJobEnqueuedResponse)
def api_generate_briefing(
    day_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Enqueue a pre-workout briefing for a scheduled plan day and return the job id.

    Clients poll GET /api/v1/jobs/{job_id} until status is 'done', then refresh
    Today (GET /api/v1/today) to pick up the new briefing insight. Regenerates
    (replaces) any existing briefing for the day.
    """
    from app.ai_coach import enqueue_job

    plan_day = (
        db.query(TrainingPlanDay)
        .filter(TrainingPlanDay.id == day_id, TrainingPlanDay.user_id == current_user.id)
        .first()
    )
    if plan_day is None:
        raise HTTPException(status_code=404, detail="Plan day not found")

    job_id = enqueue_job("generate_briefing", {"plan_day_id": plan_day.id}, current_user.id)
    return AIJobEnqueuedResponse(status="queued", job_id=job_id)


@router.get("/season-plan", response_model=SeasonPlanResponse | None)
def api_get_season_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the season-long periodization skeleton to the athlete's goal race.

    Deterministic and cheap (no AI call), so it's computed/refreshed inline on
    read rather than via the job queue. Returns null if there's no goal race.
    """
    from app.season_plan import ensure_season_plan
    plan = ensure_season_plan(db, current_user.id)
    if not plan:
        return None
    weeks = (
        db.query(SeasonPlanWeek)
        .filter(SeasonPlanWeek.season_plan_id == plan.id, SeasonPlanWeek.user_id == current_user.id)
        .order_by(SeasonPlanWeek.week_start.asc())
        .all()
    )
    return SeasonPlanResponse(
        id=plan.id,
        generated_at=plan.generated_at,
        start_date=plan.start_date,
        goal_race_title=plan.goal_race_title,
        goal_race_date=plan.goal_race_date,
        goal_race_distance_m=plan.goal_race_distance_m,
        peak_weekly_km=plan.peak_weekly_km,
        weeks=[SeasonPlanWeekResponse.model_validate(w) for w in weeks],
    )


@router.post("/training-plan/adapt-day")
def api_adapt_plan_day(
    body: PlanAdaptationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept or dismiss a readiness-driven adaptation suggestion for a plan day."""
    uid = current_user.id
    plan_day = (
        db.query(TrainingPlanDay)
        .filter(TrainingPlanDay.id == body.plan_day_id, TrainingPlanDay.user_id == uid)
        .first()
    )
    if plan_day is None:
        raise HTTPException(status_code=404, detail="Plan day not found")

    if body.action == "dismiss":
        db.add(SyncStatus(
            user_id=uid,
            key=f"plan_adaptation_dismissed:{plan_day.id}",
            value="1",
        ))
        db.commit()
        return {"status": "dismissed"}

    # action == "accept" — re-derive the suggestion server-side and apply it
    daily_summary = (
        db.query(DailySummary)
        .filter(DailySummary.user_id == uid, DailySummary.date == plan_day.day_date)
        .first()
    )
    current_load = training_load.current_load(db, as_of=plan_day.day_date, user_id=uid)
    rhr_cutoff = plan_day.day_date - timedelta(days=7)
    recent_rhr_rows = (
        db.query(DailySummary.resting_hr)
        .filter(
            DailySummary.user_id == uid,
            DailySummary.date >= rhr_cutoff,
            DailySummary.date < plan_day.day_date,
            DailySummary.resting_hr.isnot(None),
        )
        .all()
    )
    recent_rhr = [row[0] for row in recent_rhr_rows]
    checkin = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.user_id == uid, DailyCheckin.date == plan_day.day_date)
        .first()
    )
    readiness = training_load.compute_readiness(daily_summary, current_load, recent_rhr, checkin)
    active_niggle = plan_adaptation_mod.get_active_niggle(db, uid)
    suggestion = plan_adaptation_mod.suggest_adaptation(
        plan_day,
        readiness,
        checkin,
        injury_risk=current_load.injury_risk if current_load else None,
        active_niggle=active_niggle,
    )
    if suggestion is None:
        raise HTTPException(status_code=409, detail="No adaptation suggestion applies to this plan day")

    plan_day.notes = (
        f"{suggestion.reason}"
        + (f"\n{plan_day.notes}" if plan_day.notes else "")
    )
    plan_day.workout_type = suggestion.suggested_workout_type
    plan_day.target_distance_m = suggestion.suggested_target_distance_m
    if suggestion.direction == "downgrade":
        plan_day.target_pace_min_km = None
        plan_day.target_pace_display = None
    db.commit()
    db.refresh(plan_day)
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == uid).first()
    from app.ai_coach import recent_heat_stress
    heat_stress = recent_heat_stress(db, date.today(), uid)
    return _day_to_response(plan_day, profile.weight_kg if profile else None, heat_stress)


@router.get("/training-plan/realignment-status", response_model=PlanRealignmentStatus)
def api_get_realignment_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return whether the current plan has enough missed sessions to warrant realignment."""
    from app.ai_coach import detect_plan_realignment
    result = detect_plan_realignment(db, date.today(), user_id=current_user.id)
    return PlanRealignmentStatus(
        should_prompt=result["should_prompt"],
        missed_count=result["missed_count"],
        total_scheduled=result["total_scheduled"],
        missed_sessions=[
            MissedPlanSession(
                date=s["date"],
                workout_type=s["workout_type"],
                target_distance_km=s["target_distance_km"],
            )
            for s in result["missed_sessions"]
        ],
        race_note=result["race_note"],
    )


@router.post("/training-plan/realign")
def api_realign_plan(
    body: PlanRealignmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Handle plan realignment: regenerate the plan or dismiss the banner for 7 days."""
    if body.action == "dismiss":
        dismiss_until = (date.today() + timedelta(days=7)).isoformat()
        row = db.query(SyncStatus).filter(
            SyncStatus.user_id == current_user.id,
            SyncStatus.key == "plan_realignment_dismissed_until",
        ).first()
        if row:
            row.value = dismiss_until
        else:
            db.add(SyncStatus(
                user_id=current_user.id,
                key="plan_realignment_dismissed_until",
                value=dismiss_until,
            ))
        db.commit()
        return {"status": "dismissed", "until": dismiss_until}

    # action == "regenerate" — enqueue and return job id for polling
    from app.ai_coach import enqueue_job
    # Clear any existing dismiss snooze when the user triggers regeneration
    row = db.query(SyncStatus).filter(
        SyncStatus.user_id == current_user.id,
        SyncStatus.key == "plan_realignment_dismissed_until",
    ).first()
    if row:
        db.delete(row)
        db.commit()
    job_id = enqueue_job("generate_plan", {}, current_user.id)
    return AIJobEnqueuedResponse(status="queued", job_id=job_id)


@router.post("/training-plan/days/{day_id}/push-to-garmin", response_model=PushWorkoutResponse)
def api_push_workout_to_garmin(
    day_id: int,
    current_user: User = Depends(get_current_user),
):
    """Upload a plan day as a structured workout to the user's Garmin device.

    Creates the workout on Garmin Connect and schedules it on the plan day's
    date so it appears on the watch. Rest and cross-training days are rejected
    with 422; Garmin API failures surface as 502.
    """
    from app import garmin_sync

    if not current_user.garmin_email:
        raise HTTPException(
            status_code=422,
            detail="Garmin account not connected. Connect in Settings first.",
        )
    try:
        result = garmin_sync.push_workout_to_garmin(current_user, day_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc:
        logger.error("Garmin push failed for day %s: %s", day_id, exc)
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error pushing workout %s to Garmin", day_id)
        raise HTTPException(status_code=502, detail=f"Garmin error: {exc}")
    return result
