"""AI provider dispatch: Anthropic/Gemini calls with retry/backoff.

Internal dispatch (``_call_ai`` picking ``_call_claude``/``_call_gemini``, and
its ``_get_ai_config`` lookup) is routed through the ``app.ai_coach`` shim
rather than called as bare module-local names. The test suite monkeypatches
these functions on ``app.ai_coach`` (e.g. ``monkeypatch.setattr(ai_coach,
"_call_claude", ...)``); a bare in-module call would resolve against this
module's own globals and silently ignore that patch.
"""
import logging
import time

import anthropic
from google import genai
from google.genai import errors as _genai_errors
from google.genai import types as _genai_types

from sqlalchemy.orm import Session

from app.config import settings
from app.models import DEFAULT_USER_ID, SyncStatus
from app.coach.context import SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class AITransientError(Exception):
    """Retryable AI error: rate limit, timeout, or server 5xx."""


class AIFatalError(Exception):
    """Non-retryable AI error: bad credentials, invalid model, or bad request."""


_MAX_RETRIES = 3
_BACKOFF_BASE = 2  # seconds; delays are 1s, 2s before the 3rd attempt


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
    from app import ai_coach as _shim

    provider, model = _shim._get_ai_config(db, user_id)
    call_fn = _shim._call_gemini if provider == "gemini" else _shim._call_claude

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
