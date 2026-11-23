# Second Opinion: Architecture → UI/UX

_Written 2026-11-23 against `main` @ `72d9997`. Two independent reviewers,
reconciled until they agreed: **Claude Opus 5.5** (conductor, verification,
runtime repro) and **Gemini 4 Neon XHigh** (independent full-repo read). No
product code changed._

**UI/UX companion:** [`docs/mockups/second-opinion-ui-ux.html`](mockups/second-opinion-ui-ux.html)
is a standalone page (images embedded) with annotated screenshots of the running
app and proposed fixes. Raw screenshots live in
[`docs/mockups/second-opinion/`](mockups/second-opinion/).

---

## Contents

1. [Verdict](#1-verdict)
2. [How this was reviewed](#2-how-this-was-reviewed)
3. [What is genuinely good](#3-what-is-genuinely-good)
4. [Agreed Top 10](#4-agreed-top-10)
5. [Findings by area](#5-findings-by-area)
   - [5.1 Deployment & security](#51-deployment--security)
   - [5.2 Architecture & boundaries](#52-architecture--boundaries)
   - [5.3 Data model & migrations](#53-data-model--migrations)
   - [5.4 Garmin integration](#54-garmin-integration)
   - [5.5 AI coach](#55-ai-coach)
   - [5.6 Sports-science correctness](#56-sports-science-correctness)
   - [5.7 Testing & CI](#57-testing--ci)
   - [5.8 Frontend architecture](#58-frontend-architecture)
   - [5.9 UI/UX](#59-uiux)
   - [5.10 Product & process](#510-product--process)
6. [What to cut](#6-what-to-cut)
7. [Suggested order of work](#7-suggested-order-of-work)
8. [How we reached agreement](#8-how-we-reached-agreement)
9. [Where we are least confident](#9-where-we-are-least-confident)
10. [Appendix: reproductions](#10-appendix-reproductions)

---

## 1. Verdict

This is a capable, ambitious single-person training app that has spent the last
five months polishing its surface while its wiring rotted underneath.

- **The default deployment is unsafe.** `docker compose up` exposes an
  unauthenticated instance (Garmin credentials, AI keys, all health data) on
  every host interface, and the startup guard written to prevent exactly that
  is silently bypassed by its own default. Any push to *any* branch then ships
  straight to that box within five minutes.
- **The core loop is broken after the first week.** Plans regenerate every
  Sunday with a 4-week horizon, old plan rows are never removed, and `/today`
  picks a plan day with an unordered `.first()`. From the first regeneration on,
  Today, the morning adaptation push and the pre-workout briefing all target a
  stale plan, while the Plan tab shows the new one. We reproduced it in the
  running app (see [§10](#10-appendix-reproductions)).
- **Several advertised features don't work and the docs say they do:** push
  notifications (service worker never registered), job retries (handlers
  swallow every exception), multi-turn chat (the model is fed the *oldest*
  20 messages), automatic post-run analysis (removed in March, still promised in
  README and `CURRENT_STATE.md`).
- **Some of the numbers mislead runners.** Readiness penalises fitness itself
  (`100 − ATL`), the same run shows 61 % adherence on Today and 100 % on its
  detail page, and "top 3" race efforts are actually PR milestones.
- **The UI is now genuinely good-looking and readable**: the effort-colour
  system and type work. The problem is that it shows too much: Today is
  2.9 phone screens long and shows four overlapping "how ready am I" signals
  that contradict each other.

The fix is not another redesign. Freeze features, fix the ten items in
[§4](#4-agreed-top-10), commit to single-tenant, and cut a third of the surface.

Severity counts across the agreed list: **3 Critical, 28 High, 30 Medium, 2 Low** (63 findings).

---

## 2. How this was reviewed

| Step | Who | What |
|---|---|---|
| Independent read | Gemini 4 Neon XHigh (read-only, ~11 min, whole repo) | Ten-area review with file:line evidence, no anchoring from Claude |
| Independent read | Claude Opus 5.5 | Backend, deployment, CI, coach, domain math, frontend |
| Run the app | Claude | `uvicorn` on a copy of `perf/perf.db` (3 years of a sub-3:30 marathoner), server clock pinned to 2026-06-23 18:30 Europe/Belgrade with `time-machine`; Playwright (Chromium) at 390×844 @2x and 1280×800, light and dark, browser clock pinned to match |
| Build | Claude | `npm run build`: one 1,112 kB JS chunk (322 kB gzipped) |
| Tests | Claude | Backend `pytest` run locally on Windows: green except two Windows-only failures (cp1250 decode in `test_coach_shim_seam.py`; a file lock in `test_seed_bootstrap_user_and_migrate_tokens`, which led to finding N4). Frontend tests not run |
| Verify | Claude | Every Critical/High claim from Gemini re-checked in code; A2 reproduced at runtime |
| Reconcile | Both | Three rounds until both reviewers agreed on the remaining severities and the Top 10 ([§8](#8-how-we-reached-agreement)) |

**Seed artifacts excluded** (same rule as `UI_UX_CRITIQUE.md`): identical
73 km weeks, decimal paces in seeded insight text, and seeded pace streams that
never reach rep pace (that is why "Time in pace zone" shows 0:00 in Z3–Z5 on the
screenshot; the *method* is still flawed, see N3).

**Codebase at a glance:** 16.4k lines of Python in `app/`, 15.5k TS/TSX +
8.1k CSS in `frontend/src`, 63 API routes, 21 Alembic revisions, 968 backend
test functions, 327 frontend test cases, 370 commits (219 authored as "Claude").

---

## 3. What is genuinely good

- **Visual system.** Effort-only colour (`--z1..--z5`), Archivo with tabular
  numerals, ink actions and personal-range bands on Progress are clean and
  legible. The last critique's direction was right and it shipped.
- **Deterministic season skeleton.** `season_plan.py` owns macro periodization;
  the LLM writes sessions. That is the right boundary.
- **Structured LLM output.** Tool schema / `response_schema` for plan
  generation instead of regex-parsing prose.
- **Garmin schema-drift canary.** Recorded fixtures plus a contract check on an
  unofficial API is rare discipline (`tests/test_garmin_schema_canary.py`).
- **Incremental load / CP-CV computation** with watermarks, instead of refitting
  history on every request.
- **Self-awareness in `tasks/lessons.md`.** The grid-vs-flex and
  "spec describes an already-fixed bug" lessons are real engineering learning.
- **Test volume.** ~1,300 tests exist. The problem (T1) is what they mock, not
  that they are missing.

---

## 4. Agreed Top 10

Ranked by both reviewers. Each one is small to medium in effort.

| # | ID | Fix | Why first |
|---|---|---|---|
| 1 | P1 | Set `ENV BIND_HOST=0.0.0.0` in the Dockerfile and launch uvicorn with `--host ${BIND_HOST}`; bind compose to `127.0.0.1:8080:8000`; add a non-root `USER` | Default deploy is an open, unauthenticated health-data server |
| 2 | P2 | Publish `:latest` only from `main` (or tags) **after** `tests.yml` passes; scope or remove Watchtower | Any branch push auto-deploys to production in ≤5 min |
| 3 | A2 | One helper `get_active_plan_day(db, user_id, day)` scoped to the latest `TrainingPlan`; use it in `/today`, `_push_plan_adaptation_if_needed`, `_generate_briefing_if_needed`; or delete superseded future days on regeneration | Today shows the wrong session from week 2 onward |
| 4 | A3 | Let job handlers raise; write the error insight only on the final failed attempt; add a stuck-`running` reaper at startup | Retries, failure alerts and System Health are dead code |
| 5 | I1 | `order_by(created_at.desc()).limit(N)` then reverse, in both chat queries | Coach forgets the conversation after 10 turns |
| 6 | G2+G3+G1 | Flag `needs_reauth` only on real auth/MFA errors; skip stale-event deletion if any month fetch failed; move calendar sync off the 5-min loop; add 429 backoff | One Garmin blip stops sync forever or wipes all future races |
| 7 | F1 | Register a service worker at `/` scope (e.g. `vite-plugin-pwa`), cache `/assets/*`; make the Notifications summary reflect reality | Push is 100 % dead while Settings says "8 of 8 on" |
| 8 | N1+G4 | One adherence definition across Today/Plan/Detail; reject `strength` in `translate_plan_day` and hide "Send to watch" for it | Same run shows 61 % and 100 %; strength days push an 8 km run |
| 9 | U2+I4+I2 | Separate RPE endpoint (no insight wipe, no fake "good" rating); `mark_setback` gets a category and expiry; confirm before chat replaces a plan; deterministic plan validator + red-flag deferral | Safety and trust in the coaching loop |
| 10 | S1+S2 | Readiness fatigue from TSB (or ATL relative to CTL), not `100 − ATL`; `_MAX_SPEED_MS` ≈ 7.5–9 m/s; smooth elevation before GAP | The score punishes fit runners; GPS glitches corrupt curves and PRs |

---

## 5. Findings by area

Severity is the **agreed** one. "Verified" marks claims Claude re-checked in
code (✓) or reproduced at runtime (▶).

### 5.1 Deployment & security

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| P1 | **Critical** ✓ | Startup guard bypassed in Docker. `_check_security_config` tests `settings.bind_host` (default `127.0.0.1`) while the image runs `--host 0.0.0.0`; compose defaults `AUTH_ENABLED=false` and publishes `8080` on all interfaces; container runs as root. `CURRENT_STATE.md` claims the guard "refuses to start on unauthenticated public binds". | `app/main.py:41-71`, `app/config.py:45`, `Dockerfile:32`, `docker-compose.yml:5-24` | See Top 10 #1. Better still: derive the bind from the real server socket instead of a setting the operator must keep in sync |
| P2 | **Critical** ✓ | `docker-publish.yml` pushes `:latest` on `branches: ['**']`, not gated on tests; Watchtower (with `/var/run/docker.sock`, label filtering off) pulls every 5 min. Agent-authored branches deploy themselves. | `.github/workflows/docker-publish.yml:4-5,37-44`, `docker-compose.yml:31-41` | See Top 10 #2 |
| P4 | High ✓ | `GET /activities/{id}` route backfill calls `get_garmin_client()` with no user, so it authenticates as bootstrap user #1 during any user's request. | `app/routers/activities.py:89`, `app/garmin_sync.py:123-133` | Pass `current_user`; remove the implicit bootstrap fallback |
| P5 | High | CF Access JWT: no `iss` check, JWKS not refreshed on unknown `kid` (rotation means up to 1 h of 401s), no startup check that team domain/AUD are set when auth is on, no `Origin` check on body-less POSTs (`/sync/*`, `/training-plan/generate`) that ride the `CF_Authorization` cookie. | `app/auth.py:21-61` | Verify issuer, refresh once on unknown kid, fail closed on missing config, add Origin middleware |
| P3 | Medium | Push subscription: any URL accepted as `endpoint`; an existing row's `user_id` is overwritten on collision. Authenticated-only, capability URLs, so Medium. | `app/routers/notifications.py:29-54` | HTTPS + known push hosts; key on `(user_id, endpoint)` |
| P6 | Medium | `str(exc)` returned to clients; CSV export not formula-escaped; no security headers; single static Fernet key; healthcheck ignores HTTP status. | `app/routers/settings.py:212`, `app/routers/export.py:45-55`, `docker-compose.yml:26-30` | Standard hardening |
| N4 | Medium ✓ | `_migrate_flat_token_dir` moves **every regular file** in `GARMIN_TOKEN_DIR` into `/1/`. If an operator points it at `/data` (where the DB lives), the live SQLite file is moved and the next start creates an empty DB. The test suite literally moves `test.db`. | `app/garmin_sync.py:256-270` | Move only known token filenames (`oauth1_token.json`, `oauth2_token.json`) |

### 5.2 Architecture & boundaries

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| A2 | **Critical** ▶ | Stale `TrainingPlanDay`: `(user_id, day_date).first()` with no plan scoping; superseded plans' days are never deleted (`_store_training_plan` only inserts). Reproduced: Today resolves day id 3 (old plan, "easy"), Plan shows day id 31 (new plan, "rest"); TodayHero renders "Easy" with empty Distance/Time/Pace. | `app/routers/daily.py:236-240`, `app/main.py:236-240,299-303`, `app/coach/plans.py:602-648` | Top 10 #3 |
| A3 | High ✓ | Every job handler catches `Exception` and saves an "error insight", so `_run_claimed_job` records the job as `done`. `max_attempts`, the `failed` push and System Health's failed-job list never fire. No reaper for jobs left `running` by a restart. `CURRENT_STATE.md` says "the job queue retries failures". | `app/coach/jobs.py:156-195,355-361`, `app/coach/plans.py:881-883` | Top 10 #4 |
| A4 | High ✓ | Multi-user is half-built: zone configs are seeded once for user 1 only and `PUT /zones` silently skips missing rows (so user 2 cannot set zones); no backfill when a user connects Garmin from Settings (backfill runs only for the env account); one global `TIMEZONE`/`DAILY_SYNC_HOUR`; canary status lives in process memory. | `app/database.py:113-153`, `app/routers/settings.py:345-354`, `app/main.py:580-582` | Decide single-tenant (X2) or finish it |
| A5 | High | God-modules: `garmin_sync.py` 1,611 lines, `threshold.py` 1,342, `plans.py` 1,055, `schemas.py` 1,002. `main.py` holds business logic (adaptation push, race reminders, canary). `routers/daily.py` spawns raw daemon threads for manual sync with no per-user lock, so double-tapping "Sync now" runs two syncs concurrently. Four concurrency mechanisms coexist: APScheduler, a thread pool, raw threads and a backfill thread. | `app/routers/daily.py:481-489`, `app/main.py:206-405` | Sync orchestration service with per-user locks; route manual sync through the job table |
| N10 | Medium ✓ | Test-induced design damage: `app/ai_coach.py` is a re-export shim, and `app/coach/*` calls back through it at runtime **only** so tests can monkeypatch private functions. A test (`test_coach_shim_seam.py`) exists to police the seam. | `app/ai_coach.py:1-13`, `app/coach/providers.py:1-9,175-178` | Patch the real module paths in tests, delete the shim |
| A6 | Medium | Synchronous Garmin HTTP and DB writes inside `GET /activities/{id}`; N+1 full-`Activity` loads in plan matching. | `app/routers/activities.py:83-113`, `app/routers/plan.py:54-97` | Move lazy backfills to jobs; batch queries |
| N3 | Medium ✓ | Three separate parsers of the same Garmin detail payload (`utils.parse_activity_charts`, `streams.py`, `adherence.py`). Pace time-in-zone is computed **in the browser** from ~200 point-decimated instantaneous samples (`metrics[::step]`) assuming even spacing, which is wrong with smart recording or auto-pause, yet shown to the second. | `app/utils.py:44-45`, `frontend/src/components/activity-detail/PaceZonesChart.tsx:31-58` | One stream parser in `streams.py`; compute time-in-zone server-side on the full, time-aligned stream |

### 5.3 Data model & migrations

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| D2 | High | `SyncStatus` is an untyped key-value store for everything: sync timestamps, AI provider/model, notification prefs, push dedup keys, canary state, threshold caches, one row per custom performance-curve range (grows without bound). | `app/models.py:268-278`, `app/threshold.py:1132-1190`, `app/coach/providers.py:136-150` | Typed settings columns; a bounded cache table |
| D1 | Medium | `Activity` has 55+ columns and nine JSON text blobs inline (`laps_json` holds up to 10k samples). Hot stream paths already use `load_only`; this is debt, not an outage. | `app/models.py:61-143` | `activity_payloads` 1:1 child table or `deferred()` |
| D3 | Medium | Zero `ForeignKey`s across 19 tables while `PRAGMA foreign_keys=ON` is set. `user_id` defaults to `1` everywhere, so any code path that forgets the scope **fails open into user 1's data** rather than failing loudly. | `app/models.py:31-38`, `app/database.py:24` | Remove the default from data columns (make `user_id` required); add FKs in batch migrations |
| D4 | Medium ✓ | Missing composite indexes (`(user_id, date)` etc. are separate single indexes); orphan `Race` table; dismissing a plan adaptation twice raises `IntegrityError` → 500. | `app/routers/plan.py:280-286` | Upsert; composite indexes |
| D5 | Medium ✓ | Time soup: naive local `started_at`, mixed `utcnow()`/aware datetimes, and `date.today()` everywhere. The container has no `TZ`, so "today" is UTC; `TIMEZONE` only reaches the cron triggers. From 00:00–02:00 Belgrade, Today, adaptation and briefing operate on yesterday. | `app/main.py:180,226,288`, `app/routers/daily.py:58` | One `local_today(user)` helper |
| D6 | Medium | SQLite hard-coded; unused `aiosqlite`; hand-typed non-hex Alembic IDs; `init_db` silently stamps `head` if tables exist without `alembic_version`. | `app/database.py:14-17,166-171`, `requirements.txt:6` | Generate IDs with `alembic revision`; fail loudly on unstamped DBs |

### 5.4 Garmin integration

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| G2 | High ✓ | `_authenticate_or_flag` sets `needs_reauth=True` on **any** exception, including a timeout or 5xx. The scheduler then skips that user until they manually reconnect, and nothing warns them except a Settings badge. | `app/main.py:120-135` | Flag only on 401/403/MFA-required |
| G3 | High ✓ | Calendar sync deletes future events not seen in this fetch. If some months fail, their races are deleted. If **all** fail, `seen_garmin_ids` is empty, the filter is skipped, and **every** future event is deleted, including the goal race the season plan anchors to. | `app/garmin_sync.py:1325-1333,1419-1430` | Delete only within months that fetched successfully |
| G1 | High | Calendar sync runs inside every 5-minute activity sync: 6 month requests plus per-workout and per-race detail calls, fixed `sleep(0.3)`, no 429/backoff. That is thousands of calls a day against an unofficial API that bans accounts. | `app/main.py:138-154`, `app/garmin_sync.py:1316-1365` | Calendar 1–4×/day; exponential backoff with `Retry-After` |
| G4 | High ✓ | `translate_plan_day` rejects only `rest`/`cross`, so a `strength` day falls through to `_build_easy(8000)` and pushes an **8 km easy run** to the watch; the UI offers the button. Pushes aren't idempotent (duplicates on repeat taps). | `app/workout_translator.py:216-236`, `frontend/src/components/today/TodayHero.tsx:134` | Reject non-run types; store `garmin_workout_id` per plan day |
| G5 | Medium | Encrypted password stored **and** plaintext OAuth tokens on disk; MFA session in RAM; canary checks only top-level keys and lives in RAM. | `app/garmin_sync.py:36-63` | Tokens only; encrypt token files |

### 5.5 AI coach

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| I1 | High ✓ | Chat history is `order_by(created_at.asc()).limit(20)` for the model and `limit(50)` for the UI, so after 10 turns the model sees the first 20 messages ever, and after 50 the UI stops showing new ones on reload. | `app/routers/chat.py:32-38,86-93` | Top 10 #5 |
| I2 | High | No deterministic post-generation validator (ramp %, long-run share, `available_days`, exactly 28 days, workout enum); no red-flag deferral (chest pain, dizziness, localized bone pain, illness). The 32–34 km figures are caps keyed on volume preference, not targets. | `app/coach/plans.py:125-139,602-648`, `app/coach/context.py:35-62` | Validator that rejects or clamps; explicit "stop and see a professional" rules |
| I3 | High | No cost controls: no prompt caching, no per-user budget, any user can pick the most expensive model on the owner's key, plan calls allow 16k output tokens; each RPE tap re-bills an analysis (U2). | `app/coach/plans.py:55`, `app/coach/chat.py:88-118`, `app/coach/providers.py:84-96` | `cache_control` on the stable context block; daily budget; admin-only model choice |
| I4 | High ✓ | `mark_setback` always writes `CoachMemory(category="niggle")`, even for "travel" or "low energy" (its own schema's examples). `get_active_niggle` then downgrades every hard session until the user finds and resolves it in Settings. `regenerate_plan`/`adjust_upcoming_week` run on one tool call with no confirmation. | `app/coach/chat.py:151-169,245-262`, `app/plan_adaptation.py:40-51` | Category + expiry on setbacks; propose-then-confirm for plan changes |
| I5 | Medium | Provider error mapping and retry loops copy-pasted across `providers.py`, `plans.py`, `chat.py`; Anthropic client has no timeout; `_call_claude` reads `response.content[0].text` blindly. | `app/coach/providers.py:84-115`, `app/coach/plans.py:800-871`, `app/coach/chat.py:317-446` | One provider wrapper |
| I6 | Medium | Garmin titles, feedback text and memories are interpolated raw into prompts; the chat SSE handler keeps a DB session open for the whole stream. | `app/routers/chat.py:105-123` | Delimit untrusted text; close the session before streaming |
| N6 | Medium ✓ | The system prompt hard-codes Garmin cadence "percentile zones" and tells the model to suggest corrective drills when a runner is outside "average". Cadence depends on speed and height, so this produces wrong advice on most easy runs. ACWR > 1.5 is labelled "high injury risk" to the user, but ACWR's predictive validity is contested, and here it is an EWMA ATL/CTL ratio rather than the published rolling ACWR. | `app/coach/context.py:35-62`, `app/training_load.py:281-297,653-664` | Drop percentile framing; present ACWR as "load spike", not injury risk |

### 5.6 Sports-science correctness

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| S1 | High ✓ | Readiness `fatigue_component = 100 − ATL`. ATL is absolute TSS/day, so a marathoner at steady state (ATL ≈ 85, TSB ≈ 0) scores 15/100 every day. The score punishes fitness and can trigger false downgrades. (Weights sum to 1.2, not 1.0 as the docstring says; they are renormalized, so only the comment is wrong.) | `app/training_load.py:573-606` | Map TSB (or ATL/CTL) to 0–100 |
| S2 | High ✓ | `_MAX_SPEED_MS = 12.0` is commented "~22 km/h"; it is 43.2 km/h (1:23/km). Combined with unsmoothed point-to-point grade in GAP, GPS jitter inflates mean-max curves, CV and PRs. | `app/streams.py:58-62,194-220` | 7.5–9 m/s cap; smooth elevation over 30–50 m |
| S5 | High ✓ | "Top 3" race efforts are actually PR milestones: a row is stored only when a time beats the previous best (`records.py:151-164`), so a 19:05 after a 19:00 never appears and #2 may be an old 25:00. The docstring argues this is correct. Separately, plan adherence takes `min(100, actual/planned)`, so 20 km on an 8 km recovery day scores 100 % on distance. | `app/records.py:151-164,324-347`, `app/adherence.py:665-667` | Rank from per-activity best efforts; penalise over-distance |
| N1 | High ▶ | **Two different adherence numbers for one run.** Today and Plan show "61 % adherence" (plan day vs `workout_translator`'s *synthetic* steps); Activity detail shows "100 % adherence" (activity vs Garmin's scheduled-workout steps). Same label, different maths, same screen flow. | `app/routers/plan.py:89-95`, `frontend/src/components/activity-detail/RepsPanel.tsx:36`, screenshots | One definition, computed once, stored on the activity |
| S3 | Medium | 3-parameter CP fit's `W'` plotted with the 2-parameter equation (power curve only); rolling-window cache misses PR expiry; Riegel 1.06 optimistic for recreational marathoners. | `app/threshold.py:683,938-990` | Plot what you fit |
| S4 | Medium | Load is a blend of methods in one CTL: pace-rTSS on *average* pace (not NGP, so intervals are under-scored), hrTSS as `avg_hr/LTHR` (~70 TSS/h for an easy run), quadratic sRPE, a duration floor. Threshold or RPE edits don't invalidate `DailyLoadSeries`. | `app/training_load.py:94-142,181-200` | NGP/GAP-based rTSS; invalidate on profile/RPE change |
| S6 | Medium | Heat penalty adds temperature and dew-point terms above 10 °C (double counting) and cites Ely et al. 2007, which used WBGT. | `app/weather.py:6-10,60-64` | Use an established T+DP table, or WBGT |
| S7 | Medium | Negative split doesn't sum to target on odd distances; "terrain" pacing uses whichever past run was closest in distance; 105 g/h carbs for any race > 2.5 h; Garmin 5-zone %HRmax mapped straight onto a 3-zone polarization model. | `app/pacing.py:234-235`, `app/routers/races.py:77-108`, `app/nutrition.py:43-46`, `app/intensity.py:105-107` | Normalise splits; GPX-based terrain or none; 60–90 g/h default |

### 5.7 Testing & CI

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| T1 | High | Tests mock the very seams that are broken: the job-queue test raises from a mocked handler (real handlers swallow), auth tests mock `verify_cf_access_jwt`, sync tests don't assert what gets enqueued. 80 % coverage that missed A2, A3, I1, F1. | `tests/test_job_queue.py:167-207`, `tests/test_auth.py:130`, `tests/test_main.py:53-67` | A handful of end-to-end tests: sync → plan regeneration → `/today` → job → insight |
| T2 | Medium | `perf/perf.db` (4.7 MB binary) is frozen at 2026-06-23 while four benchmarks use `date.today()`-relative windows, so they now benchmark empty ranges. Seeded streams have 120 samples (production: thousands). Alerts are advisory (`fail-on-alert: false`). | `perf/test_perf_endpoints.py:44,97,101,105`, `.github/workflows/performance.yml:67-68` | Generate the DB in CI with relative dates and realistic streams |
| T3 | Medium | Test DB built with `create_all()`, never through Alembic; all deprecation warnings silenced. | `tests/conftest.py:26`, `pyproject.toml:5-10` | One migration test, upgrade on populated data |
| T4 | Medium | CI uses Python 3.11, the image ships 3.12; no lint, type-check, `vite build`, or dependency audit; image publish doesn't wait for tests (P2). Build artifacts are committed (`frontend/tsconfig.tsbuildinfo` changes on every build). | `.github/workflows/tests.yml:20`, `Dockerfile:8` | Align versions; add ruff, `tsc -b && vite build`, `pip-audit`/`npm audit` |

### 5.8 Frontend architecture

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| F1 | High ✓ | No `navigator.serviceWorker.register` anywhere; `static/sw.js` lives under `/static/` so it could never control `/`; it precaches legacy `/static/style.css`. `NotificationsSection` awaits `serviceWorker.ready`, which never resolves. Settings still says "Notifications: 8 of 8 on". | `frontend/src/components/settings/NotificationsSection.tsx:38-43,68,88`, `static/sw.js` | Top 10 #7 |
| F2 | High ✓ | Broken flows: Onboarding "Skip for now" → `window.location.replace('/')` → `App` sees no profile → redirects back to `/onboarding` (loop). `FeedbackPrompt` drops the returned `job_id` so the insight spinner never resolves; `DailyDetailView` passes a no-op `onReanalyze`. | `frontend/src/components/onboarding/OnboardingView.tsx:213`, `frontend/src/App.tsx:119-124`, `frontend/src/components/daily/DailyDetailView.tsx:64` | Skip flag; one `useTrackedJob` hook |
| F3 | High ✓ | Over-fetching: `PlanView.useActualDistances` fetches the **full** activity detail (streams, polyline, splits) for every done day just to read `distance_m`; TodayHero also fetches full detail. | `frontend/src/components/plan/PlanView.tsx:332-348`, `frontend/src/components/today/TodayHero.tsx:255` | Return `matched_distance_m` on plan days |
| F4b | Medium ▶ | One 1.1 MB JS chunk (322 kB gz): all 15 views, Recharts and react-markdown eagerly imported. | `frontend/src/App.tsx:1-22`, build output | `React.lazy` per route; split Recharts |
| F5 | Medium | `ChatView` bypasses the API client and React Query, never aborts its stream on unmount, doesn't invalidate plan/memory caches after coach actions, uses `confirm()`; custom charts use `prompt()` (broken in iOS standalone PWAs). | `frontend/src/components/chat/ChatView.tsx:49-177`, `frontend/src/components/trends/CustomChartsView.tsx:133` | Abort in cleanup; invalidate on `action` events |
| F6 | Medium | `display: contents` + CSS `order` makes focus order differ from visual order on Today and Detail; unlabeled zone inputs and canvas; RPE buttons lack `aria-pressed`. | `TodayView.css`, `ZoneConfigSection.tsx:102-125`, `RouteMap.tsx:325` | Match DOM order to reading order on mobile |
| F4r | Low | Route map replays its trace animation on a timer (it does respect `prefers-reduced-motion`). | `RouteMap.tsx:265-288` | Play once |

### 5.9 UI/UX

The visual layer is good; the problems are **information architecture,
consistency and trust**. Annotated screenshots and proposed fixes:
[`second-opinion-ui-ux.html`](mockups/second-opinion-ui-ux.html).

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| U1 | High | Too many places to log and read. A runner meets a morning check-in, an inline RPE, a post-run feedback modal, a briefing, coach notes, a weekly review, chat, and coach memory CRUD, across 15 routes and 10 settings pages. "Where do I tell it my knee hurts?" has four answers. | `App.tsx` routes, `TodayView.tsx` | One daily coaching thread on Today (brief → recap); one input per moment (below) |
| U2 | High ✓ | The RPE tap is the **only** post-run analysis trigger (auto-analysis was removed in `c26d2ea`). Each tap deletes the existing insight, enqueues a new LLM job, and, if the run was never rated, sends `rating: "good"`, so the model is told "the runner reported this workout went well" even after RPE 10. Tapping 7 then 8 costs two analyses. | `TodayHero.tsx:222-237`, `app/routers/activities.py:202-233`, `app/coach/jobs.py:393-394` | `PATCH /activities/{id}/rpe` that only updates load; one analysis per run, triggered after sync |
| N2 | Medium ▶ | Four overlapping, contradicting readiness signals on one screen: Readiness 55 "Good" + "Low HRV is holding it back" + Sleep "below range" + Form "Very fresh, +17". Garmin's sleep score, body battery and stress already include HRV; the app re-weights them into its own score and then adds TSB. | Today screenshot; `app/training_load.py:552-650` | One verdict ("Train as planned / Ease off / Rest"), with reasons beneath |
| N8 | Medium ▶ | Today is 2,434 px at 390 px wide (2.9 screens). At 18:30, after the run, it still asks "How do you feel **this morning**?" directly below a 1–10 RPE row: two surveys with opposite polarity (RPE 1 = easy, soreness 1 = very sore). | `DailyCheckinCard.tsx:156`, screenshot | Time-aware: check-in before the run only; one survey at a time |
| U3 | High ✓ | Misleading links and labels: Body's "Daily history" opens a single day (`/daily/{id}`), not the history; several Settings rows land on the same sub-page with no anchor; onboarding says "Your first Garmin sync is running" when Garmin isn't connected. | `BodyPanel.tsx:49`, `SettingsView.tsx`, `OnboardingView.tsx:228` | Fix targets |
| U4 | Medium | Chat starters are static ("How was my training this week?") although the last critique asked for context-aware ones; Fitness stacks five charts with five range pickers; the power curve legend says "CV model fit". | `ChatView.tsx:9-14`, `PerformanceCurveView.tsx:385` | Starters from today's data; one shared range |
| U5 | Medium | Race pacing card fetches while collapsed, hard-codes km, swallows push errors; "Send to watch" offered on strength days (G4). Plan's watch button is an unlabeled black icon; season bar truncates "Recove(ry)" and has no "you are here". | `RacePacingCard.tsx:31-47`, Plan screenshot | Label the action; mark the current phase |
| N9 | Low ✓ | Settings shows "System health: All checks pass" (green) with Garmin "Not connected", push dead, and job failures swallowed. | `settingsSummary.ts:78-84`, `SystemHealthSection.tsx:55-58` | Health reflects connection, push and job state |

### 5.10 Product & process

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| X1 | High | Identity sprawl: the improvement plans benchmark against Garmin Connect+, Runna, TrainingPeaks, Stryd, Intervals.icu and an AI coach, and build a shallow version of each. Intervals.icu will always win on analytics depth, Runna on prescriptive polish, Garmin on device integration. | `docs/IMPROVEMENT_PLAN.md:29-37` | Pick the wedge only this app has (see below) |
| X2 | High | Fake multi-tenancy taxes every layer (user scoping, default-to-user-1, CF Access, Fernet, per-user tokens) while the real deployment is one person, and the multi-user parts don't work (A4, P4). | `docs/CURRENT_STATE.md:447-452` | Declare single-tenant (or a trusted household with BYO API key) and simplify |
| N7 | High ✓ | Process churn: five UI planning/review cycles in five months (`UI_UX_REDESIGN_PLAN` → `REVIEW` → follow-up → `NOTHING_OS_SKIN_PLAN` → `UI_UX_CRITIQUE`), ~4,800 lines of planning docs, while A2/A3/I1/G3-class wiring bugs survived every pass. Docs are stale and in places false: README still says `app/api.py` holds all endpoints and `ai_coach.py` the coach logic; `CURRENT_STATE.md` claims auto-analysis, job retries and a working startup guard. | `README.md:57,104-107`, `docs/CURRENT_STATE.md:213,323,455-460` | Stop writing plans; write end-to-end tests; regenerate docs from code or delete them |
| X3 | Medium | Surface that costs more than it returns (see [§6](#6-what-to-cut)). | — | Cut |

**The wedge.** A private, self-hosted coach that reads *your* Garmin data and
**explains and negotiates** the week ("I'm travelling Thursday, my calf is
tight, move the tempo") better than Garmin's black-box suggestions or a rigid
Runna plan. Everything that doesn't serve that loop
(sync → trustworthy load/readiness → today's session → post-run recap → weekly adjust)
is optional.

---

## 6. What to cut

Agreed by both reviewers. Freeze or delete:

1. **Custom chart builder** (`CustomChartsView`, 21-metric API). Intervals.icu exists; this is maintenance with no coaching value.
2. **3-parameter Morton CP / Pmax.** The 2-parameter CV/CP fit is plenty for distance runners, and the 3-parameter version is plotted wrong (S3).
3. **"Terrain" race pacing from the closest past run.** It is guesswork presented as analysis. Bring it back only with a GPX upload.
4. **Separate daily-summary AI insight.** Fold overnight recovery into the morning briefing.
5. **Multi-user plumbing beyond what one household needs** (X2), plus the orphan `Race` table and legacy `static/style.css` / `static/sw.js`.
6. **Duplicate inputs:** keep one morning check-in (before the run) and one RPE (after it); drop the thumbs-up/down modal as a separate step.

---

## 7. Suggested order of work

| Week | Theme | Items |
|---|---|---|
| 1 | Stop the bleeding | P1, P2, A2, I1, G3, G4, N4 (each is a few lines) |
| 2 | Make failure visible | A3 + reaper, G2, G1, F1, N9; end-to-end tests for sync → plan → today → job (T1) |
| 3 | Make the numbers honest | S1, S2, S5, N1, U2, D5; remove percentile cadence/ACWR framing (N6) |
| 4 | Shrink | Cut list (§6), F3, F4b, Today time-aware layout (N2, N8), docs regenerated or deleted (N7) |

Deliberately **not** in the first month: FKs/blob split (D1, D3), the
provider-plumbing refactor (I5), or another visual pass.

---

## 8. How we reached agreement

| Round | Gemini | Claude | Outcome |
|---|---|---|---|
| 1 | Independent review, 60+ findings, 9 Critical | Independent read + runtime repro | — |
| 2 | — | Verified every Critical/High claim; reproduced A2; disputed 7, added 10 | Gemini agreed to all 7 downgrades and all 10 additions; defended U2's "fake good rating" (accepted, merged into U2 at High) |
| 3 | — | Asked to lower D1/D3, drop unverifiable model-ID claim, restate I2, re-prove S5 | Gemini agreed to 4 of 5; **re-proved S5** with `records.py:151-164`; Claude verified and kept it at High |

Notable corrections to the first pass:

- **"Automatic activity analysis is dead" (Gemini, Critical) → not a bug.** It was
  removed deliberately in `c26d2ea` ("Replace automatic AI insight generation with
  user-initiated feedback"). The real defects are the stale docs (N7) and the RPE
  tap being the sole, destructive trigger (U2).
- **hrTSS "Critical" → Medium (S4).** Real but moderate; the bigger issue is mixing methods in one CTL.
- **RouteMap "60 fps forever" → Low.** It replays on a timer and honours reduced motion.
- **Push SSRF/hijack High → Medium (P3).** Authenticated-only, capability URLs.
- **Calendar wipe (G3) got worse on verification:** a *total* failure deletes all future events, not just the failed months.
- **A2 upgraded to Critical** after runtime reproduction.

---

## 9. Where we are least confident

- **Live Garmin behaviour.** Rate limits, MFA state and payload drift were judged from code and fixtures, not traffic.
- **Model catalog.** We did not verify the configured model IDs against live provider catalogs; the owner just shipped a catalog fix (`b4bb1da`).
- **Frontend tests** were not run in this review; the backend suite was run on Windows only (two Windows-specific failures, both explained above).
- **Seeded data** hides some UI states (identical weeks, flat pace streams); findings that depend on seed quirks are excluded or flagged.
- **Sports-science thresholds** (ACWR bands, heat model, carb targets) are contested in the literature; we flag over-confident *presentation* more than exact constants.

---

## 10. Appendix: reproductions

### A2 — stale plan day on Today (runtime)

1. Copy `perf/perf.db`, run the app with the clock pinned to 2026-06-23 (`time-machine`), `AUTH_ENABLED=false`.
2. Insert a second `TrainingPlan` (later `generated_at`) duplicating plan 1's days, with 2026-06-24 changed to `rest`.
3. `GET /api/v1/today?date=2026-06-24` → `plan_day_id: 3` (plan 1, `easy`).
4. `GET /api/v1/training-plan` → plan 2; the 2026-06-24 day is id `31` (`rest`).
5. In the browser on 2026-06-24, Today renders "Easy · Easy" with Distance / Time / Pace all "—", while the week strip above shows Wednesday as rest. Screenshot: `docs/mockups/second-opinion/bug-stale-plan-day.jpg`.

### N1 — two adherence numbers (runtime)

Same activity (id 877, 6×800 m): Today hero "61 % adherence to the plan", Plan row "Done, 61 %",
Activity detail "6 × 800 m, target 4:00 /km, 100 % adherence".
`GET /api/v1/activities/877` → `adherence.adherence_score = 100.0`; the plan-day score comes from
`routers/plan.py:89-95` (scored against `workout_translator`'s synthetic steps).

### P1 — guard bypass (static)

`Dockerfile:32` `--host 0.0.0.0`; `config.py:45` `bind_host = "127.0.0.1"`; `docker-compose.yml`
sets neither `BIND_HOST` nor auth, and maps `8080:8000` on all interfaces → `_check_security_config`
sees a loopback bind and passes.

### Bundle (build)

`npm run build` → `dist/assets/index-*.js 1,112.39 kB │ gzip: 321.65 kB` with Vite's chunk-size warning.
