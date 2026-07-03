"""Thin aggregator over ``app.routers.*`` (P3-1 monolith split).

``app/api.py`` used to hold all 53 routes; they now live in
``app/routers/{activities,daily,calendar,plan,races,chat,settings,trends,
export}.py``, grouped by domain. This module builds the single
``/api/v1``-prefixed ``api_router`` that ``app/main.py`` mounts, and
re-exports the couple of helpers (``_parse_date``, ``_enrich_event_with_steps``)
that tests reach for directly via ``app.api``.
"""
from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.routers import activities, calendar, chat, daily, export, plan, races, settings, trends
from app.routers._shared import _enrich_event_with_steps, _parse_date

api_router = APIRouter(
    prefix="/api/v1",
    tags=["api"],
    dependencies=[Depends(get_current_user)],
)

for _router in (
    daily.router,
    activities.router,
    calendar.router,
    settings.router,
    trends.router,
    plan.router,
    races.router,
    export.router,
    chat.router,
):
    api_router.include_router(_router)

__all__ = ["api_router", "_parse_date", "_enrich_event_with_steps"]
