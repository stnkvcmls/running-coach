# Colour pass — less grey, same rules (2026-11-24)

Spec: docs/mockups/colour-pass-before-after.html (agreed with Gemini, approved by owner).
Branch: feat/colour-pass.

## Tasks
- [x] globals.css: new neutrals (light + dark), `--body` / `--body-subtle` tokens,
      1px border on `.card`, `.badge-effort` 14% zone tint.
- [x] Panels outside `.card` get the border: group-list, detail-panel, stat-info-card,
      plan-days, plan-week-tile, season-timeline, set-list, pr-card.
- [x] Chrome on card: TopBar, Coach composer.
- [x] chartTheme.ts: `BODY_COLOR`, `zoneGradientStops()` (+ tests).
- [x] Today: readiness meter petrol (verdict text ink); hero session divider 3px zone +
      tinted kind pill; WeekRail missed dashed in zone colour, rest hollow outline;
      BodyPanel in-range petrol dot / out-of-range ink pill; Form fitness petrol, no area.
- [x] Plan: week mini-bars in zone colour (done solid / planned 50% / missed outline);
      week-km bar stacked by session; 4px zone bar per row (replaces dot; today full-height).
- [x] Run analysis: line metrics with zones stroked by zone, no area fill; rep bands neutral.
- [x] Progress body trends: petrol line, band and in-range dot; out-of-range ink pill.
- [x] Settings: green "ok" dot -> ink check.
- [x] docs/UI_UX_CRITIQUE.md §5: amend principle 1 + token table.
- [x] Verify: typecheck, vitest, build, real-browser screenshots light/dark vs mockup.

## Review
- Typecheck clean; vitest 355/355 (+4 new in chartTheme.test.ts for `zoneGradientStops` and `hrZoneBands`); `vite build` OK.
- Real browser (Playwright, built app on a copy of `perf/perf.db`, clock faked to
  2026-06-23 18:30, light + dark): Today, Plan, run analysis, Progress body,
  Progress fitness, Settings, Coach all match the mockup.
- Beyond the mockup, decided during implementation:
  - HR trace zones come from Garmin's per-run `hr_zones[].zoneLowBoundary`
    (`metric_zones` has no heart-rate rows); falls back to an ink line without them.
  - Readiness verdict text is ink in every verdict (it was Z4/Z5 text for
    ease/rest, and Z4 is 3.1:1 as text); the meter and component bars are petrol.
  - Browser `theme-color` now follows `--bg-card` (the top bar), not `--bg`.
  - Coach empty-state heading/icon to full ink (Gemini round-1 note).
- Not mocked, unchanged by rule: bottom nav, buttons, chips (ink).

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

---

# Today view: matched workout tagging

Goal: when an activity fulfils a scheduled workout on the same day, the
scheduled card disappears from Today and the activity is tagged as a workout.

## Tasks
- [x] schemas.py: add `workout_tag` to `ActivitySummary`.
- [x] routers/daily.py `/today`: match activities to scheduled workouts by
      same-day + sport category; drop matched workouts from `scheduled_events`,
      set `workout_tag` on the matched activity summary.
- [x] frontend types + WorkoutCard: render a "Workout" badge when tagged.
- [x] tests: matched run consumes the scheduled card + tags the activity;
      non-matching sport leaves the scheduled card and no tag.

## Review
- Matching reuses the existing `_categorize_activity_type` grouping so a run
  fulfils a running workout while a ride/walk does not; each workout claims at
  most one activity (1:1), and workouts with no matching activity stay scheduled.
- Backend change is confined to `/today`; the activity-detail page still shows
  the planned workout + adherence unchanged.

# UI/UX redesign (plan only — see docs/UI_UX_REDESIGN_PLAN.md)

Goal: execute the phased UI/UX redesign. Each phase is one focused session,
independently shippable; full specs, file lists, and acceptance criteria live
in the plan doc. Follow its "Global rules for the implementing agent".
Visual target per phase: docs/mockups/ui-redesign-mockup.html (toggle
"Show component labels" to cross-reference elements against plan tasks).

## Phases
- [x] Phase 0 — Design-system foundation & defect fixes (tokens, `--surface`
      fix, shared buttons, chart theme, toast + skeleton primitives)
- [x] Phase 1 — Navigation & IA (5-tab nav, Settings behind avatar, sync
      status pill, reconnect orphaned /daily route, planned-dots on calendar)
- [x] Phase 2 — Today screen hierarchy (TodayHero: readiness × session ×
      briefing, compact alerts/races, check-in collapse, skeletons)
- [x] Phase 3 — Activity list & detail (rich rows, weekly totals, sticky
      detail header, insight verdict chip, SplitsBars)
- [x] Phase 4 — Plan & calendar (day completion states, WorkoutStructureBar,
      informative week tabs, auto-select current week)
- [x] Phase 5 — Trends → Progress (tab chrome, RangeSelector, chartTheme
      adoption, records celebration)
- [x] Phase 6 — Accessibility, responsive desktop layout & polish (semantics
      sweep, chart aria-labels, reduced-motion, desktop two-column layout +
      nav rail, empty states, onboarding closing step, tap targets)

## Review (2026-07-10)
- [x] Post-implementation review of Phases 0–6 against the plan + mockups —
      findings and follow-up plan in docs/UI_UX_REDESIGN_REVIEW.md.
      Verdict: faithful implementation; 2 mobile-only layout bugs (detail-page
      section order no-op, sticky week headers under TopBar), UTC "today" in
      plan state, no error boundary, sync-pill semantics — all specced as
      Follow-up Phases A–D in the review doc.

## Follow-up Phases A–D (2026-07-10)
- [x] Phase A — Layout & correctness bugs: `.detail-body` flex column (A1);
      `.group-head` sticky offset *and* the actual root cause — `.app-main`'s
      dead `overflow-y: auto` was silently breaking every sticky descendant's
      containing block (A2, two commits — see lessons.md); local-timezone
      `todayStr()` (A3, new regression test); `ErrorBoundary` wrapping
      `<Routes>` (A4); `useSyncStatus` no longer reports `syncing` from its
      own poll (A5).
- [x] Phase B — Today hero completeness: Send-to-watch + View-in-plan actions
      on the planned state (B1); ring `subLabel` (B2); adherence appended to
      the completed line once the matched activity's detail loads it (B3);
      race strips capped at 2 + "Show all N races" (B4).
- [x] Phase C — Consistency & polish: `getActivityAccent` sport-colour tint
      for non-run activities (C1); Send-to-watch gated to today/upcoming
      plan rows (C2); avg HR in activity rows (C3); mixed time/distance
      `WorkoutStructureBar` segment weights (C4); rhythm/chevron/AdherenceCard
      wrap fixes (C5); consolidated `.spin` CSS — found and fixed a second
      hidden cross-file dependency (`spin-icon`) beyond the one the review
      flagged (C6).
- [x] Phase D1 — `personal_records` additively exposed on the activities-list
      and Today `ActivitySummary` payloads (batched query, not N+1); PB badge
      on `ActivityListItem`; `celebrateNewRecords` now fires from the
      Activities list. D2/D3 deliberately not attempted (bigger, out of scope).
- Verification: `frontend && npm run build && npm test` green (212 tests,
  +30 new). `pytest` green (982 tests excluding `test_notifications.py`,
  which needs a `pywebpush` stub in this container — see lessons.md).
  Fixture-driven Playwright screenshots at 390×844 for every phase's
  user-visible change (detail order, sticky header, hero states, races,
  activities list icons/HR/PB badge, AdherenceCard wrap, Plan row gating).

# UI/UX critique & change proposal (2026-11-02, plan only)

Goal: critique the shipped UI/UX against real seeded data and propose changes
with mockups. Deliverables: docs/UI_UX_CRITIQUE.md,
docs/mockups/ui-ux-critique-mockup.html, docs/mockups/ui-ux-critique/*.

- [x] Run backend on a copy of perf/perf.db + Vite; pin browser and server
      clocks to 2026-06-23 so Today/Plan/load agree
- [x] Capture 390×844 / 1280×800, dark + light, every main tab + detail + settings
- [x] Trace each finding to code (`file:line`); exclude seed artifacts
- [x] Design direction for the default skin (effort-only colour, Archivo, ink actions)
- [x] HTML mockups (7 screens, light/dark, change-ID overlay) + rendered PNGs
- [x] Implementation plan (7 phases) in the doc

## Review
Found 5 S1 issues: same-day AI-plan runs not matched (Today hero still offers
"Send to watch" after the run; Plan shows 0.0/73 km), "Week N Overview"
headline is an 8-week total, Wellness y-axis clips "100" to "00", and
readiness number ~1.1:1 contrast in light mode. Biggest S2 theme: global
week strip renders on 5 tabs but only Today reads DateContext. Phases 1–2 of
the doc's plan clear every S1 item and most daily friction.

## Revision (2026-11-02, after owner answers)
- [x] Re-baselined on the Nothing skin branch (`origin/claude/activity-nothing-theme-ui-4qgdfo`,
      unmerged, fast-forward from main). Added N1–N7 skin defects (blank badges on
      signal/black, "17.15542" steps+HRV, overlapping hero numerals, readiness
      ~1.4:1 on app inks/white, dot-matrix on every stat, 9px labels at 3.1–3.9:1,
      colour leaks).
- [x] Q1: dropped the default-skin identity proposal; mockups redrawn in the
      skin's vocabulary (Black/White × Signal/App inks).
- [x] Q2: RPE asked on Today's done hero; detail page stays as edit point.
- [x] Q3: Garmin HRV baseline/status for HRV; 10th–90th percentile of 90 days
      for RHR, sleep, body battery, stress.
- [x] Plan now starts with Phase 0 "land the skin" (fix N1–N7, then merge).
- Lesson recorded in tasks/lessons.md (check for unmerged implementation branches).

## Revision 2 (2026-11-02): Nothing skin discarded
Owner: "discard nothing os theme, i don't like it and it's unreadable".
- [x] Reverted the critique to the `main`/default-skin baseline and the §5
      effort-colour direction (Archivo, Garmin-zone effort scale, ink actions),
      now marked approved. N1–N7 and Phase 0 removed.
- [x] Phases reordered: visual identity is Phase 3, before the Today/Plan/
      Activities rewrites, so new components are built on the new tokens once.
- [x] Q2 (RPE on Today) and Q3 (Garmin HRV baseline + 90-day percentile bands
      for the rest) recorded as decisions; Q3 implementation is task 4.6
      (verify Garmin field names against a live payload first).
- [x] Mockup restored to the effort-colour design with the decisions applied;
      "current" screenshots recaptured from `main`.
- [x] `docs/NOTHING_OS_SKIN_PLAN.md` marked abandoned. Skin branch left
      unmerged; deleting it is the owner's call.

# UI/UX critique implementation (branch claude/ui-ux-critique-implementation)

Spec: docs/UI_UX_CRITIQUE.md §7 (+ §5 tokens, §8 decisions). Visual target:
docs/mockups/ui-ux-critique-mockup.html. One commit per phase, single PR.
Baseline: frontend 212 tests (2 load-flaky on this machine, pass in isolation),
tsc clean.

## Waves
- [x] Wave A (parallel): B1 backend — 1.1 same-day plan matching, 4.6 Garmin
      HRV baseline (sync + migration + schema + tests) · F1 frontend — 1.3 axis,
      1.4 readiness contrast, Phase 2 chrome/IA (week strip on Today only,
      training-context subtitle, System/Light/Dark + Appearance section, sync pill
      only when wrong, Progress tabs Body/Fitness/Records). 1.2 superseded by 4.5.
- [x] Wave B: F2 — Phase 3 visual identity (tokens, effort scale, Archivo
      self-hosted, ink actions, sentence case, no shadows)
- [x] Wave C (parallel): F3 — Phase 4 Today · F4 — Phase 7 Settings index
- [x] Wave D (parallel): F5 — Phase 5 Plan · F6 — Phase 6 Activities, detail, Progress Body
- [x] After each wave: build + tests + real-browser screenshots (390/1280, light/dark)
      against perf.db with pinned clocks; fix; commit
- [x] PR #153

# Second-opinion week 1 (branch fix/second-opinion-week1)

Source: docs/SECOND_OPINION_REVIEW.md §4/§7. Implementation drafted by Gemini
(agy), reviewed and gated by Claude.

- [x] P1 Docker guard: image sets BIND_HOST=0.0.0.0 and uvicorn binds ${BIND_HOST};
      compose publishes 127.0.0.1:8080 and passes BIND_HOST/ALLOW_INSECURE_BIND.
      (Non-root USER deferred: existing root-owned ./data volumes would break on upgrade.)
- [x] P2 CI: image publishes only after Tests succeed on main; Watchtower label-scoped.
- [x] A2 `get_active_plan_day()` (latest plan wins) used by /today, adaptation push,
      briefing enqueue, chat explain_workout.
- [x] I1 chat history = newest N, oldest-first.
- [x] G3 calendar sync never deletes events in months that failed to fetch.
- [x] G4 only run types (easy/long/tempo/interval) translate/push; UI hides push otherwise.
- [x] N4 token-dir migration moves only known token files.
- [x] Tests for each; full backend + frontend suites green; tsc clean.

## Review

- Drafted by Gemini 4 Neon XHigh (agy, accept-edits) from one spec; reviewed by Claude.
- Claude change on review: `docker-publish.yml` also requires
  `workflow_run.event == 'push'` and the head repo to be this repo; otherwise a
  fork PR whose branch is named `main` would satisfy `branches: [main]` and publish.
- Checked other `TrainingPlanDay` date queries (`coach/chat.py:70`,
  `coach/plans.py:266,699`): all already scoped to the latest plan's `plan_id`.
- Gates: backend pytest green (exit 0, `PYTHONUTF8=1` on Windows); every new
  test fails on the pre-fix `app/` (stash check); frontend vitest 346/346,
  `tsc --noEmit` clean, `vite build` OK.
- Runtime: on a copy of perf.db with a newer plan inserted, `/today?date=2026-06-24`
  now returns the new plan's day (31, rest) and Today renders "Rest day",
  matching the week strip (before: stale day 3, empty "Easy" card).
- Deploy note: with BIND_HOST now honest, an instance running AUTH_ENABLED=false
  refuses to start unless ALLOW_INSECURE_BIND=true. Compose now publishes on
  127.0.0.1 only. Non-root USER deferred (root-owned ./data volumes).

# Second-opinion week 2 (branch fix/second-opinion-week1)

- [x] A3+reaper — let AI job handlers propagate errors, fail fast on AIFatalError, write error insights on final failure, reap stuck running jobs on startup & every 10 min, single `concurrent.futures.wait`, route scheduled review/plan through AIJob queue
- [x] G2 — flag `garmin_needs_reauth` only on real auth/decryption errors; add exponential 429 cooldown (30 min to 4 h) for scheduled Garmin sync loops
- [x] G1 — decouple calendar sync from 5-min activity poll into its own scheduled job (`CALENDAR_SYNC_HOURS=6`) + daily sync; break/store/re-raise on 429 in `sync_calendar`
- [x] F1 — serve `/sw.js` at root scope with `Service-Worker-Allowed: /`, rewrite `static/sw.js` (`running-coach-v5`), register in production `main.tsx`, use `getRegistration()` in `NotificationsSection`, align `manifest.json` theme colors
- [x] N9 — expose Garmin/push/stuck-job status on `/health-detail` and push status on `/notification-preferences`; reflect them honestly in `settingsSummary.ts` and `SystemHealthSection.tsx`
- [x] T1 — end-to-end tests in `tests/test_e2e_core_loop.py` covering plan regeneration -> Today, transient job failure -> `/health-detail`, and 30-message chat continuity

## Review

- Drafted by Gemini 4 Neon XHigh (agy, accept-edits) from one spec; reviewed by Claude.
- Claude changes on review:
  - Startup reap uses `older_than_minutes=0` (nothing can be running before the
    scheduler starts); periodic reaper + health "stuck" threshold share
    `STUCK_JOB_MINUTES = 30` (15 min could re-run a live plan generation).
  - `sync_calendar` upsert now goes through `_merge_calendar_event`: a None never
    overwrites a stored value and an un-enriched raw_json never replaces one with
    workout steps / race detail. Pre-existing bug (any failed detail fetch wiped
    goal times), made routine by the new 429 early-stop. 3 tests added.
- Gemini went beyond spec in `garmin_sync.py`: 429 now propagates out of
  `sync_activities` / `sync_daily_summary` / `sync_athlete_profile` and the
  workout/race detail fetchers so callers can start the cooldown. Reviewed; kept.
- Gates: backend pytest exit 0 (1,063 tests); every new week-2 test fails or
  errors on the pre-week-2 code; frontend vitest 351/351, `tsc --noEmit` and
  `tsc -b && vite build` clean.
- Runtime (perf.db copy, clock pinned): stale `running` job -> `pending` with
  "Interrupted" on restart; `/sw.js` 200 with `Service-Worker-Allowed: /`;
  production build registers the SW at `/` (active); Settings shows
  "Notifications: Not set up on server" and "System health: Garmin not
  connected" instead of "8 of 8 on" / "All checks pass"; scheduler lists
  Calendar Sync (6 h) and AI Job Reaper.

# Second-opinion week 3 (branch fix/second-opinion-week1)

- [x] S1 — base readiness fatigue component on TSB (`75 + 2 * TSB`) instead of `100 - ATL`; fix `WEIGHTS` sum comment (1.2, renormalised)
- [x] S2 — lower speed spike cap `_MAX_SPEED_MS` to 9.0 m/s with accurate comment; switch `grade_adjusted_speed` to a 20 m distance-window two-pointer grade
- [x] S5 — rewrite `get_distance_top_n` to rank real per-activity `distance_efforts` (transient `PersonalRecord` objects) rather than PR milestone rows
- [x] N1 — unify activity-detail and training-plan adherence behind `adherence_for_activity` (Garmin workout event first, plan-day translation fallback)
- [x] U2 (+auto-analysis) — add `PATCH /activities/{id}/rpe` + `mark_activity_load_dirty`, switch `TodayHero` RPE buttons to `useSetRpe`, and auto-enqueue `analyze_activity` for newly synced recent runs (`AUTO_ANALYZE_ACTIVITIES`)
- [x] D5 — add `local_today()` in `app/utils.py` using `settings.timezone` (`zoneinfo`) and replace all `date.today()` calls in `app/`
- [x] N6 — replace over-confident ACWR "injury risk" and Running Dynamics percentile framing in `SYSTEM_PROMPT`, `classify_acwr`, `_interpret_acwr`, and `format_training_load_context`

## Review

- Drafted by Gemini 4 Neon XHigh (agy, accept-edits) from one spec; reviewed by Claude.
- Claude changes on review:
  - Three stale assertions in `tests/test_training_load_edge.py` ("high risk",
    "moderate risk", "sweet spot") that Gemini missed, updated to the new wording.
  - `frontend/src/components/info/statInfo.ts` ACWR help text still said
    "sweet spot / high risk"; reworded to match the backend, with a note that
    ACWR is a coarse heuristic, not an injury predictor.
  - Coach-memory lists ordered by `created_at` alone were flaky on Windows
    (two rows in one clock tick); added `id desc` as a tie-breaker in
    `routers/chat.py`, `coach/context.py`, `plan_adaptation.py`.
- Product note: U2 restores automatic post-run analysis (removed in c26d2ea),
  limited to new runs started in the last 48 h without an insight, behind
  `AUTO_ANALYZE_ACTIVITIES` (default true). The RPE tap no longer triggers it.
- Known limits: S2 applies to newly computed curves only (no recompute of
  stored mean_max_json). S5's transient top-N records reuse the activity id as
  `id` (only used as a React key within one distance's list).
- Gates: backend 1,080 tests, exit 0; every new week-3 test fails or errors on
  the pre-week-3 tree (exported with `git checkout-index`, no stash); frontend
  vitest 351/351, `tsc --noEmit` clean, `vite build` OK.
- Runtime (perf.db copy, clock pinned to 2026-06-23): readiness 55 -> 64
  (fatigue 100 at TSB +17); activity 877 adherence 100 on its detail page and
  100 on the plan day (was 100 vs 61); Today says "100% adherence";
  PATCH /activities/877/rpe -> ok and Today shows "Felt 7/10". S5 can't be shown
  on the seed (no distance efforts in any seeded activity); covered by unit test.

# Second-opinion week 4 — Shrink (branch fix/second-opinion-week1)

- [x] C1 — cut the custom chart builder (view, hooks, types, `/custom-charts/*`, schemas, tests)
- [x] C2 — cut the 3-parameter Morton CP / Pmax (2-parameter fit only; fixes S3)
- [x] C3 — cut "terrain" race pacing (strategies: even, negative_split)
- [x] C4 — cut the separate daily-summary AI insight; recovery lives in the morning briefing
- [x] C5 — drop the orphan `Race` model/table (alembic migration) and legacy `static/style.css`
- [x] C6 — drop the thumbs-up/down feedback step; RPE-only prompt + "Get coach analysis" on the run page
- [x] F3 — `matched_distance_m` on plan days; delete PlanView's per-day full-detail fetches
- [x] F4b — lazy routes + `charts` / `markdown` chunks
- [x] N2 — one readiness verdict (Train as planned / Ease off / Rest) with ≤2 server-side reasons; Form panel moves to Progress
- [x] N8 — check-in only before the run (or as a chip once logged); "How do you feel today?"
- [x] N7 — delete stale plan docs and mockups; regenerate `docs/CURRENT_STATE.md` and README from code

## Review

- Drafted by Gemini 4 Neon XHigh (agy, accept-edits) from one spec, docs from
  a second spec; reviewed by Claude. The first code delegation did nothing (the
  spec asked it to run tests; shell is denied in that mode) — lesson added.
- Claude changes on review:
  - Deleted the 9 files Gemini could only empty (no delete tool).
  - Removed stale `limitingFactor` tests left in `FormPanel.test.ts`; fixed a
    `TrainingPlanDay` fixture missing `matched_distance_m` (tsc).
  - F4b: Gemini's `manualChunks` let rollup hoist React-DOM into the `charts`
    chunk, so Today still downloaded Recharts. Added a `react` chunk. First load
    is now index 189 kB + react 194 kB + markdown 118 kB = 501 kB (154 kB gz),
    was one 1.1 MB chunk (322 kB gz); `charts` (417 kB) loads only on pages with charts.
  - Deleted 6 stale plan docs + 2 mockups; `UI_UX_CRITIQUE.md` notes it;
    review gained §7.1 implementation status. Spot-checked the regenerated
    README / CURRENT_STATE against config defaults, scheduler ids/times, job
    constants, bind guard and chat tool names.
- Not done: multi-user plumbing (cut item 5 / X2) stays — it is a schema-wide
  refactor, not a cut. Morning briefing now also gets last night's daily
  summary explicitly (it had readiness + 7-day recovery but not HRV/sleep score).
- Gates: backend 1,060 passed / 0 failed (was 1,080; cut features took their
  tests); frontend vitest 351/351, `tsc --noEmit` clean, `vite build` OK.
  Fail-before proof not possible this week: weeks 3 and 4 share the unstaged
  tree; the new tests target fields/behaviour that did not exist before
  (`verdict`, `reasons`, `matched_distance_m`, check-in gating).
- Runtime (app4.db copy, clock 2026-06-23 18:30): migration `s2t3u4v5w6x7`
  applied on startup and `races` is gone; `/today` readiness 64 ->
  "Train as planned" + "Overnight HRV is below your baseline."; Today is
  1,762 px tall at 390 px (was 2,434), no check-in after the run, no Form
  panel; Progress -> Fitness opens with "Fitness & fatigue"; run 697 (no
  insight) shows "Get coach analysis" and the RPE-only prompt; plan day
  returns `matched_distance_m: 9219.0`.
