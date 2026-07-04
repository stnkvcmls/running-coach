"""Web Push subscription management + notification preferences (P0-1)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import notifications as notifications_mod
from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.models import PushSubscription, User
from app.schemas import (
    NotificationPreferencesRequest,
    NotificationPreferencesResponse,
    PushSubscriptionDeleteRequest,
    PushSubscriptionRequest,
    VapidPublicKeyResponse,
)

router = APIRouter()


@router.get("/push/vapid-public-key", response_model=VapidPublicKeyResponse)
def api_vapid_public_key():
    return VapidPublicKeyResponse(
        public_key=settings.vapid_public_key,
        configured=notifications_mod.is_configured(),
    )


@router.post("/push-subscriptions")
def api_create_push_subscription(
    body: PushSubscriptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = (
        db.query(PushSubscription)
        .filter(PushSubscription.endpoint == body.endpoint)
        .first()
    )
    if existing:
        existing.user_id = current_user.id
        existing.p256dh = body.keys.p256dh
        existing.auth = body.keys.auth
        existing.user_agent = body.user_agent
    else:
        db.add(PushSubscription(
            user_id=current_user.id,
            endpoint=body.endpoint,
            p256dh=body.keys.p256dh,
            auth=body.keys.auth,
            user_agent=body.user_agent,
        ))
    db.commit()
    return {"status": "subscribed"}


@router.delete("/push-subscriptions")
def api_delete_push_subscription(
    body: PushSubscriptionDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id,
        PushSubscription.endpoint == body.endpoint,
    ).delete()
    db.commit()
    return {"status": "unsubscribed"}


@router.get("/notification-preferences", response_model=NotificationPreferencesResponse)
def api_get_notification_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return NotificationPreferencesResponse(
        categories=notifications_mod.get_notification_preferences(db, current_user.id),
        labels=notifications_mod.CATEGORIES,
    )


@router.put("/notification-preferences", response_model=NotificationPreferencesResponse)
def api_set_notification_preferences(
    body: NotificationPreferencesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    categories = notifications_mod.set_notification_preferences(
        db, body.categories, current_user.id
    )
    return NotificationPreferencesResponse(
        categories=categories,
        labels=notifications_mod.CATEGORIES,
    )
