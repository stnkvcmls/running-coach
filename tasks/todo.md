# Phase 3 — Data Isolation (multi-user)

Goal: every row, query, computation, and sync job is scoped to one user.
Migration ships as a new Alembic revision (P3-3 retired the hand-rolled helper).

Convention: `DEFAULT_USER_ID = 1` is the primary/bootstrap user. Data columns
default to it; the migration backfills existing rows to it; compute/sync
functions default their `user_id` scope to it. API and scheduler always pass an
explicit user, so the default is only the single-tenant/test fallback.

## Tasks
- [x] models.py: `user_id` on Activity, DailySummary, Insight, Race,
      GarminCalendarEvent, AthleteProfile, ZoneConfig, TrainingPlan,
      TrainingPlanDay, SyncStatus. Composite uniques. `User.garmin_needs_reauth`.
- [x] alembic revision `c3d4e5f6a7b8`: add `user_id` (server_default="1" backfill),
      rework single-tenant uniques into per-user (batch mode for SQLite).
- [x] garmin_sync.py: per-user sync (`user` arg), write `user_id`, scope queries,
      per-user SyncStatus helpers, `mark_garmin_needs_reauth` + status field.
- [x] compute paths: `user_id` scope in training_load, threshold, intensity, streams
      (incl. per-user SyncStatus caches).
- [x] ai_coach.py: thread `user_id` through context build, analyze_*, plan, review;
      derive user from the trigger row where possible.
- [x] api.py: inject `current_user`, filter every query, pass user scope to compute;
      manual `/sync` scoped to the caller.
- [x] main.py scheduler: iterate Garmin-connected users, isolate failures, flag
      `needs_reauth` when a cron can't authenticate.
- [x] frontend: `needs_reauth` type + Reconnect banner in Settings.
- [x] docs/IMPROVEMENT_PLAN.md: rewrote P3-4 bullet.
- [x] perf/perf.db: regenerated at new head (user_id=1).
- [x] tests: suite green (440) + new test_data_isolation.py; updated garmin_sync/main
      tests for the new signatures/scheduler. Coverage 84.8% ≥ 80%. Frontend build +
      50 vitest green. Perf 34 passed.

## Review

**Convention `DEFAULT_USER_ID = 1`.** The app was single-tenant, so every data
column defaults to user 1, the migration backfills existing rows to user 1, and
compute/sync helpers default their `user_id` scope to 1. Production read/write
paths (API → `current_user.id`, scheduler → iterated user) always pass an explicit
id, so the default only ever covers the bootstrap account and the test suite. This
kept ~100 existing test data-instantiations and compute call-sites green untouched.

**Migration (Alembic `c3d4e5f6a7b8`).** Adds `user_id` to ten tables with
`server_default="1"` (the backfill), plus `users.garmin_needs_reauth`. The initial
schema had declared single-column uniqueness as *both* a unique index and an
unnamed UNIQUE constraint, so for `activities`/`daily_summaries`/
`garmin_calendar_events` the index is demoted to a plain lookup index and the
constraint is replaced (batch mode + naming convention) with a composite
`(user_id, …)`. `zone_configs` and `sync_status` get composite uniques the same
way. Verified end-to-end: backfill → per-user duplicates allowed, same-user
duplicates rejected.

**Scheduler.** The four cron jobs now iterate `_iter_garmin_users()` (Garmin
connected, not flagged `needs_reauth`) and run each user in isolation — one
failure can't abort the rest. `_authenticate_or_flag` validates the user's Garmin
client up front; a cron can't answer an MFA prompt, so on auth failure it sets
`needs_reauth` and skips, and Settings surfaces a Reconnect action that clears the
flag. The manual `/sync` endpoint is scoped to the calling user.

**Models, not FKs.** Following the existing convention (`TrainingPlanDay.plan_id`
is a plain indexed int, not a `ForeignKey`), `user_id` is a plain indexed integer.
