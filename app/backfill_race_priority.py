"""
One-time backfill: re-parse raw_json for existing race records to populate
priority from the Garmin `primaryEvent` boolean field.

Usage: python -m app.backfill_race_priority
"""
import json
from app.database import SessionLocal
from app.models import GarminCalendarEvent
from app.garmin_sync import _parse_race_priority


def backfill():
    db = SessionLocal()
    try:
        races = (
            db.query(GarminCalendarEvent)
            .filter(GarminCalendarEvent.event_type == "race")
            .all()
        )
        updated = 0
        for race in races:
            if not race.raw_json:
                continue
            item = json.loads(race.raw_json)

            # Re-derive priority using the same logic as _parse_calendar_response
            priority_raw = item.get("priority") or item.get("racePriority") or item.get("eventPriority")
            if priority_raw is None:
                primary_event = item.get("primaryEvent")
                if primary_event is True:
                    priority_raw = "PRIMARY"
                elif primary_event is False:
                    priority_raw = "SECONDARY"
            priority = _parse_race_priority(priority_raw)

            if race.priority != priority:
                print(f"  {race.title}: priority {race.priority!r} -> {priority!r}")
                race.priority = priority
                updated += 1

        db.commit()
        print(f"Backfill complete: {updated}/{len(races)} races updated.")
    finally:
        db.close()


if __name__ == "__main__":
    backfill()
