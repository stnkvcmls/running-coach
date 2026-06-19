import json
import logging
from datetime import datetime, date, timedelta, timezone

import anthropic
import google.generativeai as genai
from sqlalchemy.orm import Session
from sqlalchemy import func

from app import training_load
from app import threshold as threshold_mod
from app import adherence as adherence_mod
from app.config import settings
from app.database import db_session
from app.models import (
    Activity,
    AthleteProfile,
    DailySummary,
    GarminCalendarEvent,
    Insight,
    MetricZone,
    SyncStatus,
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
- When a Training Load section is present, read CTL (Fitness), ATL (Fatigue), and TSB (Form = CTL − ATL) together: negative TSB means accumulated fatigue (productive while building, but watch for overreaching), positive TSB means freshness/taper. Comment on fitness trend and freshness, and flag rapid fatigue spikes.
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
    if summary.total_calories:
        parts.append(f"Calories: {summary.total_calories:,}")
    if summary.intensity_minutes:
        parts.append(f"Intensity Minutes: {summary.intensity_minutes}")
    return "\n".join(parts)


def _format_athlete_profile_context(profile: AthleteProfile, reference_date: date | None = None) -> str:
    """Format the athlete profile as a markdown block, emitting only set fields."""
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
    if profile.weekly_availability:
        lines.append(f"- Weekly Availability: {profile.weekly_availability}")
    if profile.training_preferences:
        lines.append(f"- Training Preferences: {profile.training_preferences}")
    if profile.injury_history:
        lines.append(f"- Injury History: {profile.injury_history}")
    if not lines:
        return ""
    return "## Athlete Profile\n" + "\n".join(lines)


def _build_context(db: Session, trigger_type: str, trigger_data: str, reference_date: date | None = None) -> str:
    """Build full context for AI analysis.

    Args:
        reference_date: The date to use as "today" for temporal context.
                        Defaults to date.today() if not provided.
    """
    if reference_date is None:
        reference_date = date.today()
    ref_datetime = datetime.combine(reference_date, datetime.min.time(), tzinfo=timezone.utc)

    sections = [f"## Current Data\n{trigger_data}"]

    # Athlete profile (baseline personalization — lands right after Current Data)
    profile = db.query(AthleteProfile).first()
    if profile:
        profile_context = _format_athlete_profile_context(profile, reference_date)
        if profile_context:
            sections.insert(1, profile_context)

    # Auto-derived thresholds — surface only the ones the athlete hasn't set so the
    # AI still has a reference for Critical Power / threshold pace / LTHR.
    try:
        estimate = threshold_mod.estimate_thresholds(db)
        estimate_context = threshold_mod.format_threshold_estimate_context(estimate, profile)
        if estimate_context:
            sections.insert(min(2, len(sections)), estimate_context)
    except Exception:
        logger.debug("Threshold estimate skipped", exc_info=True)

    # Training load (Fitness/Fatigue/Form) as of the reference date
    load_point = training_load.current_load(db, as_of=reference_date)
    load_context = training_load.format_training_load_context(load_point)
    if load_context:
        sections.insert(2 if len(sections) > 1 else 1, load_context)

    # Training readiness (composite of sleep, stress, body battery, acute load)
    today_summary = db.query(DailySummary).filter(DailySummary.date == reference_date).first()
    rhr_cutoff = reference_date - timedelta(days=7)
    recent_rhr_rows = (
        db.query(DailySummary.resting_hr)
        .filter(
            DailySummary.date >= rhr_cutoff,
            DailySummary.date < reference_date,
            DailySummary.resting_hr.isnot(None),
        )
        .all()
    )
    recent_rhr = [row[0] for row in recent_rhr_rows]
    readiness = training_load.compute_readiness(today_summary, load_point, recent_rhr)
    readiness_context = training_load.format_readiness_context(readiness)
    if readiness_context:
        insert_pos = min(3, len(sections))
        sections.insert(insert_pos, readiness_context)

    # Recent activities (last 14 days)
    cutoff = ref_datetime - timedelta(days=14)
    recent_activities = (
        db.query(Activity)
        .filter(Activity.started_at >= cutoff)
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

    # Recent daily summaries (last 7 days)
    recent_days = (
        db.query(DailySummary)
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
            race_lines.append(
                f"- {r.title} ({r.distance_label or '?'}) on {r.date} "
                f"({days_until} days away){goal}{priority}"
            )
        sections.append("## Upcoming Races\n" + "\n".join(race_lines))

    # Next scheduled training (from Garmin calendar)
    next_training = (
        db.query(GarminCalendarEvent)
        .filter(
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
    response = client.messages.create(
        model=model,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )
    content = response.content[0].text
    summary, category = _extract_summary_and_category(content, trigger_type)
    return content, summary, category


def _call_gemini(context: str, trigger_type: str, model: str) -> tuple[str, str, str]:
    """Call Gemini API and return (content, summary, category)."""
    genai.configure(api_key=settings.gemini_api_key)
    gemini_model = genai.GenerativeModel(model_name=model, system_instruction=SYSTEM_PROMPT)
    user_prompt = f"Analyze this {trigger_type} data and provide coaching insights:\n\n{context}"
    response = gemini_model.generate_content(user_prompt)
    content = response.text
    summary, category = _extract_summary_and_category(content, trigger_type)
    return content, summary, category


def _get_ai_config(db: Session) -> tuple[str, str]:
    """Return (provider, model) from DB, falling back to env defaults."""
    provider_row = db.query(SyncStatus).filter(SyncStatus.key == "ai_provider").first()
    model_row = db.query(SyncStatus).filter(SyncStatus.key == "ai_model").first()
    provider = provider_row.value if provider_row else "claude"
    model = model_row.value if model_row else settings.ai_model
    return provider, model


def _call_ai(db: Session, context: str, trigger_type: str) -> tuple[str, str, str]:
    """Dispatch to the configured AI provider and return (content, summary, category)."""
    provider, model = _get_ai_config(db)
    if provider == "gemini":
        return _call_gemini(context, trigger_type, model)
    return _call_claude(context, trigger_type, model)


def _save_error_insight(activity_id: int, exc: Exception) -> None:
    """Persist a failure insight so the UI can show an error and allow retry."""
    try:
        with db_session() as db:
            db.query(Insight).filter(
                Insight.trigger_type == "activity",
                Insight.trigger_id == activity_id,
            ).delete()
            db.add(Insight(
                created_at=datetime.now(timezone.utc),
                trigger_type="activity",
                trigger_id=activity_id,
                content=f"Analysis failed: {exc}\n\nCheck your AI backend configuration and use **Re-analyze** to retry.",
                summary="Analysis failed — use Re-analyze to retry",
                category="recommendation",
            ))
            db.commit()
    except Exception:
        logger.exception("Failed to save error insight for activity %s", activity_id)


def _load_zones(db: Session) -> dict[str, list[MetricZone]]:
    """Load metric zones from the database, grouped by metric_key."""
    zones_by_metric: dict[str, list[MetricZone]] = {}
    for z in db.query(MetricZone).all():
        zones_by_metric.setdefault(z.metric_key, []).append(z)
    return zones_by_metric


def _load_zone_configs(db: Session) -> dict:
    """Load custom threshold-anchored zone configs and profile thresholds."""
    profile = db.query(AthleteProfile).first()
    all_zones = db.query(ZoneConfig).order_by(ZoneConfig.zone_type, ZoneConfig.zone_number).all()
    return {
        "hr": [z for z in all_zones if z.zone_type == "hr"],
        "pace": [z for z in all_zones if z.zone_type == "pace"],
        "threshold_hr": profile.threshold_hr if profile else None,
        "threshold_pace": profile.threshold_pace_min_km if profile else None,
    }


def analyze_activity(activity: Activity):
    """Generate AI insight for a new activity."""
    with db_session() as db:
        try:
            activity_date = activity.started_at.date() if isinstance(activity.started_at, datetime) else activity.started_at
            zones_by_metric = _load_zones(db)
            zc = _load_zone_configs(db)
            activity_context = _format_activity_context(
                activity, zones_by_metric,
                hr_zone_configs=zc["hr"], pace_zone_configs=zc["pace"],
                threshold_hr=zc["threshold_hr"], threshold_pace=zc["threshold_pace"],
            )

            # Append workout adherence section if a workout was scheduled for this date
            workout_event = (
                db.query(GarminCalendarEvent)
                .filter(
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

            full_context = _build_context(db, "activity", activity_context, reference_date=activity_date)
            content, summary, category = _call_ai(db, full_context, "activity")

            insight = Insight(
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
    with db_session() as db:
        try:
            daily_context = _format_daily_context(daily)
            full_context = _build_context(db, "daily_summary", daily_context, reference_date=daily.date)
            content, summary, category = _call_ai(db, full_context, "daily_summary")

            insight = Insight(
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

            # Delete existing insight for this activity
            db.query(Insight).filter(
                Insight.trigger_type == "activity",
                Insight.trigger_id == activity.id,
            ).delete()

            activity_date = activity.started_at.date() if isinstance(activity.started_at, datetime) else activity.started_at
            zones_by_metric = _load_zones(db)
            zc = _load_zone_configs(db)
            activity_context = _format_activity_context(
                activity, zones_by_metric,
                hr_zone_configs=zc["hr"], pace_zone_configs=zc["pace"],
                threshold_hr=zc["threshold_hr"], threshold_pace=zc["threshold_pace"],
            )
            full_context = _build_context(db, "activity", activity_context, reference_date=activity_date)
            content, summary, category = _call_ai(db, full_context, "activity")

            insight = Insight(
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
            _save_error_insight(activity_id, exc)


def analyze_activity_with_feedback(activity_id: int):
    """Generate AI insight for an activity, incorporating user feedback."""
    with db_session() as db:
        try:
            activity = db.query(Activity).get(activity_id)
            if not activity:
                logger.warning("Activity %s not found for feedback analysis", activity_id)
                return

            # Delete existing insight for this activity
            db.query(Insight).filter(
                Insight.trigger_type == "activity",
                Insight.trigger_id == activity.id,
            ).delete()

            zones_by_metric = _load_zones(db)
            zc = _load_zone_configs(db)
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
            full_context = _build_context(db, "activity", activity_context, reference_date=activity_date)
            content, summary, category = _call_ai(db, full_context, "activity")

            insight = Insight(
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
            _save_error_insight(activity_id, exc)


def backfill_missing_insights():
    """Analyze past 7 days of activities and daily summaries that lack insights."""
    with db_session() as db:
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)

        # Activities in past 7 days without insights
        activities = (
            db.query(Activity)
            .filter(
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


def weekly_review():
    """Generate a weekly training summary and recommendations."""
    with db_session() as db:
        try:
            week_start = date.today() - timedelta(days=7)
            week_activities = (
                db.query(Activity)
                .filter(Activity.started_at >= datetime.combine(week_start, datetime.min.time()))
                .order_by(Activity.started_at.asc())
                .all()
            )

            if not week_activities:
                logger.info("No activities this week, skipping weekly review")
                return

            zones_by_metric = _load_zones(db)
            zc = _load_zone_configs(db)
            activity_summaries = "\n\n".join(
                _format_activity_context(
                    a, zones_by_metric,
                    hr_zone_configs=zc["hr"], pace_zone_configs=zc["pace"],
                    threshold_hr=zc["threshold_hr"], threshold_pace=zc["threshold_pace"],
                )
                for a in week_activities
            )
            trigger_data = f"## Weekly Review ({week_start} to {date.today()})\n\n{activity_summaries}"
            full_context = _build_context(db, "weekly_review", trigger_data)
            content, summary, category = _call_ai(db, full_context, "weekly_review")

            insight = Insight(
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
