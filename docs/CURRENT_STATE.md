# Running Coach — Current State

Generated from the code on 2026-11-23. If code and this document disagree, the code wins.

## 1. Architecture overview

- **Backend process**: single `uvicorn app.main:app` process running FastAPI, an in-process APScheduler `BackgroundScheduler`, a 5-thread `ThreadPoolExecutor` (`_job_executor`) for AI jobs, a startup historical-backfill daemon thread (when env Garmin credentials are set), and ad-hoc daemon threads for manual sync requests. A scheduler event listener calls `libc.malloc_trim(0)` after each job and after backfill; the Docker image sets `MALLOC_ARENA_MAX=2` and `MALLOC_TRIM_THRESHOLD_=131072`.
- **Data store**: SQLite in WAL mode (`PRAGMA journal_mode=WAL`, `PRAGMA foreign_keys=ON`) via SQLAlchemy 2.0 (`app/database.py`). Schema migrations live in `alembic/` (`render_as_batch=True`); `init_db()` runs `alembic upgrade head` on startup (stamping `head` if `activities` exists without `alembic_version`) and seeds `metric_zones` and default `zone_configs`.
- **Frontend**: React 19 + TypeScript + Vite SPA using React Router v7, TanStack React Query (`staleTime: 30_000`, `retry: 1`), Recharts, and `react-markdown`. Production builds output to `frontend/dist`, served by FastAPI (`/assets` mount and `/{full_path:path}` catch-all). `static/sw.js` is served at `/sw.js` with `Service-Worker-Allowed: /` and `Cache-Control: no-cache`, and registered in production builds by `frontend/src/main.tsx`.

## 2. Scheduled jobs

Registered in `lifespan()` (`app/main.py`). Cron jobs use `pytz.timezone(settings.timezone)`.

| Job ID | Trigger | Behavior |
| --- | --- | --- |
| `activity_sync` | Every `ACTIVITY_POLL_MINUTES` (default 5 m) | For each connected user not flagged `garmin_needs_reauth` and not in 429 cooldown: syncs up to 20 recent activities (`include_calendar=False`), detects PRs, and enqueues auto-analysis for eligible new runs. |
| `calendar_sync` | Every `CALENDAR_SYNC_HOURS` (default 6 h) | For each eligible user: syncs 6 months of Garmin calendar workouts and races. |
| `daily_sync` | Daily at `DAILY_SYNC_HOUR`:00 (default 07:00) | For each eligible user: syncs athlete profile, calendar, and rolling `daily_sync_window_days` (default 3) summaries; then runs plan-adaptation push, 7-day race-week reminder push, morning briefing enqueue, and canary drift push. |
| `weekly_review` | Sunday 08:00 | Enqueues a `weekly_review` `AIJob` for each connected user. |
| `plan_generation` | Sunday 09:00 | Enqueues a `generate_plan` `AIJob` for each connected user. |
| `ai_job_worker` | Every 30 s | Atomically claims up to 5 oldest `pending` `AIJob`s (`_JOB_POOL_SIZE = 5`) and executes them concurrently on `_job_executor` (wait cap `_JOB_TIMEOUT_SECONDS = 120` s per batch). |
| `ai_job_reaper` | Every 10 m | Calls `reap_stuck_jobs()` (`STUCK_JOB_MINUTES = 30`). Startup also runs `reap_stuck_jobs(older_than_minutes=0)` before starting the scheduler. |

When `GARMIN_EMAIL` and `GARMIN_PASSWORD` are set, startup spawns a background backfill thread running `sync_athlete_profile()`, `backfill_activities()` (pages of 100, then `rebuild_personal_records()`), `backfill_daily_summaries()` (today back 365 days), and an initial `weekly_review()`.

## 3. Garmin sync

- **Auth and tokens** (`app/garmin_sync.py`): uses `garminconnect.Garmin`. OAuth tokens live in `{GARMIN_TOKEN_DIR}/{user_id}/`; `_migrate_flat_token_dir` moves only `oauth1_token.json`, `oauth2_token.json`, and `garmin_tokens.json` from legacy flat layouts into `/1/`. Interactive connect in Settings supports MFA (5-minute in-memory `_mfa_sessions`, `_MFA_TTL = 300` s) and encrypts passwords with Fernet (`app/crypto.py`).
- **`needs_reauth` rules** (`app/main.py`): `_authenticate_or_flag` sets `User.garmin_needs_reauth = True` (and sends a transition-only `reauth` push) only on `GarminConnectAuthenticationError` or `cryptography.fernet.InvalidToken`. Other errors log a warning without disabling scheduled sync.
- **429 cooldown** (`app/main.py`): `GarminConnectTooManyRequestsError` pauses scheduled syncs for that user starting at 30 min (`_GARMIN_COOLDOWN_BASE_SECONDS = 1800`), doubling per consecutive 429 up to 4 h (`_GARMIN_COOLDOWN_MAX_SECONDS = 14400`), cleared on the next successful sync. Manual API syncs bypass cooldown.
- **Sync payloads**:
  - *Activities*: `get_activities(0, 20)` plus per-activity summary, splits, HR zones, weather, split summaries, typed splits, and detail streams (`maxchart=10000, maxpoly=10000`). Computes `mean_max_json`, `decoupling_pct`, `efficiency_factor`, and checks personal records.
  - *Daily summaries*: rolling `daily_sync_window_days` (default 3: today + 2 prior days) via stats, user summary, heart rates, sleep, stress, and overnight HRV (including Garmin's `balancedLow`/`balancedUpper` range).
  - *Athlete profile*: full name, DOB, weight (with 30-day body-composition fallback), and resting HR; overwrites Garmin-managed fields (`name`, `date_of_birth`, `weight_kg`).
  - *Calendar*: current month + next 5 months (6 months total), plus per-workout step details and per-race shareable details (goal time, `isPrimaryEvent`, Garmin projected/predicted finish times).
- **Calendar merge and cleanup**: `_merge_calendar_event` never lets `None` overwrite a stored non-null value and never lets an un-enriched `raw_json` overwrite an enriched one (`workoutSteps`, `workoutSegments`, `_eventDetail`). Stale future events are deleted only for months in `succeeded_months`; if all months fail, cleanup is skipped.
- **Schema-drift canary**: `check_payload_fields` verifies top-level keys on `activity_summary`, `daily_stats`, `sleep_data`, `hrv_data`, `activity_stream`, and `calendar_response`, storing results in process memory (`_canary_status`).

## 4. AI coach

- **Providers** (`app/coach/providers.py`, `app/config.py`): `claude` (Anthropic SDK; default models `claude-opus-4-8`, `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`) and `gemini` (`google-genai` SDK; default models `gemini-2.5-flash`, `gemini-3-flash-preview`, `gemini-3.1-flash-lite`, `gemini-3.5-flash`, `gemma-4-26b-a4b-it`, `gemma-4-31b-it`; timeouts 120 s / 300 s for plan calls). Provider/model are stored per user in `SyncStatus`. Transient failures retry `_MAX_RETRIES = 3` times with `2**attempt` s backoff; fatal errors raise `AIFatalError` without retry.
- **Durable `AIJob` queue** (`app/coach/jobs.py`): statuses `pending`, `running`, `done`, `failed`; `max_attempts = 3`. Handlers raise on error; `_finish_claimed_job` marks `failed` immediately on `AIFatalError` or when `attempts >= max_attempts`, else returns the row to `pending`. Final failure triggers a `system_health` push and, for activity-analysis jobs, saves a tailored error `Insight` so the UI shows Re-analyze. `reap_stuck_jobs` recovers jobs stuck in `running` past 30 min (or all `running` jobs on startup), resetting retry-eligible rows to `pending` and marking exhausted rows `failed` with a `system_health` push.
- **Job types**: `_dispatch` handles `analyze_activity`, `analyze_feedback` (retained in worker dispatch; no active API route enqueues it), `generate_plan`, `weekly_review`, and `generate_briefing`.
- **Auto-analysis of new runs** (`app/main.py`): when `AUTO_ANALYZE_ACTIVITIES=true`, newly synced running activities (`training_load.is_run`) with `started_at` within the last 48 hours and no existing `activity` `Insight` enqueue `analyze_activity`.
- **Morning briefing** (`app/coach/plans.py`): enqueued once per plan day during daily sync (`SyncStatus` key `briefing_generated:{plan_day.id}`) or on demand. Context includes today's `TrainingPlanDay`, parent `TrainingPlan` phase/overview, long-run fuelling target (when applicable), today's `DailySummary` (sleep, HRV, resting HR, stress, body battery), and `_build_context` (profile, active coach memories, estimated thresholds, load, readiness, check-in, recent heat stress, 14-day activities, 8-week volume, 4-week intensity, 7-day recovery, upcoming races, next Garmin workout, last 3 insights). Sends a `briefing` push.
- **Weekly review and plan generation** (`app/coach/plans.py`): `weekly_review` summarizes the last 7 days' activities with full context and sends a `weekly_review` push. `generate_training_plan` produces a 4-week plan (`_PLAN_MAX_TOKENS = 16000`) via Anthropic forced tool-use (`generate_plan`) or Gemini `response_schema` (JSON fence-stripping fallback), incorporating prior-plan adherence, mandatory race periodization directives, and the `SeasonPlan` skeleton.
- **Chat and memory** (`app/coach/chat.py`, `app/routers/chat.py`): SSE streaming (`POST /chat`) with up to 20 most recent prior messages, full context, and the next 7 days of the active plan. Allows at most one tool call per turn: `regenerate_plan`, `adjust_upcoming_week`, `mark_setback` (creates both a `chat_setback` `Insight` and `CoachMemory(category="niggle")`), and `explain_workout`. Up to `COACH_MEMORY_CONTEXT_LIMIT = 10` active `CoachMemory` entries are injected into every coaching context.

## 5. Training science as implemented

- **TSS** (`app/training_load.py`): fallback order `power` (stored `training_stress_score`) -> `pace` (runs only, `IF = threshold_pace / avg_pace_min_km`) -> `hr` (`IF = avg_hr / threshold_hr`, fallback `0.9 * max_hr`) -> `srpe` (`IF = rpe / 10.0`) -> `duration` (`_DEFAULT_IF = 0.70`). Formula: `duration_hr * min(IF, 1.50)^2 * 100`.
- **CTL / ATL / TSB and ACWR** (`app/training_load.py`, `app/schemas.py`): `CTL_DAYS = 42` (`alpha = 1 - exp(-1/42)`), `ATL_DAYS = 7` (`alpha = 1 - exp(-1/7)`), `TSB = CTL - ATL`, persisted incrementally in `DailyLoadSeries`. `ACWR = ATL / CTL` (when `CTL > 1.0`), framed in prompts and labels as a load-spike heuristic rather than an injury predictor: `< 0.8` detraining, `0.8-1.3` productive, `> 1.3` (or `ramp_rate_7d > 7`) `moderate`, `> 1.5` (or `ramp_rate_7d > 10`) `high`.
- **Readiness** (`app/training_load.py`): 0-100 weighted composite (weights sum to 1.20 and renormalize over present inputs): `sleep` 0.25 (avg of `sleep_score` and linear 5 h->0, 8 h->100 duration), `recovery` 0.25 (avg of `100 - stress_avg` and `body_battery_high`), `fatigue` 0.20 (TSB-based: `clamp(75 + 2 * TSB, 0, 100)`), `rhr` 0.10 (`clamp(75 - 7.5 * (rhr - avg_7d), 0, 100)`), `hrv` 0.20 (`clamp(75 + (hrv_avg / hrv_weekly_avg - 1.0) * 250, 0, 100)`, fallback enum `BALANCED=85`, `UNBALANCED=50`, `LOW=30`, `POOR=20`), `subjective` 0.20 (`(avg_taps - 1) / 4 * 100`). Verdict bands: `>= 51` `Train as planned`, `31-50` `Ease off today`, `<= 30` `Rest or go very easy`. Up to two lowest components below 50 produce reason lines.
- **GAP, streams, and mean-max curves** (`app/streams.py`, `app/records.py`): Minetti running-cost polynomial (`_FLAT_COST = 3.6`, `_GRADE_CLAMP = 0.30`, floor `0.1`) using grade over a `_GRADE_WINDOW_M = 20.0` m rolling distance window. Spike caps: `_MAX_SPEED_MS = 9.0` (32.4 km/h), `_MAX_POWER_W = 2000.0`, HR `20-240` bpm. Mean-max curves span 16 `STANDARD_DURATIONS` (`5` s to `5400` s) plus rolling-window `distance_efforts` over 13 race distances (`400m` to `Marathon`, excluding treadmill). Aerobic decoupling (first vs second half pace/HR ratio drift, >= 20 samples and >= 600 s) and efficiency factor (`avg_speed / avg_hr`). Top-3 race efforts rank per-activity `distance_efforts` directly.
- **CP / CV 2-parameter model and race predictions** (`app/threshold.py`): weighted OLS fit of `output(t) = asymptote + work/t` over `_FIT_MIN_S = 120` s to `_FIT_MAX_S = 2400` s (`DEFAULT_LOOKBACK_DAYS = 90`, exponential recency `_RECENCY_TAU_DAYS = 45.0`). Clamps: `W'` `3000-40000` J, `D'` `20-600` m. Power includes treadmill; GAP pace excludes treadmill. Race predictions (5K, 10K, Half Marathon, Marathon) use `t = (D - D') / CV` up to 2400 s and extrapolate beyond with `_RIEGEL_FATIGUE_EXPONENT = 1.06`.
- **Race pacing, weather, and fuelling** (`app/pacing.py`, `app/weather.py`, `app/nutrition.py`): pacing supports `even` and `negative_split` (first half `1.02x` slower, second half `0.98x` faster) in `km` or `mile` splits, optionally scaled by heat penalty (`+0.4%/°C` above 10 °C temp + `+0.6%/°C` above 10 °C dew point; Garmin °F converted to °C). Fuelling (>= 60 min): `30 / 60 / 90` g/hr carbs (`+15` g/hr race), `6.5 mL/kg/hr` fluid (`+15%` under recent heat stress).
- **Workout adherence** (`app/adherence.py`): `adherence_for_activity` prefers Garmin calendar workout steps on the activity's date and falls back to `workout_translator.translate_plan_day` for the matched `TrainingPlanDay`. Aligns laps to steps per channel (warmup/work/rest/cooldown; 85% distance consumption for auto-lap) and averages distance score (`min(100, actual/planned * 100)`) with per-interval or aggregate pace score (`max(0, 100 - |delta|/30 * 50)`).

## 6. Plans

- **Generation and season skeleton**: `generate_training_plan` creates a 4-week plan starting `_next_monday`. `app/season_plan.py` builds a deterministic skeleton (`base`/`build`/`peak` ~45/35/20, cutback `0.8x` every 4th week, category-based taper 1-3 weeks and recovery 1-2 weeks) anchored to the nearest A-priority Garmin race, else nearest Garmin race, else profile `goal_race_date`.
- **Active plan day selection** (`app/plan_days.py`): `get_active_plan_day(db, user_id, day)` joins `TrainingPlan` and orders by `generated_at DESC, TrainingPlan.id DESC, TrainingPlanDay.id DESC` so the newest plan covering `day` always wins. Old plans remain stored.
- **Adaptation and realignment**: `app/plan_adaptation.py` downgrades `tempo`/`interval`/`long` to `rest` (readiness <= 30) or `easy` at `0.6x` distance (high `injury_risk`, active `niggle`, check-in tap <= 2, or readiness <= 50), and nudges `easy` up by `+15%` (capped `+2000 m`) at readiness >= 86 when risk is not high. `detect_plan_realignment` prompts after >= 2 missed non-rest days or a post-plan completed race within its recovery window (dismissible for 7 days).
- **Push to Garmin** (`app/workout_translator.py`, `app/garmin_sync.py`): only `easy`, `long`, `tempo`, and `interval` plan days translate and push (`rest`, `cross`, `strength`, etc. return HTTP 422). Uploads via `upload_workout` and schedules via `schedule_workout` (±5% pace tolerance; ±3% for race pacing).

## 7. Data model

20 tables defined in `app/models.py` (all data tables scoped by indexed `user_id`, defaulting to `DEFAULT_USER_ID = 1`):

| Table | Model | Purpose |
| --- | --- | --- |
| `users` | `User` | User identity, Garmin email, encrypted Garmin password, `garmin_needs_reauth` flag |
| `activities` | `Activity` | Synced activities with metrics, JSON blobs (laps/streams, splits, zones, weather, mean-max), decoupling/EF, RPE |
| `daily_summaries` | `DailySummary` | Per-day Garmin wellness (steps, calories, HR, sleep, stress, body battery, HRV + baseline range) |
| `daily_checkins` | `DailyCheckin` | Per-day self-reported soreness/energy/mood (1-5) and optional `soreness_note` |
| `insights` | `Insight` | AI outputs keyed by `trigger_type` (`activity`, `briefing`, `weekly_review`, `chat_setback`, legacy `daily_summary`) |
| `garmin_calendar_events` | `GarminCalendarEvent` | Synced Garmin races (distance, goal/projected/predicted times, priority) and scheduled workouts |
| `metric_zones` | `MetricZone` | Seeded global Garmin percentile bands for running dynamics (cadence, GCT, vert. osc., vert. ratio) |
| `sync_status` | `SyncStatus` | Per-user key-value store (sync timestamps, AI provider/model, notification prefs, dedup keys, caches) |
| `athlete_profiles` | `AthleteProfile` | Per-user demographics (Garmin-managed name/DOB/weight), thresholds, and plan preferences |
| `zone_configs` | `ZoneConfig` | Per-user threshold-anchored HR, pace, and power zones (5 zones each) |
| `training_plans` | `TrainingPlan` | AI-generated 4-week plan header (`week_start`, `phase`, `overview`, `raw_json`) |
| `training_plan_days` | `TrainingPlanDay` | Daily workout prescriptions linked by `plan_id` (including optional `routine_id`) |
| `season_plans` | `SeasonPlan` | Deterministic season-long periodization header anchored to a goal race |
| `season_plan_weeks` | `SeasonPlanWeek` | Per-week phase and target weekly km belonging to a `SeasonPlan` |
| `ai_jobs` | `AIJob` | Durable AI task queue (`task_type`, `payload_json`, `status`, `attempts`, `max_attempts`, timestamps) |
| `chat_messages` | `ChatMessage` | Persisted user/assistant chat turns, optional `activity_id`, and `actions_json` |
| `coach_memories` | `CoachMemory` | Durable athlete facts (`niggle`, `constraint`, `preference`, `note`) with `active` flag |
| `daily_load_series` | `DailyLoadSeries` | Incremental per-day TSS, CTL, ATL, TSB, ACWR, ramp rates, `injury_risk`, and sport breakdown |
| `personal_records` | `PersonalRecord` | Append-only duration (`power`, `gap_speed`) and race-distance all-time best milestones |
| `push_subscriptions` | `PushSubscription` | Browser Web Push endpoints and encryption keys (`p256dh`, `auth`) |

## 8. API surface

All routes below are mounted under `/api/v1` via `app/api.py` with `Depends(get_current_user)`. `app/main.py` also serves `GET /sw.js` and `GET /{full_path:path}` (SPA catch-all).

### `app/routers/daily.py`
| Method & path | Purpose |
| --- | --- |
| `GET /today` | Selected-date dashboard (activities, summary, 8-week volume, insights, races, workouts, load, readiness, adaptation, check-in, briefing) |
| `POST /daily-checkin` | Upsert daily soreness/energy/mood check-in; auto-records a niggle memory after 3 consecutive sore check-ins (<= 2) with matching note |
| `GET /daily-summaries` | Paginated daily summaries, newest first |
| `GET /daily-summaries/{summary_id}` | Single daily summary with that day's activities and any stored daily insight |
| `GET /insights` | Recent AI insights with optional `category` filter |
| `POST /sync/{sync_type}` | Spawn background sync thread for current user (`activities`, `daily`, or `calendar`) |
| `GET /jobs/{job_id}` | Poll status of a user-owned `AIJob` |
| `POST /jobs/{job_id}/retry` | Reset a `failed` `AIJob` to `pending` |

### `app/routers/activities.py`
| Method & path | Purpose |
| --- | --- |
| `GET /activities` | Paginated activity summaries (optional `type` filter) with personal record badges |
| `GET /activities/{activity_id}` | Full activity detail (splits, zones, weather/heat pace, charts, route, adherence, insight, PRs); lazy-backfills route and aerobic metrics |
| `POST /activities/{activity_id}/analyze` | Enqueue `analyze_activity` `AIJob` |
| `PATCH /activities/{activity_id}/rpe` | Save Borg CR10 RPE (1-10) and mark `DailyLoadSeries` dirty |

### `app/routers/calendar.py`
| Method & path | Purpose |
| --- | --- |
| `GET /calendar` | Month grid (`month=YYYY-MM`) of activities and calendar events with parsed steps |
| `GET /calendar/week` | Monday-Sunday week around `date` of activities and calendar events |
| `GET /calendar-events/{event_id}` | Single calendar event with parsed workout steps and race fuelling guidance |

### `app/routers/settings.py`
| Method & path | Purpose |
| --- | --- |
| `GET /me` | Current authenticated user email and name |
| `GET /settings` | Row counts for activities, daily summaries, insights, and calendar events |
| `GET /health-detail` | Last sync times, schema canary status, recent failed/stuck jobs, Garmin and push state |
| `GET /ai-config` | Active AI provider/model and allowed model catalog |
| `POST /ai-config` | Persist per-user AI provider and model |
| `GET /garmin-credentials/status` | Garmin connection, pending MFA, and `needs_reauth` status |
| `POST /garmin-credentials` | Start Garmin login (requires `ENCRYPTION_KEY`); returns `connected` or `mfa_required` |
| `POST /garmin-credentials/mfa` | Complete pending Garmin MFA login with one-time code |
| `DELETE /garmin-credentials` | Disconnect Garmin and remove cached client and token directory |
| `GET /athlete-profile` | Current user's athlete profile (with derived `age`), or `null` |
| `POST /athlete-profile` | Upsert athlete profile (ignores Garmin-managed `name`, `date_of_birth`, `weight_kg`) |
| `GET /zones` | Custom HR, pace, and power zones with threshold-computed bounds |
| `PUT /zones` | Bulk-update existing `ZoneConfig` rows |
| `GET /threshold-estimate` | Auto-estimated CP/W', threshold pace, LTHR, and max HR vs current profile |
| `POST /threshold-estimate/apply` | Apply selected (or all available) threshold estimates to the athlete profile |

### `app/routers/trends.py`
| Method & path | Purpose |
| --- | --- |
| `GET /training-load` | Daily CTL/ATL/TSB/ACWR/ramp-rate series (`days` 7-365) and current snapshot |
| `GET /wellness-trends` | Daily summaries over the last `days` (7-365) |
| `GET /intensity-trends` | Weekly HR or power time-in-zone buckets and 3-zone polarization split |
| `GET /performance-curve` | Mean-max power/pace frontiers, CP/CV fits, race predictions, optional window comparison |
| `GET /personal-records` | Current duration/distance PRs, recent PR feed, and top-3 per-activity efforts per race distance |
| `GET /aerobic-trends` | Per-run aerobic decoupling % and efficiency factor over `days` (30-365) |

### `app/routers/plan.py`
| Method & path | Purpose |
| --- | --- |
| `GET /strength-routines` | Static strength/mobility routine library with demo URLs |
| `GET /training-plan` | Latest 4-week plan with hydrated routines, long-run fuelling, matched activities, and adherence |
| `POST /training-plan/generate` | Enqueue `generate_plan` `AIJob` |
| `POST /training-plan/days/{day_id}/briefing` | Enqueue `generate_briefing` `AIJob` for a plan day |
| `GET /season-plan` | Deterministic season-long periodization skeleton to goal race, or `null` |
| `POST /training-plan/adapt-day` | Accept or dismiss today's rule-based adaptation suggestion |
| `GET /training-plan/realignment-status` | Missed-session / post-race realignment prompt status |
| `POST /training-plan/realign` | Enqueue plan regeneration or dismiss banner for 7 days |
| `POST /training-plan/days/{day_id}/push-to-garmin` | Translate and push a run plan day (`easy`, `long`, `tempo`, `interval`) to Garmin |

### `app/routers/races.py`
| Method & path | Purpose |
| --- | --- |
| `GET /races/{race_id}/pacing` | Split-by-split pacing plan (`even` or `negative_split`, `km`/`mile`, optional heat conditions) |
| `POST /races/{race_id}/pacing/push` | Upload and schedule a race pacing plan to Garmin |

### `app/routers/export.py`
| Method & path | Purpose |
| --- | --- |
| `GET /export/activities` | Download user activities as CSV or JSON |
| `GET /export/insights` | Download user insights as CSV or JSON |

### `app/routers/chat.py`
| Method & path | Purpose |
| --- | --- |
| `GET /chat` | Recent chat messages (default `limit=50`, chronological) |
| `DELETE /chat` | Delete all chat messages for current user |
| `POST /chat` | Save user message and stream SSE coach reply (tokens, tool actions, `[DONE]`) |
| `GET /coach-memory` | List coach memory entries |
| `POST /coach-memory` | Create a coach memory entry |
| `PUT /coach-memory/{memory_id}` | Update a coach memory entry (including `active`) |
| `DELETE /coach-memory/{memory_id}` | Delete a coach memory entry |

### `app/routers/notifications.py`
| Method & path | Purpose |
| --- | --- |
| `GET /push/vapid-public-key` | Return server VAPID public key and configured flag |
| `POST /push-subscriptions` | Register or update a Web Push subscription by `endpoint` |
| `DELETE /push-subscriptions` | Remove a Web Push subscription for current user |
| `GET /notification-preferences` | Return per-category preferences (8 categories), labels, and push state |
| `PUT /notification-preferences` | Update per-category Web Push opt-in/out preferences |

## 9. Frontend

- **Routes** (`frontend/src/App.tsx`): 14 routes. `/` (`TodayView`) is eagerly imported; the other 13 (`/activities`, `/activities/:id`, `/daily`, `/daily/:id`, `/workouts/:id`, `/trends`, `/plan`, `/plan/setup`, `/settings`, `/settings/:section`, `/info/:topic`, `/onboarding`, `/chat`) are `React.lazy` with manual Vite chunks for `react`, `charts`, and `markdown`. Bottom navigation links to **Today**, **Plan**, **Coach**, **Activities**, and **Progress**. Missing athlete profile redirects to `/onboarding`.
- **Today screen** (`TodayView.tsx`, `TodayHero.tsx`): realignment banner (when triggered), `WeekRail`, `TodayHero` (readiness verdict line with expandable 6-component breakdown + session block showing planned workout, inline briefing, and Send-to-watch OR completed session, rep chart, adherence, and inline 1-10 `EffortPrompt`), `DailyCheckinCard` (shown before a running activity exists today, or once saved), optional `PlanAdaptationCard`, `BodyPanel`, `RacesPanel`, `CoachNotes`, and any extra same-day activities.
- **Progress tabs** (`TrendsView.tsx`): **Body** (wellness trends), **Fitness** (Fitness & fatigue, Weekly volume, Performance curve, Intensity, Aerobic efficiency), and **Records** (peak performances).
- **Settings sections** (`SettingsView.tsx`, `SettingsSectionView.tsx`): index links into 7 sub-pages under `/settings/:section` — `profile`, `zones` (threshold estimates + zone editor), `garmin` (connect/MFA + manual sync), `coach` (coach memory + AI model), `notifications` (device push toggle + 8 categories), `appearance` (system/dark/light), and `data` (CSV/JSON export, DB counts, system health).

## 10. Security and deployment

- **Authentication** (`app/auth.py`): `AUTH_ENABLED=true` verifies `Cf-Access-Jwt-Assertion` (RS256) against `https://{CF_ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs` (1 h JWKS cache) and `CF_ACCESS_AUD`, upserting `User` by email. `AUTH_ENABLED=false` uses `DEV_USER_EMAIL` / `GARMIN_EMAIL` / `dev@localhost`.
- **Bind guard** (`app/main.py`, `Dockerfile`, `docker-compose.yml`): `_check_security_config()` refuses startup when `AUTH_ENABLED=false` and `BIND_HOST` is non-loopback, unless `ALLOW_INSECURE_BIND=true`. `Dockerfile` and `docker-compose.yml` set `BIND_HOST=0.0.0.0` so the guard always sees the container bind.
- **Secrets and transport**: per-user Garmin passwords are Fernet-encrypted with `ENCRYPTION_KEY`. `docker-compose.yml` binds `127.0.0.1:8080:8000` (loopback only on the host), Watchtower is restricted by `WATCHTOWER_LABEL_ENABLE=true`, and `.github/workflows/docker-publish.yml` publishes `:latest` only after `Tests` passes on a push to `main`.

## 11. Known limitations

Open items confirmed against code and `docs/SECOND_OPINION_REVIEW.md` (§5, §7.1):

- **Single-household deployment**: multi-user plumbing exists, but default zone seeding runs once for user #1, startup backfill only uses env credentials, `TIMEZONE`/`DAILY_SYNC_HOUR` are global, canary state is in-memory, and `GET /activities/{id}`'s on-demand route backfill authenticates without passing `current_user` (A4, P4, X2).
- **Auth and hardening gaps**: container runs as root; CF Access JWT verification skips `iss`, does not refresh JWKS on unknown `kid`, and does not fail closed at startup on empty domain/AUD; push subscription endpoints are unvalidated and overwrite `user_id` on collision; Garmin OAuth tokens are plaintext on disk; CSV export is not formula-escaped; compose healthcheck ignores HTTP status (P3, P5, P6, G5).
- **Schema and concurrency debt**: zero `ForeignKey` constraints across 20 tables while `user_id` defaults to `1`; `Activity` stores large JSON blobs inline; `SyncStatus` mixes settings, dedup keys, and unbounded performance-curve range caches; manual sync spawns raw daemon threads without per-user locking; dismissing an adaptation twice triggers a unique-constraint 500; `init_db()` silently stamps `head` on unstamped DBs (D1-D4, D6, A5, A6).
- **AI coach guardrails**: no deterministic post-generation validator on AI plans and no explicit medical red-flag deferral; no prompt caching or spend caps; `mark_setback` always records `category="niggle"` and chat plan tools run without confirmation; provider error/retry logic is duplicated across `providers.py`, `plans.py`, and `chat.py`; `app/ai_coach.py` remains as a test monkeypatch shim (I2-I6, N10).
- **Analytics caveats**: existing stored `mean_max_json` curves are not recomputed after the 9 m/s speed-cap and 20 m GAP-window change; CTL blends power/average-pace/HR/sRPE/duration TSS and profile threshold edits do not invalidate `DailyLoadSeries`; weather heat adjustment adds temperature and dew-point terms directly; negative-split totals can drift slightly on odd distances; browser pace time-in-zone (`PaceZonesChart`) aggregates ~200 decimated samples (S2 note, S4, S6, S7, N3).
- **Frontend and CI caveats**: Onboarding "Skip for now" loops back while profile is `null`; `ChatView` does not abort SSE streams on unmount or invalidate caches on tool actions; CI tests run Python 3.11 vs Python 3.12 in Docker; tests build tables via `create_all()` instead of Alembic; `perf/` benchmarks query relative dates against a static committed `perf/perf.db` (F2, F5, T2-T4).
