# UI/UX Redesign — Post-Implementation Review

_Reviewed: 2026-07-10 · Scope: PR #139 (commits `a9e6ab4`…`3b88ba2`, Phases 0–6 of
[`docs/UI_UX_REDESIGN_PLAN.md`](UI_UX_REDESIGN_PLAN.md)) against the plan text and
[`docs/mockups/ui-redesign-mockup.html`](mockups/ui-redesign-mockup.html)._

## How this review was done

- Read every phase's tasks in the plan and verified them against the current code
  (all 125 changed files audited at the source level; key files line-by-line).
- `cd frontend && npm run build` → **green** (tsc + vite). `npm test` → **182/182
  tests pass** (29 files).
- `pytest` → **990/992 pass** (backend additive changes from Phase 4 verified).
  The 2 failures are `tests/test_notifications.py` only and are an artifact of
  this review container: `http-ece` (a `pywebpush` build dependency) cannot
  compile here, so `pywebpush` was stubbed and the stub's exception signature
  differs. `app/notifications.py` was not touched by the redesign.
- **Fixture-driven visual verification**: built app served via `vite preview`,
  Playwright + Chromium with all `/api/v1/*` intercepted by fixtures that mirror
  `api/types.ts` (plan §8 playbook). Captured 390×844 and 1280×800 screenshots of
  Today (dark/light, hero collapsed/expanded), Plan, Activities, Activity detail
  (5 scroll positions), Progress (Wellness + Records), and compared each against
  the corresponding mockup frame.

## Verdict

**The redesign is substantially faithful to the plan.** All seven phases shipped
with their core deliverables working as specified: 5-tab nav + avatar + sync pill,
`useRouteMeta` chrome table, TodayHero with all four states and readiness
accordion, check-in chip collapse, at-a-glance → `/daily/:id`, compact race strips,
calendar planned/race dots, rich activity rows with week-total group headers,
sticky condensed detail header, verdict chip, collapsible stat grids, SplitsBars
with zone colours + Bars/Table toggle, plan day-state machine (`✓/✗/▶/○/—`) with
"Done · 96% adherence · View run →", informative week tabs with 7-dot state rows,
auto-select of the current week, Progress tab chrome with ARIA tablist,
RangeSelector, chartTheme adoption (no hex in trends TSX), records "New!" badges +
one-time PB toast, desktop two-column layouts + left nav rail, reduced-motion
handling, and the design-token/defect fixes of Phase 0 (verified: `--surface`
defined, `.btn-primary` exactly once, `.page-enter` gone, tabular-nums, focus
ring, muted-text contrast).

Backend changes are additive and well-factored exactly as the plan allowed
(`matched_activity_id`/`adherence_score` on plan days, shared
`_categorize_activity_type`, tests added).

**However, visual verification uncovered two real bugs that the unit tests cannot
see (both mobile-only layout issues), plus a small set of correctness/robustness
gaps and deliberate-or-data-gated deviations from the mockup.** A follow-up
implementation plan for all of it is at the end of this document.

---

## 1. Bugs found (fix first)

### B1 — Mobile activity-detail renders in the wrong order (`order` is a no-op)

`ActivityDetailView.css:207–228` reorders the mobile stack with CSS `order`
(stats → verdict → route → … → charts → splits → insight), relying on the column
wrappers being `display: contents`. But **`order` only applies to flex/grid
items, and `.detail-body` (`ActivityDetailView.css:59`) is a plain block
container** — so every `order` rule is ignored below 1024 px.

Confirmed in screenshots: on a 390×844 viewport the page renders in raw DOM
order — Description structure-bar → HR zones → chart tabs → splits — and the
**primary stats, Coach verdict chip, and adherence card only appear after all
charts**, inverting the intended hierarchy (plan §5.3/3.4: verdict "directly
under hero stats") and regressing the pre-redesign order (stats used to be
first in the DOM). Desktop (≥1024 px) is unaffected and matches the plan.

**Fix (one line + regression check):** make `.detail-body` a flex column
(`display: flex; flex-direction: column;`). At ≥1024 px `.detail-columns`
remains the flex row it is today; the `order` values are consistent with each
column's DOM order, and the AI-insight section (order 12) still lands after the
columns. `TodayView` already works precisely because `.today-view` *is* a flex
column — this brings the detail page to parity.

### B2 — Activities' sticky week headers pin underneath the TopBar

The scroll container on mobile is the **document**, not `.app-main`
(`.app-shell` is `min-height: 100dvh` — nothing constrains `.app-main`, so its
`overflow-y: auto` is inert). The TopBar is `position: sticky; top: 0;
z-index: 100` with an opaque background (`TopBar.css:1–12`), and the group
headers are `position: sticky; top: 0; z-index: 10` (`ActivitiesView.css:35–38`)
— so once a week header sticks, it sits **behind** the TopBar and is invisible,
defeating plan task 3.2 ("sticky within the scroll container"). Screenshots
confirm list content scrolling underneath the TopBar.

**Fix:** `top: var(--top-bar-height)` on `.group-head` (Activities always
renders with main chrome, so the offset is constant). Optionally do the same
audit for any future sticky element under main chrome.

### B3 — "Today" is computed in UTC in the plan state machine

`planDayState.todayStr()` uses `new Date().toISOString().slice(0, 10)`
(`planDayState.ts:5–7`) — that is **UTC**, while the rest of the app derives
day keys from local time (`formatDateKey`). For any user east of UTC the Plan
view marks the wrong row as `▶ today` (and flips `upcoming`→`missed`) between
local midnight and UTC midnight — e.g. 00:00–02:00 for CEST. Same pattern in
`SeasonTimeline.tsx:23–25` and `PlanView.today()`. `TrainingPlanDay.day_date`
is a local calendar date, so the comparison must also be local.

**Fix:** build the string from local date parts (or reuse `formatDateKey(new
Date())`) in one shared helper; keep the injectable-`today` test seam. Add a
unit test with a mocked non-UTC timezone.

### B4 — No error boundary: one render error white-screens the whole app

During fixture testing, two malformed payloads each unmounted the **entire**
app to a blank page (React unwinds to the root — `#root` ends up empty;
`grep -rn "ErrorBoundary" frontend/src` → none). Real-world triggers exist:
any unexpected `null`/shape drift in one card takes down Today, nav and all.
This contradicts plan principle 4 ("every state designed — error = retry").

**Fix:** add a small `components/ui/ErrorBoundary.tsx` (retry + "back to
Today" actions), wrap the route outlet (per-route reset via `key=location.
pathname`), keep chrome (TopBar/nav) outside it. ~40 lines, no deps.

### B5 — Sync pill's "syncing" state shows fetch activity, not sync activity

`useSyncStatus` (`api/hooks.ts:236–241`) reports `syncing` whenever
`health.isFetching || garmin.isFetching` — i.e. for the sub-second window of
its own 60 s polling request. It never reflects an actual Garmin sync job, so
the pill flashes a spinner every minute while real syncs go unindicated.

**Fix:** derive `syncing` from a real signal (running sync/backfill jobs are
already exposed via the jobs/system-health payloads) or drop the state and
keep `ok`/`needs_reauth` only.

---

## 2. Deviations from plan/mockup (reviewed, with disposition)

Legend: **[data]** = blocked on payload, plan anticipated it · **[minor]** =
cosmetic/copy, plan says mockup is not authoritative · **[gap]** = should be
scheduled · **[ok]** = deliberate, fine as shipped.

### Today
| # | Deviation | Disposition |
|---|---|---|
| T1 | Hero has **no "Send to watch" / "Details" actions** (mockup + plan §5.2 sketch show both). `usePushWorkoutToGarmin(planDayId)` already exists — frontend-only wire-up. | **[gap]** → Follow-up B |
| T2 | Hero shows **no WorkoutStructureBar for plan days** — `TrainingPlanDay` carries no `workout_steps` (code comments the limitation; bar renders for scheduled Garmin events). Also affects Plan day rows (4.2 "when steps exist"). | **[data]** → Follow-up D2 |
| T3 | Ring sublabel is "/100"; mockup shows the qualitative verdict ("Ready"). `readiness.label` exists and `ScoreRing` already accepts `subLabel` — unused. | **[gap]** (one line) → Follow-up B |
| T4 | Completed-session hero state shows "Done — {name} · distance/time", not the mockup's "✓ Done — 96% adherence": the Today payload's `ActivitySummary` has no adherence field. | **[data]** → Follow-up D1/B3 |
| T5 | Races are **not capped at 2 + "show all"** (task 2.5); all render. | **[gap]** (small) → Follow-up B |
| T6 | Week overview lacks the mockup's **planned-volume outline bars** (fixture shows completed only). Plan tasks never required it — mockup illustration. | **[minor]** / future idea (D3) |
| T7 | At-a-glance tile grid: no chevron affordance (mockup has one); 5th tile (HRV) leaves a ragged 4-column row. | **[minor]** polish |
| T8 | Section rhythm: `.today-view` flex `gap: 16px` stacks with `.today-section { margin-bottom: 20px }` → uneven 16/36 px gaps between blocks. | **[minor]** polish |
| T9 | Sync pill collapsed state shows ✓ always, reveals time on tap (plan said hidden-until-tap; mockup shows pill+time persistent). Middle ground; no layout shift. | **[ok]** |

### Activities & detail
| # | Deviation | Disposition |
|---|---|---|
| A1 | Row icon is tinted with the **workout-intensity colour** (`getActivityColor`) rather than the **sport colour** (task 3.1 says sport colour; `SPORT_COLORS` exists but is unused here — a bike ride tints purple/default, not bike-teal). Intensity tint arguably carries more information; either keep-and-document or switch. | **decision** → Follow-up C1 |
| A2 | No PB trophy on rows — list `ActivitySummary` has no `personal_records` (plan's conditional: "if absent, show PB only in detail and note the optional backend enrichment"; lessons.md records this correctly). | **[data]** → Follow-up D1 |
| A3 | No avg-HR in the meta line (mockup shows `♥152`; plan task text doesn't require it, and the field exists in the payload). | **[minor]** → Follow-up C3 |
| A4 | Zone-distribution micro-bar omitted (plan §5.3: "if not in payload, omit"). | **[data][ok]** |
| A5 | AdherenceCard's Distance row collides label/value at 390 px (pre-existing card, untouched by the phases). | **[minor]** polish |

### Plan
| # | Deviation | Disposition |
|---|---|---|
| P1 | Day rows show **"Send to watch" on past (done/missed) days** — mockup shows it on today/upcoming only; pushing a past workout is noise. | **[gap]** (small) → Follow-up C2 |
| P2 | Mockup day rows lead with a synthesized name ("Tempo 10k"); app leads with the type badge + targets. Same information, slightly different hierarchy. | **[ok]** |
| P3 | Structure bar on interval rows (mockup) — same data gap as T2. | **[data]** → D2 |

### Cross-cutting
| # | Deviation | Disposition |
|---|---|---|
| X1 | `WorkoutStructureBar.computeSegments` weights segments by raw `end_condition_value`, mixing **seconds with metres** when a workout mixes time- and distance-ended steps (a 90 s recovery vs 3000 m rep distorts proportions ~30×). Plan 4.2 said "duration/distance-based widths". | **[gap]** → Follow-up C4 |
| X2 | `@keyframes spin`/`.spin` re-declared in 6+ component CSS files, and `ActivityDetailView.tsx:312` inlines `animation: 'feedback-spin…'` whose keyframes live in `FeedbackPrompt.css` — the exact hidden cross-file CSS dependency pattern the plan's audit (§2.6.4) called out. Works only because Vite bundles all CSS. | **[gap]** (mechanical) → Follow-up C6 |
| X3 | WeekStrip/MonthCalendar render one marker per day with priority done > race > planned — a race day with any completed activity loses its 🏁 marker; mockup shows dot combinations. | **[minor]** |
| X4 | `GET /training-plan` now runs the activity-match + adherence scoring per past plan day per request (N+1-ish; ≤ ~14 extra queries + step comparisons on a 4-week plan). Fine for a single-athlete self-hosted app; batch/cache if plans grow. | **[ok]** note |
| X5 | Trends: Wellness/Intensity/Aerobic adopted `RangeSelector`; Performance/Custom/Records keep their own idioms (Records has its own 30d/90d/1y control) — plan 5.2 only listed the three, so compliant, but the chrome isn't fully uniform. | **[ok]** note |

Everything else checked came back **compliant**: acceptance criteria for Phases
0, 1, 5 verified by grep/inspection (e.g. no `#hex` in `components/trends/*.tsx`,
no inline tab styles in `TrendsView.tsx`, `role="img"` + labels on all 10 chart
files, chat hint chips reappear while history < 4 messages, onboarding closing
step with "Generate plan now"/"Go to Today", Settings back-header, Garmin
empty-state CTA, `/daily` reachable from Wellness and the snapshot card).

---

## 3. Follow-up implementation plan

Ordered by severity; each phase is independently shippable. Global rules from
`UI_UX_REDESIGN_PLAN.md` §6.0 apply (no new deps, tokens only, tests green,
`npm run build && npm test`, backend only where marked).

### Phase A — Layout & correctness bugs (S, frontend-only)

- **A1** `.detail-body { display: flex; flex-direction: column; }` in
  `ActivityDetailView.css`. Verify: 390 px order is stats → verdict → route →
  description → adherence → secondary → toggle → zones → charts → splits →
  insight; 1280 px unchanged (two columns, insight full-width below).
  Test: extend `ActivityDetailView.test.tsx` to assert the computed order of
  section headings (or snapshot the class order) — jsdom can assert the CSS
  `order` values via `getComputedStyle` given the stylesheet is loaded, else
  assert DOM structure + document the CSS dependency.
- **A2** `.group-head { top: var(--top-bar-height); }` in `ActivitiesView.css`.
  Visual check at 390 px: header remains visible below the TopBar when stuck.
- **A3** Localize `todayStr()` (shared helper in `utils/date.ts`, e.g.
  `formatDateKey(new Date())`); update `planDayState.ts`, `PlanView.today()`,
  `SeasonTimeline`. Unit test with `vi.setSystemTime` at a UTC+2 midnight
  boundary asserting the day flips at local, not UTC, midnight.
- **A4** `components/ui/ErrorBoundary.tsx` + wrap the `<Routes>` outlet in
  `App.tsx` (keyed by pathname so navigation resets it); fallback card with
  "Try again" (re-mount) and "Go to Today" (navigate `/`). Test: throwing child
  renders fallback; nav stays mounted.
- **A5** Sync pill: gate the `syncing` state on a real signal (e.g. a running
  `sync`/`backfill` job in `recent_failed_jobs`' sibling data or a dedicated
  flag if the payload has one; otherwise remove the state). Update
  `SyncStatusPill.test.tsx`.

### Phase B — Hero completeness (S–M, frontend-only)

- **B1** Hero actions for the planned state: primary `⌚ Send to watch`
  (reuse `usePushWorkoutToGarmin(data.plan_day_id)` + toast, disabled for
  rest/cross), secondary `View in plan →` (navigate `/plan`; cheaper and more
  truthful than the mockup's "Details" since plan days have no detail route).
- **B2** Pass `subLabel={readiness.label}` (falls back to "/100" when absent)
  to the hero's `ScoreRing`.
- **B3** Completed state: append adherence when available — today it is only on
  the plan-day payload (`adherence_score`), so look the matched day up from the
  already-fetched `useTrainingPlan()` (`plan_day_id`) before touching the
  backend: "✓ Done — 96% adherence".
- **B4** Cap race strips at 2 + "Show all N races" ghost button (task 2.5).
- Tests: hero action rendering per state; race cap; label fallback.

### Phase C — Consistency & polish (S–M, frontend-only)

- **C1** Decide icon tint semantics. Recommendation: **keep** intensity tint
  (it encodes workout type, which sport icons already disambiguate), but route
  non-run sports through `SPORT_COLORS` so a ride/swim/strength icon gets its
  sport colour instead of `default` purple. Document the rule in `colors.ts`.
- **C2** Plan rows: render Send-to-watch only for `today`/`upcoming` states.
- **C3** Activity rows: append `· ♥ {avg_hr}` to the meta line when present.
- **C4** `computeSegments`: normalise mixed units — when a workout mixes time-
  and distance-ended steps, convert time→distance via the step target pace
  (fallback: overall workout pace; final fallback: weight 1) so proportions
  stay meaningful. Extend the segment-width unit tests with a mixed workout.
- **C5** Rhythm/affordance pass: collapse the double spacing (drop
  `.today-section` bottom margin in favour of the flex gap), add the
  at-a-glance chevron, fix AdherenceCard's Distance row wrap at 360–390 px.
- **C6** Move `@keyframes spin`/`.spin` to `globals.css` once; delete the
  per-component copies; replace `ActivityDetailView.tsx:312`'s inline
  `feedback-spin` with the shared class.

### Phase D — Data enrichment (M, **backend + frontend**, optional)

- **D1** Additive: `personal_records: PersonalRecordSummary[] | null` (or a
  boolean `has_pr`) on list/Today `ActivitySummary` → PB trophy badge on rows
  (plan 3.1's noted enrichment) and true PB state in the hero.
- **D2** Structured `workout_steps` for AI plan days (translator already exists
  for Garmin push — persist/serve the same structure on `TrainingPlanDay`) →
  structure bars in Plan rows and TodayHero (T2/P3), closing the largest
  remaining mockup gap.
- **D3** `planned_km` alongside `weekly_data` buckets → WeekOverview planned
  outline bars (mockup T6).
- Each additive-only, with schema tests; frontend consumes defensively.

### Verification (all phases)

`cd frontend && npm run build && npm test`; backend phases: `pytest`. Re-run the
plan §8 visual smoke (fixture-driven Playwright) for Today, Plan, Activities,
detail at 390×844 + 1280×800, dark + light — the review's fixture set lives in
the session notes and can be recreated from `api/types.ts` in ~200 lines.

---

## 4. Review evidence notes

- Fixture-driven screenshots confirmed: hero states + readiness accordion,
  check-in chip, alert banner, race strips, planned/race calendar dots, week
  group headers + totals, derived filter chips, sticky condensed header,
  SplitsBars zone colouring + legend + toggle, verdict chip, "Show all stats"
  collapse, adherence card, NEW-PB badge + one-time 🏆 toast, Records "New!"
  celebration, plan day-state glyphs/borders, week-tab dots + auto-select,
  week progress bar, desktop two-column Today/detail + left nav rail, light
  theme on Today.
- Two crashes observed during fixturing were caused by intentionally imperfect
  fixture data (`{}` for a missing season plan; a mis-named adherence field) —
  the root causes were fixture bugs, but the blast radius (full-app white
  screen) is what motivates finding B4.
- 2026 has 53 ISO weeks — the TopBar's "Week 28/53" is correct, not a defect.
