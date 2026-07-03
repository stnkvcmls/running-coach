"""CSV/JSON export of activities and insights."""
import csv
import io
import json

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Activity, Insight, User
from app.schemas import ActivitySummary, InsightResponse

router = APIRouter()


@router.get("/export/activities")
def api_export_activities(
    format: str = Query("csv", pattern="^(csv|json)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activities = (
        db.query(Activity)
        .filter(Activity.user_id == current_user.id)
        .order_by(Activity.started_at.desc())
        .all()
    )

    if format == "json":
        data = [ActivitySummary.model_validate(a).model_dump() for a in activities]
        content = json.dumps(data, default=str, indent=2)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=activities.json"},
        )

    fields = [
        "id", "garmin_id", "activity_type", "name", "started_at",
        "duration_sec", "distance_m", "avg_hr", "max_hr",
        "avg_pace_min_km", "calories", "elevation_gain",
    ]
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for a in activities:
        row = ActivitySummary.model_validate(a).model_dump()
        writer.writerow({k: ("" if row[k] is None else str(row[k])) for k in fields})
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=activities.csv"},
    )


@router.get("/export/insights")
def api_export_insights(
    format: str = Query("csv", pattern="^(csv|json)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    insights = (
        db.query(Insight)
        .filter(Insight.user_id == current_user.id)
        .order_by(Insight.created_at.desc())
        .all()
    )

    if format == "json":
        data = [InsightResponse.model_validate(i).model_dump() for i in insights]
        content = json.dumps(data, default=str, indent=2)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=insights.json"},
        )

    fields = ["id", "created_at", "trigger_type", "trigger_id", "category", "summary", "content"]
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for i in insights:
        row = InsightResponse.model_validate(i).model_dump()
        writer.writerow({k: ("" if row[k] is None else str(row[k])) for k in fields})
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=insights.csv"},
    )
