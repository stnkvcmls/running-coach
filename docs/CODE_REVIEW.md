# Code Review — Running Coach

_Review date: 2026-06-30_
_Scope: full codebase (FastAPI backend `app/`, React PWA `frontend/`, infra, CI, docs)._
_Method: static reading of source. No code was changed. No tests were run as part of this review._

## Summary

This is a mature, well-structured single-tenant-leaning-multi-user app. The
architecture is clean: analytics modules are cohesive and individually testable,
the AI provider abstraction is tidy, per-user scoping is applied consistently at
the query layer, and the test suite is substantial (~550 test functions, 80%
coverage gate in CI). Error handling around the AI providers (transient vs fatal
classification + backoff) and the durable `AIJob` ledger are genuine strengths.

The findings below are mostly correctness and consistency issues rather than
architectural problems. The two that matter most are: (1) the startup security
guard is silently bypassed in the project's own default Docker deployment, and
(2) an on-demand Garmin fetch in a read endpoint ignores the current user, which
is a cross-user defect now that the app is multi-user.

Severity legend: **High** = security or data-correctness impact; **Medium** =
functional bug or notable risk; **Low** = consistency, tech-debt, or polish.

---

## High

### H1. Startup security guard is bypassed in the default Docker deployment
**Files:** `app/main.py:32-52`, `app/config.py:44`, `Dockerfile:38`, `docker-compose.yml`

`_check_security_config()` warns when `auth_enabled=False` **and**
`bind_host` is non-loopback. But it reads `settings.bind_host`, which defaults to
`127.0.0.1` and is **only** correct if the operator manually keeps `BIND_HOST` in
sync with uvicorn's `--host`.

The project's own shipping artifacts break that invariant:
- `Dockerfile:38` runs `uvicorn ... --host 0.0.0.0`.
- `docker-compose.yml` never sets `BIND_HOST` and publishes `8080:8000`.
- `AUTH_ENABLED` defaults to `false`.

So the documented "quick start" path runs **publicly reachable with auth
disabled**, yet the guard sees `bind_host == "127.0.0.1"` (loopback) and stays
silent — exactly the catastrophic combination the guard was added (commit
`610058a`) to catch. The guard gives a false sense of safety because it checks a
config value that is decoupled from the actual listen address.

_Suggested direction (not applied):_ derive the bind address from the real
server (or have the Dockerfile/compose set `BIND_HOST=0.0.0.0` so the guard
fires), or check `auth_enabled` independently of `bind_host` when running in the
container. At minimum the README's "safe-default rule" should acknowledge that
the default Docker compose does not satisfy it.

### H2. On-demand route backfill uses the bootstrap Garmin client, not the request user's
**File:** `app/api.py:388-405` (specifically `client = get_garmin_client()` at line 394)

Inside `GET /activities/{activity_id}`, when an outdoor activity lacks a cached
polyline, the handler calls `get_garmin_client()` **with no `user` argument**.
`get_garmin_client(None)` resolves to the *bootstrap* user #1's credentials
(`app/garmin_sync.py:122-132`). For any non-bootstrap user this fetches GPS detail
through the wrong Garmin account (wrong/forbidden activity id, or silently the
wrong data), and writes the result back into the requesting user's row. It should
pass `current_user`. This is dormant in single-tenant use but is a real
cross-user correctness bug in the multi-user mode the codebase otherwise scopes
carefully.

---

## Medium

### M1. Chat history sends the *oldest* 20 turns, not the most recent
**File:** `app/api.py:1692-1701`

```python
history_rows = (db.query(ChatMessage)
    .filter(ChatMessage.user_id == ..., ChatMessage.id < user_msg.id)
    .order_by(ChatMessage.created_at.asc())
    .limit(20).all())
```

`ORDER BY created_at ASC LIMIT 20` returns the *first* 20 messages of the
conversation. Once a chat exceeds 20 messages, the model permanently loses the
recent turns and keeps re-reading the opening of the conversation — the opposite
of the intended "multi-turn context." It should select the most recent 20
(`ORDER BY created_at DESC LIMIT 20` then reverse).

### M2. Chat history GET also returns the oldest 50, not the latest
**File:** `app/api.py:1643-1658`

Same shape as M1: `order_by(created_at.asc()).limit(50)`. A user with >50 stored
messages sees the beginning of their history rather than the latest exchange,
which is almost certainly not what a chat UI wants on load.

### M3. Read (GET) endpoints perform writes / commits
**Files:** `app/api.py:388-418` (route + aerobic backfill, two `db.commit()`),
`app/api.py:1069-1072` (`backfill_missing_aerobic_metrics` on GET),
plus the cross-user fetch in H2.

`GET /activities/{id}` and `GET /aerobic-trends` mutate and commit during a read.
Consequences: GETs are no longer idempotent/safe; they can trigger external
Garmin calls and DB writes under read load; and concurrent reads of the same
activity can race on the same backfill. Backfill is reasonable to *trigger*, but
it belongs on a write path / background job rather than inline in a GET. At a
minimum, document the side effect; better, move it to the sync/worker layer.

### M4. Naive/aware datetime comparisons against DB columns
**Files:** `app/ai_coach.py:1122` and `:1143` (`datetime.now(timezone.utc)` vs
`Activity.started_at`), `app/api.py:1073` (`datetime.utcnow()`), `app/threshold.py:787,935`.

DB datetime columns (`started_at`, etc.) are stored naive (UTC). Cutoffs are a
mix of timezone-aware (`datetime.now(timezone.utc)`) and naive
(`datetime.utcnow()`). Comparing aware and naive datetimes through SQLAlchemy on
SQLite relies on string rendering and can silently shift the window by the UTC
offset suffix, or raise if ever compared in Python. Standardize on one
representation (the model already centralizes `_utcnow()` returning aware UTC —
either make all comparisons aware, or strip tzinfo consistently before querying).

### M5. `datetime.utcnow()` is deprecated (Python 3.12)
**Files:** `app/api.py:1073`, `app/threshold.py:787`, `app/threshold.py:935`

`datetime.utcnow()` is deprecated as of 3.12 (the production runtime — see
`Dockerfile`). Prefer `datetime.now(timezone.utc)`. Related to M4; fixing both
together keeps tz handling consistent.

### M6. CI Python version differs from production
**Files:** `.github/workflows/tests.yml` (`python-version: '3.11'`),
`Dockerfile` (`python:3.12-slim`), `README.md` ("Python 3.12").

Tests run on 3.11 while the image and docs target 3.12. This is how
version-specific deprecations/behavior (e.g. M5) slip through green CI. Align CI
to 3.12 (or test a matrix of both).

---

## Low

### L1. Legacy SQLAlchemy 2.0 `Query.get()` usage
**File:** `app/ai_coach.py:961, 993, 1007, 1055`

`db.query(Model).get(pk)` is legacy in SQLAlchemy 2.0 and emits a deprecation
warning (currently muted by the `filterwarnings` ignore in `pyproject.toml`).
Prefer `db.get(Model, pk)`. The blanket `ignore::DeprecationWarning` in pytest
config means these (and M5) won't surface in test output — consider scoping the
ignore more narrowly so real deprecations remain visible.

### L2. `_parse_date` masks bad input by returning today
**File:** `app/api.py:1743-1749`

An unparseable `date` query param silently falls back to `date.today()` instead
of returning `422`. Callers can't tell a typo from "no date given," and the user
sees data for the wrong day with no error. Consider returning a 400/422 for a
malformed (but present) date.

### L3. Redundant `get_current_user` dependency
**File:** `app/api.py:98-106` and most endpoints

The router declares `dependencies=[Depends(get_current_user)]` *and* nearly every
endpoint re-declares `current_user: User = Depends(get_current_user)`. FastAPI
caches per-request so it's only resolved once (not a perf issue), but the
router-level dependency is redundant given every handler needs the user object
anyway — minor noise.

### L4. In-process global state limits horizontal scaling
**Files:** `app/garmin_sync.py:29-36` (`_garmin_clients`, `_mfa_sessions` module
dicts), `app/auth.py:16-17` (JWKS cache), `app/main.py:27` (`BackgroundScheduler`).

Cached Garmin clients, pending MFA sessions, and the APScheduler all assume a
single process. Running more than one uvicorn worker would (a) duplicate every
scheduled sync/AI job across workers and (b) break the interactive MFA flow
(connect and code-submit could hit different workers). This is fine for the
documented single-container deployment but is an unstated hard constraint worth
documenting (`--workers 1`).

### L5. `AIJob` claiming is not atomic at the DB level
**File:** `app/ai_coach.py:839-859`, `app/main.py:219-247`

`_worker_run_pending_jobs` selects pending ids, then `execute_job` re-checks
`status == "pending"` and flips to `running` in a separate transaction. Correct
for the current single scheduler thread, but there is no `SELECT ... FOR UPDATE`
/ atomic compare-and-set, so it would double-execute jobs under any multi-worker
setup. Ties into L4; note the single-process assumption near the worker.

### L6. Broad `except Exception: pass` swallows errors silently
**Files:** `app/api.py:417-418` (aerobic backfill), `app/api.py:1071-1072`
(`backfill_missing_aerobic_metrics`), and several `except Exception: pass` blocks
in `app/ai_coach.py` (e.g. `:1442-1443`).

Some of these intentionally degrade gracefully, but a bare `pass` with no
`logger.debug(..., exc_info=True)` makes failures invisible. The codebase already
uses the `logger.debug(..., exc_info=True)` pattern elsewhere (e.g.
`ai_coach.py:444`); applying it consistently would aid debugging without changing
behavior.

### L7. Documentation drift
**Files:** `README.md` vs reality.

- README: "~414 tests"; the suite now has ~550 test functions.
- The README "Safe-default rule" implies the default is safe, but the default
  `docker compose up` is not (see H1).
- README references `docs/CURRENT_STATE.md` / `IMPROVEMENT_PLAN.md`; worth a pass
  to confirm they still match the Phase-3 multi-user state.

These are cheap to fix and keep the otherwise-excellent docs trustworthy.

### L8. Repeated threshold / performance-curve computation per request
**File:** `app/api.py:1326-1355` (race pacing calls `get_performance_curve_data`
up to twice), `app/ai_coach.py:_build_context` (calls `estimate_thresholds` every
analysis).

`threshold.py` does cache estimates (`_load_cached_threshold`), which mitigates
this, but the race-pacing endpoint can still invoke `get_performance_curve_data`
twice in one request (once for the target-time fallback, once for the reference
prediction). Computing once and reusing would be cleaner.

---

## Things done well (for balance)

- **Per-user data isolation** is applied consistently — nearly every query filters
  on `user_id`, and the model layer centralizes the scoping column.
- **AI provider abstraction**: transient vs fatal error classification, bounded
  exponential backoff, and provider dispatch are clean and well-tested.
- **Durable job ledger** (`AIJob`) replacing ad-hoc daemon threads, with retry
  semantics and a status API for polling.
- **Schema evolution** via Alembic with a sensible baseline-stamp bootstrap in
  `init_db()`.
- **Operational care**: `malloc_trim` after sync jobs + capped glibc arenas show
  real attention to the RSS-creep problem inherent in bursty JSON/stream work.
- **Test coverage** is broad (analytics, adherence, threshold, schema canary for
  Garmin payload drift) with an enforced 80% gate.

---

## Suggested priority order

1. **H1** — close the security-guard gap (or at least correct the docs/compose).
2. **H2** — pass `current_user` to the on-demand Garmin fetch.
3. **M1 / M2** — fix chat history ordering (clear user-facing correctness bug).
4. **M3** — move read-path backfills off GET handlers.
5. **M4 / M5 / M6** — unify tz handling and align CI to Python 3.12.
6. **L1–L8** — consistency and tech-debt cleanup as capacity allows.
</content>
</invoke>
