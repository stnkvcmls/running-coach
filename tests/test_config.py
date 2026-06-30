"""Tests for P3-3: model catalog lifted into Settings.available_models."""

import json
import pytest
from pydantic_settings import BaseSettings


def test_default_available_models_has_claude_and_gemini():
    from app.config import settings

    catalog = settings.available_models
    assert "claude" in catalog
    assert "gemini" in catalog
    assert len(catalog["claude"]) > 0
    assert len(catalog["gemini"]) > 0


def test_default_available_models_contains_known_models():
    from app.config import settings

    assert "claude-sonnet-4-6" in settings.available_models["claude"]
    assert "gemini-2.5-flash" in settings.available_models["gemini"]


def test_available_models_overridable_via_env(monkeypatch):
    """AVAILABLE_MODELS env var (JSON) overrides the default catalog."""
    custom = {"mycloud": ["model-a", "model-b"]}
    monkeypatch.setenv("AVAILABLE_MODELS", json.dumps(custom))

    # Instantiate a fresh Settings to pick up the env override.
    from pydantic_settings import BaseSettings
    from app.config import Settings

    fresh = Settings()
    assert fresh.available_models == custom
    assert "mycloud" in fresh.available_models
    assert "model-a" in fresh.available_models["mycloud"]


def test_available_models_env_can_add_provider(monkeypatch):
    """Operators can extend the catalog without a code change."""
    from app.config import Settings, _DEFAULT_AVAILABLE_MODELS

    extended = dict(_DEFAULT_AVAILABLE_MODELS)
    extended["openai"] = ["gpt-4o"]
    monkeypatch.setenv("AVAILABLE_MODELS", json.dumps(extended))

    fresh = Settings()
    assert "openai" in fresh.available_models
    assert "gpt-4o" in fresh.available_models["openai"]
    # Original providers still present.
    assert "claude" in fresh.available_models
