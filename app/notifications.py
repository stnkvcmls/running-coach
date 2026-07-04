"""Outbound Web Push notifications (P0-1).

Standards-based Web Push (VAPID) so the PWA + service worker already
installed on the athlete's phone can receive bite-sized coach nudges without
polling or a native app: a new AI insight after an activity syncs, the weekly
review landing, a plan-adaptation suggestion on a low-readiness morning, a
Garmin re-auth flag, a race-week reminder, and a new personal record.

``notify()`` is the single entry point every call site uses. It is a no-op
(with a one-time warning) when VAPID keys aren't configured, so existing
deployments and the test suite are unaffected until an operator opts in.
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass

from pywebpush import WebPushException, webpush
from sqlalchemy.orm import Session

from app.config import settings
from app.models import DEFAULT_USER_ID, PushSubscription, SyncStatus

logger = logging.getLogger(__name__)

# Every push category, with a human label for the Settings UI toggle list.
# Categories are opt-out (default enabled) — see get_notification_preferences.
CATEGORIES: dict[str, str] = {
    "insight": "New coaching insights",
    "weekly_review": "Weekly reviews",
    "plan_adaptation": "Plan adaptation suggestions",
    "personal_record": "Personal records",
    "reauth": "Garmin connection issues",
    "race_reminder": "Race-week reminders",
}

_PREFS_KEY = "notification_preferences"
_not_configured_logged = False


@dataclass
class PushPayload:
    category: str
    title: str
    body: str
    url: str | None = None

    def to_json(self) -> str:
        return json.dumps({
            "category": self.category,
            "title": self.title,
            "body": self.body,
            "url": self.url,
        })


def is_configured() -> bool:
    return bool(settings.vapid_public_key and settings.vapid_private_key)


def get_notification_preferences(db: Session, user_id: int = DEFAULT_USER_ID) -> dict[str, bool]:
    """This user's per-category opt-outs, defaulting every category to enabled."""
    row = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == user_id, SyncStatus.key == _PREFS_KEY)
        .first()
    )
    stored: dict[str, bool] = {}
    if row and row.value:
        try:
            stored = json.loads(row.value)
        except (json.JSONDecodeError, TypeError):
            stored = {}
    return {category: bool(stored.get(category, True)) for category in CATEGORIES}


def set_notification_preferences(
    db: Session, updates: dict[str, bool], user_id: int = DEFAULT_USER_ID
) -> dict[str, bool]:
    """Merge ``updates`` (category -> enabled) into this user's stored preferences."""
    current = get_notification_preferences(db, user_id)
    current.update({k: bool(v) for k, v in updates.items() if k in CATEGORIES})

    row = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == user_id, SyncStatus.key == _PREFS_KEY)
        .first()
    )
    value = json.dumps(current)
    if row:
        row.value = value
    else:
        db.add(SyncStatus(user_id=user_id, key=_PREFS_KEY, value=value))
    db.commit()
    return current


def notify(
    db: Session,
    user_id: int,
    category: str,
    title: str,
    body: str,
    url: str | None = None,
) -> int:
    """Push ``title``/``body`` to every subscribed device for ``user_id``.

    Returns the number of subscriptions successfully pushed to. Silently does
    nothing if VAPID isn't configured, the category is opted out, or the user
    has no subscriptions. Subscriptions the push service reports as gone
    (404/410) are pruned so future calls don't keep retrying them.
    """
    global _not_configured_logged
    if category not in CATEGORIES:
        raise ValueError(f"Unknown notification category: {category}")

    if not is_configured():
        if not _not_configured_logged:
            logger.info("Web Push not configured (no VAPID keys); notify() is a no-op.")
            _not_configured_logged = True
        return 0

    prefs = get_notification_preferences(db, user_id)
    if not prefs.get(category, True):
        return 0

    subscriptions = (
        db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
    )
    if not subscriptions:
        return 0

    payload = PushPayload(category=category, title=title, body=body, url=url).to_json()
    sent = 0
    for sub in subscriptions:
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
        }
        try:
            webpush(
                subscription_info=subscription_info,
                data=payload,
                vapid_private_key=settings.vapid_private_key,
                vapid_claims={"sub": settings.vapid_subject},
            )
            sent += 1
        except WebPushException as exc:
            status_code = getattr(exc.response, "status_code", None)
            if status_code in (404, 410):
                logger.info("Pruning dead push subscription %s (status %s)", sub.id, status_code)
                db.delete(sub)
                db.commit()
            else:
                logger.warning("Push to subscription %s failed: %s", sub.id, exc)
    return sent
