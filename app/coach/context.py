"""Context and prompt builders for AI coaching (analysis + chat).

Formats activity/daily/profile/memory data and assembles the full context
block handed to the configured AI provider (see providers.py).
"""
import json
import logging
from datetime import datetime, date, timedelta, timezone

from sqlalchemy.orm import Session
from sqlalchemy import func

from app import training_load
from app import threshold as threshold_mod
from app import intensity as intensity_mod
from app import records as records_mod
from app import weather as weather_mod
from app.models import (
    DEFAULT_USER_ID,
    Activity,
    AthleteProfile,
    CoachMemory,
    DailyCheckin,
    DailySummary,
    GarminCalendarEvent,
    Insight,
    MetricZone,
    ZoneConfig,
)
from app.utils import calculate_age

logger = logging.getLogger(__name__)


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
    db: Session | None = None,
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

    # Personal records set by this activity (app.records)
    if db is not None and activity.id:
        try:
            pr_context = records_mod.format_activity_pr_context(
                db, activity.id, user_id=activity.user_id or DEFAULT_USER_ID
            )
            if pr_context:
                parts.append(pr_context)
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


def _format_checkin_note(checkin: DailyCheckin | None) -> str:
    """Return a one-line "how the athlete says they feel" note for the readiness section."""
    if checkin is None:
        return ""
    taps = []
    if checkin.soreness is not None:
        taps.append(f"Soreness {checkin.soreness}/5 (5=none)")
    if checkin.energy is not None:
        taps.append(f"Energy {checkin.energy}/5")
    if checkin.mood is not None:
        taps.append(f"Mood {checkin.mood}/5")
    if not taps:
        return ""
    note = f"- How the athlete says they feel today: {', '.join(taps)}"
    if checkin.soreness_note:
        note += f" (sore area noted: {checkin.soreness_note})"
    return note


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
    checkin = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.user_id == user_id, DailyCheckin.date == reference_date)
        .first()
    )
    readiness = training_load.compute_readiness(today_summary, load_point, recent_rhr, checkin)
    readiness_context = training_load.format_readiness_context(readiness)

    # Append a heat-stress note to readiness when recent runs were hot/humid.
    # Query the last 3 activities with weather data and check for notable penalties.
    heat_penalty_note = _recent_heat_stress_note(db, reference_date, user_id)
    if heat_penalty_note:
        readiness_context = (readiness_context + "\n" + heat_penalty_note).strip()

    # Append the athlete's own daily check-in, if logged today.
    checkin_note = _format_checkin_note(checkin)
    if checkin_note:
        readiness_context = (readiness_context + "\n" + checkin_note).strip()

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
            # Non-run sessions don't carry a pace/HR the athlete reads as
            # "load" the way a run's does — surface the estimated TSS instead
            # so cross-training contribution to fitness/fatigue is explicit.
            cross_training = ""
            if not training_load.is_run(a.activity_type):
                tss, _ = training_load.estimate_tss(a, profile)
                if tss > 0:
                    cross_training = f"~{tss:.0f} TSS"
            act_lines.append(
                f"- {date_str}: {a.name} ({a.activity_type}) {dist} {dur} {pace} {hr} {cross_training}".rstrip()
            )
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
