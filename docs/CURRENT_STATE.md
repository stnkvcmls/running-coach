# Running Coach — Current State

_Last updated: 2026-06-19_

A single-athlete running analytics and AI-coaching app. It syncs data from
Garmin Connect, computes sports-science training metrics (training load,
readiness, thresholds, workout adherence), and layers automated AI coaching on
top, all surfaced through a mobile-first React SPA backed by a FastAPI service.

---

## Core Features

### Garmin Sync
- **Activity sync** runs every N minutes (default 5), pulling recent activities
  with full detail: splits, laps, HR zones, power zones, weather, running
  dynamics, respiration, and per-sample detail streams.
- **Daily summary sync** runs once per day (default 7am) and pulls steps,
  calories, HR, sleep, sleep score, stress, body battery, intensity minutes,
  and floors.
- **Calendar sync** pulls Garmin calendar events — scheduled workouts (with full
  step definitions) and races (distance, goal time, priority A/B/C).
- **Athlete-profile sync** pulls Garmin-side athlete data (e.g. lactate-threshold
  HR) on the daily job and at startup.
- **Historical backfill** runs in a background thread on startup: all past
  activities and the last 365 days of daily summaries, then an initial weekly
  review.
- Garmin session is token-based; credentials and tokens live in a configurable
  directory.

### Detail Streams & Mean-Maximal Curves (`app/streams.py`)
- Parses Garmin's per-sample detail payload (power, speed, HR, elevation,
  distance) into aligned stream arrays, with spike rejection and a robust time
  axis (elapsed-duration column → epoch timestamp → sample index fallback).
- Computes **grade-adjusted speed** via the Minetti running-cost model.
- Computes **mean-maximal curves** — best sustained power / GAP-speed / HR over a
  set of standard durations (5 s → 90 min) — stored compactly per activity
  (`Activity.mean_max_json`). A bounded self-healing backfill fills curves for
  activities synced before this existed.

### Threshold / Critical-Power Auto-Estimation (`app/threshold.py`)
- Fits the 2-parameter Critical Power model `P(t) = CP + W'/t` (optionally
  refined by the 3-parameter Morton model for Pmax) to the aggregated
  power-duration frontier, with recency weighting so estimates track current
  fitness.
- Estimates **threshold pace** via the analogous critical-velocity model on the
  GAP-speed frontier, and **threshold HR (LTHR)** from Garmin's value, else
  drift-corrected steady-state segments, else a fraction of max HR.
- Each field carries a method, confidence level, sample size, and guidance note.
  Estimates can be reviewed and applied to the athlete profile from the UI.

### Training Load & Readiness (`app/training_load.py`)
- **PMC / training-load model**: daily CTL (Fitness, 42d EWMA), ATL (Fatigue, 7d
  EWMA), and TSB (Form = CTL − ATL) derived from per-activity TSS.
- TSS uses stored power-based TSS when present, else estimated rTSS (pace),
  hrTSS (HR), or a duration-only floor — so non-power runs still contribute.
- **Readiness score** (0–100): weighted composite of sleep (duration + Garmin
  sleep score), recovery (stress + body battery), fatigue (ATL), and resting-HR
  trend, with graceful handling of missing components.

### Workout Adherence (`app/adherence.py`)
- Parses Garmin workout step definitions (including nested repeat blocks) and
  compares a completed activity against its planned workout: planned vs actual
  distance, pace delta, interval/lap counts, and a 0–100 adherence score.
- Adherence is rendered in the UI and folded into the AI coaching context.

### AI Coaching (`app/ai_coach.py`)
- **Multi-provider**: Claude (Opus 4.8 / 4.7, Sonnet 4.6, Haiku 4.5) and Google
  (Gemini 2.5/3.x Flash variants, Gemma). Provider and model are selectable from
  the UI and persisted in the DB.
- **Automated analysis**: every new activity or daily summary triggers an AI
  insight built from rich context — recent activities, weekly volume, recovery
  metrics, training load, readiness, adherence, athlete profile, custom zones,
  and upcoming races/workouts.
- **Feedback-driven re-analysis**: rate an activity good/bad, attach setback
  tags, and add free text; re-analysis incorporates the feedback.
- **AI training-plan generation**: produces a periodized multi-week plan (phase,
  weekly themes, per-day target workouts/paces) stored as `TrainingPlan` +
  `TrainingPlanDay`, regenerated weekly (Sundays 9am) and on demand.
- **Weekly review**: training summary with recommendations every Sunday 8am.
- **Backfill**: an endpoint generates insights for recent activities/summaries
  missing them.
- **Robust error handling**: transient vs fatal error classification with
  exponential-backoff retries; on failure a tailored error insight is saved so
  the UI can prompt a re-analyze.

### Frontend (React SPA)
Mobile-first SPA with bottom navigation and an expandable calendar. Routes:
- **Today** — selected day's activities, daily summary, scheduled workouts,
  readiness card, week overview, training-load chart, race countdowns, latest
  insights.
- **Activities** list + **Activity Detail** — 80+ metrics, running dynamics with
  zone indicators, power metrics, interactive charts (HR/pace/cadence/elevation/
  power zones), laps table, adherence card, AI insight + feedback prompt,
  setback modal.
- **Daily summaries** list + detail.
- **Wellness Trends** — sleep / stress / body battery / RHR trends over time.
- **Plan** — the AI-generated training plan.
- **Workout detail** — scheduled workout step breakdown.
- **Settings** — AI backend/model selection, athlete profile, custom zone
  configuration, threshold-estimate review/apply, sync status, manual sync.
- **Onboarding** — first-run flow when no athlete profile exists yet.
- **Dark/light theme** toggle persisted to `localStorage`.

### Data Export
- `GET /api/v1/export/activities` and `/export/insights` endpoints for exporting
  data out of the app.

---

## Architecture

```
[Garmin Connect API]
        │
   garmin_sync.py  ← APScheduler (4 background jobs + startup backfill)
        │
   SQLite (WAL mode)
   ├── Activity            (80+ fields; laps/splits/zones/streams/mean-max as JSON)
   ├── DailySummary        (steps, sleep, stress, body battery, …)
   ├── GarminCalendarEvent (races + workouts with step JSON)
   ├── Race                (manually-tracked races)
   ├── Insight             (AI-generated: activity / daily / weekly / plan)
   ├── AthleteProfile      (single-row: DOB, weight, goal race, thresholds, …)
   ├── ZoneConfig          (threshold-anchored HR/pace/power zones)
   ├── MetricZone          (percentile bands for running-dynamics metrics)
   ├── TrainingPlan / TrainingPlanDay  (AI-generated periodized plan)
   └── SyncStatus          (key-value config/progress store)
        │
   streams.py · threshold.py · training_load.py · adherence.py   (analytics)
        │
   ai_coach.py  → Anthropic / Google Generative AI  (retry + fallback)
        │
   FastAPI REST API  (/api/v1) + SPA catch-all
        │
   React SPA  (TypeScript, React Router, React Query, Recharts)
```

### Key Modules

| File | Role |
|------|------|
| `app/main.py` | FastAPI init, APScheduler (4 jobs), lifespan, SPA catch-all |
| `app/api.py` | All REST endpoints (~960 lines) |
| `app/garmin_sync.py` | Garmin auth, sync, backfill, calendar/profile parsing |
| `app/ai_coach.py` | AI analysis, prompt/context building, plan generation, provider abstraction, retry |
| `app/streams.py` | Detail-stream parsing, GAP, mean-maximal curves |
| `app/threshold.py` | Critical Power / CV / LTHR auto-estimation |
| `app/training_load.py` | CTL/ATL/TSB and readiness scoring |
| `app/adherence.py` | Workout step parsing + planned-vs-actual adherence |
| `app/models.py` | SQLAlchemy ORM models |
| `app/schemas.py` | Pydantic request/response schemas |
| `app/database.py` | DB setup, column-level migration helper, zone seeding |
| `app/config.py` | Env-var configuration via pydantic-settings |
| `frontend/src/api/` | HTTP client, TypeScript types, ~25 React Query hooks |
| `frontend/src/components/` | UI split by view (today, activities, activity-detail, daily, trends, plan, settings, onboarding, layout) |

### Scheduling
Four APScheduler jobs:
1. **Activity sync** — every `ACTIVITY_POLL_MINUTES`; new activities trigger AI
   analysis; calendar sync piggybacks.
2. **Daily summary sync** — daily at `DAILY_SYNC_HOUR`; syncs athlete profile +
   daily summary, then triggers daily AI analysis.
3. **Weekly review** — Sundays 8am.
4. **Training-plan generation** — Sundays 9am (after the weekly review).

Plus a startup background-thread backfill (profile → activities → daily
summaries → initial weekly review), gated on Garmin credentials being set.

### Testing & CI
- **~270 test functions across 16 files** (`tests/`), covering adherence,
  AI coach, AI context, API endpoints/helpers, athlete profile, database,
  garmin sync, main/app wiring, readiness, streams, threshold, training load
  (incl. edge cases), and utils.
- `pyproject.toml` configures pytest (`pythonpath=["."]`) and coverage with
  `fail_under = 80`.
- GitHub Actions: `tests.yml` (CI) and `docker-publish.yml` (build & push image
  to GHCR on every branch push).

### Deployment
Docker Compose: single multi-stage container (Node 20 builds the React app,
Python 3.12 runs the backend), port 8080→8000, `/data` volume for SQLite and
Garmin tokens. Watchtower configured for auto-updates.

---

## Notable Gaps and Rough Edges

### Single-User, No Authentication
The app is hard-wired single-athlete (`AthleteProfile` is accessed via
`.first()`) and has no auth layer. It assumes a trusted, private deployment;
exposing it publicly would leak all data and sync controls.

### Garmin API Fragility
`garmin_sync.py`, `adherence.py`, and `streams.py` carry extensive field-name
fallback logic (e.g. `stepType` vs `type`, `endCondition` vs `conditionType`,
metric-descriptor key normalization, race goal-time extraction). This is
necessary to cope with Garmin API variation but is brittle and the workarounds
accumulate. A Garmin schema change can silently degrade parsing.

### AI Plan/JSON Parsing Reliance
Training-plan generation depends on the model returning well-formed JSON that
`_parse_plan_json` can consume. There's parsing defense, but a malformed or
truncated model response (max_tokens is modest) can still produce an empty or
partial plan with limited user-facing diagnostics.

### Adherence is Coarse
Adherence compares whole-activity averages (total distance, average pace, lap
count) against the plan. It does not align executed laps to specific planned
interval steps, so a workout hitting the right total but wrong structure can
still score well.

### Hard-Coded Model Catalog
The selectable AI model list lives inline in `app/api.py`. New model IDs require
a code change rather than configuration.

### Pagination UX
Activities/daily summaries use manual next/prev paging — no infinite scroll or
"load all" for browsing long history.

### Estimation Cost / Recompute
Training-load and threshold series are recomputed from the full activity history
per request rather than cached/incrementalized. Fine at personal-archive scale,
but it does redundant work as history grows.

### Config Surface
`config.py` exposes a small set of env vars; the default `ai_model` there
(`claude-sonnet-4-6`) and the DB-stored provider/model can drift from the
catalog in `api.py`. There's no validation that a configured model is in the
allowed list.

### Single Database, No Migration Framework
Schema evolution relies on a hand-rolled column-add helper in `database.py`
rather than a migration tool (e.g. Alembic). This works for additive changes but
offers no down-migrations, renames, or data backfills.
