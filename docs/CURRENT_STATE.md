# Running Coach — Current State

_Last updated: 2026-05-29_

---

## Core Features

### Garmin Sync
- **Activity sync** runs every N minutes (default 5), pulling the most recent 20 activities with full detail: splits, laps, HR zones, power zones, weather, running dynamics, respiration.
- **Daily summary sync** runs once per day (configurable hour, default 7am) and pulls steps, calories, HR, sleep, stress, and body battery.
- **Calendar sync** pulls the current and next two months of Garmin calendar events — scheduled workouts (with full step definitions) and races (with distance, goal time, and priority).
- **Historical backfill** runs on startup: all past activities and the last 365 days of daily summaries.
- Garmin session is token-based; credentials and tokens are stored in a configurable directory.

### AI Coaching
- **Multi-provider**: supports both Claude (Opus 4.7, Sonnet 4.6, Haiku 4.5) and Gemini (2.5 Flash, 2.5 Flash Lite, 3.0, Gemma). Provider and model are selectable from the UI.
- **Automated analysis**: every new activity or daily summary triggers an AI insight, including context about recent activities, weekly volume, recovery metrics, upcoming races, and scheduled training.
- **Feedback-driven re-analysis**: users can rate an activity good/bad, attach issue tags, and add free text; re-analysis incorporates this feedback.
- **Weekly review**: every Sunday at 8am a training summary with recommendations is generated.
- **Backfill**: an endpoint triggers AI analysis for the past 7 days of activities/summaries that are missing insights.
- The system prompt emphasises injury prevention, pacing, form, training load, and recovery.

### Today View
- Shows the selected date's activities, daily summary, and scheduled workouts.
- Race countdown cards for the next two upcoming races, showing distance label, goal time, priority, and days until race.
- Eight-week rolling weekly mileage chart broken down by activity type (run, bike, swim, walk, other).
- Latest AI insights panel.

### Activity Detail
- All 80+ synced metrics, including running dynamics (ground contact time, vertical oscillation, vertical ratio) with percentile zone indicators.
- Power metrics: normalised power, Training Stress Score, intensity factor.
- Interactive charts: HR, pace, cadence, elevation, GCT, vertical metrics, power zones.
- HR zones breakdown and laps table.
- AI insight card with feedback prompt.
- Link back to the associated scheduled workout if applicable.

### Calendar
- Month and week views showing activities and calendar events.
- Date picker on the Today screen to navigate to any day.

### Settings
- AI backend and model selection (Claude/Gemini and specific model variant).
- Sync status and data counts.
- Manual sync triggers for activities, daily summaries, and calendar.

---

## Architecture

```
[Garmin Connect API]
        │
   garmin_sync.py  ← APScheduler (3 background jobs)
        │
   SQLite (WAL mode)
   ├── Activity  (80+ fields, laps/splits/zones as JSON)
   ├── DailySummary
   ├── GarminCalendarEvent  (races + workouts with step JSON)
   ├── Insight  (AI-generated, per activity/daily/weekly)
   ├── MetricZone  (percentile bands for dynamics metrics)
   └── SyncStatus  (key-value config/progress store)
        │
   ai_coach.py  → Anthropic / Google Generative AI
        │
   FastAPI REST API  (/api/v1)
        │
   React SPA  (TypeScript, React Query, Recharts)
```

### Key Modules

| File | Role |
|------|------|
| `app/main.py` | FastAPI init, APScheduler setup, lifespan management |
| `app/api.py` | All REST endpoints (~738 lines) |
| `app/garmin_sync.py` | Garmin auth, sync, backfill, calendar parsing (~799 lines) |
| `app/ai_coach.py` | AI analysis, prompt building, provider abstraction (~704 lines) |
| `app/models.py` | SQLAlchemy ORM models |
| `app/schemas.py` | Pydantic request/response schemas |
| `app/database.py` | DB setup, column-level migration helper, metric zone seeding |
| `app/config.py` | Env-var configuration via pydantic-settings |
| `app/routes.py` | Legacy Jinja2 routes (deprecated, still present) |
| `frontend/src/api/` | HTTP client, TypeScript types, React Query hooks |
| `frontend/src/components/` | UI components split by view (today, activity-detail, daily, layout, settings) |

### Scheduling
Three APScheduler jobs on startup:
1. **Activity sync** — every `ACTIVITY_POLL_MINUTES` minutes; new activities trigger AI analysis automatically.
2. **Daily summary sync** — daily at `DAILY_SYNC_HOUR`; triggers daily AI analysis.
3. **Weekly review** — Sundays at 8am.

### Deployment
Docker Compose: single container (multi-stage build — Node 20 for React, Python 3.12 for backend), port 8080→8000, `/data` volume for SQLite and Garmin tokens. Watchtower configured for auto-updates.

---

## Notable Gaps and Rough Edges

### No Tests
Zero test files. No pytest config, no Vitest/Jest setup. The entire backend and frontend are untested.

### Legacy Code Debt
`app/routes.py` contains ~431 lines of Jinja2 template routes under `/legacy` that duplicate the API logic and are completely superseded by the React SPA. The templates still exist in `app/templates/`. These are dead weight.

### No Athlete Profile
The AI has no knowledge of the athlete's age, goal race, fitness history, injury history, or training preferences. All context is derived from recent activity data. Insights are not personalised beyond what Garmin provides.

### No Training Plan / Prescriptive Features
The app is purely reactive — it analyses what happened. It does not generate structured training plans, assign specific upcoming workouts, or implement periodisation. The AI coaching prompt references these concepts but the app surface does not expose them.

### Workout Adherence Not Tracked
Scheduled workouts are displayed, but the app does not compare the actual activity to the planned workout (e.g., planned pace vs. actual, target intervals vs. executed).

### No Custom HR/Power Zones
Zones for running dynamics metrics are seeded at startup from percentile bands. The user cannot configure personal HR zones, power zones, or lactate threshold values. The UI displays zones but they are not athlete-specific.

### Sleep Data Not Acted On
Sleep duration and quality are synced from Garmin daily summaries and stored, but neither the UI nor the AI context builder surfaces sleep data in any meaningful analytical way.

### AI Error Handling is Thin
When an AI call fails, an error insight is saved with a generic "please retry" message. There is no retry logic, no distinction between transient and fatal errors, and no user notification beyond the insight card text.

### Garmin API Fragility
`garmin_sync.py` contains extensive field-name fallback logic (e.g., checking `stepType` vs `type`, `conditionType` vs `endCondition`) to cope with variations across Garmin API versions. This is functional but brittle and hard to reason about.

### No Data Export
No way to export activities, insights, or training logs as CSV, JSON, or PDF.

### Limited Pagination UX
Activities are paginated at 20–30 items; daily summaries at 30. The UI has next/prev navigation but no "load all" or infinite scroll. Users must manually page through history.

### Race Goal Time Extraction is Fragile
Multiple fallback mechanisms exist in `garmin_sync.py` to extract a race goal time from Garmin calendar events (`customGoal`, `completionTarget` with unit checks, dedicated fields). This suggests the Garmin API is inconsistent and the logic accumulates workarounds.

### No Dark Mode
The UI has a single light theme with no preference toggle.

### Anthropic SDK Version
`requirements.txt` pins `anthropic==0.42.0`, which is several minor versions behind current. The configured model IDs reference `claude-opus-4-7` and `claude-sonnet-4-6` which may need updating as model versions change.
