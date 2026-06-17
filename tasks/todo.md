# Project-wide unit tests + coverage CI

Add comprehensive unit tests across the whole backend and a GitHub Actions
workflow that runs them with code coverage on every push to any branch.

## Test suite (pytest)
- [x] `tests/test_utils.py` — `calculate_age`, `safe_json_loads`, `parse_activity_charts`
- [x] `tests/test_training_load.py` (existing) + edge cases for IF cap / HR fallback / `_interpret_tsb`
- [x] `tests/test_api_helpers.py` — workout step parsing, distance/duration/pace formatters, `_parse_date`
- [x] `tests/test_api_endpoints.py` — activities, daily-summaries, calendar, insights, settings, ai-config, sync, feedback, analyze
- [x] `tests/test_ai_coach.py` — context formatters, summary/category extraction, provider dispatch (mocked), analyze flows (mocked)
- [x] `tests/test_garmin_sync.py` — field extraction, timestamp/date/priority parsing, calendar response parsing, sync-status, `_store_activity` (mocked client)
- [x] `tests/test_routes.py` — Jinja template filters + HTML endpoints
- [x] `tests/test_main.py` — scheduled job wrappers (mocked sync/AI)
- [x] `tests/test_database.py` — `get_db`/`db_session` generators, `init_db`/seed idempotency

## Config
- [x] `pyproject.toml` — pytest + coverage config (`--cov=app`, fail-under threshold)
- [x] `requirements-dev.txt` — add `pytest-cov`

## CI
- [x] `.github/workflows/tests.yml` — run on push to any branch; install deps, run pytest with coverage, upload report

## Verification
- [x] `pytest --cov=app` passes locally with high coverage

## Review

Added a project-wide pytest suite and a CI workflow that runs it with code
coverage on every push to any branch.

**Tests (237 total, up from 20).** New files cover the whole backend:
- `test_utils.py` — age math, JSON guard, activity chart parsing (pace/cadence conversions).
- `test_api_helpers.py` — workout-step parsing, distance/duration/pace formatters, date parsing.
- `test_api_endpoints.py` — every API route (activities, daily summaries, calendar
  month/week, insights, settings, ai-config, athlete-profile, analyze/feedback/sync),
  including 404 and validation paths. Background-job targets are stubbed so action
  handlers don't spawn real work.
- `test_ai_coach.py` — context formatters, summary/category extraction, provider
  dispatch (Claude/Gemini mocked), and the analyze/force/feedback/weekly flows with
  the AI call and `db_session` redirected to the in-memory DB.
- `test_garmin_sync.py` — field/timestamp/date/priority/calendar parsing, sync-status
  helpers, `_store_activity`, and the `sync_*` / `backfill_*` orchestrators with a
  mocked Garmin client.
- `test_routes.py` — Jinja filters and every HTML page/redirect.
- `test_main.py` — scheduled-job wrappers and the SPA catch-all guard.
- `test_database.py` — session generator/context-manager lifecycle and seed idempotency.
- `test_training_load_edge.py` — TSB interpretation bands, IF cap, HR-threshold fallback.

**Coverage: 89%** overall (`app/` only; templates omitted). Per-module: utils/models/
config 100%, schemas 99%, training_load 99%, api 95%, routes 93%, database 89%,
ai_coach 87%, garmin_sync 78%, main 70% (the async lifespan/scheduler is integration-
level and left uncovered).

**Config.** `pyproject.toml` sets pytest `testpaths`, silences the pre-existing
Pydantic/genai deprecation noise, and configures coverage (source=`app`, templates
omitted, `fail_under=80`). `pytest-cov` added to `requirements-dev.txt`.

**CI.** `.github/workflows/tests.yml` runs on push to any branch (plus PRs and manual
dispatch): sets up Python 3.11 with pip caching, installs `requirements-dev.txt`, runs
`pytest` with coverage and `--cov-fail-under=80`, and uploads the coverage/junit XML as
an artifact. `DB_PATH`/`GARMIN_TOKEN_DIR` are pointed at the runner temp dir so the
real engine initialises without needing `/data`.

**Notes.** Tests mock all external I/O (Garmin, Anthropic, Gemini) — no network or
credentials needed. The conftest gained a `routes_client` fixture and a
`patch_db_session` helper that redirects background-job `db_session()` onto the test DB.
