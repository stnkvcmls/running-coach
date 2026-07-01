# Running Coach — Current State

_Last updated: 2026-07-01_

A multi-user running analytics and AI-coaching app. It syncs data from Garmin
Connect, computes sports-science training metrics (training load, readiness,
critical-power thresholds, aerobic durability, workout adherence), and layers
automated **and conversational** AI coaching on top — all surfaced through a
mobile-first React PWA backed by a FastAPI service. Data is per-user isolated; a
single-tenant "bootstrap" deployment is still the common case but the codebase is
scoped for multiple authenticated users.

The v3 improvement plan and the follow-on **v4 plan** (`docs/IMPROVEMENT_PLAN.md`,
phases P0–P3) are now essentially fully delivered. On top of the v3 baseline
(conversational coach, aerobic decoupling/efficiency factor, race-day pacing,
structured-output plan generation, a durable AI task queue, a strength routine
library, incremental load/threshold compute, a startup security guard, a
config-driven model catalog, a schema-drift canary, infinite-scroll history), the
app now also ships: **weather-adjusted pace & heat-aware coaching**, a coach that
**acts on the conversation** (chat tool-use), **daily readiness-driven workout
adaptation**, **terrain/GAP-aware race pacing**, **persistent athlete memory**,
**fuelling & hydration guidance**, **season-long periodization**, per-week
**strength progression with demo links**, and **user-defined custom charts**.

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
- **Schema-drift canary**: declared field contracts (`_ACTIVITY_SUMMARY_CONTRACT`
  etc.) plus a `check_payload_fields` health surface flag when Garmin renames or
  drops fields, so the silent `.get()` fallbacks can't corrupt synced data
  unnoticed. Guarded by contract/snapshot tests over recorded fixtures
  (`tests/test_garmin_schema_canary.py`).
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
- The same translator path is reused to push a **race-day pacing plan** to the
  watch as a structured pace workout (`POST /races/{id}/pacing/push`).

### Detail Streams, Mean-Maximal Curves & Aerobic Coupling (`app/streams.py`)
- Parses Garmin's per-sample detail payload (power, speed, HR, elevation,
  distance) into aligned stream arrays, with spike rejection and a robust time
  axis (elapsed-duration column → epoch timestamp → sample index fallback).
- Computes **grade-adjusted speed** via the Minetti running-cost model.
- Computes **mean-maximal curves** — best sustained power / GAP-speed / HR over a
  set of standard durations (5 s → 90 min) — stored compactly per activity
  (`Activity.mean_max_json`). A bounded self-healing backfill fills curves for
  activities synced before this existed.
- Computes **aerobic decoupling** (`Activity.decoupling_pct` — Pa:HR drift between
  the first and second half of an effort) and **efficiency factor**
  (`Activity.efficiency_factor` — GAP-speed per bpm) from the aligned pace/power +
  HR streams. Both surface on Activity Detail, drive an `/aerobic-trends`
  endpoint, and feed a one-line aerobic-durability read into the AI context.

### Weather-Adjusted Pace & Heat Coaching (`app/weather.py`)
- Derives a **heat/humidity pace penalty** (sec/km) from stored Garmin activity
  weather using a temp + dew-point model (Ely et al. 2007). Garmin returns
  temp/dew point in Fahrenheit regardless of locale; the module converts to
  Celsius before applying the model.
- Surfaces a "cool-equivalent effort" pace and a plain-language note on Activity
  Detail (`weather_adjusted_pace_min_km`, `weather_penalty_sec_per_km`,
  `weather_description`), and feeds a heat read into the AI activity context.
- A `recent_heat_stress` signal (any of the last 3 weathered runs in the past 7
  days carrying a notable penalty) scales fuelling fluid targets for upcoming
  long runs where no direct weather reading exists yet.

### Fuelling & Hydration Guidance (`app/nutrition.py`)
- For efforts ≥ 60 min, derives **carb-per-hour and fluid-per-hour targets**
  (plus totals) from duration, intensity (easy long vs race), athlete body
  weight, and recent heat exposure. Consensus endurance-nutrition model: carbs
  30 → 60 → 90 g/hr by duration (+15 at race intensity), fluid ~6.5 mL/kg/hr
  (+15% under recent heat stress).
- Rendered on the long-run / race-week surfaces and folded into the AI context
  (`fuelling_guidance` on the scheduled-workout and calendar-event responses).

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
- Estimates are cached in `SyncStatus` keyed on a data fingerprint, and the
  CP/CV fit is computed **incrementally** rather than refit from full history on
  every cache miss.

### Race-Day Pacing Strategy (`app/pacing.py`)
- Given a target finish time and race distance, generates a split-by-split
  pacing plan in km or mile units, each split carrying target pace, split time,
  and cumulative totals. Three strategies:
  - **even** and **negative-split** (first half 2% slower, second 2% faster, net
    time preserved), and
  - **terrain / GAP-aware** — given a course elevation profile, interpolates the
    grade per split and grade-adjusts each split's target so effort (not pace)
    stays even, carrying a per-split `grade_pct`.
- Anchored to the CP/CV race prediction from `get_performance_curve_data` for a
  reference time, exposed via `GET /races/{id}/pacing`, and optionally pushable
  to the watch.

### Training Load & Readiness (`app/training_load.py`)
- **PMC / training-load model**: daily CTL (Fitness, 42d EWMA), ATL (Fatigue, 7d
  EWMA), and TSB (Form = CTL − ATL) derived from per-activity TSS, plus ACWR and
  ramp-rate-based injury-risk flags.
- TSS uses stored power-based TSS when present, else estimated rTSS (pace),
  hrTSS (HR), or a duration-only floor — so non-power runs still contribute.
- The daily series is **persisted incrementally** in `DailyLoadSeries`: only rows
  from the earliest newly-synced ("dirty") date are deleted and recomputed, so
  the EWMA carries forward without re-scanning the full activity history.
- **Readiness score** (0–100): weighted composite of sleep (duration + Garmin
  sleep score), recovery (stress + body battery), fatigue (ATL), resting-HR
  trend, and an HRV component, with graceful handling of missing inputs.
- The TSB / Running Stress Balance state feeds explicit form guidance into the AI
  context (fresh / neutral / fatigued bands).

### Daily Readiness-Driven Plan Adaptation (`app/plan_adaptation.py`)
- Closes the loop between the readiness score and the static `TrainingPlanDay`
  prescription. Purely rule-based (readiness bands × workout type):
  - a **hard day** (tempo/interval/long) at Low readiness (≤30) is downgraded to
    rest; at Fair readiness (≤50) it's swapped to an easy effort at ~60% distance;
  - an **easy day** at Excellent readiness (≥86) gets a small upgrade nudge
    (strides / a modest distance bump, capped).
- Surfaced on Today as a `PlanAdaptationCard` and applied via
  `POST /training-plan/adapt-day`.

### Intensity Distribution (`app/intensity.py`)
- Aggregates weekly time-in-zone (HR or power) from stored zone JSON or
  recomputed from streams, and derives a polarization/distribution summary that
  feeds both the Trends UI and the AI context.

### Workout Adherence (`app/adherence.py`)
- Parses Garmin workout step definitions (including nested repeat blocks) and
  compares a completed activity against its planned workout: planned vs actual
  distance, pace delta, interval/lap alignment, per-rep deltas, and a 0–100
  adherence score.
- Adherence is rendered in the UI and folded into the AI coaching context.

### Strength & Mobility Routines (`app/strength_routines.py`)
- A static library of strength/mobility routines (running-base, hip-glute,
  lower-leg, core-stability, mobility-recovery, full-body), each with focus,
  duration, structured sets/reps/cues, and **per-exercise demo links**.
- The plan generator picks a routine per strength day; the slug is stored on
  `TrainingPlanDay.routine_id` and hydrated into a concrete session at response
  time, with **per-week progression** across the plan (`GET /strength-routines`,
  plan/workout-detail views).

### Season-Long Periodization (`app/season_plan.py`)
- A **deterministic, rule-based** (no AI call) periodization skeleton to the
  athlete's goal race: selects the goal race (nearest upcoming A-priority Garmin
  race → any upcoming race → profile goal-race date), then splits the weeks
  between now and the race into phase blocks — **base / build / peak / taper /
  race / recovery** — with a target weekly volume per week (baseline → peak ramp
  with cutback weeks, category-specific taper and post-race recovery).
- Persisted as `SeasonPlan` + `SeasonPlanWeek`, regenerated when the goal race
  changes (`ensure_season_plan`). Exposed via `GET /season-plan` (rendered as a
  `SeasonTimeline`) and **injected into the plan-generation AI context** so the
  rolling 4-week generator fills in a season-long skeleton rather than working
  week-to-week.

### AI Coaching (`app/ai_coach.py`)
- **Multi-provider**: Claude (Opus 4.8 / 4.7, Sonnet 4.6, Haiku 4.5) and Google
  (Gemini / Gemma variants). Provider/model are selectable from the UI, validated
  against the catalog (sourced from `Settings.available_models`, overridable via
  the `AVAILABLE_MODELS` env var), and persisted per user in `SyncStatus`.
- **Conversational coach (chat)**: a multi-turn chat surface where the athlete can
  ask "why this workout?", negotiate changes, or flag a niggle. `chat_stream`
  reuses `_build_context` for a per-user system block and runs the message history
  through the provider dispatch, **streaming tokens over SSE** (`POST /chat`).
  Turns persist in `ChatMessage` (up to 20 prior turns of context), can be tied to
  a specific activity, and are cleared via `DELETE /chat`.
- **Chat tool-use (the coach acts, not just talks)**: the chat model may call at
  most one tool per turn — e.g. `regenerate_plan`, `adjust_upcoming_week` (for a
  specific stated reason like travel/illness), or recording an athlete fact to
  memory. `_dispatch_chat_tool` executes the action, feeds a grounded result back
  to the model, and streams a small public `action` object to the client (also
  persisted as `ChatMessage.actions_json`) so the UI can show what changed.
- **Persistent athlete memory** (`CoachMemory`): durable structured facts —
  niggles, life constraints, preferences — recorded either by the athlete
  directly (Settings → Coach Memory) or by the coach via chat tool-use. Active
  entries are injected into every AI context until resolved/deleted (capped per
  turn), so the coach remembers across sessions rather than only the last few
  turns. CRUD via `/coach-memory`.
- **Automated analysis**: every new activity or daily summary triggers an AI
  insight built from rich context — recent activities, weekly volume, recovery
  metrics, training load / RSB, readiness, intensity distribution, adherence,
  aerobic decoupling, weather/heat, athlete profile, custom zones, threshold
  estimates, coach memory, season skeleton, and upcoming races/workouts.
- **Feedback-driven re-analysis**: rate an activity good/bad, attach setback
  tags, and add free text; re-analysis incorporates the feedback.
- **AI training-plan generation**: produces a periodized 4-week plan (phase,
  weekly themes, per-day target workouts/paces, strength & cross sessions with
  routine IDs) stored as `TrainingPlan` + `TrainingPlanDay`, regenerated weekly
  (Sundays 9am) and on demand. Generation uses provider **structured output**
  (tool schema / `response_schema`) with fence-stripping as a fallback, so a
  malformed/truncated response can't silently yield an empty plan. Folds in
  adherence to the prior plan and the season skeleton.
- **Plan realignment**: detects when enough scheduled sessions have been missed
  and prompts the user to regenerate (or dismiss the banner for 7 days).
- **Weekly review**: training summary with recommendations every Sunday 8am.
- **Durable execution**: on-demand analysis, feedback re-analysis, and plan
  generation are **enqueued as `AIJob` rows** rather than run inline or on daemon
  threads. An APScheduler worker polls the ledger every 30 s, claims up to 5
  pending jobs (pending → running → done|failed), and retries up to
  `max_attempts`. The frontend polls `GET /jobs/{id}` for "analysis in progress"
  states.
- **Robust error handling**: transient vs fatal error classification with
  exponential-backoff retries; on failure a tailored error insight is saved so
  the UI can prompt a re-analyze.

### Frontend (React 19 PWA)
Mobile-first SPA with bottom navigation and an expandable calendar. Routes:
- **Today** — selected day's activities, daily summary, scheduled workouts,
  readiness card, plan-adaptation suggestion card, week overview, training-load
  chart, race countdowns, insights.
- **Activities** list (infinite scroll) + **Activity Detail** — 80+ metrics,
  running dynamics with zone indicators, power metrics, aerobic decoupling /
  efficiency factor, weather-adjusted pace, interactive charts
  (HR/pace/cadence/elevation/power zones), laps table, route map, adherence card,
  AI insight + feedback prompt, setback modal.
- **Daily summaries** list (infinite scroll) + detail.
- **Trends** — wellness (sleep/stress/body battery/RHR), intensity distribution,
  aerobic trends, performance-curve views, and a **user-defined custom-chart
  builder**.
- **Chat** — conversational coach with streamed responses, persisted history, and
  rendered coach actions.
- **Plan** + **Plan Setup** — the AI-generated plan (with hydrated strength
  routines), a **season timeline**, plus a guided setup flow (bottom-sheet pickers
  for volume, difficulty, ability, elevation, mileage, schedule, race times)
  writing structured plan preferences to the profile.
- **Workout detail** — scheduled workout step breakdown, strength routines with
  demo links, fuelling guidance.
- **Settings** — AI backend/model selection, athlete profile, Garmin connect/MFA/
  reconnect, custom zone configuration, threshold-estimate review/apply, coach
  memory, sync status, manual sync, data export.
- **Onboarding** — first-run flow when no athlete profile exists yet.
- **Info** — contextual stat-explanation pages.
- **Dark/light theme** toggle persisted to `localStorage`. PWA manifest +
  service worker under `static/`.

### User-Defined Custom Charts
- `GET /custom-charts/metrics` exposes the queryable metric catalog (activity and
  daily-summary fields); `GET /custom-charts/data` returns a series for a chosen
  metric/aggregation/window, rendered by `CustomChartsView` — an Intervals.icu-
  style builder over the athlete's own data.

### Data Export
- `GET /api/v1/export/activities` and `/export/insights` (CSV or JSON).

---

## Architecture

```
[Garmin Connect API]
        │
   garmin_sync.py  ← APScheduler (5 background jobs + startup backfill)
        │
   SQLite (WAL mode)   — every data row scoped by user_id
   ├── User                (identity + per-user Garmin credentials/flags)
   ├── Activity            (80+ fields; laps/splits/zones/streams/mean-max/decoupling/weather)
   ├── DailySummary        (steps, sleep, stress, body battery, HRV, …)
   ├── DailyLoadSeries     (persisted per-day CTL/ATL/TSB for incremental compute)
   ├── GarminCalendarEvent (races + workouts with step JSON)
   ├── Race                (manually-tracked races)
   ├── Insight             (AI-generated: activity / daily / weekly / plan)
   ├── ChatMessage         (multi-turn coach conversation + actions_json)
   ├── CoachMemory         (durable athlete facts: niggle/constraint/preference/note)
   ├── AIJob               (durable AI task ledger)
   ├── AthleteProfile      (per-user: DOB, weight, thresholds, plan preferences)
   ├── ZoneConfig          (threshold-anchored HR/pace/power zones)
   ├── MetricZone          (percentile bands for running-dynamics metrics)
   ├── TrainingPlan / TrainingPlanDay  (AI-generated periodized plan + routine_id)
   ├── SeasonPlan / SeasonPlanWeek     (deterministic season-long periodization)
   └── SyncStatus          (per-user key-value: progress, AI config, caches)
        │
   streams · threshold · training_load · adherence · intensity · pacing  (analytics)
   weather · nutrition · plan_adaptation · season_plan  (rule-based coaching helpers)
   strength_routines (routine library) · workout_translator (plan day → Garmin workout)
        │
   ai_coach.py  → Anthropic / Google Generative AI  (retry + provider dispatch + chat SSE + tool-use)
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
- A **startup security guard** (`_check_security_config` in `app/main.py`) logs a
  prominent `CRITICAL` warning and **refuses to start** when `auth_enabled=False`
  and `bind_host` is not a loopback address — the case where an unauthenticated
  instance would be publicly readable/writable. `ALLOW_INSECURE_BIND=true` opts
  out of the refusal (warning still logs) for trusted, firewalled networks.
- All API queries and compute paths are scoped by `user_id`; `DEFAULT_USER_ID = 1`
  is the bootstrap account that unscoped/test writes default to. The scheduler
  fans each job out across all Garmin-connected users, isolating per-user
  failures.

### Key Modules

| File | Role |
|------|------|
| `app/main.py` | FastAPI init, APScheduler (5 jobs), lifespan, backfill, security guard, SPA catch-all, malloc-trim memory management |
| `app/api.py` | All REST endpoints (~2200 lines, ~53 routes), auth-gated router |
| `app/auth.py` | Cloudflare Access JWT verification + user resolution |
| `app/garmin_sync.py` | Garmin auth/MFA, sync, backfill, calendar/profile parsing, schema canary, push-to-Garmin |
| `app/ai_coach.py` | AI analysis, context building, plan generation (structured output), chat streaming + tool-use, coach memory injection, job ledger execution, provider dispatch, retry |
| `app/workout_translator.py` | TrainingPlanDay / pacing plan → Garmin structured-workout JSON |
| `app/streams.py` | Detail-stream parsing, GAP, mean-maximal curves, aerobic decoupling / efficiency factor |
| `app/threshold.py` | Critical Power / CV / LTHR estimation, performance curve, race prediction (incremental) |
| `app/training_load.py` | CTL/ATL/TSB, ACWR, readiness scoring, incremental daily series |
| `app/pacing.py` | Race-day split-by-split pacing (even / negative-split / terrain-GAP) |
| `app/weather.py` | Heat/humidity pace penalty from activity weather |
| `app/nutrition.py` | Carb/fluid fuelling targets for long runs & races |
| `app/plan_adaptation.py` | Readiness-band × workout-type daily plan-day adaptation |
| `app/season_plan.py` | Deterministic season-long periodization skeleton |
| `app/intensity.py` | Weekly time-in-zone aggregation + polarization |
| `app/adherence.py` | Workout step parsing + planned-vs-actual (incl. per-rep) adherence |
| `app/strength_routines.py` | Static strength/mobility routine library (+ demo links) for plan days |
| `app/crypto.py` | Fernet encryption for stored Garmin passwords |
| `app/models.py` | SQLAlchemy ORM models (all user-scoped) |
| `app/schemas.py` | Pydantic request/response schemas |
| `app/database.py` | DB/session setup, Alembic bootstrap, zone seeding |
| `app/config.py` | Env-var config (pydantic-settings) + `available_models` catalog |
| `frontend/src/api/` | HTTP client, TypeScript types, React Query hooks |
| `frontend/src/components/` | UI by view (today, activities, activity-detail, daily, trends, chat, plan, plan-setup, settings, onboarding, profile, info, layout, workout-detail) |

### Scheduling
Five APScheduler jobs (the first four iterate all Garmin-connected users):
1. **Activity sync** — every `ACTIVITY_POLL_MINUTES`; new activities trigger AI
   analysis; calendar sync piggybacks.
2. **Daily summary sync** — daily at `DAILY_SYNC_HOUR`; rolling window + athlete
   profile, then triggers daily AI analysis on today's summary.
3. **Weekly review** — Sundays 8am.
4. **Training-plan generation** — Sundays 9am (after the weekly review).
5. **AI job worker** — every 30 s; claims and executes pending `AIJob` rows.

Plus a startup background-thread backfill (profile → activities → daily
summaries → initial weekly review), gated on bootstrap Garmin credentials.
A `malloc_trim` listener returns freed heap pages to the OS after each job to
keep RSS from pinning at its high-water mark.

### Persistence & Migrations
- SQLite in WAL mode. Schema evolution is managed by **Alembic** (15 revisions to
  date: initial schema → race predictions → per-user Garmin credentials →
  user_id data isolation → plan-preference fields → target weekly km → chat
  messages → aerobic metrics → stride cm→m fix → AI jobs → daily load series →
  routine_id on plan days → chat actions JSON → coach memory → season plan).
  `init_db()` bootstraps/stamps via Alembic and seeds metric zones + default
  zone configs.

### Testing & CI
- **~745 backend test functions across 31 test files** (`tests/`), covering
  adherence, AI coach, AI context, API endpoints/helpers, athlete profile, auth,
  coach memory, config, custom charts, database, data isolation, garmin
  sync/connect, the schema-drift canary, the AI job queue, intensity, main/app
  wiring, nutrition, pacing, plan adaptation, readiness, season plan, streams,
  strength routines, threshold, training load (incl. edge cases), weather, the
  workout translator, and utils.
- **~57 frontend vitest** cases (date/colors/formatting/pagination utils).
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

### Garmin API Fragility (monitored, not eliminated)
`garmin_sync.py`, `adherence.py`, `streams.py`, `weather.py`, and
`workout_translator.py` still carry extensive field-name fallback logic (e.g.
`stepType` vs `type`, metric-descriptor key normalization, race goal-time
extraction, `temp`/`dewPoint` spelling variants, the undocumented Fahrenheit
weather units, hard-coded Garmin step/condition type IDs). The schema-drift
canary raises an alarm when contracted fields disappear, but a Garmin change
*within* a tolerated field (units, nesting, semantics) can still silently degrade
parsing.

### Rule-Based Coaching Helpers Are Heuristic, Not Personalized
Weather pace adjustment, fuelling/hydration, readiness-driven adaptation, and the
season skeleton are all fixed-formula models from published consensus (Ely heat
model, generic carb/fluid ramps, readiness bands, 45/35/20 phase split). They're
deliberately deterministic and cheap, but they don't yet learn an individual's
heat tolerance, gut tolerance, or historical response — the numbers are
population averages nudged by a few profile fields.

### Fatigue Resistance: Reframed as the Aerobic Efficiency Trend
The originally-specced Garmin Endurance Score / Stryd durability analogue
(comparing late-effort mean-maximal curves against the fresh curve) was
**redesigned** rather than built as specced. Fatigue-resistance is instead
surfaced through the **aerobic efficiency trend** — per-activity aerobic
decoupling (`Activity.decoupling_pct`) and efficiency factor
(`Activity.efficiency_factor`) tracked over time via `/aerobic-trends` and the
Trends UI. This reads "can you hold it?" from within-effort drift and economy
rather than from a separate endurance index, so a discrete durability score is
intentionally absent.

### Season Plan Is a Skeleton, Not Detailed Sessions
`season_plan.py` produces phase + target-weekly-volume per week; it does **not**
prescribe individual workouts. Detailed sessions still come from the rolling
4-week AI generator, which now consumes the skeleton as context. The two can
drift if the AI plan diverges from the skeleton's targets, and there's no
reconciliation pass that flags such divergence.

### Single Bootstrap Tenant in Practice
The multi-user plumbing (auth, per-user scoping, per-user Garmin credentials) is
in place, and a startup guard refuses to start on unauthenticated public binds
(opt-out via `ALLOW_INSECURE_BIND=true`), but the common deployment is still
single-tenant (env `GARMIN_EMAIL/PASSWORD` seeds user #1, and `auth_enabled`
defaults to `False`).

### AI Output Still Model-Dependent
Plan generation uses structured output with a fence-stripping fallback, chat
tool-use forces schema-valid actions, and the job queue retries failures — but
chat and analysis quality still depend on the configured provider/model, and a
provider outage surfaces as a failed `AIJob` / error insight rather than a
degraded-but-useful result.

### Recompute Cost (reduced, not gone)
Training-load and CP/CV persist incrementally, so steady-state syncs are cheap.
But a fingerprint change or a backdated activity still forces recompute from the
earliest dirty date forward, and some endpoints (custom charts, aerobic trends,
season plan) recompute derived series per request rather than reading a fully
materialized cache.
