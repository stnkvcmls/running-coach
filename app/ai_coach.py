import json
import logging
import time
from datetime import datetime, date, timedelta, timezone

import anthropic
from google import genai
from google.genai import errors as _genai_errors
from google.genai import types as _genai_types
from sqlalchemy.orm import Session
from sqlalchemy import func

from app import training_load
from app import threshold as threshold_mod
from app import adherence as adherence_mod
from app import intensity as intensity_mod
from app import weather as weather_mod
from app.config import settings
from app.database import db_session
from app.models import (
    DEFAULT_USER_ID,
    Activity,
    AthleteProfile,
    CoachMemory,
    DailySummary,
    GarminCalendarEvent,
    Insight,
    MetricZone,
    SyncStatus,
    TrainingPlan,
    TrainingPlanDay,
    ZoneConfig,
)
from app.utils import calculate_age
from app.strength_routines import catalog_summary, get_routine

logger = logging.getLogger(__name__)


class AITransientError(Exception):
    """Retryable AI error: rate limit, timeout, or server 5xx."""


class AIFatalError(Exception):
    """Non-retryable AI error: bad credentials, invalid model, or bad request."""


_MAX_RETRIES = 3
_BACKOFF_BASE = 2  # seconds; delays are 1s, 2s before the 3rd attempt
_PLAN_MAX_TOKENS = 16000


SYSTEM_PROMPT = """You are an experienced, data-driven running coach. You analyze training data from Garmin Connect and provide actionable insights.

Your approach:
- Focus on injury prevention and sustainable progressive overload
- Analyze pacing strategy, HR drift, cadence, and training effect
- Analyze running dynamics (ground contact time, vertical oscillation, vertical ratio) for form assessment when available
- Use power metrics (NP, TSS, IF) for training load analysis when available
- When a Training Load section is present, read CTL (Fitness), ATL (Fatigue), TSB (Form = CTL − ATL), and ACWR (ATL/CTL) together: negative TSB means accumulated fatigue (productive while building, but watch for overreaching), positive TSB means freshness/taper. ACWR sweet spot is 0.8–1.3; above 1.3 signals moderate overreaching risk, above 1.5 is high injury risk. Flag rapid ramp rates (>7–10 CTL points/week) and elevated ACWR.
- Consider respiration rate trends for effort assessment
- Consider recovery indicators (sleep, stress, resting HR, body battery)
- Tailor advice to upcoming races when applicable
- Be concise: 3-5 key points per analysis
- Use markdown formatting with headers and bullet points
- Start with a one-line summary (prefixed with "**Summary:** ")

When race goals are provided, frame training recommendations around race preparation:
- Suggest appropriate workout types for the training phase
- Flag if training volume or intensity needs adjustment
- Consider tapering needs as race day approaches

Running Dynamics Zone Reference (Garmin percentile-based):
- Cadence: Excellent >185 spm (top 5%), Above Avg 174-185 (70-95%), Average 163-173 (30-69%), Below Avg 151-162 (5-29%), Poor <151 (bottom 5%)
- GCT: Excellent <208 ms (top 5%), Above Avg 208-240 (70-95%), Average 241-272 (30-69%), Below Avg 273-305 (5-29%), Poor >305 (bottom 5%)
- Vertical Oscillation: Excellent <6.4 cm (top 5%), Above Avg 6.4-8.1 (70-95%), Average 8.1-9.7 (30-69%), Below Avg 9.7-11.5 (5-29%), Poor >11.5 (bottom 5%)
- Vertical Ratio: Excellent <6.1% (top 5%), Above Avg 6.1-7.4 (70-95%), Average 7.4-8.6 (30-69%), Below Avg 8.6-10.1 (5-29%), Poor >10.1 (bottom 5%)
When a runner's metrics fall outside the average zone, note this and suggest corrective drills if appropriate.

When user feedback is provided (rating, reported issues, comments), prioritize addressing those specific concerns in your analysis. If the user reports setbacks like tough paces, not feeling well, or conditions issues, offer practical advice tailored to those reported problems."""


def _classify_metric(value: float, zones: list[MetricZone]) -> str:
    """Classify a metric value into its percentile zone and return a descriptive string."""
    for zone in zones:
        above_min = zone.min_value is None or value >= zone.min_value
        below_max = zone.max_value is None or value < zone.max_value
        if above_min and below_max:
            label = zone.zone_name.replace("_", " ").title()
            return f" ({label} zone, {zone.percentile_label} percentile)"
    # Check unbounded max zones
    for zone in zones:
        if zone.max_value is None:
            above_min = zone.min_value is None or value >= zone.min_value
            if above_min:
                label = zone.zone_name.replace("_", " ").title()
                return f" ({label} zone, {zone.percentile_label} percentile)"
    return ""


def _classify_by_zones(value: float, configs: list[ZoneConfig], threshold: float | None) -> str:
    """Classify a value against threshold-anchored ZoneConfig entries."""
    if not configs or not threshold or threshold <= 0:
        return ""
    for cfg in sorted(configs, key=lambda z: z.zone_number):
        above_min = cfg.min_pct is None or value >= threshold * cfg.min_pct / 100
        below_max = cfg.max_pct is None or value < threshold * cfg.max_pct / 100
        if above_min and below_max:
            return f" (Zone {cfg.zone_number}: {cfg.zone_name})"
    return ""


def _format_activity_context(
    activity: Activity,
    zones_by_metric: dict[str, list[MetricZone]] | None = None,
    hr_zone_configs: list[ZoneConfig] | None = None,
    pace_zone_configs: list[ZoneConfig] | None = None,
    threshold_hr: int | None = None,
    threshold_pace: float | None = None,
) -> str:
    parts = [
        f"**{activity.name}** ({activity.activity_type})",
        f"Date: {activity.started_at.strftime('%Y-%m-%d %H:%M') if activity.started_at else 'unknown'}",
    ]
    if activity.distance_m:
        parts.append(f"Distance: {activity.distance_m / 1000:.2f} km")
    if activity.duration_sec:
        mins = int(activity.duration_sec // 60)
        secs = int(activity.duration_sec % 60)
        parts.append(f"Duration: {mins}:{secs:02d}")
    if activity.avg_pace_min_km:
        pace_min = int(activity.avg_pace_min_km)
        pace_sec = int((activity.avg_pace_min_km - pace_min) * 60)
        zone_str = _classify_by_zones(activity.avg_pace_min_km, pace_zone_configs or [], threshold_pace)
        parts.append(f"Avg Pace: {pace_min}:{pace_sec:02d} /km{zone_str}")
    if activity.avg_hr:
        zone_str = _classify_by_zones(activity.avg_hr, hr_zone_configs or [], threshold_hr)
        parts.append(f"Avg HR: {activity.avg_hr} bpm{zone_str}")
    if activity.max_hr:
        parts.append(f"Max HR: {activity.max_hr} bpm")
    if activity.avg_cadence:
        zone_str = _classify_metric(activity.avg_cadence, zones_by_metric.get("cadence", [])) if zones_by_metric else ""
        parts.append(f"Cadence: {activity.avg_cadence:.0f} spm{zone_str}")
    if activity.avg_stride:
        parts.append(f"Stride: {activity.avg_stride:.2f} m")
    if activity.elevation_gain:
        parts.append(f"Elevation: +{activity.elevation_gain:.0f}m / -{activity.elevation_loss or 0:.0f}m")
    if activity.training_effect_aerobic:
        parts.append(f"Aerobic TE: {activity.training_effect_aerobic:.1f}")
    if activity.training_effect_anaerobic:
        parts.append(f"Anaerobic TE: {activity.training_effect_anaerobic:.1f}")
    if activity.vo2max:
        parts.append(f"VO2max: {activity.vo2max:.1f}")
    if activity.calories:
        parts.append(f"Calories: {activity.calories:.0f}")

    # Running dynamics
    if activity.avg_ground_contact_time:
        zone_str = _classify_metric(activity.avg_ground_contact_time, zones_by_metric.get("gct", [])) if zones_by_metric else ""
        parts.append(f"Ground Contact Time: {activity.avg_ground_contact_time:.0f} ms{zone_str}")
    if activity.avg_vertical_oscillation:
        zone_str = _classify_metric(activity.avg_vertical_oscillation, zones_by_metric.get("vert_osc", [])) if zones_by_metric else ""
        parts.append(f"Vertical Oscillation: {activity.avg_vertical_oscillation:.1f} cm{zone_str}")
    if activity.avg_vertical_ratio:
        zone_str = _classify_metric(activity.avg_vertical_ratio, zones_by_metric.get("vert_ratio", [])) if zones_by_metric else ""
        parts.append(f"Vertical Ratio: {activity.avg_vertical_ratio:.1f}%{zone_str}")

    # Power metrics
    if activity.normalized_power:
        parts.append(f"Normalized Power: {activity.normalized_power:.0f} W")
    if activity.training_stress_score:
        parts.append(f"TSS: {activity.training_stress_score:.1f}")
    if activity.intensity_factor:
        parts.append(f"Intensity Factor: {activity.intensity_factor:.2f}")

    # Respiration
    if activity.avg_respiration_rate:
        parts.append(f"Avg Respiration: {activity.avg_respiration_rate:.1f} br/min")
    if activity.max_respiration_rate:
        parts.append(f"Max Respiration: {activity.max_respiration_rate:.1f} br/min")

    # Speed
    if activity.avg_speed:
        parts.append(f"Avg Speed: {activity.avg_speed * 3.6:.1f} km/h")
    if activity.max_speed:
        parts.append(f"Max Speed: {activity.max_speed * 3.6:.1f} km/h")

    # Additional HR & elevation
    if activity.min_hr:
        parts.append(f"Min HR: {activity.min_hr} bpm")
    if activity.max_elevation is not None and activity.min_elevation is not None:
        parts.append(f"Elevation Range: {activity.min_elevation:.0f}m - {activity.max_elevation:.0f}m")
    if activity.max_cadence:
        parts.append(f"Max Cadence: {activity.max_cadence:.0f} spm")
    if activity.run_time_sec and activity.walk_time_sec:
        parts.append(
            f"Run/Walk: {int(activity.run_time_sec // 60)}min run / {int(activity.walk_time_sec // 60)}min walk"
        )
    elif activity.run_time_sec:
        parts.append(f"Run Time: {int(activity.run_time_sec // 60)}min")
    if activity.power_zones_json:
        try:
            pz = json.loads(activity.power_zones_json)
            if isinstance(pz, list):
                zone_parts = [
                    f"PZ{z.get('zoneNumber', '?')}: {int(z.get('secsInZone', 0) // 60)}m"
                    for z in pz if z.get("secsInZone", 0) > 0
                ]
                if zone_parts:
                    parts.append(f"Power Zones: {', '.join(zone_parts)}")
        except (json.JSONDecodeError, TypeError):
            pass

    # Aerobic coupling metrics
    if activity.decoupling_pct is not None:
        coupling = (
            "excellent aerobic durability" if activity.decoupling_pct < 3
            else "good aerobic durability" if activity.decoupling_pct < 5
            else "moderate cardiac drift" if activity.decoupling_pct < 8
            else "significant cardiac drift"
        )
        parts.append(f"Aerobic Decoupling: {activity.decoupling_pct:.1f}% — {coupling}")
    if activity.efficiency_factor is not None:
        # Convert m/s per bpm to a more readable format (multiply by 1000 → mm/s per bpm)
        parts.append(f"Efficiency Factor: {activity.efficiency_factor * 1000:.2f} mm/s/bpm")

    # Add lap data if available
    if activity.laps_json:
        try:
            laps_data = json.loads(activity.laps_json)
            # Try to extract lap summaries from the detailed data
            laps = None
            if isinstance(laps_data, dict):
                laps = laps_data.get("metricDescriptors")
                # If it's activity details format, summarize it
                parts.append("(Detailed lap/metric data available)")
            elif isinstance(laps_data, list):
                laps = laps_data
                parts.append(f"Laps: {len(laps)}")
        except (json.JSONDecodeError, TypeError):
            pass

    # Add HR zones
    if activity.hr_zones_json:
        try:
            zones = json.loads(activity.hr_zones_json)
            if isinstance(zones, list):
                zone_strs = []
                for z in zones:
                    zone_num = z.get("zoneNumber", "?")
                    secs = z.get("secsInZone", 0)
                    if secs > 0:
                        zone_strs.append(f"Z{zone_num}: {secs // 60}m")
                if zone_strs:
                    parts.append(f"HR Zones: {', '.join(zone_strs)}")
        except (json.JSONDecodeError, TypeError):
            pass

    # Add splits
    if activity.splits_json:
        try:
            splits = json.loads(activity.splits_json)
            if isinstance(splits, list) and splits:
                parts.append(f"Splits: {len(splits)} segments")
            elif isinstance(splits, dict):
                lap_list = splits.get("lapDTOs", [])
                if lap_list:
                    split_details = []
                    for lap in lap_list[:10]:  # First 10 splits
                        dist = lap.get("distance", 0)
                        dur = lap.get("duration", 0)
                        if dist > 0 and dur > 0:
                            pace = (dur / 60) / (dist / 1000)
                            p_min = int(pace)
                            p_sec = int((pace - p_min) * 60)
                            hr = lap.get("averageHR", "")
                            split_details.append(f"{dist/1000:.1f}km @ {p_min}:{p_sec:02d}/km HR:{hr}")
                    if split_details:
                        parts.append("Split details:\n  " + "\n  ".join(split_details))
        except (json.JSONDecodeError, TypeError):
            pass

    # Weather-adjusted pace
    if activity.weather_json:
        try:
            weather = weather_mod.parse_weather(activity.weather_json)
            _, penalty_sec, wx_desc = weather_mod.weather_pace_info(
                weather, activity.avg_pace_min_km
            )
            if wx_desc:
                parts.append(f"Weather: {wx_desc}")
        except Exception:
            pass

    return "\n".join(parts)


def _format_daily_context(summary: DailySummary) -> str:
    parts = [f"**Daily Summary for {summary.date}**"]
    if summary.steps:
        parts.append(f"Steps: {summary.steps:,}")
    if summary.resting_hr:
        parts.append(f"Resting HR: {summary.resting_hr} bpm")
    if summary.sleep_seconds:
        h = summary.sleep_seconds // 3600
        m = (summary.sleep_seconds % 3600) // 60
        parts.append(f"Sleep: {h}h {m}m")
    if summary.sleep_score:
        parts.append(f"Sleep Score: {summary.sleep_score:.0f}")
    if summary.stress_avg:
        parts.append(f"Avg Stress: {summary.stress_avg}")
    if summary.body_battery_high is not None:
        parts.append(f"Body Battery: {summary.body_battery_low}-{summary.body_battery_high}")
    if summary.hrv_avg is not None:
        hrv = f"HRV (overnight): {summary.hrv_avg:.0f} ms"
        if summary.hrv_status:
            hrv += f" ({summary.hrv_status.title()})"
        parts.append(hrv)
    if summary.total_calories:
        parts.append(f"Calories: {summary.total_calories:,}")
    if summary.intensity_minutes:
        parts.append(f"Intensity Minutes: {summary.intensity_minutes}")
    return "\n".join(parts)


def _format_athlete_profile_context(profile: AthleteProfile, reference_date: date | None = None) -> str:
    """Format the athlete profile as a markdown block, emitting only set fields."""
    import json as _json

    ref = reference_date or date.today()
    lines = []
    if profile.name:
        lines.append(f"- Name: {profile.name}")
    age = calculate_age(profile.date_of_birth, ref)
    if age is not None:
        lines.append(f"- Age: {age}")
    if profile.weight_kg:
        lines.append(f"- Weight: {profile.weight_kg:.1f} kg")
    if profile.goal_race:
        goal = f"- Goal Race: {profile.goal_race}"
        if profile.goal_race_date:
            days_until = (profile.goal_race_date - ref).days
            goal += f" on {profile.goal_race_date} ({days_until} days away)"
        lines.append(goal)
    elif profile.goal_race_date:
        days_until = (profile.goal_race_date - ref).days
        lines.append(f"- Goal Race Date: {profile.goal_race_date} ({days_until} days away)")
    if profile.threshold_pace_min_km:
        p_min = int(profile.threshold_pace_min_km)
        p_sec = int((profile.threshold_pace_min_km - p_min) * 60)
        lines.append(f"- Threshold Pace: {p_min}:{p_sec:02d}/km")
    if profile.threshold_hr:
        lines.append(f"- Threshold HR: {profile.threshold_hr} bpm")
    if getattr(profile, "threshold_power", None):
        lines.append(f"- Threshold Power (FTP): {profile.threshold_power} W")
    if profile.max_hr:
        lines.append(f"- Max HR: {profile.max_hr} bpm")
    if profile.resting_hr:
        lines.append(f"- Resting HR: {profile.resting_hr} bpm")
    # Structured plan preferences
    if getattr(profile, "running_ability", None):
        lines.append(f"- Running Ability: {profile.running_ability}")
    if getattr(profile, "training_volume", None):
        _vol_hints = {
            "gradual": "low volume, gentle progression",
            "steady": "medium volume, sustainable progression",
            "progressive": "high volume, aggressive progression",
        }
        hint = _vol_hints.get(profile.training_volume, "")
        lines.append(f"- Training Volume: {profile.training_volume}" + (f" ({hint})" if hint else ""))
    if getattr(profile, "difficulty", None):
        _diff_hints = {
            "comfortable": "1 hard session/week, no mandatory pace targets on long runs",
            "balanced": "1-2 hard sessions/week, occasional long-run pace targets",
            "challenging": "2 hard sessions/week, regular pace targets on quality days",
        }
        hint = _diff_hints.get(profile.difficulty, "")
        lines.append(f"- Plan Difficulty: {profile.difficulty}" + (f" ({hint})" if hint else ""))
    if getattr(profile, "elevation_profile", None):
        _elev_hints = {
            "flat": "no hill workouts",
            "rolling": "some hill workouts",
            "moderate": "regular hill workouts",
            "hilly": "frequent hill workouts",
        }
        hint = _elev_hints.get(profile.elevation_profile, "")
        lines.append(f"- Elevation Profile: {profile.elevation_profile}" + (f" ({hint})" if hint else ""))
    if getattr(profile, "target_weekly_km", None):
        lines.append(f"- Target Weekly Mileage: {profile.target_weekly_km:.1f} km")
    if getattr(profile, "weekly_mileage_km", None):
        lines.append(f"- Current Weekly Mileage: {profile.weekly_mileage_km:.1f} km")
    if getattr(profile, "longest_run_km", None):
        lines.append(f"- Current Longest Run: {profile.longest_run_km:.1f} km")
    if getattr(profile, "runs_per_week", None):
        lines.append(f"- Runs Per Week: {profile.runs_per_week}")
    if getattr(profile, "available_days", None):
        try:
            days = _json.loads(profile.available_days)
            lines.append(f"- Available Training Days: {', '.join(days)}")
        except Exception:
            lines.append(f"- Available Training Days: {profile.available_days}")
    if getattr(profile, "long_run_day", None):
        lines.append(f"- Long Run Day: {profile.long_run_day}")
    if getattr(profile, "race_times_json", None):
        try:
            times = _json.loads(profile.race_times_json)
            parts = [f"{dist}: {t}" for dist, t in times.items() if t]
            if parts:
                lines.append(f"- Current Race Times: {', '.join(parts)}")
        except Exception:
            pass
    if profile.weekly_availability:
        lines.append(f"- Weekly Availability (notes): {profile.weekly_availability}")
    if profile.training_preferences:
        lines.append(f"- Training Preferences (notes): {profile.training_preferences}")
    if profile.injury_history:
        lines.append(f"- Injury History: {profile.injury_history}")
    if not lines:
        return ""
    return "## Athlete Profile\n" + "\n".join(lines)


# Cap on how many memory entries are injected per turn, so a long history of
# resolved niggles doesn't crowd out the rest of the context.
COACH_MEMORY_CONTEXT_LIMIT = 10


def _format_coach_memory_context(db: Session, user_id: int) -> str:
    """Format the athlete's active durable memories as a markdown block."""
    memories = (
        db.query(CoachMemory)
        .filter(CoachMemory.user_id == user_id, CoachMemory.active.is_(True))
        .order_by(CoachMemory.created_at.desc())
        .limit(COACH_MEMORY_CONTEXT_LIMIT)
        .all()
    )
    if not memories:
        return ""
    lines = [f"- [{m.category}] {m.tag}: {m.note}" for m in memories]
    return "## What The Coach Remembers\n" + "\n".join(lines)


def _recent_hot_runs(
    db: Session,
    reference_date: date,
    user_id: int = DEFAULT_USER_ID,
) -> list[str]:
    """Return descriptions of recent runs with a notable heat penalty (>= 5 s/km).

    Checks the last 3 running activities with weather data in the past 7 days.
    """
    cutoff = reference_date - timedelta(days=7)
    recent = (
        db.query(Activity)
        .filter(
            Activity.user_id == user_id,
            Activity.started_at >= datetime.combine(cutoff, datetime.min.time(), tzinfo=timezone.utc),
            Activity.weather_json.isnot(None),
        )
        .order_by(Activity.started_at.desc())
        .limit(3)
        .all()
    )
    hot_runs: list[str] = []
    for act in recent:
        try:
            weather = weather_mod.parse_weather(act.weather_json)
            _, penalty_sec, _ = weather_mod.weather_pace_info(weather, act.avg_pace_min_km)
            if penalty_sec is not None and penalty_sec >= 5:
                date_str = act.started_at.strftime("%m/%d") if act.started_at else "recent"
                hot_runs.append(f"{date_str} (~{int(penalty_sec)} s/km heat penalty)")
        except Exception:
            continue
    return hot_runs


def _recent_heat_stress_note(
    db: Session,
    reference_date: date,
    user_id: int = DEFAULT_USER_ID,
) -> str:
    """Return a one-line heat-stress note for the readiness section.

    If any of the last 3 weathered runs had a notable heat penalty, surface a
    coaching note so the AI factors environmental load into its recovery
    assessment.
    """
    hot_runs = _recent_hot_runs(db, reference_date, user_id)
    if not hot_runs:
        return ""
    runs_str = ", ".join(hot_runs)
    return f"- Recent heat stress: {runs_str} — environmental load may be elevating fatigue"


def recent_heat_stress(
    db: Session,
    reference_date: date,
    user_id: int = DEFAULT_USER_ID,
) -> bool:
    """Whether any of the last 3 weathered runs (past 7 days) had a notable heat penalty.

    Used to scale fluid targets in fuelling guidance (app/nutrition.py) for
    upcoming long runs/races, where no direct weather reading exists yet.
    """
    return bool(_recent_hot_runs(db, reference_date, user_id))


def _build_context(
    db: Session,
    trigger_type: str,
    trigger_data: str,
    reference_date: date | None = None,
    user_id: int = DEFAULT_USER_ID,
) -> str:
    """Build full context for AI analysis.

    Args:
        reference_date: The date to use as "today" for temporal context.
                        Defaults to date.today() if not provided.
        user_id: Scope all data to this user.
    """
    if reference_date is None:
        reference_date = date.today()
    ref_datetime = datetime.combine(reference_date, datetime.min.time(), tzinfo=timezone.utc)

    sections = [f"## Current Data\n{trigger_data}"]

    # Athlete profile (baseline personalization — lands right after Current Data)
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    if profile:
        profile_context = _format_athlete_profile_context(profile, reference_date)
        if profile_context:
            sections.insert(1, profile_context)

    # What the coach remembers (durable niggles/constraints/preferences)
    memory_context = _format_coach_memory_context(db, user_id)
    if memory_context:
        sections.insert(min(2, len(sections)), memory_context)

    # Auto-derived thresholds — surface only the ones the athlete hasn't set so the
    # AI still has a reference for Critical Power / threshold pace / LTHR.
    try:
        estimate = threshold_mod.estimate_thresholds(db, user_id=user_id)
        estimate_context = threshold_mod.format_threshold_estimate_context(estimate, profile)
        if estimate_context:
            sections.insert(min(2, len(sections)), estimate_context)
    except Exception:
        logger.debug("Threshold estimate skipped", exc_info=True)

    # Training load (Fitness/Fatigue/Form) as of the reference date
    load_point = training_load.current_load(db, as_of=reference_date, user_id=user_id)
    load_context = training_load.format_training_load_context(load_point)
    if load_context:
        sections.insert(2 if len(sections) > 1 else 1, load_context)

    # Training readiness (composite of sleep, stress, body battery, acute load)
    today_summary = (
        db.query(DailySummary)
        .filter(DailySummary.user_id == user_id, DailySummary.date == reference_date)
        .first()
    )
    rhr_cutoff = reference_date - timedelta(days=7)
    recent_rhr_rows = (
        db.query(DailySummary.resting_hr)
        .filter(
            DailySummary.user_id == user_id,
            DailySummary.date >= rhr_cutoff,
            DailySummary.date < reference_date,
            DailySummary.resting_hr.isnot(None),
        )
        .all()
    )
    recent_rhr = [row[0] for row in recent_rhr_rows]
    readiness = training_load.compute_readiness(today_summary, load_point, recent_rhr)
    readiness_context = training_load.format_readiness_context(readiness)

    # Append a heat-stress note to readiness when recent runs were hot/humid.
    # Query the last 3 activities with weather data and check for notable penalties.
    heat_penalty_note = _recent_heat_stress_note(db, reference_date, user_id)
    if heat_penalty_note:
        readiness_context = (readiness_context + "\n" + heat_penalty_note).strip()

    if readiness_context:
        insert_pos = min(3, len(sections))
        sections.insert(insert_pos, readiness_context)

    # Recent activities (last 14 days)
    cutoff = ref_datetime - timedelta(days=14)
    recent_activities = (
        db.query(Activity)
        .filter(Activity.user_id == user_id, Activity.started_at >= cutoff)
        .order_by(Activity.started_at.desc())
        .limit(15)
        .all()
    )
    if recent_activities:
        act_lines = []
        for a in recent_activities:
            dist = f"{a.distance_m / 1000:.1f}km" if a.distance_m else "?"
            dur = f"{int(a.duration_sec // 60)}min" if a.duration_sec else "?"
            hr = f"HR:{a.avg_hr}" if a.avg_hr else ""
            pace = ""
            if a.avg_pace_min_km:
                p_min = int(a.avg_pace_min_km)
                p_sec = int((a.avg_pace_min_km - p_min) * 60)
                pace = f"{p_min}:{p_sec:02d}/km"
            date_str = a.started_at.strftime("%m/%d") if a.started_at else "?"
            act_lines.append(f"- {date_str}: {a.name} ({a.activity_type}) {dist} {dur} {pace} {hr}")
        sections.append("## Recent Activities (14 days)\n" + "\n".join(act_lines))

    # Weekly volume (last 8 weeks)
    weeks = []
    for w in range(8):
        week_start = reference_date - timedelta(days=reference_date.weekday() + 7 * w)
        week_end = week_start + timedelta(days=7)
        result = (
            db.query(
                func.count(Activity.id),
                func.sum(Activity.distance_m),
                func.sum(Activity.duration_sec),
            )
            .filter(
                Activity.user_id == user_id,
                Activity.started_at >= datetime.combine(week_start, datetime.min.time()),
                Activity.started_at < datetime.combine(week_end, datetime.min.time()),
            )
            .first()
        )
        count, dist, dur = result
        if count and count > 0:
            weeks.append(
                f"- Week of {week_start}: {count} activities, "
                f"{(dist or 0) / 1000:.1f}km, {int((dur or 0) / 60)}min"
            )
    if weeks:
        sections.append("## Weekly Volume (last 8 weeks)\n" + "\n".join(weeks))

    # Intensity distribution (HR zones, last 4 weeks)
    try:
        intensity_weeks = intensity_mod.aggregate_weekly_intensity(
            db, days=56, zone_type="hr", as_of=reference_date, user_id=user_id
        )
        intensity_context = intensity_mod.format_intensity_context(intensity_weeks, zone_type="hr")
        if intensity_context:
            sections.append(intensity_context)
    except Exception:
        logger.debug("Intensity context skipped", exc_info=True)

    # Recent daily summaries (last 7 days)
    recent_days = (
        db.query(DailySummary)
        .filter(DailySummary.user_id == user_id)
        .order_by(DailySummary.date.desc())
        .limit(7)
        .all()
    )
    if recent_days:
        day_lines = []
        for d in recent_days:
            sleep = ""
            if d.sleep_seconds:
                h = d.sleep_seconds // 3600
                m = (d.sleep_seconds % 3600) // 60
                sleep = f"Sleep:{h}h{m}m"
            rhr = f"RHR:{d.resting_hr}" if d.resting_hr else ""
            bb = f"BB:{d.body_battery_low}-{d.body_battery_high}" if d.body_battery_high else ""
            stress = f"Stress:{d.stress_avg}" if d.stress_avg else ""
            day_lines.append(f"- {d.date}: {sleep} {rhr} {bb} {stress}")
        sections.append("## Recent Recovery (7 days)\n" + "\n".join(day_lines))

    # Upcoming races (from Garmin calendar)
    upcoming_races = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.user_id == user_id,
            GarminCalendarEvent.event_type == "race",
            GarminCalendarEvent.date >= reference_date,
        )
        .order_by(GarminCalendarEvent.date.asc())
        .all()
    )
    if upcoming_races:
        race_lines = []
        for r in upcoming_races:
            days_until = (r.date - reference_date).days
            goal = ""
            if r.goal_time_sec:
                gh = r.goal_time_sec // 3600
                gm = (r.goal_time_sec % 3600) // 60
                gs = r.goal_time_sec % 60
                goal = f" Goal: {gh}:{gm:02d}:{gs:02d}" if gh else f" Goal: {gm}:{gs:02d}"
            priority = f" [Priority {r.priority}]" if r.priority else ""
            pacing_note = ""
            if r.distance_m and r.goal_time_sec:
                try:
                    from app.pacing import generate_pacing_strategy
                    plan = generate_pacing_strategy(
                        distance_m=r.distance_m,
                        target_time_sec=float(r.goal_time_sec),
                        strategy="even",
                        split_unit="km",
                    )
                    p_min = int(plan.target_pace_min_km)
                    p_sec = int((plan.target_pace_min_km - p_min) * 60)
                    pacing_note = f" Avg pace: {p_min}:{p_sec:02d}/km"
                except Exception:
                    pass
            race_lines.append(
                f"- {r.title} ({r.distance_label or '?'}) on {r.date} "
                f"({days_until} days away){goal}{pacing_note}{priority}"
            )
        sections.append("## Upcoming Races\n" + "\n".join(race_lines))

    # Next scheduled training (from Garmin calendar)
    next_training = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.user_id == user_id,
            GarminCalendarEvent.event_type == "workout",
            GarminCalendarEvent.date >= date.today(),
        )
        .order_by(GarminCalendarEvent.date.asc())
        .first()
    )
    if next_training:
        training_parts = [
            f"- {next_training.title} on {next_training.date}",
            f"- Type: {next_training.workout_type or 'General'}",
        ]
        if next_training.workout_description:
            training_parts.append(f"- Details: {next_training.workout_description}")
        sections.append("## Next Scheduled Training\n" + "\n".join(training_parts))

    # Recent insights (last 3) to avoid repetition
    recent_insights = (
        db.query(Insight)
        .filter(Insight.user_id == user_id)
        .order_by(Insight.created_at.desc())
        .limit(3)
        .all()
    )
    if recent_insights:
        ins_lines = [f"- [{i.category}] {i.summary}" for i in recent_insights if i.summary]
        if ins_lines:
            sections.append(
                "## Recent Insights (avoid repeating these)\n" + "\n".join(ins_lines)
            )

    return "\n\n".join(sections)


def _extract_summary_and_category(content: str, trigger_type: str) -> tuple[str, str]:
    """Extract summary line and category from AI response text."""
    summary = ""
    for line in content.split("\n"):
        if line.strip().startswith("**Summary:**"):
            summary = line.strip().replace("**Summary:**", "").strip()
            break
    if not summary:
        summary = content.split("\n")[0][:200]
    category_map = {
        "activity": "workout_analysis",
        "daily_summary": "recovery",
        "weekly_review": "training_plan",
    }
    return summary, category_map.get(trigger_type, "recommendation")


def _call_claude(context: str, trigger_type: str, model: str) -> tuple[str, str, str]:
    """Call Claude API and return (content, summary, category)."""
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    user_prompt = f"Analyze this {trigger_type} data and provide coaching insights:\n\n{context}"
    try:
        response = client.messages.create(
            model=model,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except (
        anthropic.RateLimitError,
        anthropic.APITimeoutError,
        anthropic.APIConnectionError,
        anthropic.InternalServerError,
    ) as exc:
        raise AITransientError(str(exc)) from exc
    except (
        anthropic.AuthenticationError,
        anthropic.PermissionDeniedError,
        anthropic.BadRequestError,
        anthropic.NotFoundError,
    ) as exc:
        raise AIFatalError(str(exc)) from exc
    content = response.content[0].text
    summary, category = _extract_summary_and_category(content, trigger_type)
    return content, summary, category


def _call_gemini(context: str, trigger_type: str, model: str) -> tuple[str, str, str]:
    """Call Gemini API and return (content, summary, category)."""
    client = genai.Client(api_key=settings.gemini_api_key)
    user_prompt = f"Analyze this {trigger_type} data and provide coaching insights:\n\n{context}"
    try:
        response = client.models.generate_content(
            model=model,
            contents=user_prompt,
            config=_genai_types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
        )
    except _genai_errors.ServerError as exc:
        raise AITransientError(str(exc)) from exc
    except _genai_errors.ClientError as exc:
        if getattr(exc, "code", None) == 429:
            raise AITransientError(str(exc)) from exc
        raise AIFatalError(str(exc)) from exc
    content = response.text
    summary, category = _extract_summary_and_category(content, trigger_type)
    return content, summary, category


def _get_ai_config(db: Session, user_id: int = DEFAULT_USER_ID) -> tuple[str, str]:
    """Return (provider, model) from DB, falling back to env defaults."""
    provider_row = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == user_id, SyncStatus.key == "ai_provider")
        .first()
    )
    model_row = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == user_id, SyncStatus.key == "ai_model")
        .first()
    )
    provider = provider_row.value if provider_row else "claude"
    if provider not in settings.available_models:
        logger.warning("Stored AI provider %r is not in available_models; falling back to 'claude'", provider)
        provider = "claude"
    stored_model = model_row.value if model_row else None
    if stored_model and stored_model in settings.available_models.get(provider, []):
        model = stored_model
    else:
        if stored_model:
            logger.warning("Stored AI model %r is not allowed for provider %r; falling back to default", stored_model, provider)
        model = settings.ai_model
    return provider, model


def _call_ai(
    db: Session, context: str, trigger_type: str, user_id: int = DEFAULT_USER_ID
) -> tuple[str, str, str]:
    """Dispatch to the configured AI provider with exponential backoff on transient errors."""
    provider, model = _get_ai_config(db, user_id)
    call_fn = _call_gemini if provider == "gemini" else _call_claude

    last_exc: Exception = RuntimeError("no attempts made")
    for attempt in range(_MAX_RETRIES):
        try:
            return call_fn(context, trigger_type, model)
        except AIFatalError:
            raise  # configuration errors are not retryable
        except AITransientError as exc:
            last_exc = exc
            if attempt < _MAX_RETRIES - 1:
                wait = _BACKOFF_BASE ** attempt
                logger.warning(
                    "Transient AI error (attempt %d/%d), retrying in %ds: %s",
                    attempt + 1, _MAX_RETRIES, wait, exc,
                )
                time.sleep(wait)
    raise last_exc


def _activity_user_id(activity_id: int) -> int:
    """Best-effort lookup of an activity's owner (for error-path insight writes)."""
    try:
        with db_session() as db:
            row = db.query(Activity.user_id).filter(Activity.id == activity_id).first()
            return (row[0] if row and row[0] else DEFAULT_USER_ID)
    except Exception:
        return DEFAULT_USER_ID


def _save_error_insight(
    activity_id: int, exc: Exception, user_id: int = DEFAULT_USER_ID
) -> None:
    """Persist a failure insight so the UI can show an error and allow retry."""
    if isinstance(exc, AITransientError):
        content = (
            "**Analysis temporarily unavailable**\n\n"
            "The AI service returned a rate-limit or server error after multiple retries. "
            "This is usually short-lived — use **Re-analyze** to try again in a moment."
        )
        summary = "AI service temporarily unavailable — use Re-analyze to retry"
    elif isinstance(exc, AIFatalError):
        content = (
            "**Analysis configuration error**\n\n"
            "The AI request was rejected due to a credential or model error. "
            "Check your API key and model selection in **Settings**, then use **Re-analyze**."
        )
        summary = "AI configuration error — check Settings and use Re-analyze"
    else:
        content = (
            "**Analysis failed unexpectedly**\n\n"
            "An unexpected error occurred. Use **Re-analyze** to retry, "
            "or check Settings if the problem persists."
        )
        summary = "Analysis failed — use Re-analyze to retry"
    try:
        with db_session() as db:
            db.query(Insight).filter(
                Insight.user_id == user_id,
                Insight.trigger_type == "activity",
                Insight.trigger_id == activity_id,
            ).delete()
            db.add(Insight(
                user_id=user_id,
                created_at=datetime.now(timezone.utc),
                trigger_type="activity",
                trigger_id=activity_id,
                content=content,
                summary=summary,
                category="recommendation",
            ))
            db.commit()
    except Exception:
        logger.exception("Failed to save error insight for activity %s", activity_id)


def enqueue_job(task_type: str, payload: dict, user_id: int) -> int:
    """Persist a pending AIJob and return its id.

    Called from API request handlers to hand off AI work to the background
    worker instead of blocking the request or spawning a daemon thread.
    """
    from app.models import AIJob

    job = AIJob(
        user_id=user_id,
        task_type=task_type,
        payload_json=json.dumps(payload),
        status="pending",
        attempts=0,
        max_attempts=3,
    )
    with db_session() as db:
        db.add(job)
        db.commit()
        db.refresh(job)
        return job.id


def execute_job(job_id: int) -> None:
    """Claim and execute a single AIJob. Called by the APScheduler worker.

    Atomically marks the job running, dispatches to the appropriate AI
    function, then records done or schedules a retry (up to max_attempts).
    """
    from app.models import AIJob

    with db_session() as db:
        job = db.query(AIJob).filter(AIJob.id == job_id).first()
        if job is None or job.status not in ("pending",):
            return
        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        job.attempts += 1
        db.commit()
        task_type = job.task_type
        payload = json.loads(job.payload_json or "{}")
        attempts = job.attempts
        max_attempts = job.max_attempts
        user_id = job.user_id

    try:
        if task_type == "analyze_activity":
            analyze_activity_force(payload["activity_id"])
        elif task_type == "analyze_feedback":
            analyze_activity_with_feedback(payload["activity_id"])
        elif task_type == "generate_plan":
            generate_training_plan(user_id=user_id, note=payload.get("note"))
        elif task_type == "weekly_review":
            weekly_review(user_id=user_id)
        else:
            raise ValueError(f"Unknown task_type: {task_type!r}")

        with db_session() as db:
            job = db.query(AIJob).filter(AIJob.id == job_id).first()
            if job:
                job.status = "done"
                job.completed_at = datetime.now(timezone.utc)
                db.commit()
    except Exception as exc:
        logger.exception("Job %s (%s) failed on attempt %s/%s", job_id, task_type, attempts, max_attempts)
        with db_session() as db:
            job = db.query(AIJob).filter(AIJob.id == job_id).first()
            if job:
                job.error_message = str(exc)[:1000]
                job.completed_at = datetime.now(timezone.utc)
                job.status = "failed" if attempts >= max_attempts else "pending"
                db.commit()


def _load_zones(db: Session) -> dict[str, list[MetricZone]]:
    """Load metric zones from the database, grouped by metric_key."""
    zones_by_metric: dict[str, list[MetricZone]] = {}
    for z in db.query(MetricZone).all():
        zones_by_metric.setdefault(z.metric_key, []).append(z)
    return zones_by_metric


def _load_zone_configs(db: Session, user_id: int = DEFAULT_USER_ID) -> dict:
    """Load custom threshold-anchored zone configs and profile thresholds."""
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    all_zones = (
        db.query(ZoneConfig)
        .filter(ZoneConfig.user_id == user_id)
        .order_by(ZoneConfig.zone_type, ZoneConfig.zone_number)
        .all()
    )
    return {
        "hr": [z for z in all_zones if z.zone_type == "hr"],
        "pace": [z for z in all_zones if z.zone_type == "pace"],
        "threshold_hr": profile.threshold_hr if profile else None,
        "threshold_pace": profile.threshold_pace_min_km if profile else None,
    }


def analyze_activity(activity: Activity):
    """Generate AI insight for a new activity."""
    user_id = activity.user_id or DEFAULT_USER_ID
    with db_session() as db:
        try:
            activity_date = activity.started_at.date() if isinstance(activity.started_at, datetime) else activity.started_at
            zones_by_metric = _load_zones(db)
            zc = _load_zone_configs(db, user_id)
            activity_context = _format_activity_context(
                activity, zones_by_metric,
                hr_zone_configs=zc["hr"], pace_zone_configs=zc["pace"],
                threshold_hr=zc["threshold_hr"], threshold_pace=zc["threshold_pace"],
            )

            # Append workout adherence section if a workout was scheduled for this date
            workout_event = (
                db.query(GarminCalendarEvent)
                .filter(
                    GarminCalendarEvent.user_id == user_id,
                    GarminCalendarEvent.date == activity_date,
                    GarminCalendarEvent.event_type == "workout",
                )
                .first()
            )
            if workout_event and workout_event.raw_json:
                workout_steps = adherence_mod.parse_workout_steps(workout_event.raw_json)
                adherence_result = adherence_mod.compute_adherence(activity, workout_steps)
                if adherence_result:
                    activity_context += "\n\n" + adherence_mod.format_adherence_context(adherence_result)

            full_context = _build_context(
                db, "activity", activity_context, reference_date=activity_date, user_id=user_id
            )
            content, summary, category = _call_ai(db, full_context, "activity", user_id)

            insight = Insight(
                user_id=user_id,
                created_at=datetime.now(timezone.utc),
                trigger_type="activity",
                trigger_id=activity.id,
                content=content,
                summary=summary,
                category=category,
            )
            db.add(insight)

            db_activity = db.query(Activity).get(activity.id)
            if db_activity:
                db_activity.ai_analyzed = True

            db.commit()
            logger.info("AI analysis complete for activity %s: %s", activity.id, summary[:80])
        except Exception:
            logger.exception("AI analysis failed for activity %s", activity.id)


def analyze_daily_summary(daily: DailySummary):
    """Generate AI insight for a daily summary."""
    user_id = daily.user_id or DEFAULT_USER_ID
    with db_session() as db:
        try:
            daily_context = _format_daily_context(daily)
            full_context = _build_context(
                db, "daily_summary", daily_context, reference_date=daily.date, user_id=user_id
            )
            content, summary, category = _call_ai(db, full_context, "daily_summary", user_id)

            insight = Insight(
                user_id=user_id,
                created_at=datetime.now(timezone.utc),
                trigger_type="daily_summary",
                trigger_id=daily.id,
                content=content,
                summary=summary,
                category=category,
            )
            db.add(insight)

            db_daily = db.query(DailySummary).get(daily.id)
            if db_daily:
                db_daily.ai_analyzed = True

            db.commit()
            logger.info("AI analysis complete for daily summary %s: %s", daily.date, summary[:80])
        except Exception:
            logger.exception("AI analysis failed for daily summary %s", daily.id)


def analyze_activity_force(activity_id: int):
    """Generate AI insight for an activity, replacing any existing insight."""
    with db_session() as db:
        try:
            activity = db.query(Activity).get(activity_id)
            if not activity:
                logger.warning("Activity %s not found for re-analysis", activity_id)
                return
            user_id = activity.user_id or DEFAULT_USER_ID

            # Delete existing insight for this activity
            db.query(Insight).filter(
                Insight.user_id == user_id,
                Insight.trigger_type == "activity",
                Insight.trigger_id == activity.id,
            ).delete()

            activity_date = activity.started_at.date() if isinstance(activity.started_at, datetime) else activity.started_at
            zones_by_metric = _load_zones(db)
            zc = _load_zone_configs(db, user_id)
            activity_context = _format_activity_context(
                activity, zones_by_metric,
                hr_zone_configs=zc["hr"], pace_zone_configs=zc["pace"],
                threshold_hr=zc["threshold_hr"], threshold_pace=zc["threshold_pace"],
            )
            full_context = _build_context(
                db, "activity", activity_context, reference_date=activity_date, user_id=user_id
            )
            content, summary, category = _call_ai(db, full_context, "activity", user_id)

            insight = Insight(
                user_id=user_id,
                created_at=datetime.now(timezone.utc),
                trigger_type="activity",
                trigger_id=activity.id,
                content=content,
                summary=summary,
                category=category,
            )
            db.add(insight)
            activity.ai_analyzed = True
            db.commit()
            logger.info("AI re-analysis complete for activity %s: %s", activity.id, summary[:80])
        except Exception as exc:
            logger.exception("AI re-analysis failed for activity %s", activity_id)
            _save_error_insight(activity_id, exc, _activity_user_id(activity_id))


def analyze_activity_with_feedback(activity_id: int):
    """Generate AI insight for an activity, incorporating user feedback."""
    with db_session() as db:
        try:
            activity = db.query(Activity).get(activity_id)
            if not activity:
                logger.warning("Activity %s not found for feedback analysis", activity_id)
                return
            user_id = activity.user_id or DEFAULT_USER_ID

            # Delete existing insight for this activity
            db.query(Insight).filter(
                Insight.user_id == user_id,
                Insight.trigger_type == "activity",
                Insight.trigger_id == activity.id,
            ).delete()

            zones_by_metric = _load_zones(db)
            zc = _load_zone_configs(db, user_id)
            activity_context = _format_activity_context(
                activity, zones_by_metric,
                hr_zone_configs=zc["hr"], pace_zone_configs=zc["pace"],
                threshold_hr=zc["threshold_hr"], threshold_pace=zc["threshold_pace"],
            )

            # Append user feedback to context
            feedback_parts = []
            if activity.feedback_rating == "good":
                feedback_parts.append("The runner reported this workout went well.")
            elif activity.feedback_rating == "bad":
                feedback_parts.append("The runner reported issues with this workout.")
                if activity.feedback_tags:
                    try:
                        tags = json.loads(activity.feedback_tags)
                        if tags:
                            feedback_parts.append(f"Issues reported: {', '.join(tags)}")
                    except (json.JSONDecodeError, TypeError):
                        pass
                if activity.feedback_text:
                    feedback_parts.append(f'Additional comments: "{activity.feedback_text}"')

            if feedback_parts:
                activity_context += "\n\n## User Feedback\n" + "\n".join(feedback_parts)

            activity_date = activity.started_at.date() if isinstance(activity.started_at, datetime) else activity.started_at
            full_context = _build_context(
                db, "activity", activity_context, reference_date=activity_date, user_id=user_id
            )
            content, summary, category = _call_ai(db, full_context, "activity", user_id)

            insight = Insight(
                user_id=user_id,
                created_at=datetime.now(timezone.utc),
                trigger_type="activity",
                trigger_id=activity.id,
                content=content,
                summary=summary,
                category=category,
            )
            db.add(insight)
            activity.ai_analyzed = True
            db.commit()
            logger.info("AI feedback analysis complete for activity %s: %s", activity.id, summary[:80])
        except Exception as exc:
            logger.exception("AI feedback analysis failed for activity %s", activity_id)
            _save_error_insight(activity_id, exc, _activity_user_id(activity_id))


def backfill_missing_insights(user_id: int = DEFAULT_USER_ID):
    """Analyze past 7 days of activities and daily summaries that lack insights."""
    with db_session() as db:
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)

        # Activities in past 7 days without insights
        activities = (
            db.query(Activity)
            .filter(
                Activity.user_id == user_id,
                Activity.started_at >= cutoff,
                Activity.ai_analyzed == False,
            )
            .order_by(Activity.started_at.asc())
            .all()
        )
        logger.info("Backfilling insights for %d activities", len(activities))
        for activity in activities:
            try:
                analyze_activity(activity)
            except Exception:
                logger.exception("Insight backfill failed for activity %s", activity.id)

        # Daily summaries in past 7 days without insights
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=7)).date()
        summaries = (
            db.query(DailySummary)
            .filter(
                DailySummary.user_id == user_id,
                DailySummary.date >= cutoff_date,
                DailySummary.ai_analyzed == False,
            )
            .order_by(DailySummary.date.asc())
            .all()
        )
        logger.info("Backfilling insights for %d daily summaries", len(summaries))
        for summary in summaries:
            try:
                analyze_daily_summary(summary)
            except Exception:
                logger.exception("Insight backfill failed for daily summary %s", summary.id)

        logger.info("Insight backfill complete")


def _build_plan_system_prompt() -> str:
    """Build the plan generation system prompt, embedding the current routine catalog."""
    routine_catalog = catalog_summary()
    return f"""You are an expert running coach generating a periodized training plan.
Output ONLY a valid JSON object with no markdown fences, no commentary — just raw JSON.

Schema:
{{
  "phase": "<base|build|peak|taper>",
  "overview": "<2-3 sentence narrative about the plan's intent>",
  "weeks": [
    {{
      "week_number": 1,
      "theme": "<short theme, e.g. 'Aerobic Base'>",
      "notes": "<1-2 sentence coaching note for the week>",
      "days": [
        {{
          "date": "YYYY-MM-DD",
          "day_of_week": "<Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday>",
          "workout_type": "<easy|tempo|long|interval|rest|cross|strength>",
          "target_distance_km": <number or null>,
          "target_pace_display": "<e.g. '5:15/km' or null>",
          "description": "<brief workout description>",
          "notes": "<optional coaching note or null>",
          "routine_id": "<routine id from the catalog below, or null>"
        }}
      ]
    }}
  ]
}}

Available strength & mobility routines (use the exact id string for routine_id):
{routine_catalog}

Rules:
- Generate exactly 4 weeks, each with exactly 7 days in order starting from the given week_start.
- workout_type must be one of: easy, tempo, long, interval, rest, cross, strength.
- target_distance_km and target_pace_display may be null for rest, cross, and strength days.
- Respect the athlete's weekly_availability (days/sessions per week).
- Anchor pace targets to the athlete's threshold pace if available.
- Distribute load progressively: build 2 weeks, recover 1 week, then race-specific or peak.
- Account for any upcoming races as goal events (taper if race is within 3 weeks).
- When a "Race Periodization Directives" section is present in the athlete context, the
  per-week volume/intensity caps listed there are mandatory and override the generic
  progressive-build, adherence, and strength rules above for the specific weeks listed —
  do not increase volume during a listed RACE WEEK, TAPER, or RECOVERY week even if
  adherence has been excellent.
- Respect injury history — avoid high-impact volume if relevant injuries are listed.
- Strength & cross-training:
  * Include 1–2 `strength` sessions per week during base and build phases; 0–1 during taper
    (maintenance only, reduced load).
  * For `strength` days set target_distance_km and target_pace_display to null. Set routine_id
    to the most appropriate routine from the catalog above. Choose based on the athlete's injury
    history (e.g. "hip-glute" for IT-band issues, "lower-leg" for calf/Achilles history,
    "mobility-recovery" for recovery weeks, "running-base" as the general default).
    Also write a brief description summarising the focus of the session.
  * Schedule `strength` on easy or rest-adjacent days. Do not pair strength with tempo,
    interval, or long-run days.
  * For `cross` days describe the activity (cycling, swimming, elliptical, yoga/pilates) and
    approximate duration, e.g. "45 min easy cycling or 30 min yoga". Set target_distance_km,
    target_pace_display, and routine_id to null.
- Plan Difficulty (if provided):
  * comfortable → 1 hard session (tempo or interval) per week max; avoid mandatory pace targets
    on long runs; keep easy days truly easy.
  * balanced → 1-2 hard sessions per week; include pace targets on some long runs.
  * challenging → 2 hard sessions per week; regular pace targets on quality and long-run days.
- Training Volume (if provided):
  * gradual → keep weekly km near or slightly above current_weekly_mileage; max long run ~32 km;
    very gentle progression (≤5% per week).
  * steady → moderate progression; max long run ~33 km.
  * progressive → aggressive build; max long run ~34 km; 8-10% weekly progression allowed.
- Elevation Profile (if provided):
  * flat → no hill workouts; flat route descriptions only.
  * rolling → 1 hill workout per week (e.g. hill strides or rolling route easy run).
  * moderate → 1-2 hill sessions per week (hill repeats or hilly tempo).
  * hilly → regular hill workouts; include hill repeats in quality sessions.
- Available Training Days / Long Run Day (if provided): only schedule runs on the listed
  available days; place the long run on the specified long_run_day.
- When a "Current Plan Adherence" section is present, use it to shape the new plan:
  * Adherence ≥80%: the athlete is consistent — progress load as designed.
  * Adherence 60–79%: moderate disruption — keep similar volume but reduce the count of the
    session type missed most often (e.g. one fewer interval day).
  * Adherence <60%: significant disruption — scale total weekly volume down ~10–15% and
    prioritize key quality sessions (one tempo/interval + long run) over quantity.
  * If the same workout type is repeatedly missed, reduce or replace it with a more accessible
    type (e.g. swap interval → tempo, or tempo → easy with strides).
  * After multiple consecutive missed sessions, treat the first week of the new plan as a
    rebuild week (easy/moderate volume) before resuming normal load.
"""


_PLAN_SYSTEM_PROMPT = _build_plan_system_prompt()

# Anthropic tool-use schema — forces a schema-valid plan object instead of free text.
_PLAN_TOOL_SCHEMA = {
    "name": "generate_plan",
    "description": "Return the 4-week running training plan as a structured object.",
    "input_schema": {
        "type": "object",
        "properties": {
            "phase": {
                "type": "string",
                "enum": ["base", "build", "peak", "taper"],
            },
            "overview": {"type": "string"},
            "weeks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "week_number": {"type": "integer"},
                        "theme": {"type": "string"},
                        "notes": {"type": "string"},
                        "days": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "date": {"type": "string"},
                                    "day_of_week": {
                                        "type": "string",
                                        "enum": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                                    },
                                    "workout_type": {
                                        "type": "string",
                                        "enum": ["easy", "tempo", "long", "interval", "rest", "cross", "strength"],
                                    },
                                    "target_distance_km": {"type": ["number", "null"]},
                                    "target_pace_display": {"type": ["string", "null"]},
                                    "description": {"type": "string"},
                                    "notes": {"type": ["string", "null"]},
                                    "routine_id": {"type": ["string", "null"]},
                                },
                                "required": ["date", "day_of_week", "workout_type", "description"],
                            },
                        },
                    },
                    "required": ["week_number", "days"],
                },
            },
        },
        "required": ["phase", "overview", "weeks"],
    },
}

# Gemini response_schema — enforces structured JSON output at the API level.
# Gemini's schema dialect doesn't support type unions, so nullable fields are
# left optional (absent) rather than typed as ["string", "null"].
_PLAN_GEMINI_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "phase": {"type": "string"},
        "overview": {"type": "string"},
        "weeks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "week_number": {"type": "integer"},
                    "theme": {"type": "string"},
                    "notes": {"type": "string"},
                    "days": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "date": {"type": "string"},
                                "day_of_week": {"type": "string"},
                                "workout_type": {"type": "string"},
                                "target_distance_km": {"type": "number"},
                                "target_pace_display": {"type": "string"},
                                "description": {"type": "string"},
                                "notes": {"type": "string"},
                                "routine_id": {"type": "string"},
                            },
                            "required": ["date", "day_of_week", "workout_type", "description"],
                        },
                    },
                },
                "required": ["week_number", "days"],
            },
        },
    },
    "required": ["phase", "overview", "weeks"],
}


def _build_plan_adherence_context(
    db: Session, reference_date: date, user_id: int = DEFAULT_USER_ID
) -> str | None:
    """Build adherence summary for the most recent training plan.

    For each non-rest day in the current plan that has already passed, checks
    whether an activity was completed and notes distance adherence. Returns None
    when there is no active plan or no past scheduled sessions yet.
    """
    plan = (
        db.query(TrainingPlan)
        .filter(TrainingPlan.user_id == user_id)
        .order_by(TrainingPlan.generated_at.desc())
        .first()
    )
    if not plan:
        return None

    past_days = (
        db.query(TrainingPlanDay)
        .filter(
            TrainingPlanDay.plan_id == plan.id,
            TrainingPlanDay.day_date < reference_date,
            TrainingPlanDay.workout_type != "rest",
        )
        .order_by(TrainingPlanDay.day_date.asc())
        .all()
    )
    if not past_days:
        return None

    completed = 0
    missed = 0
    rows: list[str] = []

    for plan_day in past_days:
        day_start = datetime.combine(plan_day.day_date, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        activity = (
            db.query(Activity)
            .filter(
                Activity.user_id == user_id,
                Activity.started_at >= day_start,
                Activity.started_at < day_end,
            )
            .first()
        )
        if activity:
            completed += 1
            dist_note = ""
            if plan_day.target_distance_m and activity.distance_m:
                pct = (activity.distance_m / plan_day.target_distance_m) * 100
                dist_note = (
                    f" ({pct:.0f}% of planned {plan_day.target_distance_m / 1000:.1f} km)"
                )
            rows.append(
                f"- {plan_day.day_date} [{plan_day.workout_type}] COMPLETED{dist_note}"
            )
        else:
            missed += 1
            target_note = ""
            if plan_day.target_distance_m:
                target_note = f" (planned {plan_day.target_distance_m / 1000:.1f} km)"
            rows.append(
                f"- {plan_day.day_date} [{plan_day.workout_type}] MISSED{target_note}"
            )

    total = completed + missed
    if total == 0:
        return None

    rate = (completed / total) * 100
    lines = [
        f"## Current Plan Adherence ({total} scheduled sessions)",
        f"Completed: {completed}/{total} ({rate:.0f}%)",
    ] + rows
    return "\n".join(lines)


# Taper/recovery length (in weeks) by race distance category — the closer
# categories to a marathon need longer taper and recovery windows.
_TAPER_WEEKS_BY_CATEGORY = {"marathon": 3, "half": 2, "10k": 1, "short": 1}
_RECOVERY_WEEKS_BY_CATEGORY = {"marathon": 2, "half": 2, "10k": 1, "short": 1}

_RACE_WEEK_GUIDANCE = (
    "cap weekly volume at ~40-50% of a normal build week; only easy shakeout runs "
    "plus short race-pace strides; no hard efforts within 4 days of race day"
)
_TAPER_GUIDANCE = {
    1: (
        "final taper week — target ~65-75% of peak weekly volume, cut the long run "
        "to ~50-60% of its peak length, one short race-pace tune-up early in the week, "
        "nothing hard in the final 4 days"
    ),
    2: (
        "target ~80-85% of peak weekly volume, begin trimming the long run, keep one "
        "quality session but shorten it"
    ),
    3: (
        "target ~85-90% of peak weekly volume, start easing off big long runs while "
        "keeping intensity"
    ),
}
_RECOVERY_GUIDANCE = {
    1: (
        "days 1-3 rest or easy cross-training only; days 4-7 easy running at ~30-40% "
        "of the pre-race weekly volume; no quality sessions"
    ),
    2: (
        "~55-70% of the pre-race weekly volume, still easy/moderate only, no quality "
        "sessions until this week is complete"
    ),
}


def _race_distance_category(distance_m: float | None) -> str:
    """Classify a race distance into a taper/recovery category.

    marathon >=30km, half >=18km, 10k >=8km, else short (5K or unknown distance).
    """
    if not distance_m:
        return "short"
    if distance_m >= 30000:
        return "marathon"
    if distance_m >= 18000:
        return "half"
    if distance_m >= 8000:
        return "10k"
    return "short"


def _build_race_periodization_context(
    db: Session, week_start: date, plan_weeks: int, user_id: int = DEFAULT_USER_ID
) -> str | None:
    """Deterministic taper/recovery directives for each week of the plan.

    Scans tracked races (GarminCalendarEvent, event_type="race") in a window
    bracketing the plan and, for every plan week that falls in a race week, its
    taper, or its recovery block, emits a mandatory volume/intensity directive
    scaled by race distance. Weeks with no nearby race get no directive, leaving
    the generic progression rules in the system prompt in charge.
    """
    window_start = week_start - timedelta(days=21)
    window_end = week_start + timedelta(days=7 * plan_weeks + 21)
    races = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.user_id == user_id,
            GarminCalendarEvent.event_type == "race",
            GarminCalendarEvent.date >= window_start,
            GarminCalendarEvent.date <= window_end,
        )
        .order_by(GarminCalendarEvent.date.asc())
        .all()
    )
    if not races:
        return None

    lines: list[str] = []
    for week_idx in range(plan_weeks):
        w_start = week_start + timedelta(days=7 * week_idx)
        w_end = w_start + timedelta(days=6)

        race_week = next((r for r in races if w_start <= r.date <= w_end), None)
        if race_week:
            priority = f" (Priority {race_week.priority})" if race_week.priority else ""
            lines.append(
                f"- Week {week_idx + 1} ({w_start}–{w_end}): RACE WEEK — "
                f"{race_week.title or 'race'}{priority} on {race_week.date}. "
                f"{_RACE_WEEK_GUIDANCE}."
            )
            continue

        # Recovery takes priority over taper (safety first) when both could apply.
        recovery_hit: tuple[GarminCalendarEvent, int] | None = None
        for r in races:
            if r.date >= w_start:
                continue
            weeks_since = -(-(w_start - r.date).days // 7)  # ceil division
            category = _race_distance_category(r.distance_m)
            if 1 <= weeks_since <= _RECOVERY_WEEKS_BY_CATEGORY[category]:
                if recovery_hit is None or weeks_since < recovery_hit[1]:
                    recovery_hit = (r, weeks_since)
        if recovery_hit:
            r, weeks_since = recovery_hit
            guidance = _RECOVERY_GUIDANCE.get(weeks_since, _RECOVERY_GUIDANCE[1])
            lines.append(
                f"- Week {week_idx + 1} ({w_start}–{w_end}): RECOVERY (week "
                f"{weeks_since} post-race) — after {r.title or 'race'} on {r.date}. "
                f"{guidance}."
            )
            continue

        taper_hit: tuple[GarminCalendarEvent, int] | None = None
        for r in races:
            if r.date <= w_end:
                continue
            weeks_before = -(-(r.date - w_end).days // 7)  # ceil division
            category = _race_distance_category(r.distance_m)
            if 1 <= weeks_before <= _TAPER_WEEKS_BY_CATEGORY[category]:
                if taper_hit is None or weeks_before < taper_hit[1]:
                    taper_hit = (r, weeks_before)
        if taper_hit:
            r, weeks_before = taper_hit
            guidance = _TAPER_GUIDANCE.get(weeks_before, _TAPER_GUIDANCE[1])
            plural = "s" if weeks_before != 1 else ""
            lines.append(
                f"- Week {week_idx + 1} ({w_start}–{w_end}): TAPER ({weeks_before} "
                f"week{plural} out) — {r.title or 'race'} on {r.date}. {guidance}."
            )

    if not lines:
        return None
    return (
        "## Race Periodization Directives (mandatory — override default "
        "progression for these weeks)\n" + "\n".join(lines)
    )


def _build_plan_context(
    db: Session,
    reference_date: date,
    user_id: int = DEFAULT_USER_ID,
    week_start: date | None = None,
    plan_weeks: int = 4,
) -> str:
    """Build context string for plan generation (profile + load + recent history)."""
    sections: list[str] = [f"Today's date: {reference_date}"]

    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    if profile:
        ctx = _format_athlete_profile_context(profile, reference_date)
        if ctx:
            sections.append(ctx)

    try:
        estimate = threshold_mod.estimate_thresholds(db, user_id=user_id)
        est_ctx = threshold_mod.format_threshold_estimate_context(estimate, profile)
        if est_ctx:
            sections.append(est_ctx)
    except Exception:
        pass

    load_point = training_load.current_load(db, as_of=reference_date, user_id=user_id)
    load_ctx = training_load.format_training_load_context(load_point)
    if load_ctx:
        sections.append(load_ctx)

    today_summary = (
        db.query(DailySummary)
        .filter(DailySummary.user_id == user_id, DailySummary.date == reference_date)
        .first()
    )
    rhr_cutoff = reference_date - timedelta(days=7)
    recent_rhr_rows = (
        db.query(DailySummary.resting_hr)
        .filter(
            DailySummary.user_id == user_id,
            DailySummary.date >= rhr_cutoff,
            DailySummary.date < reference_date,
            DailySummary.resting_hr.isnot(None),
        )
        .all()
    )
    recent_rhr = [row[0] for row in recent_rhr_rows]
    readiness = training_load.compute_readiness(today_summary, load_point, recent_rhr)
    readiness_ctx = training_load.format_readiness_context(readiness)
    if readiness_ctx:
        sections.append(readiness_ctx)

    # Weekly volume last 8 weeks
    weeks = []
    for w in range(8):
        vol_week_start = reference_date - timedelta(days=reference_date.weekday() + 7 * w)
        vol_week_end = vol_week_start + timedelta(days=7)
        result = (
            db.query(func.count(Activity.id), func.sum(Activity.distance_m))
            .filter(
                Activity.user_id == user_id,
                Activity.started_at >= datetime.combine(vol_week_start, datetime.min.time()),
                Activity.started_at < datetime.combine(vol_week_end, datetime.min.time()),
            )
            .first()
        )
        count, dist = result
        if count and count > 0:
            weeks.append(f"- Week of {vol_week_start}: {count} runs, {(dist or 0) / 1000:.1f} km")
    if weeks:
        sections.append("## Recent Weekly Volume\n" + "\n".join(weeks))

    # Adherence to the current plan
    adherence_ctx = _build_plan_adherence_context(db, reference_date, user_id)
    if adherence_ctx:
        sections.append(adherence_ctx)

    # Upcoming races
    upcoming = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.user_id == user_id,
            GarminCalendarEvent.event_type == "race",
            GarminCalendarEvent.date >= reference_date,
        )
        .order_by(GarminCalendarEvent.date.asc())
        .all()
    )
    if upcoming:
        race_lines = []
        for r in upcoming:
            days_until = (r.date - reference_date).days
            priority = f" [Priority {r.priority}]" if r.priority else ""
            race_lines.append(
                f"- {r.title} ({r.distance_label or '?'}) on {r.date} "
                f"({days_until} days away){priority}"
            )
        sections.append("## Upcoming Races\n" + "\n".join(race_lines))

    # Deterministic taper/recovery directives for this plan's weeks
    resolved_week_start = week_start or _next_monday(reference_date)
    periodization_ctx = _build_race_periodization_context(
        db, resolved_week_start, plan_weeks, user_id
    )
    if periodization_ctx:
        sections.append(periodization_ctx)

    return "\n\n".join(sections)


def _next_monday(ref: date) -> date:
    """Return the Monday on or after ``ref``."""
    days_ahead = (7 - ref.weekday()) % 7
    return ref + timedelta(days=days_ahead if days_ahead else 7)


def _parse_plan_json(raw: str) -> dict:
    """Extract and parse JSON from raw AI response (strip any markdown fences)."""
    text = raw.strip()
    # Strip optional ```json ... ``` fences
    if text.startswith("```"):
        lines = text.splitlines()
        start = next((i for i, l in enumerate(lines) if l.strip() in ("```", "```json")), 0)
        end = next((i for i in range(len(lines) - 1, start, -1) if lines[i].strip() == "```"), len(lines))
        text = "\n".join(lines[start + 1:end])
    return json.loads(text)


def _store_training_plan(
    db: Session, plan_data: dict, week_start: date, raw_json: str, user_id: int = DEFAULT_USER_ID
) -> TrainingPlan:
    """Persist the parsed plan dict as TrainingPlan + TrainingPlanDay rows."""
    plan = TrainingPlan(
        user_id=user_id,
        generated_at=datetime.now(timezone.utc),
        week_start=week_start,
        plan_weeks=len(plan_data.get("weeks", [])) or 4,
        phase=plan_data.get("phase"),
        overview=plan_data.get("overview"),
        raw_json=raw_json,
    )
    db.add(plan)
    db.flush()  # populate plan.id

    for week in plan_data.get("weeks", []):
        week_num = week.get("week_number", 1)
        theme = week.get("theme")
        for day_data in week.get("days", []):
            try:
                day_date = date.fromisoformat(day_data["date"])
            except (KeyError, ValueError):
                continue
            dist_km = day_data.get("target_distance_km")
            dist_m = dist_km * 1000 if dist_km is not None else None
            pace_display = day_data.get("target_pace_display")
            pace_num = _parse_pace_display(pace_display) if pace_display else None
            raw_routine_id = day_data.get("routine_id")
            routine_id = raw_routine_id if get_routine(raw_routine_id or "") else None
            db.add(TrainingPlanDay(
                user_id=user_id,
                plan_id=plan.id,
                day_date=day_date,
                day_of_week=day_data.get("day_of_week", day_date.strftime("%A")),
                week_number=week_num,
                workout_type=day_data.get("workout_type", "easy"),
                target_distance_m=dist_m,
                target_pace_min_km=pace_num,
                target_pace_display=pace_display,
                description=day_data.get("description"),
                notes=day_data.get("notes"),
                week_theme=theme,
                routine_id=routine_id,
            ))
    db.commit()
    return plan


def _parse_pace_display(pace_str: str) -> float | None:
    """Parse '5:15/km' or '5:15' to float min/km. Returns None on failure."""
    try:
        parts = pace_str.replace("/km", "").strip().split(":")
        return int(parts[0]) + int(parts[1]) / 60.0
    except Exception:
        return None


_REALIGNMENT_MISSED_THRESHOLD = 2  # Show banner when this many sessions are missed


def detect_plan_realignment(
    db: Session, reference_date: date, user_id: int = DEFAULT_USER_ID
) -> dict:
    """Return realignment state for the current plan.

    Looks at all past non-rest TrainingPlanDay rows that lack a matching
    Activity. When the missed count reaches _REALIGNMENT_MISSED_THRESHOLD and
    the user has not dismissed the banner (via SyncStatus), sets should_prompt
    to True.
    """
    plan = (
        db.query(TrainingPlan)
        .filter(TrainingPlan.user_id == user_id)
        .order_by(TrainingPlan.generated_at.desc())
        .first()
    )
    empty = {
        "should_prompt": False,
        "missed_count": 0,
        "total_scheduled": 0,
        "missed_sessions": [],
        "race_note": None,
    }
    if not plan:
        return empty

    dismiss_row = db.query(SyncStatus).filter(
        SyncStatus.user_id == user_id,
        SyncStatus.key == "plan_realignment_dismissed_until",
    ).first()
    dismissed = False
    if dismiss_row and dismiss_row.value:
        try:
            dismissed = date.fromisoformat(dismiss_row.value) > reference_date
        except ValueError:
            pass

    past_days = (
        db.query(TrainingPlanDay)
        .filter(
            TrainingPlanDay.plan_id == plan.id,
            TrainingPlanDay.day_date < reference_date,
            TrainingPlanDay.workout_type != "rest",
        )
        .order_by(TrainingPlanDay.day_date.asc())
        .all()
    )

    missed_sessions: list[dict] = []
    for plan_day in past_days:
        day_start = datetime.combine(plan_day.day_date, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        activity = (
            db.query(Activity)
            .filter(
                Activity.user_id == user_id,
                Activity.started_at >= day_start,
                Activity.started_at < day_end,
            )
            .first()
        )
        if not activity:
            missed_sessions.append({
                "date": plan_day.day_date,
                "workout_type": plan_day.workout_type,
                "target_distance_km": plan_day.target_distance_m / 1000 if plan_day.target_distance_m else None,
            })

    # Race-aware realignment: a race that completed after this plan was
    # generated means the plan predates it and won't reflect a recovery block.
    race_note = None
    completed_race = (
        db.query(GarminCalendarEvent)
        .filter(
            GarminCalendarEvent.user_id == user_id,
            GarminCalendarEvent.event_type == "race",
            GarminCalendarEvent.date >= plan.generated_at.date(),
            GarminCalendarEvent.date < reference_date,
        )
        .order_by(GarminCalendarEvent.date.desc())
        .first()
    )
    if completed_race:
        category = _race_distance_category(completed_race.distance_m)
        recovery_days = _RECOVERY_WEEKS_BY_CATEGORY[category] * 7
        if (reference_date - completed_race.date).days <= recovery_days:
            race_note = (
                f"Your plan predates {completed_race.title or 'your race'} on "
                f"{completed_race.date} — regenerate to apply a recovery block."
            )

    missed_count = len(missed_sessions)
    return {
        "should_prompt": (
            (missed_count >= _REALIGNMENT_MISSED_THRESHOLD or race_note is not None)
            and not dismissed
        ),
        "missed_count": missed_count,
        "total_scheduled": len(past_days),
        "race_note": race_note,
        "missed_sessions": missed_sessions,
    }


def generate_training_plan(
    reference_date: date | None = None, user_id: int = DEFAULT_USER_ID, note: str | None = None
) -> TrainingPlan | None:
    """Generate and persist a 4-week AI training plan.

    Can be called from the API (on demand) or from the scheduler (weekly).
    `note` carries an optional athlete-stated reason (e.g. from the chat
    adjust_upcoming_week tool) that should take priority over the default
    rolling-adherence logic. Returns the new TrainingPlan or None on failure.
    """
    with db_session() as db:
        ref = reference_date or date.today()
        week_start = _next_monday(ref)

        try:
            context = _build_plan_context(db, ref, user_id, week_start=week_start)
            provider, model = _get_ai_config(db, user_id)

            plan_prompt = (
                f"Generate a 4-week running training plan starting Monday {week_start}.\n\n"
                f"Athlete context:\n{context}"
            )
            if note:
                plan_prompt += (
                    f"\n\nAthlete note for this regeneration: {note}\n"
                    "Prioritize accommodating this above the default rolling adherence logic."
                )

            last_exc: Exception = RuntimeError("no attempts made")
            raw = None
            plan_data: dict | None = None
            for attempt in range(_MAX_RETRIES):
                try:
                    if provider == "gemini":
                        gemini_client = genai.Client(api_key=settings.gemini_api_key)
                        try:
                            response = gemini_client.models.generate_content(
                                model=model,
                                contents=plan_prompt,
                                config=_genai_types.GenerateContentConfig(
                                    system_instruction=_PLAN_SYSTEM_PROMPT,
                                    response_mime_type="application/json",
                                    response_schema=_PLAN_GEMINI_RESPONSE_SCHEMA,
                                ),
                            )
                        except _genai_errors.ServerError as exc:
                            raise AITransientError(str(exc)) from exc
                        except _genai_errors.ClientError as exc:
                            if getattr(exc, "code", None) == 429:
                                raise AITransientError(str(exc)) from exc
                            raise AIFatalError(str(exc)) from exc
                        raw = response.text
                    else:
                        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
                        try:
                            response = client.messages.create(
                                model=model,
                                max_tokens=_PLAN_MAX_TOKENS,
                                system=_PLAN_SYSTEM_PROMPT,
                                tools=[_PLAN_TOOL_SCHEMA],
                                tool_choice={"type": "tool", "name": "generate_plan"},
                                messages=[{"role": "user", "content": plan_prompt}],
                            )
                        except (
                            anthropic.RateLimitError,
                            anthropic.APITimeoutError,
                            anthropic.APIConnectionError,
                            anthropic.InternalServerError,
                        ) as exc:
                            raise AITransientError(str(exc)) from exc
                        except (
                            anthropic.AuthenticationError,
                            anthropic.PermissionDeniedError,
                            anthropic.BadRequestError,
                            anthropic.NotFoundError,
                        ) as exc:
                            raise AIFatalError(str(exc)) from exc
                        # Extract the structured dict from the guaranteed tool_use block.
                        for block in response.content:
                            if block.type == "tool_use" and block.name == "generate_plan":
                                plan_data = block.input
                                raw = json.dumps(plan_data)
                                break
                        # Fallback: model returned text instead of a tool call.
                        if plan_data is None:
                            for block in response.content:
                                if hasattr(block, "text"):
                                    raw = block.text
                                    break
                    break  # success
                except AIFatalError:
                    raise
                except AITransientError as exc:
                    last_exc = exc
                    if attempt < _MAX_RETRIES - 1:
                        wait = _BACKOFF_BASE ** attempt
                        logger.warning(
                            "Transient AI error during plan generation (attempt %d/%d), retrying in %ds: %s",
                            attempt + 1, _MAX_RETRIES, wait, exc,
                        )
                        time.sleep(wait)
            else:
                raise last_exc

            if plan_data is None:
                plan_data = _parse_plan_json(raw)
            plan = _store_training_plan(db, plan_data, week_start, raw, user_id)
            logger.info(
                "Training plan generated: %d weeks, phase=%s, week_start=%s",
                plan.plan_weeks, plan.phase, plan.week_start,
            )
            return plan
        except Exception:
            logger.exception("Training plan generation failed")
            return None


def weekly_review(user_id: int = DEFAULT_USER_ID):
    """Generate a weekly training summary and recommendations."""
    with db_session() as db:
        try:
            week_start = date.today() - timedelta(days=7)
            week_activities = (
                db.query(Activity)
                .filter(
                    Activity.user_id == user_id,
                    Activity.started_at >= datetime.combine(week_start, datetime.min.time()),
                )
                .order_by(Activity.started_at.asc())
                .all()
            )

            if not week_activities:
                logger.info("No activities this week, skipping weekly review")
                return

            zones_by_metric = _load_zones(db)
            zc = _load_zone_configs(db, user_id)
            activity_summaries = "\n\n".join(
                _format_activity_context(
                    a, zones_by_metric,
                    hr_zone_configs=zc["hr"], pace_zone_configs=zc["pace"],
                    threshold_hr=zc["threshold_hr"], threshold_pace=zc["threshold_pace"],
                )
                for a in week_activities
            )
            trigger_data = f"## Weekly Review ({week_start} to {date.today()})\n\n{activity_summaries}"
            full_context = _build_context(db, "weekly_review", trigger_data, user_id=user_id)
            content, summary, category = _call_ai(db, full_context, "weekly_review", user_id)

            insight = Insight(
                user_id=user_id,
                created_at=datetime.now(timezone.utc),
                trigger_type="weekly_review",
                trigger_id=None,
                content=content,
                summary=summary,
                category="training_plan",
            )
            db.add(insight)
            db.commit()
            logger.info("Weekly review complete: %s", summary[:80])
        except Exception:
            logger.exception("Weekly review failed")


# ---------------------------------------------------------------------------
# Conversational coach — streaming chat (P0-1)
# ---------------------------------------------------------------------------

CHAT_SYSTEM_PROMPT = SYSTEM_PROMPT + """

You are now in **conversational mode**. The athlete can ask you anything about
their training, upcoming races, recovery, or specific workouts. You have full
access to their recent training context below.

Guidelines for chat responses:
- Be conversational but precise — no need for a rigid 3-5 bullet format
- Answer the specific question asked, then offer one follow-up insight if relevant
- Reference specific data from their context when it supports your point
- Keep responses concise (2-4 short paragraphs max) unless they ask for detail
- Use markdown sparingly — only headers/bullets when they genuinely help clarity

You also have tools to act on the conversation, not just talk about it:
- Use regenerate_plan or adjust_upcoming_week when the athlete asks you to redo,
  rework, or reschedule their plan — don't just describe what you would do, call
  the tool. adjust_upcoming_week is for a specific stated reason (travel, illness,
  a busy week); regenerate_plan is for a general "start over" request.
- Use mark_setback when the athlete mentions a niggle, injury, or life constraint
  worth remembering, even mid-conversation about something else.
- Use explain_workout when asked about a specific scheduled day — look it up
  rather than guessing from memory.
- For everything else, just answer normally. Only call a tool when the athlete's
  message clearly calls for one of these actions."""


def _format_upcoming_plan_context(db: Session, user_id: int) -> str:
    """Append the next 7 days of the active plan so explain_workout has real dates to reference."""
    plan = (
        db.query(TrainingPlan)
        .filter(TrainingPlan.user_id == user_id)
        .order_by(TrainingPlan.generated_at.desc())
        .first()
    )
    if not plan:
        return ""
    today = date.today()
    days = (
        db.query(TrainingPlanDay)
        .filter(
            TrainingPlanDay.plan_id == plan.id,
            TrainingPlanDay.day_date >= today,
            TrainingPlanDay.day_date < today + timedelta(days=7),
        )
        .order_by(TrainingPlanDay.day_date.asc())
        .all()
    )
    if not days:
        return ""
    lines = [
        f"- {d.day_date} ({d.day_of_week}): {d.workout_type} — {d.description or 'No description'}"
        for d in days
    ]
    return "\n\n## Upcoming Plan This Week\n" + "\n".join(lines)


def _build_chat_context(
    db: Session, user_id: int, activity_id: int | None = None
) -> str:
    """Build the context block injected into the chat system prompt."""
    if activity_id:
        activity = (
            db.query(Activity)
            .filter(Activity.id == activity_id, Activity.user_id == user_id)
            .first()
        )
        if activity:
            zones_by_metric = _load_zones(db)
            zc = _load_zone_configs(db, user_id)
            activity_context = _format_activity_context(
                activity,
                zones_by_metric,
                zc["hr"],
                zc["pace"],
                zc["threshold_hr"],
                zc["threshold_pace"],
            )
            trigger_data = (
                f"The athlete is asking about a specific activity:\n\n{activity_context}"
            )
            context = _build_context(db, "chat", trigger_data, user_id=user_id)
            return context + _format_upcoming_plan_context(db, user_id)

    trigger_data = "The athlete is conversing with the AI running coach."
    context = _build_context(db, "chat", trigger_data, user_id=user_id)
    return context + _format_upcoming_plan_context(db, user_id)


# Anthropic tool-use schema for chat — model may call at most one of these per turn.
_CHAT_TOOL_SCHEMAS = [
    {
        "name": "regenerate_plan",
        "description": (
            "Regenerate the athlete's rolling training plan from scratch using their "
            "current training data. Use when the athlete asks you to redo, reset, or "
            "fully rebuild their plan."
        ),
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "adjust_upcoming_week",
        "description": (
            "Rework the upcoming training plan to account for a stated life constraint "
            "(e.g. travel, illness, a busy week, reduced time). Regenerates the plan with "
            "that reason factored in."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "description": "The athlete's stated reason, in their own words.",
                },
            },
            "required": ["reason"],
        },
    },
    {
        "name": "mark_setback",
        "description": (
            "Record a niggle, injury, or life constraint the athlete mentions so future "
            "coaching context remembers it, even if no plan change is requested yet."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "tag": {
                    "type": "string",
                    "description": "A short label, e.g. 'knee pain', 'low energy', 'travel'.",
                },
                "note": {
                    "type": "string",
                    "description": "A brief note in the athlete's words.",
                },
            },
            "required": ["tag", "note"],
        },
    },
    {
        "name": "explain_workout",
        "description": (
            "Look up a specific scheduled training day by date and return its full "
            "prescription so you can explain it to the athlete."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "date": {
                    "type": "string",
                    "description": "ISO date (YYYY-MM-DD) of the scheduled day to explain.",
                },
            },
            "required": ["date"],
        },
    },
]

# Gemini function-declaration equivalent (same shape as _PLAN_GEMINI_RESPONSE_SCHEMA's
# use of raw dicts for schema-bearing config).
_CHAT_GEMINI_TOOLS = [
    {
        "function_declarations": [
            {
                "name": schema["name"],
                "description": schema["description"],
                "parameters": schema["input_schema"],
            }
            for schema in _CHAT_TOOL_SCHEMAS
        ],
    },
]


def _dispatch_chat_tool(
    db: Session, user_id: int, tool_name: str, tool_input: dict
) -> tuple[dict, dict | None]:
    """Execute one chat tool call.

    Returns (tool_result, action): tool_result is fed back to the model as the
    tool result content so it can compose a grounded confirmation; action (if
    not None) is a small public dict streamed to the client as an SSE 'action'
    event and persisted alongside the chat message.
    """
    if tool_name == "regenerate_plan":
        job_id = enqueue_job("generate_plan", {}, user_id)
        return (
            {"status": "queued", "job_id": job_id},
            {
                "type": "regenerate_plan",
                "status": "queued",
                "job_id": job_id,
                "summary": "Regenerating your training plan.",
            },
        )

    if tool_name == "adjust_upcoming_week":
        reason = tool_input.get("reason", "")
        job_id = enqueue_job("generate_plan", {"note": reason}, user_id)
        return (
            {"status": "queued", "job_id": job_id},
            {
                "type": "adjust_upcoming_week",
                "status": "queued",
                "job_id": job_id,
                "summary": f"Reworking your plan: {reason}",
            },
        )

    if tool_name == "mark_setback":
        tag = tool_input.get("tag") or "setback"
        note = tool_input.get("note", "")
        db.add(Insight(
            user_id=user_id,
            created_at=datetime.now(timezone.utc),
            trigger_type="chat_setback",
            content=note,
            summary=tag,
            category="setback",
        ))
        # Also persist as durable coach memory (P1-3) so it stays in context
        # beyond the last-few-insights window, until resolved or deleted.
        db.add(CoachMemory(
            user_id=user_id,
            category="niggle",
            tag=tag,
            note=note,
        ))
        db.commit()
        return (
            {"status": "recorded"},
            {
                "type": "mark_setback",
                "status": "recorded",
                "job_id": None,
                "summary": f"Remembered: {tag}.",
            },
        )

    if tool_name == "explain_workout":
        date_str = tool_input.get("date", "")
        try:
            day_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return {"status": "invalid_date", "date": date_str}, None

        plan = (
            db.query(TrainingPlan)
            .filter(TrainingPlan.user_id == user_id)
            .order_by(TrainingPlan.generated_at.desc())
            .first()
        )
        day = (
            db.query(TrainingPlanDay)
            .filter(
                TrainingPlanDay.plan_id == plan.id,
                TrainingPlanDay.day_date == day_date,
            )
            .first()
            if plan
            else None
        )
        if day is None:
            return {"status": "not_found", "date": date_str}, None

        return (
            {
                "status": "ok",
                "date": date_str,
                "workout_type": day.workout_type,
                "target_distance_km": (
                    round(day.target_distance_m / 1000, 2) if day.target_distance_m else None
                ),
                "target_pace_display": day.target_pace_display,
                "description": day.description,
                "notes": day.notes,
            },
            None,
        )

    raise ValueError(f"Unknown chat tool: {tool_name!r}")


def _claude_stream_tokens(client: "anthropic.Anthropic", **stream_kwargs):
    """Yield {'type': 'token', 'text': ...} events for one Claude streaming call.

    Returns (via generator return value, retrievable with `yield from`) the
    final Message once the stream completes, so callers can inspect it for a
    tool_use block.
    """
    try:
        with client.messages.stream(**stream_kwargs) as stream:
            for event in stream:
                if event.type == "content_block_delta" and event.delta.type == "text_delta":
                    yield {"type": "token", "text": event.delta.text}
            final_message = stream.get_final_message()
    except (
        anthropic.RateLimitError,
        anthropic.APITimeoutError,
        anthropic.APIConnectionError,
        anthropic.InternalServerError,
    ) as exc:
        raise AITransientError(str(exc)) from exc
    except (
        anthropic.AuthenticationError,
        anthropic.PermissionDeniedError,
        anthropic.BadRequestError,
        anthropic.NotFoundError,
    ) as exc:
        raise AIFatalError(str(exc)) from exc
    return final_message


def _stream_claude(history: list[dict], system: str, model: str, db: Session, user_id: int):
    """Yield token/action events from the Claude streaming API, dispatching at most one tool call."""
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    final_message = yield from _claude_stream_tokens(
        client, model=model, max_tokens=2048, system=system, tools=_CHAT_TOOL_SCHEMAS, messages=history,
    )

    tool_use_block = next(
        (b for b in final_message.content if b.type == "tool_use"), None
    )
    if tool_use_block is None:
        return

    result, action = _dispatch_chat_tool(db, user_id, tool_use_block.name, tool_use_block.input)
    if action:
        yield {"type": "action", "action": action}

    followup_messages = history + [
        {"role": "assistant", "content": final_message.content},
        {
            "role": "user",
            "content": [
                {
                    "type": "tool_result",
                    "tool_use_id": tool_use_block.id,
                    "content": json.dumps(result),
                }
            ],
        },
    ]
    yield from _claude_stream_tokens(
        client, model=model, max_tokens=2048, system=system, messages=followup_messages,
    )


def _gemini_contents(history: list[dict]) -> list[dict]:
    contents = []
    for msg in history:
        role = "user" if msg["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})
    return contents


def _gemini_stream_tokens(client: "genai.Client", **generate_kwargs):
    """Yield {'type': 'token', 'text': ...} events for one Gemini streaming call.

    Returns (via generator return value) the function_call part if the model
    called one, else None.
    """
    function_call = None
    try:
        for chunk in client.models.generate_content_stream(**generate_kwargs):
            if chunk.text:
                yield {"type": "token", "text": chunk.text}
            for candidate in chunk.candidates or []:
                for part in (candidate.content.parts or []) if candidate.content else []:
                    fc = getattr(part, "function_call", None)
                    if fc is not None:
                        function_call = fc
    except _genai_errors.ServerError as exc:
        raise AITransientError(str(exc)) from exc
    except _genai_errors.ClientError as exc:
        if getattr(exc, "code", None) == 429:
            raise AITransientError(str(exc)) from exc
        raise AIFatalError(str(exc)) from exc
    return function_call


def _stream_gemini(history: list[dict], system: str, model: str, db: Session, user_id: int):
    """Yield token/action events from the Gemini streaming API, dispatching at most one tool call."""
    client = genai.Client(api_key=settings.gemini_api_key)
    contents = _gemini_contents(history)

    function_call = yield from _gemini_stream_tokens(
        client,
        model=model,
        contents=contents,
        config=_genai_types.GenerateContentConfig(
            system_instruction=system, tools=_CHAT_GEMINI_TOOLS,
        ),
    )
    if function_call is None:
        return

    tool_args = dict(function_call.args or {})
    result, action = _dispatch_chat_tool(db, user_id, function_call.name, tool_args)
    if action:
        yield {"type": "action", "action": action}

    followup_contents = contents + [
        {"role": "model", "parts": [{"function_call": {"name": function_call.name, "args": tool_args}}]},
        {"role": "user", "parts": [{"function_response": {"name": function_call.name, "response": result}}]},
    ]
    yield from _gemini_stream_tokens(
        client,
        model=model,
        contents=followup_contents,
        config=_genai_types.GenerateContentConfig(system_instruction=system),
    )


def chat_stream(
    db: Session,
    new_message: str,
    history: list[dict],
    user_id: int = DEFAULT_USER_ID,
    activity_id: int | None = None,
):
    """Build context and return an event-streaming generator for the chat response.

    Yields dicts of shape {"type": "token", "text": ...} or
    {"type": "action", "action": {...}} when the model invokes a coach tool.
    """
    provider, model = _get_ai_config(db, user_id)
    context = _build_chat_context(db, user_id, activity_id)
    system = CHAT_SYSTEM_PROMPT + "\n\n---\n\n" + context

    messages = list(history) + [{"role": "user", "content": new_message}]
    stream_fn = _stream_gemini if provider == "gemini" else _stream_claude
    return stream_fn(messages, system, model, db, user_id)
