# Running Coach

Running Coach is a self-hosted running analytics and AI coaching web app. It syncs activities, daily wellness metrics, athlete profile data, and calendar events from Garmin Connect into a local SQLite database. An AI coach backed by Anthropic Claude or Google Gemini/Gemma (`app/coach/providers.py`) generates post-run analyses, morning pre-workout briefings, weekly reviews, 4-week training plans, and conversational replies. The codebase includes multi-user data scoping and Cloudflare Access authentication, though the intended deployment is a single household.

## Features

- **Garmin Connect sync**: polls recent activities (splits, HR/power zones, weather, running dynamics, per-sample streams, GPS routes), rolling daily summaries (steps, sleep, stress, body battery, resting HR, overnight HRV), athlete profile, and calendar workouts and races. Supports interactive MFA connect and reconnect in Settings.
- **Training load and readiness**: incremental CTL/ATL/TSB model with ACWR load-spike heuristic and ramp rates; 0-100 readiness score combining sleep, recovery, TSB freshness, resting HR trend, HRV, and daily check-in into a verdict (`Train as planned`, `Ease off today`, `Rest or go very easy`).
- **Performance analytics**: Minetti grade-adjusted pace (GAP), mean-maximal power/pace/HR curves, 2-parameter Critical Power / Critical Velocity threshold estimation and race predictions, aerobic decoupling and efficiency factor, weekly HR/power intensity distribution, heat-adjusted pace, workout adherence, and all-time plus top-3 per-distance personal records.
- **Training plans and race pacing**: AI-generated 4-week plans shaped by a deterministic season-long periodization skeleton, daily rule-based workout adaptation, missed-session realignment prompts, strength and mobility routines with exercise demo links, fuelling targets for long runs and races, split-by-split race pacing (`even` or `negative_split` with optional heat scaling), and push-to-Garmin for run workouts and race pacing plans.
- **AI coaching and memory**: automatic post-run analysis (`AUTO_ANALYZE_ACTIVITIES`), morning pre-workout briefings that incorporate overnight recovery, Sunday weekly reviews, streaming chat with coach tool-use (`regenerate_plan`, `adjust_upcoming_week`, `mark_setback`, `explain_workout`), and persistent coach memory.
- **React PWA**: mobile-first SPA with **Today**, **Plan**, **Coach**, **Activities**, **Progress**, **Daily history**, **Settings**, and **Onboarding** views, system/dark/light themes, CSV/JSON export, and optional Web Push notifications via `/sw.js`.

## Quick start with Docker

1. Copy `.env.example` to `.env` and fill in your Garmin credentials, at least one AI provider key (`ANTHROPIC_API_KEY` or `GEMINI_API_KEY`), and `TIMEZONE`:

   ```bash
   cp .env.example .env
   ```

2. Generate a Fernet `ENCRYPTION_KEY` once and add it to `.env` (required to store or connect Garmin credentials from Settings):

   ```bash
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```

3. Choose how authentication is handled before starting the container:
   - `Dockerfile` and `docker-compose.yml` set `BIND_HOST=0.0.0.0` (matching uvicorn's `--host "$BIND_HOST"`).
   - At startup, `_check_security_config()` in `app/main.py` refuses to start if `AUTH_ENABLED=false` and `BIND_HOST` is not a loopback address (`127.0.0.1`, `::1`, `localhost`), unless `ALLOW_INSECURE_BIND=true` is set.
   - Recommended when exposed beyond localhost: put the app behind a reverse proxy or Cloudflare Tunnel with Cloudflare Access, and set `AUTH_ENABLED=true`, `CF_ACCESS_TEAM_DOMAIN`, and `CF_ACCESS_AUD`.
   - Local-only or trusted private network: `docker-compose.yml` publishes `127.0.0.1:8080:8000` (loopback only on the host). To run without auth in Docker, set `ALLOW_INSECURE_BIND=true` explicitly in `.env`.

4. Start the stack and open `http://127.0.0.1:8080`:

   ```bash
   docker compose up -d
   ```

SQLite data and per-user Garmin tokens persist in `./data` (mounted at `/data`). The bundled Watchtower service runs with `WATCHTOWER_LABEL_ENABLE=true` and only updates containers carrying `com.centurylinklabs.watchtower.enable=true` (`running-coach`).

## Configuration

All environment variables read by `Settings` in `app/config.py` (common ones are templated in `.env.example`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `GARMIN_EMAIL` | `""` | Bootstrap (user #1) Garmin account email |
| `GARMIN_PASSWORD` | `""` | Bootstrap (user #1) Garmin account password |
| `ANTHROPIC_API_KEY` | `""` | Anthropic API key for Claude models |
| `GEMINI_API_KEY` | `""` | Google Gemini API key for Gemini/Gemma models |
| `AI_MODEL` | `claude-sonnet-4-6` | Default AI model ID |
| `AVAILABLE_MODELS` | built-in dict | JSON map overriding allowed `claude` and `gemini` model IDs |
| `TIMEZONE` | `UTC` | IANA timezone for scheduler cron triggers and `local_today()` |
| `DB_PATH` | `/data/running_coach.db` | SQLite database file path |
| `GARMIN_TOKEN_DIR` | `/data/garmin_tokens` | Root directory for per-user Garmin OAuth tokens |
| `ACTIVITY_POLL_MINUTES` | `5` | Interval (minutes) for scheduled activity sync |
| `CALENDAR_SYNC_HOURS` | `6` | Interval (hours) for scheduled Garmin calendar sync |
| `DAILY_SYNC_HOUR` | `7` | Hour of day (in `TIMEZONE`) for the daily summary sync |
| `DAILY_SYNC_WINDOW_DAYS` | `3` | Days synced each morning (today plus prior `window - 1` days) |
| `AUTO_ANALYZE_ACTIVITIES` | `true` | Auto-enqueue AI analysis for newly synced runs within 48 hours |
| `AUTH_ENABLED` | `false` | Require and verify Cloudflare Access JWTs on `/api/v1/*` |
| `CF_ACCESS_TEAM_DOMAIN` | `""` | Cloudflare Access team domain used to fetch JWKS |
| `CF_ACCESS_AUD` | `""` | Cloudflare Access application AUD tag verified in JWTs |
| `DEV_USER_EMAIL` | `""` | Fallback user email when `AUTH_ENABLED=false` |
| `ENCRYPTION_KEY` | `""` | Fernet key encrypting per-user Garmin passwords at rest |
| `BIND_HOST` | `127.0.0.1` | Host checked by startup guard (`0.0.0.0` in Docker); must match `--host` |
| `ALLOW_INSECURE_BIND` | `false` | Allow startup with `AUTH_ENABLED=false` on non-loopback `BIND_HOST` |
| `VAPID_PUBLIC_KEY` | `""` | Web Push VAPID public key (blank disables push) |
| `VAPID_PRIVATE_KEY` | `""` | Web Push VAPID private key |
| `VAPID_SUBJECT` | `mailto:admin@example.com` | Web Push VAPID contact claim (`sub`) |

## Local development

### Backend (Python 3.12 in Docker; 3.11+ supported)

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env        # set local DB_PATH and GARMIN_TOKEN_DIR; keep BIND_HOST=127.0.0.1
uvicorn app.main:app --reload
```

`init_db()` in `app/database.py` runs `alembic upgrade head` automatically on startup (stamping `head` if `activities` exists without `alembic_version`) and seeds `metric_zones` and default `zone_configs`. Run migrations manually when developing schema changes:

```bash
alembic upgrade head
alembic revision -m "describe change"
```

### Frontend (Node 20)

```bash
cd frontend
npm ci
npm run dev                 # Vite dev server; proxies /api -> http://localhost:8000 (vite.config.ts)
npm run build               # tsc -b && vite build -> frontend/dist (served by FastAPI)
```

### Tests

```bash
pytest                      # backend suite (coverage fail_under = 80 in pyproject.toml)
cd frontend && npx vitest run && npx tsc --noEmit
```

API endpoint benchmarks live under `perf/` (`pip install -r requirements-perf.txt`); see [`docs/performance-testing.md`](docs/performance-testing.md).

## Project layout

```text
.
├── app/
│   ├── main.py                # FastAPI app, lifespan, security guard, scheduler, sync orchestration, /sw.js & SPA catch-all
│   ├── api.py                 # Thin /api/v1 router aggregator mounting app/routers/*
│   ├── routers/               # Domain REST routers: activities, calendar, chat, daily, export, notifications, plan, races, settings, trends, _shared
│   ├── coach/                 # AI coaching package: context, providers, jobs (AIJob queue), plans (plans/reviews/briefings), chat (SSE + tools)
│   ├── ai_coach.py            # Re-export shim over app/coach/*
│   ├── garmin_sync.py         # Garmin auth/MFA, activity/daily/profile/calendar sync, backfill, schema canary, push-to-Garmin
│   ├── training_load.py       # TSS estimation, incremental CTL/ATL/TSB/ACWR, readiness score & verdict
│   ├── streams.py             # Stream parsing, Minetti GAP, mean-max curves, distance efforts, aerobic decoupling/EF
│   ├── threshold.py           # 2-parameter CP/CV & LTHR estimation, performance curves, race predictions
│   ├── pacing.py              # Even & negative-split race pacing with optional heat scaling
│   ├── adherence.py           # Garmin step parsing and canonical planned-vs-actual adherence
│   ├── intensity.py           # Weekly HR/power time-in-zone aggregation and polarization split
│   ├── weather.py             # Heat/dew-point pace penalty from Garmin activity weather
│   ├── nutrition.py           # Carb and fluid fuelling targets for long runs and races
│   ├── records.py             # Personal records detection and top-3 race-distance efforts
│   ├── plan_days.py           # Canonical active TrainingPlanDay lookup (newest plan wins)
│   ├── plan_adaptation.py     # Rule-based daily adaptation (readiness, check-in, load risk, niggle)
│   ├── season_plan.py         # Deterministic season-long periodization skeleton
│   ├── strength_routines.py   # Static strength/mobility routine library with progression and demo links
│   ├── workout_translator.py  # Run TrainingPlanDay and race pacing -> Garmin structured workout JSON
│   ├── notifications.py       # Web Push (VAPID) delivery and per-category preferences
│   ├── auth.py / crypto.py / config.py / database.py / models.py / schemas.py / utils.py
├── alembic/                   # SQLite schema migrations
├── frontend/src/
│   ├── App.tsx / main.tsx     # Routes (lazy-loaded except Today), QueryClient, /sw.js registration
│   ├── api/                   # client.ts, hooks.ts, types.ts
│   └── components/            # today, plan, plan-setup, chat, activities, activity-detail, daily, workout-detail, trends, settings, onboarding, info, layout, ui
├── static/                    # PWA manifest (manifest.json), icons, service worker (sw.js)
├── tests/                     # Backend pytest suite
├── perf/                      # Seeded pytest-benchmark suite
└── docs/                      # Architecture and review documentation
```

## CI and deployment

Workflows under `.github/workflows/`:

- `tests.yml`: runs on every push and pull request. Executes backend `pytest --cov=app --cov-fail-under=80` (Python 3.11) and frontend `npm ci`, `npm test`, and `npx tsc --noEmit` (Node 20).
- `docker-publish.yml`: runs on `workflow_run` when `Tests` completes on `main` (or via `workflow_dispatch`). Builds and pushes `ghcr.io/<repo>:latest` and `:<sha>` only when `Tests` succeeded on a push to `main` in this repository.
- `performance.yml`: runs `pytest perf/` on pull requests and pushes to `main`/`master`, renders a step summary via `perf/summary.py`, and publishes benchmark history (advisory; `fail-on-alert: false`).

## Documentation

- [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — architecture, behavior, data model, and API reference generated from code
- [`docs/SECOND_OPINION_REVIEW.md`](docs/SECOND_OPINION_REVIEW.md) — architecture and UI/UX audit with implementation status
- [`docs/UI_UX_CRITIQUE.md`](docs/UI_UX_CRITIQUE.md) — UI/UX review and design decisions
- [`docs/performance-testing.md`](docs/performance-testing.md) — seeded API benchmark harness
- [`docs/mockups/`](docs/mockups/) — HTML mockups and screenshots referenced by the review docs
