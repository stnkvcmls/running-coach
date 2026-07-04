"""Conversational coach — streaming chat with tool-use (P0-2).

Like providers.py/jobs.py/plans.py, the provider/job-dispatch call sites here
route through the ``app.ai_coach`` shim (``from app import ai_coach as
_shim``) rather than the locally-imported names, so tests that monkeypatch
``app.ai_coach._get_ai_config`` / ``._stream_claude`` / ``._stream_gemini`` /
``.enqueue_job`` keep taking effect after the split.
"""
import json
from datetime import datetime, date, timedelta, timezone

import anthropic
from google import genai
from google.genai import errors as _genai_errors
from google.genai import types as _genai_types

from sqlalchemy.orm import Session

from app.config import settings
from app.models import (
    DEFAULT_USER_ID,
    Activity,
    CoachMemory,
    Insight,
    TrainingPlan,
    TrainingPlanDay,
)
from app.coach.context import SYSTEM_PROMPT, _build_context, _format_activity_context, _load_zones, _load_zone_configs
from app.coach.providers import AITransientError, AIFatalError

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
                db=db,
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
    from app import ai_coach as _shim

    if tool_name == "regenerate_plan":
        job_id = _shim.enqueue_job("generate_plan", {}, user_id)
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
        job_id = _shim.enqueue_job("generate_plan", {"note": reason}, user_id)
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
    from app import ai_coach as _shim

    provider, model = _shim._get_ai_config(db, user_id)
    context = _build_chat_context(db, user_id, activity_id)
    system = CHAT_SYSTEM_PROMPT + "\n\n---\n\n" + context

    messages = list(history) + [{"role": "user", "content": new_message}]
    stream_fn = _shim._stream_gemini if provider == "gemini" else _shim._stream_claude
    return stream_fn(messages, system, model, db, user_id)
