"""Re-export shim over ``app.coach.*`` (P3-1 monolith split).

``app/ai_coach.py`` used to hold all AI-coach logic; it now lives in
``app/coach/{context,providers,jobs,plans,chat}.py``. This module re-exports
that full surface so existing imports (``from app.ai_coach import X``) and
call sites elsewhere in the app keep working unchanged.

It also remains the seam the test suite monkeypatches (e.g.
``monkeypatch.setattr(ai_coach, "generate_training_plan", ...)``,
``patch_db_session(ai_coach)``) — several call sites inside ``app/coach/*``
route back through this module (``from app import ai_coach as _shim``) at
call time specifically so those patches keep taking effect after the split.
"""
import anthropic
from google import genai

from app.database import db_session

from app.coach.context import (
    SYSTEM_PROMPT,
    COACH_MEMORY_CONTEXT_LIMIT,
    _classify_metric,
    _classify_by_zones,
    _format_activity_context,
    _format_daily_context,
    _format_athlete_profile_context,
    _format_coach_memory_context,
    _recent_hot_runs,
    _recent_heat_stress_note,
    recent_heat_stress,
    _build_context,
    _load_zones,
    _load_zone_configs,
)
from app.coach.providers import (
    AITransientError,
    AIFatalError,
    _extract_summary_and_category,
    _call_claude,
    _call_gemini,
    _get_ai_config,
    _call_ai,
)
from app.coach.jobs import (
    enqueue_job,
    execute_job,
    _activity_user_id,
    _save_error_insight,
    analyze_activity,
    analyze_daily_summary,
    analyze_activity_force,
    analyze_activity_with_feedback,
    backfill_missing_insights,
)
from app.coach.plans import (
    _build_plan_system_prompt,
    _PLAN_MAX_TOKENS,
    _PLAN_SYSTEM_PROMPT,
    _PLAN_TOOL_SCHEMA,
    _PLAN_GEMINI_RESPONSE_SCHEMA,
    _build_plan_adherence_context,
    _race_distance_category,
    _build_race_periodization_context,
    _build_plan_context,
    _next_monday,
    _parse_plan_json,
    _store_training_plan,
    _parse_pace_display,
    detect_plan_realignment,
    generate_training_plan,
    weekly_review,
)
from app.coach.chat import (
    CHAT_SYSTEM_PROMPT,
    _format_upcoming_plan_context,
    _build_chat_context,
    _dispatch_chat_tool,
    _claude_stream_tokens,
    _stream_claude,
    _gemini_contents,
    _gemini_stream_tokens,
    _stream_gemini,
    chat_stream,
)

__all__ = [
    "db_session",
    "anthropic",
    "genai",
    "SYSTEM_PROMPT",
    "COACH_MEMORY_CONTEXT_LIMIT",
    "recent_heat_stress",
    "AITransientError",
    "AIFatalError",
    "enqueue_job",
    "execute_job",
    "analyze_activity",
    "analyze_daily_summary",
    "analyze_activity_force",
    "analyze_activity_with_feedback",
    "backfill_missing_insights",
    "detect_plan_realignment",
    "generate_training_plan",
    "weekly_review",
    "CHAT_SYSTEM_PROMPT",
    "chat_stream",
]
