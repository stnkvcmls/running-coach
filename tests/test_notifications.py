from unittest.mock import MagicMock

import pytest

from app import notifications
from app.config import settings
from app.models import PushSubscription, SyncStatus, User


@pytest.fixture
def user(db):
    u = User(email="athlete@example.com")
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def configured_vapid(monkeypatch):
    """Point the module at a fake VAPID keypair so notify() doesn't no-op."""
    monkeypatch.setattr(settings, "vapid_public_key", "test-public-key")
    monkeypatch.setattr(settings, "vapid_private_key", "test-private-key")
    monkeypatch.setattr(notifications, "_not_configured_logged", False)


def _add_subscription(db, user_id, endpoint="https://push.example/abc"):
    sub = PushSubscription(
        user_id=user_id, endpoint=endpoint, p256dh="p256dh-key", auth="auth-key",
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


# --- is_configured / preferences -------------------------------------------

def test_is_configured_false_by_default():
    assert notifications.is_configured() is False


def test_is_configured_true_when_both_keys_set(configured_vapid):
    assert notifications.is_configured() is True


def test_get_notification_preferences_defaults_all_enabled(db, user):
    prefs = notifications.get_notification_preferences(db, user.id)
    assert prefs == {category: True for category in notifications.CATEGORIES}


def test_set_notification_preferences_persists_and_merges(db, user):
    notifications.set_notification_preferences(db, {"insight": False}, user.id)
    prefs = notifications.get_notification_preferences(db, user.id)
    assert prefs["insight"] is False
    # Untouched categories stay enabled.
    assert prefs["weekly_review"] is True

    notifications.set_notification_preferences(db, {"weekly_review": False}, user.id)
    prefs = notifications.get_notification_preferences(db, user.id)
    assert prefs["insight"] is False
    assert prefs["weekly_review"] is False

    assert db.query(SyncStatus).filter(SyncStatus.user_id == user.id).count() == 1


def test_set_notification_preferences_ignores_unknown_category(db, user):
    result = notifications.set_notification_preferences(db, {"not_a_category": False}, user.id)
    assert "not_a_category" not in result


# --- notify() ---------------------------------------------------------------

def test_notify_no_ops_when_vapid_not_configured(db, user, monkeypatch):
    _add_subscription(db, user.id)
    mock_webpush = MagicMock()
    monkeypatch.setattr(notifications, "webpush", mock_webpush)

    sent = notifications.notify(db, user.id, "insight", "Title", "Body")

    assert sent == 0
    mock_webpush.assert_not_called()


def test_notify_no_ops_when_no_subscriptions(db, user, configured_vapid, monkeypatch):
    mock_webpush = MagicMock()
    monkeypatch.setattr(notifications, "webpush", mock_webpush)

    sent = notifications.notify(db, user.id, "insight", "Title", "Body")

    assert sent == 0
    mock_webpush.assert_not_called()


def test_notify_sends_to_each_subscription(db, user, configured_vapid, monkeypatch):
    _add_subscription(db, user.id, "https://push.example/1")
    _add_subscription(db, user.id, "https://push.example/2")
    mock_webpush = MagicMock()
    monkeypatch.setattr(notifications, "webpush", mock_webpush)

    sent = notifications.notify(db, user.id, "insight", "New insight", "Body text", url="/activities/5")

    assert sent == 2
    assert mock_webpush.call_count == 2
    kwargs = mock_webpush.call_args.kwargs
    assert kwargs["vapid_claims"]["sub"] == settings.vapid_subject
    import json
    payload = json.loads(kwargs["data"])
    assert payload == {
        "category": "insight",
        "title": "New insight",
        "body": "Body text",
        "url": "/activities/5",
    }


def test_notify_respects_opted_out_category(db, user, configured_vapid, monkeypatch):
    _add_subscription(db, user.id)
    notifications.set_notification_preferences(db, {"insight": False}, user.id)
    mock_webpush = MagicMock()
    monkeypatch.setattr(notifications, "webpush", mock_webpush)

    sent = notifications.notify(db, user.id, "insight", "Title", "Body")

    assert sent == 0
    mock_webpush.assert_not_called()


def test_notify_rejects_unknown_category(db, user, configured_vapid):
    with pytest.raises(ValueError):
        notifications.notify(db, user.id, "not_a_category", "Title", "Body")


def test_notify_prunes_dead_subscription_on_410(db, user, configured_vapid, monkeypatch):
    sub = _add_subscription(db, user.id)
    response = MagicMock(status_code=410)
    exc = notifications.WebPushException("gone", response=response)

    def raise_exc(**kwargs):
        raise exc

    monkeypatch.setattr(notifications, "webpush", raise_exc)

    sent = notifications.notify(db, user.id, "insight", "Title", "Body")

    assert sent == 0
    assert db.query(PushSubscription).filter(PushSubscription.id == sub.id).first() is None


def test_notify_keeps_subscription_on_other_failure(db, user, configured_vapid, monkeypatch):
    sub = _add_subscription(db, user.id)
    response = MagicMock(status_code=500)
    exc = notifications.WebPushException("server error", response=response)

    def raise_exc(**kwargs):
        raise exc

    monkeypatch.setattr(notifications, "webpush", raise_exc)

    sent = notifications.notify(db, user.id, "insight", "Title", "Body")

    assert sent == 0
    assert db.query(PushSubscription).filter(PushSubscription.id == sub.id).first() is not None
