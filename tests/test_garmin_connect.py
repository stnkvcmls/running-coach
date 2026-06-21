"""Tests for Phase 2: crypto + per-user Garmin connect/MFA/disconnect/bootstrap."""
import os
from unittest.mock import MagicMock

import pytest
from cryptography.fernet import Fernet

from app import crypto, garmin_sync
from app.models import User


@pytest.fixture(autouse=True)
def _clean_module_state():
    """Per-test reset of the module-level client / MFA caches."""
    garmin_sync._garmin_clients.clear()
    garmin_sync._mfa_sessions.clear()
    yield
    garmin_sync._garmin_clients.clear()
    garmin_sync._mfa_sessions.clear()


@pytest.fixture
def enc_key(monkeypatch):
    key = Fernet.generate_key().decode()
    monkeypatch.setattr(crypto.settings, "encryption_key", key)
    return key


def _fake_garmin(needs_mfa=False):
    g = MagicMock()
    g.login.return_value = ("needs_mfa", None) if needs_mfa else (None, None)
    return g


def _make_user(db, email="u@example.com", **kw):
    user = User(email=email, **kw)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# --- crypto ---------------------------------------------------------------

def test_encrypt_decrypt_roundtrip(enc_key):
    assert crypto.decrypt(crypto.encrypt("hunter2")) == "hunter2"


def test_is_configured(monkeypatch):
    monkeypatch.setattr(crypto.settings, "encryption_key", "")
    assert crypto.is_configured() is False
    monkeypatch.setattr(crypto.settings, "encryption_key", "abc")
    assert crypto.is_configured() is True


def test_encrypt_requires_key(monkeypatch):
    monkeypatch.setattr(crypto.settings, "encryption_key", "")
    with pytest.raises(RuntimeError):
        crypto.encrypt("x")


# --- connect (clean login) ------------------------------------------------

def test_connect_clean_login_stores_creds(db, enc_key, monkeypatch, tmp_path):
    monkeypatch.setattr(garmin_sync.settings, "garmin_token_dir", str(tmp_path))
    fake = _fake_garmin()
    monkeypatch.setattr(garmin_sync, "Garmin", lambda *a, **k: fake)
    user = _make_user(db)

    status = garmin_sync.connect_garmin_start(db, user, "g@garmin.com", "pw")

    assert status == "connected"
    db.refresh(user)
    assert user.garmin_email == "g@garmin.com"
    assert crypto.decrypt(user.garmin_password_encrypted) == "pw"
    # Tokens dumped into the per-user dir.
    fake.client.dump.assert_called_once_with(garmin_sync._user_token_dir(user.id))


# --- connect (MFA flow) ---------------------------------------------------

def test_connect_mfa_flow(db, enc_key, monkeypatch, tmp_path):
    monkeypatch.setattr(garmin_sync.settings, "garmin_token_dir", str(tmp_path))
    fake = _fake_garmin(needs_mfa=True)
    monkeypatch.setattr(garmin_sync, "Garmin", lambda *a, **k: fake)
    user = _make_user(db, email="mfa@example.com")

    status = garmin_sync.connect_garmin_start(db, user, "g@garmin.com", "pw")
    assert status == "mfa_required"
    db.refresh(user)
    assert user.garmin_email is None  # not stored until MFA completes

    status2 = garmin_sync.connect_garmin_mfa(db, user, "123456")
    assert status2 == "connected"
    fake.resume_login.assert_called_once_with(None, "123456")
    db.refresh(user)
    assert user.garmin_email == "g@garmin.com"
    assert crypto.decrypt(user.garmin_password_encrypted) == "pw"


def test_connect_mfa_without_session_raises(db, enc_key):
    user = _make_user(db, email="nomfa@example.com")
    with pytest.raises(ValueError):
        garmin_sync.connect_garmin_mfa(db, user, "000000")


# --- status / disconnect --------------------------------------------------

def test_connection_status(db):
    connected = User(email="c@example.com", garmin_email="g@garmin.com")
    assert garmin_sync.garmin_connection_status(connected)["connected"] is True
    not_connected = User(email="n@example.com")
    assert garmin_sync.garmin_connection_status(not_connected)["connected"] is False


def test_disconnect_clears_creds_and_tokens(db, enc_key, monkeypatch, tmp_path):
    monkeypatch.setattr(garmin_sync.settings, "garmin_token_dir", str(tmp_path))
    user = _make_user(
        db,
        email="d@example.com",
        garmin_email="g@garmin.com",
        garmin_password_encrypted=crypto.encrypt("pw"),
    )
    token_dir = garmin_sync._user_token_dir(user.id)
    os.makedirs(token_dir, exist_ok=True)
    (tmp_path / str(user.id) / "oauth1_token.json").write_text("{}")

    garmin_sync.disconnect_garmin(db, user)

    db.refresh(user)
    assert user.garmin_email is None
    assert user.garmin_password_encrypted is None
    assert not os.path.isdir(token_dir)


# --- bootstrap seeding + token migration ----------------------------------

def test_seed_bootstrap_user_and_migrate_tokens(
    db, patch_db_session, enc_key, monkeypatch, tmp_path
):
    patch_db_session(garmin_sync)
    monkeypatch.setattr(garmin_sync.settings, "garmin_email", "boot@garmin.com")
    monkeypatch.setattr(garmin_sync.settings, "garmin_password", "bootpw")
    monkeypatch.setattr(garmin_sync.settings, "dev_user_email", "boot@id.com")
    monkeypatch.setattr(garmin_sync.settings, "garmin_token_dir", str(tmp_path))
    # Legacy flat-dir token file present before migration.
    (tmp_path / "oauth1_token.json").write_text("{}")

    garmin_sync.seed_bootstrap_user()

    user = db.query(User).filter(User.email == "boot@id.com").first()
    assert user is not None
    assert user.garmin_email == "boot@garmin.com"
    assert crypto.decrypt(user.garmin_password_encrypted) == "bootpw"
    # Token moved into the per-user dir.
    assert (tmp_path / str(user.id) / "oauth1_token.json").exists()
    assert not (tmp_path / "oauth1_token.json").exists()


def test_seed_bootstrap_user_noop_without_garmin_email(
    db, patch_db_session, monkeypatch
):
    patch_db_session(garmin_sync)
    monkeypatch.setattr(garmin_sync.settings, "garmin_email", "")
    garmin_sync.seed_bootstrap_user()
    assert db.query(User).count() == 0
