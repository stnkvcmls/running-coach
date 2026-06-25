# Running Coach — Current State

_Last updated: 2026-06-25_

A multi-user running analytics and AI-coaching app. It syncs data from Garmin
Connect, computes sports-science training metrics (training load, readiness,
critical-power thresholds, workout adherence), and layers automated AI coaching
on top — all surfaced through a mobile-first React PWA backed by a FastAPI
service. Data is per-user isolated; a single-tenant "bootstrap" deployment is
still the common case but the codebase is scoped for multiple authenticated
users.

---

## Core Features

### Garmin Sync (`app/garmin_sync.py`)
- **Activity sync** runs every N minutes (default 5), pulling recent activities
  with full detail: splits, laps, HR zones, power zones, weather, running
  dynamics, respiration, and per-sample detail streams.
- **Daily summary sync** runs once per day (default 7am) over a rolling window
  (default 3 days) so last night's overnight metrics (sleep, HRV, resting HR)
  land on the correct wake-up day and earlier days' totals finalize. Pulls
  steps, calories, HR, sleep + sleep score, stress, body battery, intensity
  minutes, floors, and HRV.
- **Calendar sync** pulls Garmin calendar events — scheduled workouts (with full
  step definitions) and races (distance, goal time, priority A/B/C, plus
  Garmin's projected/predicted finish times).
- **Athlete-profile sync** pulls Garmin-side athlete data (name, DOB, weight,
  lactate-threshold HR) on the daily job and at startup. Name/DOB/weight are
  Garmin-managed and not user-editable.
- **Historical backfill** runs in a background thread on startup: all past
  activities and ~365 days of daily summaries, then an initial weekly review.
- **Per-user credentials & MFA**: each user connects their own Garmin account
  from Settings. Passwords are stored as Fernet ciphertext (`app/crypto.py`);
  OAuth tokens live on disk under `{garmin_token_dir}/{user_id}/`. The connect
  flow supports an interactive MFA challenge/response. A background sync that
  can't authenticate flags the user `needs_reauth` (a cron can't answer MFA) and
  the Settings UI surfaces a "Reconnect" action.

### Push Workouts to Garmin (`app/workout_translator.py`)
- Translates a `TrainingPlanDay` into a Garmin structured-workout JSON payload
  (warmup / interval / repeat / recovery / cooldown steps with pace targets) and
  uploads + schedules it on the watch for the plan day's date. Rest/cross days
  are rejected. Pace targets anchor to the athlete's threshold pace.

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
  Estimates can be reviewed and selectively applied to the athlete profile.
- A **Performance Curve** endpoint exposes the fitted power/pace curves plus
  race-time predictions derived from the critical-velocity / D' model.
- Estimates are cached in `SyncStatus` keyed on a data fingerprint to avoid
  refitting on every request.

### Training Load & Readiness (`app/training_load.py`)
- **PMC / training-load model**: daily CTL (Fitness, 42d EWMA), ATL (Fatigue, 7d
  EWMA), and TSB (Form = CTL − ATL) derived from per-activity TSS, plus ACWR and
  ramp-rate-based injury-risk flags.
- TSS uses stored power-based TSS when present, else estimated rTSS (pace),
  hrTSS (HR), or a duration-only floor — so non-power runs still contribute.
- **Readiness score** (0–100): weighted composite of sleep (duration + Garmin
  sleep score), recovery (stress + body battery), fatigue (ATL), resting-HR
  trend, and an HRV component, with graceful handling of missing inputs.
- Load series is cached in `SyncStatus` on a fingerprint of the activity history.

### Intensity Distribution (`app/intensity.py`)
- Aggregates weekly time-in-zone (HR or power) from stored zone JSON or
  recomputed from streams, and derives a polarization/distribution summary that
  feeds both the Trends UI and the AI context.

### Workout Adherence (`app/adherence.py`)
- Parses Garmin workout step definitions (including nested repeat blocks) and
  compares a completed activity against its planned workout: planned vs actual
  distance, pace delta, interval/lap alignment, and a 0–100 adherence score.
- Adherence is rendered in the UI and folded into the AI coaching context.

### AI Coaching (`app/ai_coach.py`)
- **Multi-provider**: Claude (Opus 4.8 / 4.7, Sonnet 4.6, Haiku 4.5) and Google
  (Gemini 2.5/3.x Flash variants, Gemma). Provider/model are selectable from the
  UI, validated against the catalog in `app/config.py`, and persisted per user in
  `SyncStatus`.
- **Automated analysis**: every new activity or daily summary triggers an AI
  insight built from rich context — recent activities, weekly volume, recovery
  metrics, training load, readiness, intensity distribution, adherence, athlete
  profile, custom zones, threshold estimates, and upcoming races/workouts.
- **Feedback-driven re-analysis**: rate an activity good/bad, attach setback
  tags, and add free text; re-analysis incorporates the feedback.
- **AI training-plan generation**: produces a periodized 4-week plan (phase,
  weekly themes, per-day target workouts/paces, strength & cross sessions) stored
  as `TrainingPlan` + `TrainingPlanDay`, regenerated weekly (Sundays 9am) and on
  demand. Plan generation folds in adherence to the prior plan.
- **Plan realignment**: detects when enough scheduled sessions have been missed
  and prompts the user to regenerate (or dismiss the banner for 7 days).
- **Weekly review**: training summary with recommendations every Sunday 8am.
- **Robust error handling**: transient vs fatal error classification with
  exponential-backoff retries; on failure a tailored error insight is saved so
  the UI can prompt a re-analyze.

### Frontend (React 19 PWA)
Mobile-first SPA with bottom navigation and an expandable calendar. Routes:
- **Today** — selected day's activities, daily summary, scheduled workouts,
  readiness card, week overview, training-load chart, race countdowns, insights.
- **Activities** list + **Activity Detail** — 80+ metrics, running dynamics with
  zone indicators, power metrics, interactive charts (HR/pace/cadence/elevation/
  power zones), laps table, route map, adherence card, AI insight + feedback
  prompt, setback modal.
- **Daily summaries** list + detail.
- **Trends** — wellness (sleep/stress/body battery/RHR), intensity distribution,
  and performance-curve views.
- **Plan** + **Plan Setup** — the AI-generated plan plus a guided setup flow
  (bottom-sheet pickers for volume, difficulty, ability, elevation, mileage,
  schedule, race times) writing structured plan preferences to the profile.
- **Workout detail** — scheduled workout step breakdown.
- **Settings** — AI backend/model selection, athlete profile, Garmin connect/MFA/
  reconnect, custom zone configuration, threshold-estimate review/apply, sync
  status, manual sync, data export.
- **Onboarding** — first-run flow when no athlete profile exists yet.
- **Info** — contextual stat-explanation pages.
- **Dark/light theme** toggle persisted to `localStorage`. PWA manifest +
  service worker under `static/`.

### Data Export
- `GET /api/v1/export/activities` and `/export/insights` (CSV or JSON).

---

## Architecture

```
[Garmin Connect API]
        │
   garmin_sync.py  ← APScheduler (4 background jobs + startup backfill)
        │
   SQLite (WAL mode)   — every data row scoped by user_id
   ├── User                (identity + per-user Garmin credentials/flags)
   ├── Activity            (80+ fields; laps/splits/zones/streams/mean-max as JSON)
   ├── DailySummary        (steps, sleep, stress, body battery, HRV, …)
   ├── GarminCalendarEvent (races + workouts with step JSON)
   ├── Race                (manually-tracked races)
   ├── Insight             (AI-generated: activity / daily / weekly / plan)
   ├── AthleteProfile      (per-user: DOB, weight, thresholds, plan preferences)
   ├── ZoneConfig          (threshold-anchored HR/pace/power zones)
   ├── MetricZone          (percentile bands for running-dynamics metrics)
   ├── TrainingPlan / TrainingPlanDay  (AI-generated periodized plan)
   └── SyncStatus          (per-user key-value: progress, AI config, caches)
        │
   streams · threshold · training_load · adherence · intensity  (analytics)
   workout_translator (plan day → Garmin structured workout)
        │
   ai_coach.py  → Anthropic / Google Generative AI  (retry + provider dispatch)
        │
   FastAPI REST API (/api/v1, auth dependency) + SPA catch-all
        │
   React PWA  (TypeScript, React Router, React Query, Recharts)
```

### Authentication & Multi-User
- `app/auth.py` resolves the request user. With `auth_enabled=True`, it verifies
  a **Cloudflare Access JWT** (`Cf-Access-Jwt-Assertion`) against the team's JWKS
  and upserts a `User` by email claim. With `auth_enabled=False` (dev/CI) it
  falls back to a synthetic dev user, so local runs and the test suite work
  without Cloudflare.
- All API queries and compute paths are scoped by `user_id`; `DEFAULT_USER_ID = 1`
  is the bootstrap account that unscoped/test writes default to. The scheduler
  fans each job out across all Garmin-connected users, isolating per-user
  failures.

### Key Modules

| File | Role |
|------|------|
| `app/main.py` | FastAPI init, APScheduler (4 jobs), lifespan, backfill, SPA catch-all, malloc-trim memory management |
| `app/api.py` | All REST endpoints (~1380 lines), auth-gated router |
| `app/auth.py` | Cloudflare Access JWT verification + user resolution |
| `app/garmin_sync.py` | Garmin auth/MFA, sync, backfill, calendar/profile parsing, push-to-Garmin |
| `app/ai_coach.py` | AI analysis, context building, plan generation, realignment, provider dispatch, retry |
| `app/workout_translator.py` | TrainingPlanDay → Garmin structured-workout JSON |
| `app/streams.py` | Detail-stream parsing, GAP, mean-maximal curves |
| `app/threshold.py` | Critical Power / CV / LTHR estimation, performance curve, race prediction |
| `app/training_load.py` | CTL/ATL/TSB, ACWR, readiness scoring |
| `app/intensity.py` | Weekly time-in-zone aggregation + polarization |
| `app/adherence.py` | Workout step parsing + planned-vs-actual adherence |
| `app/crypto.py` | Fernet encryption for stored Garmin passwords |
| `app/models.py` | SQLAlchemy ORM models (all user-scoped) |
| `app/schemas.py` | Pydantic request/response schemas |
| `app/database.py` | DB/session setup, Alembic bootstrap, zone seeding |
| `app/config.py` | Env-var config (pydantic-settings) + `AVAILABLE_MODELS` catalog |
| `frontend/src/api/` | HTTP client, TypeScript types, React Query hooks |
| `frontend/src/components/` | UI split by view (today, activities, activity-detail, daily, trends, plan, plan-setup, settings, onboarding, profile, info, layout, workout-detail) |

### Scheduling
Four APScheduler jobs, each iterating all Garmin-connected users:
1. **Activity sync** — every `ACTIVITY_POLL_MINUTES`; new activities trigger AI
   analysis; calendar sync piggybacks.
2. **Daily summary sync** — daily at `DAILY_SYNC_HOUR`; rolling window + athlete
   profile, then triggers daily AI analysis on today's summary.
3. **Weekly review** — Sundays 8am.
4. **Training-plan generation** — Sundays 9am (after the weekly review).

Plus a startup background-thread backfill (profile → activities → daily
summaries → initial weekly review), gated on bootstrap Garmin credentials.
A `malloc_trim` listener returns freed heap pages to the OS after each job to
keep RSS from pinning at its high-water mark.

### Persistence & Migrations
- SQLite in WAL mode. Schema evolution is managed by **Alembic** (6 revisions to
  date: initial schema → race predictions → per-user Garmin credentials →
  user_id data isolation → plan-preference fields → target weekly km).
  `init_db()` bootstraps/stamps via Alembic and seeds metric zones + default
  zone configs.

### Testing & CI
- **~414 backend test functions across 20 files** (`tests/`), covering
  adherence, AI coach, AI context, API endpoints/helpers, athlete profile,
  database, garmin sync/connect, main/app wiring, readiness, streams, threshold,
  training load (incl. edge cases), data isolation, workout translator, and
  utils.
- **~50 frontend vitest** cases (date/colors/formatting utils).
- `pyproject.toml` configures pytest (`pythonpath=["."]`) and coverage
  (`fail_under = 80`).
- `perf/` holds a seeded load-test harness (`test_perf_endpoints.py`,
  `seed_perf_db.py`, summary reporter) — see `docs/performance-testing.md`.
- GitHub Actions: `tests.yml` (CI), `performance.yml`, and `docker-publish.yml`
  (build & push image to GHCR).

### Deployment
Docker Compose: single multi-stage container (Node builds the React app, Python
3.12 runs the backend), `/data` volume for SQLite and Garmin tokens. Configured
via env vars / `.env` (see `.env.example`).

---

## Notable Gaps and Rough Edges

### Garmin API Fragility
`garmin_sync.py`, `adherence.py`, `streams.py`, and `workout_translator.py` carry
extensive field-name fallback logic (e.g. `stepType` vs `type`, metric-descriptor
key normalization, race goal-time extraction, hard-coded Garmin step/condition
type IDs). This copes with Garmin API variation but is brittle — a schema change
on Garmin's side can silently degrade parsing or break workout push.

### AI Plan/JSON Parsing Reliance
Training-plan generation depends on the model returning well-formed JSON that
`_parse_plan_json` can consume. There's parsing defense and fence-stripping, but
a malformed or truncated response (`max_tokens=4096`) can still produce an empty
or partial plan; on failure the whole generation returns `None` with limited
user-facing diagnostics beyond "check AI config".

### Adherence Granularity
Interval alignment exists, but adherence still leans heavily on aggregate
distance/pace/lap comparisons. A workout hitting the right totals with the wrong
internal structure can score better than it should.

### Single Bootstrap Tenant in Practice
The multi-user plumbing (auth, per-user scoping, per-user Garmin credentials) is
in place, but the common deployment is still single-tenant (the env
`GARMIN_EMAIL/PASSWORD` seeds user #1, and `auth_enabled` defaults to `False`).
Without Cloudflare Access in front, the app trusts the dev-user fallback, so a
publicly exposed instance with auth disabled would leak all data.

### Recompute Cost
Training-load and threshold series are now cached in `SyncStatus` on a data
fingerprint, but a cache miss still recomputes from the full activity history per
request rather than incrementally. Fine at personal-archive scale; redundant work
as history grows or the fingerprint changes often.

### Config / Catalog Drift
The default `ai_model` in `config.py` (`claude-sonnet-4-6`) and the per-user
DB-stored provider/model are validated against `AVAILABLE_MODELS`, but new model
IDs still require editing that catalog in code rather than configuration.

### Pagination UX
Activities and daily summaries use manual page-based paging — no infinite scroll
or "load all" for browsing long history.

### Synchronous AI on Request Paths
On-demand plan generation and re-analysis run AI calls inline (or on short-lived
daemon threads) rather than through a durable task queue, so a slow/failed
provider call blocks the request or is lost on process restart with no retry
ledger.
