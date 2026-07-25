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

# Nothing OS skin — Phase 6 (QA, accessibility & docs)

Goal: close out `docs/NOTHING_OS_SKIN_PLAN.md` (phases 0–5 already merged on
`feature/theme`) with the QA pass its own checklist demands: contrast sweep,
focus/motion checks, a full regression walk in all six theme×skin
combinations, and a pixel-diffed default-skin comparison against `main`.

## Tasks
- [x] Contrast sweep (WCAG AA, all six combinations) — computed ratios for
      every text/UI token pair, not eyeballed.
- [x] Focus-ring visibility check (accent vs. bg, all six combinations).
- [x] Reduced-motion check (`nothing.css` adds zero animations; existing
      global neutralizer covers it).
- [x] Full regression walk: Today, Plan, Activities, Activity detail,
      Progress, Plan setup, Settings — all six combinations, via a local
      backend + seeded activity/PR + headless-Chromium screenshots.
- [x] Default-skin diff: pixel-diffed against `origin/main` (not just this
      branch's own earlier commits) for Today/Plan/Activities in both modes.
- [x] `tsc --noEmit`, `vitest run`, `npm run build` all clean.
- [x] `docs/CURRENT_STATE.md` updated with the skin system.

## Review

**The contrast sweep found four real gaps, all fixed in `nothing.css`:**
1. `--text-muted` (both Nothing skins, both modes) sat at 3.4–4.1:1 against
   its own card background — under the 4.5:1 floor for the 9px mono labels
   it's used for (`.stat-label`, `.section-title`, used app-wide). Darkened/
   lightened to `#7c7c7c` / `#6f6f6f`.
2. `nothing-app`'s light-mode `--score-high`/`--score-mid`/`--score-low`
   inherited `:root`'s defaults unchanged and two fell as low as 1.4:1 as
   *text* (ReadinessCard's `rc-value`) — Phase 2.1 corrected four workout
   colours for this exact failure mode but never extended it to the score
   bands. Added the same style of correction.
3. The PB badge/medal/toast accents (`.pr-badge`, `.pr-recent-icon`,
   `.pr-new-badge`, `.pr-effort-medal-1`) hardcode `#f0a500` — Phase 2 defined
   `--c-pb` for exactly this but no component ever read it, so a gold badge
   leaked through under `nothing-signal`. Added a skin-scoped override.

**The regression walk found a much bigger, structural gap:** `getActivityAccent()`
— the function behind the Activity list icon, the activity-detail header
badge/border, `WorkoutCard`, and `MonthCalendar` dots — returned **literal
hex**, not a CSS token, for every non-running sport and was reached by
`${color}22`/`rgba(...)` string-concatenation for translucent badge fills.
Neither path can be skinned. A seeded activity + personal record made this
visible immediately: a green cycling icon and an orange PB badge on an
otherwise all-red `nothing-signal` Activities screen, plus a green PB-toast
border and a green "Reconnect" pill — the generic `--success`/`--warning`/
`--danger` tokens (13+ shared components) had the identical gap. Fixed by:
- `getActivityAccent()` now returns `var(--color-*)`/`var(--sport-*)`
  (new `--sport-*` tokens, mirroring `--color-*`); a new
  `getActivityAccentHex()` literal-hex twin covers the one consumer that
  can't use `var()` — `RouteMap`'s canvas draw.
- The three `${color}22` alpha-suffix call sites became
  `color-mix(in srgb, ${color} 13.333%, transparent)` (the precise fraction
  reproducing `0x22`'s alpha byte exactly, verified with a pixel diff) —
  `var()` doesn't support hex-alpha string concatenation but composes fine
  inside `color-mix()`. Same fix for `WorkoutDetailView`'s hardcoded
  `rgba(243,156,18,0.15)` warning badge.
- `--success`/`--warning`/`--danger` collapse to ink/accent under
  `nothing-signal` only, one token block, ~13 components fixed at once.

**The default-skin diff caught the most consequential bug of the pass.**
Phase 5's follow-up commit ("size the ring to the numeral, not the numeral
to the ring") enlarged `ScoreRing` from 64/72px to 100px at both call sites
*unconditionally* — but the reason (DotMatrix's normal-size digits need more
room than a small ring) only applies when `Numeral` is actually rendering
DotMatrix, i.e. under a Nothing skin; `default`'s plain-text numeral never
needed it. The unconditional change silently grew the readiness ring in the
**default skin**, shifting every card below it down by ~15px — a "default
skin is sacred" violation invisible without an actual pixel diff against
`main` (6.8%/8.6% of the frame differed on Today). Fixed by gating the size
on `useSkin()` in both `TodayHero` and `ReadinessCard` (64/72px default,
100px Nothing); residual diff after the fix is 0.155%, concentrated in one
ring stroke's anti-aliasing — sub-pixel rendering noise, not a layout bug.
Plan/Activities were already exact.

**Verification:** `npx tsc --noEmit` and `npx vitest run` (235 tests, +3 new)
clean; `npm run build` clean. Manual QA used a local FastAPI backend (fresh
SQLite, `AUTH_ENABLED=false`) + Vite dev server, a seeded athlete profile,
one activity with a personal record, and headless-Chromium screenshots
(390×844) across all six theme×skin combinations and the routes listed
above, plus a `pixelmatch` diff against an `origin/main` worktree for the
default-skin acceptance criterion.
