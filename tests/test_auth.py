"""Tests for the Phase 1 identity layer (app/auth.py)."""
import json
import time
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401 - ensure models register on Base.metadata
from app.api import api_router
from app.auth import _upsert_user, get_current_user
from app.config import settings
from app.database import Base, get_db
from app.models import User


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def session_factory():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield sessionmaker(bind=engine)
    engine.dispose()


@pytest.fixture
def db(session_factory):
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(session_factory):
    app = FastAPI()
    app.include_router(api_router)

    def override_get_db():
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


# ---------------------------------------------------------------------------
# _upsert_user
# ---------------------------------------------------------------------------


def test_upsert_user_creates_on_first_call(db):
    user = _upsert_user(db, "alice@example.com")
    assert user.id is not None
    assert user.email == "alice@example.com"


def test_upsert_user_returns_same_row(db):
    u1 = _upsert_user(db, "bob@example.com")
    u2 = _upsert_user(db, "bob@example.com")
    assert u1.id == u2.id


# ---------------------------------------------------------------------------
# get_current_user — dev mode (auth_enabled=False)
# ---------------------------------------------------------------------------


def test_dev_mode_uses_dev_user_email(db, monkeypatch):
    monkeypatch.setattr(settings, "auth_enabled", False)
    monkeypatch.setattr(settings, "dev_user_email", "devuser@test.com")
    req = MagicMock()
    user = get_current_user(req, db)
    assert user.email == "devuser@test.com"


def test_dev_mode_falls_back_to_garmin_email(db, monkeypatch):
    monkeypatch.setattr(settings, "auth_enabled", False)
    monkeypatch.setattr(settings, "dev_user_email", "")
    monkeypatch.setattr(settings, "garmin_email", "garmin@test.com")
    req = MagicMock()
    user = get_current_user(req, db)
    assert user.email == "garmin@test.com"


def test_dev_mode_falls_back_to_localhost(db, monkeypatch):
    monkeypatch.setattr(settings, "auth_enabled", False)
    monkeypatch.setattr(settings, "dev_user_email", "")
    monkeypatch.setattr(settings, "garmin_email", "")
    req = MagicMock()
    user = get_current_user(req, db)
    assert user.email == "dev@localhost"


# ---------------------------------------------------------------------------
# get_current_user — auth mode (auth_enabled=True)
# ---------------------------------------------------------------------------


def test_auth_mode_missing_header_raises_401(db, monkeypatch):
    monkeypatch.setattr(settings, "auth_enabled", True)
    req = MagicMock()
    req.headers.get.return_value = None
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(req, db)
    assert exc_info.value.status_code == 401


def test_auth_mode_valid_token_creates_user(db, monkeypatch):
    monkeypatch.setattr(settings, "auth_enabled", True)
    req = MagicMock()
    req.headers.get.return_value = "fake-token"
    with patch("app.auth.verify_cf_access_jwt", return_value="cf@example.com"):
        user = get_current_user(req, db)
    assert user.email == "cf@example.com"


# ---------------------------------------------------------------------------
# /me endpoint
# ---------------------------------------------------------------------------


def test_me_endpoint_returns_email(client, monkeypatch):
    monkeypatch.setattr(settings, "auth_enabled", False)
    monkeypatch.setattr(settings, "dev_user_email", "me@test.com")
    resp = client.get("/api/v1/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "me@test.com"
    assert "full_name" in data
