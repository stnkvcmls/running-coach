import json
import logging
from datetime import datetime, date, timedelta

import anthropic
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config import settings
from app.database import SessionLocal
from app.models import Activity, DailySummary, Insight, Race

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an experienced, data-driven running coach. You analyze training data from Garmin Connect and provide actionable insights.

Your approach:
- Focus on injury prevention and sustainable progressive overload
- Analyze pacing strategy, HR drift, cadence, and training effect
- Consider recovery indicators (sleep, stress, resting HR, body battery)
- Tailor advice to upcoming races when applicable
- Be concise: 3-5 key points per analysis
- Use markdown formatting with headers and bullet points
- Start with a one-line summary (prefixed with "**Summary:** ")

When race goals are provided, frame training recommendations around race preparation:
- Suggest appropriate workout types for the training phase
- Flag if training volume or intensity needs adjustment
- Consider tapering needs as race day approaches"""


def _format_activity_context(activity: Activity) -> str:
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
        parts.append(f"Avg Pace: {pace_min}:{pace_sec:02d} /km")
    if activity.avg_hr:
        parts.append(f"Avg HR: {activity.avg_hr} bpm")
    if activity.max_hr:
        parts.append(f"Max HR: {activity.max_hr} bpm")
    if activity.avg_cadence:
        parts.append(f"Cadence: {activity.avg_cadence:.0f} spm")
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


def _build_context(db: Session, trigger_type: str, trigger_data: str) -> str:
    """Build full context for AI analysis."""
    sections = [f"## Current Data\n{trigger_data}"]

    # Recent activities (last 14 days)
    cutoff = datetime.utcnow() - timedelta(days=14)
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
        week_start = date.today() - timedelta(days=date.today().weekday() + 7 * w)
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

    # Upcoming races
    upcoming_races = (
        db.query(Race)
        .filter(Race.date >= date.today())
        .order_by(Race.date.asc())
        .all()
    )
    if upcoming_races:
        race_lines = []
        for r in upcoming_races:
            days_until = (r.date - date.today()).days
            goal = ""
            if r.goal_time_sec:
                gh = r.goal_time_sec // 3600
                gm = (r.goal_time_sec % 3600) // 60
                gs = r.goal_time_sec % 60
                goal = f" Goal: {gh}:{gm:02d}:{gs:02d}" if gh else f" Goal: {gm}:{gs:02d}"
            race_lines.append(
                f"- {r.name} ({r.distance_label}) on {r.date} "
                f"({days_until} days away){goal}"
            )
        sections.append("## Upcoming Races\n" + "\n".join(race_lines))

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


def _call_claude(context: str, trigger_type: str) -> tuple[str, str, str]:
    """Call Claude API and return (content, summary, category)."""
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    user_prompt = f"Analyze this {trigger_type} data and provide coaching insights:\n\n{context}"

    response = client.messages.create(
        model=settings.ai_model,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    content = response.content[0].text

    # Extract summary (first line starting with **Summary:**)
    summary = ""
    for line in content.split("\n"):
        if line.strip().startswith("**Summary:**"):
            summary = line.strip().replace("**Summary:**", "").strip()
            break
    if not summary:
        summary = content.split("\n")[0][:200]

    # Determine category
    category_map = {
        "activity": "workout_analysis",
        "daily_summary": "recovery",
        "weekly_review": "training_plan",
    }
    category = category_map.get(trigger_type, "recommendation")

    return content, summary, category


def analyze_activity(activity: Activity):
    """Generate AI insight for a new activity."""
    db = SessionLocal()
    try:
        activity_context = _format_activity_context(activity)
        full_context = _build_context(db, "activity", activity_context)
        content, summary, category = _call_claude(full_context, "activity")

        insight = Insight(
            created_at=datetime.utcnow(),
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
    finally:
        db.close()


def analyze_daily_summary(daily: DailySummary):
    """Generate AI insight for a daily summary."""
    db = SessionLocal()
    try:
        daily_context = _format_daily_context(daily)
        full_context = _build_context(db, "daily_summary", daily_context)
        content, summary, category = _call_claude(full_context, "daily_summary")

        insight = Insight(
            created_at=datetime.utcnow(),
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
    finally:
        db.close()


def analyze_activity_force(activity_id: int):
    """Generate AI insight for an activity, replacing any existing insight."""
    db = SessionLocal()
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

        activity_context = _format_activity_context(activity)
        full_context = _build_context(db, "activity", activity_context)
        content, summary, category = _call_claude(full_context, "activity")

        insight = Insight(
            created_at=datetime.utcnow(),
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
    except Exception:
        logger.exception("AI re-analysis failed for activity %s", activity_id)
    finally:
        db.close()


def backfill_missing_insights():
    """Analyze past 7 days of activities and daily summaries that lack insights."""
    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(days=7)

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
        cutoff_date = (datetime.utcnow() - timedelta(days=7)).date()
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
    finally:
        db.close()


def weekly_review():
    """Generate a weekly training summary and recommendations."""
    db = SessionLocal()
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

        activity_summaries = "\n\n".join(_format_activity_context(a) for a in week_activities)
        trigger_data = f"## Weekly Review ({week_start} to {date.today()})\n\n{activity_summaries}"
        full_context = _build_context(db, "weekly_review", trigger_data)
        content, summary, category = _call_claude(full_context, "weekly_review")

        insight = Insight(
            created_at=datetime.utcnow(),
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
    finally:
        db.close()
