# Running Coach

A self-hosted running analytics and AI-coaching app. It syncs your data from
**Garmin Connect**, computes sports-science training metrics (training load,
readiness, critical-power thresholds, workout adherence), and layers automated
**AI coaching** on top — all surfaced through a mobile-first React PWA backed by
a FastAPI service.

Data is isolated per user. A single-tenant "bootstrap" deployment (one Garmin
account from environment variables) is the common case, but the codebase is
fully scoped for multiple authenticated users behind Cloudflare Access.

---

## Features

### Garmin sync
- **Activity sync** every N minutes (default 5): recent activities with full
  detail — splits, laps, HR/power zones, weather, running dynamics, respiration,
  and per-sample detail streams.
- **Daily summary sync** once per day (default 7am) over a rolling window so
  last night's overnight metrics (sleep, HRV, resting HR) land on the correct
  wake-up day. Pulls steps, calories, HR, sleep + sleep score, stress, body
  battery, intensity minutes, floors, and HRV.
- **Calendar sync** for scheduled workouts (with step definitions) and races
  (distance, goal time, A/B/C priority, Garmin's projected finish times).
- **Athlete-profile sync** (name, DOB, weight, lactate-threshold HR).
- **Historical backfill** on startup in a background thread: all past activities
  and ~365 days of daily summaries, then an initial weekly review.
- **Per-user credentials & MFA**: each user connects their own Garmin account
  from Settings. Passwords are stored as Fernet ciphertext; OAuth tokens live on
  disk per user. Interactive MFA is supported; a background sync that can't
  authenticate flags the user for re-auth and the UI surfaces a "Reconnect".

### Analytics
- **Detail streams & mean-maximal curves** (`app/streams.py`): aligned
  power/speed/HR/elevation/distance streams, grade-adjusted speed via the
  Minetti running-cost model, and best-sustained efforts over standard durations
  (5 s → 90 min).
- **Threshold / critical-power estimation** (`app/threshold.py`): fits the
  2-parameter Critical Power model (`P(t) = CP + W'/t`) plus critical-velocity
  for threshold pace and LTHR estimation, with confidence levels and a
  performance-curve + race-prediction endpoint.
- **Training load & readiness** (`app/training_load.py`): a PMC model (CTL/ATL/
  TSB), ACWR and ramp-rate injury-risk flags, per-activity TSS (power → pace →
  HR → duration fallback), and a 0–100 readiness score from sleep, recovery,
  fatigue, resting-HR trend, and HRV.
- **Intensity distribution** (`app/intensity.py`): weekly time-in-zone and a
  polarization summary.
- **Workout adherence** (`app/adherence.py`): planned-vs-actual distance, pace,
  and interval alignment with a 0–100 adherence score.

### AI coaching (`app/ai_coach.py`)
- **Multi-provider**: Anthropic Claude (Opus / Sonnet / Haiku) and Google
  (Gemini / Gemma), selectable per user and validated against the catalog in
  `app/config.py`.
- **Automated analysis** of every new activity and daily summary, built from
  rich context (recent activities, volume, recovery, training load, readiness,
  intensity, adherence, profile, thresholds, upcoming races/workouts).
- **Feedback-driven re-analysis**: rate an activity, tag setbacks, add notes.
- **Training-plan generation**: a periodized 4-week plan regenerated weekly and
  on demand, with plan-realignment prompts when sessions are missed.
- **Weekly review** every Sunday.
- **Push workouts to Garmin** (`app/workout_translator.py`): translates a plan
  day into a Garmin structured-workout payload and schedules it on the watch.

### Frontend (React 19 PWA)
Mobile-first SPA with bottom navigation and an expandable calendar:
**Today**, **Activities** + detail (80+ metrics, interactive charts, route map),
**Daily summaries**, **Trends** (wellness, intensity, performance curve),
**Plan** + guided setup, **Settings** (AI/model, profile, Garmin connect, custom
zones, threshold review, data export), and a first-run **Onboarding** flow.
Dark/light theme, PWA manifest, and service worker included.

---

## Architecture

```
[Garmin Connect API]
        │
   garmin_sync.py  ← APScheduler (4 background jobs + startup backfill)
        │
   SQLite (WAL mode)   — every data row scoped by user_id
   ├── User, Activity, DailySummary, GarminCalendarEvent, Race
   ├── Insight, AthleteProfile, ZoneConfig, MetricZone
   └── TrainingPlan / TrainingPlanDay, SyncStatus
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

### Key modules

| File | Role |
|------|------|
| `app/main.py` | FastAPI init, APScheduler (4 jobs), lifespan, backfill, SPA catch-all |
| `app/api.py` | All REST endpoints, auth-gated router |
| `app/auth.py` | Cloudflare Access JWT verification + user resolution |
| `app/garmin_sync.py` | Garmin auth/MFA, sync, backfill, calendar/profile parsing, push-to-Garmin |
| `app/ai_coach.py` | AI analysis, context building, plan generation, provider dispatch, retry |
| `app/workout_translator.py` | TrainingPlanDay → Garmin structured-workout JSON |
| `app/streams.py` | Detail-stream parsing, grade-adjusted pace, mean-maximal curves |
| `app/threshold.py` | Critical Power / CV / LTHR estimation, performance curve, race prediction |
| `app/training_load.py` | CTL/ATL/TSB, ACWR, readiness scoring |
| `app/intensity.py` | Weekly time-in-zone aggregation + polarization |
| `app/adherence.py` | Workout step parsing + planned-vs-actual adherence |
| `app/crypto.py` | Fernet encryption for stored Garmin passwords |
| `app/models.py` / `app/schemas.py` | SQLAlchemy ORM models / Pydantic schemas |
| `app/database.py` | DB/session setup, Alembic bootstrap, zone seeding |
| `app/config.py` | Env-var config + `AVAILABLE_MODELS` catalog |

### Scheduling
Four APScheduler jobs, each fanned out across all Garmin-connected users:
1. **Activity sync** — every `ACTIVITY_POLL_MINUTES`; new activities trigger AI analysis.
2. **Daily summary sync** — daily at `DAILY_SYNC_HOUR`; rolling window + profile.
3. **Weekly review** — Sundays 8am.
4. **Training-plan generation** — Sundays 9am.

### Authentication & multi-user
`app/auth.py` resolves the request user. With `AUTH_ENABLED=true` it verifies a
**Cloudflare Access JWT** (`Cf-Access-Jwt-Assertion`) against the team's JWKS and
upserts a user by email. With `AUTH_ENABLED=false` (dev/CI) it falls back to a
synthetic dev user. All queries are scoped by `user_id`; user #1 is the bootstrap
account seeded from `GARMIN_EMAIL`/`GARMIN_PASSWORD`.

> ⚠️ With auth disabled, the app trusts the dev-user fallback. Do not expose a
> publicly reachable instance without Cloudflare Access (or equivalent) in front.

---

## Quick start (Docker)

The simplest deployment is the published image via Docker Compose.

1. Create a `.env` file (see `.env.example`):

   ```bash
   cp .env.example .env
   # edit GARMIN_EMAIL, GARMIN_PASSWORD, ANTHROPIC_API_KEY, TIMEZONE, ...
   ```

2. Start the stack:

   ```bash
   docker compose up -d
   ```

3. Open <http://localhost:8080>.

SQLite and Garmin tokens persist in the `./data` volume. The bundled
[Watchtower](https://containrrr.dev/watchtower/) service auto-updates the image.

### Configuration

All settings come from environment variables (see `app/config.py`):

| Variable | Default | Description |
|----------|---------|-------------|
| `GARMIN_EMAIL` / `GARMIN_PASSWORD` | — | Bootstrap (user #1) Garmin credentials |
| `ANTHROPIC_API_KEY` | — | Claude API key |
| `GEMINI_API_KEY` | — | Google Gemini/Gemma API key (optional) |
| `AI_MODEL` | `claude-sonnet-4-6` | Default AI model |
| `TIMEZONE` | `UTC` | Scheduler timezone, e.g. `America/New_York` |
| `DB_PATH` | `/data/running_coach.db` | SQLite path |
| `GARMIN_TOKEN_DIR` | `/data/garmin_tokens` | OAuth token storage |
| `ACTIVITY_POLL_MINUTES` | `5` | Activity sync interval |
| `DAILY_SYNC_HOUR` | `7` | Hour of day for daily sync |
| `AUTH_ENABLED` | `false` | Enable Cloudflare Access JWT auth |
| `CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD` | — | Required when auth is enabled |
| `ENCRYPTION_KEY` | — | Fernet key for per-user Garmin passwords |
| `BIND_HOST` | `127.0.0.1` | Interface uvicorn listens on (must match `--host`); used by the security guard |
| `ALLOW_INSECURE_BIND` | `false` | Opt out of the startup refusal below (e.g. trusted, firewalled private network) |

> **Safe-default rule:** `AUTH_ENABLED=false` is fine for local development
> (`BIND_HOST=127.0.0.1`, the default).  If you expose the app on any
> non-loopback interface — including Docker's `0.0.0.0` — you **must** set
> `AUTH_ENABLED=true` and configure Cloudflare Access.  The app logs a
> `CRITICAL` warning and **refuses to start** when it detects the unsafe
> combination; set `ALLOW_INSECURE_BIND=true` only if you understand the risk
> and still want to run that way (e.g. a trusted, firewalled private network).

Generate an encryption key once and keep it stable:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## Local development

**Backend** (Python 3.12):

```bash
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env   # fill in keys; set DB_PATH/GARMIN_TOKEN_DIR to local paths
uvicorn app.main:app --reload
```

**Frontend** (Node 20):

```bash
cd frontend
npm install
npm run dev      # Vite dev server
npm run build    # production build → frontend/dist (served by FastAPI)
```

In production the multi-stage `Dockerfile` builds the React app with Node, then
serves the compiled `frontend/dist` from the FastAPI process.

---

## Testing

```bash
pytest                       # backend (~414 tests; coverage fail_under=80)
cd frontend && npm test      # frontend vitest (utils)
```

The `perf/` directory holds a seeded load-test harness — see
[`docs/performance-testing.md`](docs/performance-testing.md).

CI runs via GitHub Actions: `tests.yml` (backend + frontend), `performance.yml`,
and `docker-publish.yml` (build & push the image to GHCR).

---

## Persistence & migrations

SQLite in WAL mode; schema evolution is managed by **Alembic** (`alembic/`).
`init_db()` bootstraps/stamps the schema and seeds metric zones and default zone
configs on startup.

```bash
alembic upgrade head        # apply migrations
alembic revision -m "..."   # create a new migration
```

---

## Documentation

- [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — detailed feature & architecture reference
- [`docs/IMPROVEMENT_PLAN.md`](docs/IMPROVEMENT_PLAN.md) — roadmap
- [`docs/UI_UX_REDESIGN_PLAN.md`](docs/UI_UX_REDESIGN_PLAN.md) — UI/UX audit, competitor benchmark & phased redesign plan
- [`docs/multi_user_plan.md`](docs/multi_user_plan.md) — multi-user design
- [`docs/performance-testing.md`](docs/performance-testing.md) — load-test harness
