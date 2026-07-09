# Running Coach — UI/UX Analysis & Phased Redesign Plan

_Last updated: 2026-07-09_

This document audits the current React PWA UI/UX, benchmarks it against the
2025/26 state of the art (Garmin Connect, Strava, Runna, plus the Oura/WHOOP
design direction), and lays out a **phased, self-contained implementation plan**
written so that a capable coding agent (Sonnet) can execute each phase
unattended.

It is a **plan only** — no product code has been changed in this commit.

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Current-state audit](#2-current-state-audit)
3. [Competitor benchmark](#3-competitor-benchmark)
4. [Gap analysis & design principles](#4-gap-analysis--design-principles)
5. [Redesign direction per surface](#5-redesign-direction-per-surface)
6. [Phased implementation plan](#6-phased-implementation-plan)
   - [Global rules for the implementing agent](#60-global-rules-for-the-implementing-agent)
   - [Phase 0 — Design-system foundation & defect fixes](#phase-0--design-system-foundation--defect-fixes)
   - [Phase 1 — Navigation & information architecture](#phase-1--navigation--information-architecture)
   - [Phase 2 — Today screen hierarchy](#phase-2--today-screen-hierarchy)
   - [Phase 3 — Activity list & activity detail](#phase-3--activity-list--activity-detail)
   - [Phase 4 — Plan & calendar experience](#phase-4--plan--calendar-experience)
   - [Phase 5 — Trends → Progress](#phase-5--trends--progress)
   - [Phase 6 — Accessibility, responsive & polish](#phase-6--accessibility-responsive--polish)
7. [Out of scope / future ideas](#7-out-of-scope--future-ideas)
8. [Verification playbook](#8-verification-playbook)

---

## 1. Executive summary

The app is **functionally ahead of most competitors** (readiness with
subjective check-ins, AI briefings, adherence scoring, plan adaptation, chat
coach with tool-use) but **presentationally behind** them. Three delivered
improvement-plan cycles added features as stacked cards without revisiting
hierarchy, so the product now reads as "a long list of good widgets" rather
than a designed experience.

The gap is **not data or capability — it is hierarchy, glanceability, polish,
and celebration**:

- **Today** is a flat stack of 10+ sections with no hero, no prioritisation,
  and a check-in card that renders even when everything above it matters more.
- **Navigation** spends a permanent bottom-nav slot on Settings, labels the
  Trends tab "Wellness", and has an orphaned Daily-Summaries route no nav item
  reaches.
- The **design system is informal**: an undefined `--surface` CSS variable is
  referenced in 14 files, `.btn-primary` is defined in `PlanView.css` but used
  across other views, ~20 hex colours are hard-coded in TSX (three different
  greens), each chart re-implements its own tooltip and palette, and dead CSS
  (`.page-enter`) ships in globals.
- **Accessibility is minimal**: 12 `aria-label`s in the whole app, list rows
  are clickable `<div>`s with no keyboard access, colour is the only encoding
  for zones/types, and there is no `prefers-reduced-motion` handling.
- **Every load is a spinner**, mutations give ad-hoc inline feedback (no toast
  system), and the desktop experience is a stretched 640 px phone column.

The plan below fixes the foundation first (tokens, defects, shared
primitives), then restructures navigation, then reworks each surface in
priority order. Each phase is independently shippable and verifiable.

---

## 2. Current-state audit

Stack: React 19 + TypeScript + Vite, React Router 7, React Query 5, Recharts 2,
lucide-react icons, plain per-component CSS with custom properties, dark/light
theme via `data-theme`, PWA manifest + service worker. All views cap content at
`max-width: 640px`.

### 2.1 App shell & navigation

Files: `frontend/src/App.tsx`, `components/layout/{TopBar,BottomNav,CalendarContainer,WeekStrip,MonthCalendar}.*`

**Strengths**
- Mobile-first done properly: `100dvh`, `env(safe-area-inset-bottom)`,
  fixed bottom nav, drag-to-expand week strip → month calendar with activity
  dots — this is a genuinely nice, Garmin-like calendar affordance.
- Global date context: selecting a day in the strip drives the Today view.
  Competitors don't let you time-travel the "Today" surface this easily.
- Theme toggle persisted to `localStorage`.

**Issues**
1. **Six bottom tabs** (`Today, Activities, Coach, Plan, Wellness, Settings`).
   Settings does not deserve a permanent slot (Garmin, Strava, Runna all put
   profile/settings behind an avatar or a "More/You" tab). Six items at
   `0.65rem` labels is at the legibility floor.
2. **Orphaned route**: `/daily` (DailySummariesView) is registered in
   `App.tsx` but no nav item, link, or button navigates to it. The daily
   history list is unreachable in the UI (`grep` confirms the only `navigate('/daily/...')`
   is inside DailySummariesView itself).
3. **Label mismatch**: the nav item for `/trends` is labelled "Wellness", but
   the view contains six tabs (Wellness, Intensity, Performance, Records,
   Aerobic, Custom) — most of which are not wellness.
4. **TopBar wastes prime real estate**: it shows only "Week 27/52" plus two
   icon buttons. No page title, no sync status (buried in Settings → System
   Health), no identity/avatar, no reconnect warning surface.
5. Calendar dots show **completed activities only** — planned workouts and
   races don't appear in WeekStrip (MonthCalendar shows activity dots only
   too), so the calendar can't answer "what's coming?" — the single most
   common calendar question in a training app.
6. `showCalendar`/`isDetailPage` logic is a growing string of `startsWith`
   conditions in `App.tsx` — brittle as routes are added.

### 2.2 Today view

Files: `components/today/*` (TodayView + 11 card components)

**Strengths**
- The content is excellent: pre-workout AI briefing, readiness score with
  six component bars, daily check-in (soreness/energy/mood), plan-adaptation
  suggestions, race pacing, CTL/ATL/TSB chart, weekly volume chart, insights.
- ReadinessCard's ring + component bars is close to Garmin's Training
  Readiness widget — the market-leading pattern.

**Issues**
1. **No hierarchy.** Ten+ sections render in fixed order as equal-weight
   cards. The planned workout of the day (the #1 job of a coaching app home
   screen — Runna's whole Today tab is this) is mixed in; readiness is
   below races; the check-in card *always* renders full-size even after
   submission.
2. **The workout of the day and readiness never meet.** Garmin's Morning
   Report and Runna's Today both fuse "how ready am I" with "what am I
   doing today" into one glanceable hero. Here they're two cards separated
   by races and check-in.
3. **Daily Summary snapshot is not tappable** — the data comes from
   `DailySummary` rows that have a detail view (`/daily/:id`), but the
   snapshot card offers no navigation to it.
4. Single global `spinner` while loading; no skeletons, no pull-to-refresh.
5. Race card duplicates priority/goal chrome per race and pushes everything
   below the fold when 2+ races exist.
6. `WeekOverview` defines its own activity palette (`#6c5ce7 run / #00b894
   bike / …`) that disagrees with `utils/colors.ts` (`running = #2ecc71 easy
   green` etc.) — the same run is purple in one chart and green elsewhere.

### 2.3 Activities list & detail

Files: `components/activities/*`, `components/activity-detail/*`

**Strengths**
- Infinite scroll with IntersectionObserver + month grouping; filter chips.
- Detail view is impressively deep: 80+ metrics grouped into sections,
  animated canvas route silhouette with per-metric colour ramps (HR / pace /
  power / elevation), HR + pace zone charts, chart tabs, laps table,
  adherence card, AI insight card, PB badge, feedback loop.

**Issues**
1. **List rows are visually thin**: a coloured dot + name + one metrics line.
   No sport icon, no PB flag, no workout-type tag, no effort signal, no route
   thumbnail. Strava's feed leads with the map; Garmin leads with sport icon +
   key stats. Rows are `<div onClick>` — not keyboard-accessible.
2. Filter chips are a fixed six-sport set regardless of what the athlete
   actually does.
3. Detail page is a **single 2,000px+ scroll with no wayfinding**: no sticky
   header/back affordance after scroll, no section jump, sections can't
   collapse. StatGrid sections (Secondary → Dynamics → Power → Performance →
   Conditions) arrive before charts, which most users seek first.
4. Splits are a **table only** — every competitor renders splits as
   horizontal pace bars (fastest = longest/coloured) with HR alongside;
   the table hides the workout's shape.
5. Chart palette/tooltip logic re-implemented per chart file (ChartTabs,
   WeekOverview, TrainingLoadChart, trends views each carry their own hex
   maps and tooltip styles).

### 2.4 Daily summaries

Files: `components/daily/*`

- Solid list + detail (sleep, HRV, stress, body battery) — but unreachable
  (see 2.1.2). The list header simply repeats "Daily Summaries" (the nav
  already said where we are); rows are clickable `<div>`s.

### 2.5 Trends

Files: `components/trends/*`

**Strengths**
- Six analysis tabs incl. a **user-defined custom charts builder** and a
  performance (power/pace-duration) curve — TrainingPeaks/Intervals.icu
  territory that Garmin's consumer app doesn't offer.

**Issues**
1. Tab bar is styled **inline in TSX** with `var(--surface)` — an undefined
   variable (falls back to transparent). Six equal-width tabs at `0.82rem`
   don't fit comfortably at 360 px width.
2. Each sub-view fetches and renders with its own spinner, palette and
   tooltip conventions; no shared time-range selector (some views have their
   own, some don't).
3. "Records" (Peak Performances) exists but records pass **uncelebrated** —
   no toast/highlight when a new PB lands (the v5 plan's P2-1 delivered
   detection + badge; presentation remains flat).

### 2.6 Plan & plan setup

Files: `components/plan/*`, `components/plan-setup/*`

**Strengths**
- Plan setup / onboarding wizard (CardPicker, SliderPicker, RangeSlider,
  DayChips, VolumeChart, bottom sheets) is the most polished UI in the app —
  visibly Runna-inspired and close to parity.
- Plan view: phase badge, season timeline, week tabs, day cards with strength
  routine + fuelling accordions, per-day "Send to watch".

**Issues**
1. **Day cards show no completion state.** `plan-day-past` just dims. There's
   no ✓ done / ✗ missed / ▶ today visual state machine, no link from a
   completed day to the matching activity, and no adherence colour. Runna's
   week checklist (tick marks over the week) is its single most recognisable
   screen; TrainingPeaks' green/yellow/red compliance colouring is the
   industry standard.
2. **No interval structure visualisation.** Workout steps render as text via
   `WorkoutSteps`; competitors draw the workout as coloured segment bars
   (warmup/work/recover/cooldown) — instantly communicating structure.
3. Week tabs are labelled `W1..W4` with no volume/status context; the
   `VolumeChart` component that could annotate them already exists in
   plan-setup.
4. Plan header buttons (`Preferences`, `Regenerate`) are styled ad hoc;
   `.btn-primary` lives in `PlanView.css` yet is used by TodayView's
   realignment banner — a hidden cross-file dependency that only works
   because Vite concatenates all CSS.

### 2.7 Chat (Coach)

Files: `components/chat/*`

**Strengths**
- Streaming SSE with action chips ("⚡ adjusted Thursday"), hint prompts,
  history, markdown rendering. Ahead of Garmin (no chat) and at par with
  WHOOP Coach conceptually.

**Issues**
- Raw `fetch` calls instead of the `api/client.ts` conventions; no
  day-divider grouping for history; no error retry affordance beyond text;
  hint prompts disappear forever after first message (they're good
  re-engagement surfaces).

### 2.8 Settings

Files: `components/settings/*`

- Long single column mixing identity, AI config, Garmin connection, zones,
  thresholds, notifications, coach memory, system health, exports. No
  grouping into sub-pages, no section navigation; on-page `<select>`s and
  forms are unstyled browser defaults in places. Fine for a self-hosted tool,
  but it's 9 sections of scroll.

### 2.9 Onboarding

Files: `components/onboarding/*`

- 7-step wizard reusing plan-setup components; good defaults; progress dots.
  Missing: a closing "what happens next" step (sync started, plan generating)
  — first-run currently ends by dropping the user onto a Today view that may
  still be empty while backfill runs (backfill can take minutes).

### 2.10 Cross-cutting

**Design tokens** (`styles/globals.css`)
- Good bones: bg/card/input/hover, text triple, accent pair, semantic
  success/warning/danger, radii, two shadows, workout-type palette.
- Missing: spacing scale, type scale, font-weight scale, z-index scale,
  focus ring token, chart palette, transition tokens. Result: hard-coded
  `px` and `rem` everywhere (`0.65rem`–`1.75rem` ad hoc).
- **Defects**: `--surface` used in 14 files but never defined; `.page-enter`
  animation classes defined but never applied; `--accent-light` doubles as
  "lighter accent" (dark) and "darker accent" (light) — misleading name.

**Typography**
- System font stack only; stat values don't use `font-variant-numeric:
  tabular-nums`, so live-updating numbers and table columns jitter.
  Competitors use a distinctive condensed/rounded display face for hero
  numbers (Strava's custom face, Garmin's Roboto Flex weights).

**Accessibility**
- 12 `aria-label` + 4 `aria-expanded` total. Clickable `<div>`s
  (ActivityListItem, WorkoutCard, daily cards, several pickers). No visible
  `:focus-visible` styles. Charts have no text alternative. `--text-muted`
  (#888 on #1a1a2e) is ~4.0:1 — below AA for the 0.65–0.75rem sizes it's
  used at. No `prefers-reduced-motion` (route trace runs a 7s animation loop
  forever).

**Feedback & states**
- One spinner pattern for every load; no skeletons; no toasts (mutation
  results are inline strings with bespoke styles per component); no
  optimistic updates outside React Query defaults; empty states are a single
  muted sentence with no CTA (e.g. Activities: "No activities found" — no
  "connect Garmin" shortcut when unconnected).

**Responsive**
- Three `@media` queries in the entire app (two at 400px, one at 400px). At
  tablet/desktop the app is a centred 640px phone column with dead margins.
  Garmin/Strava/Intervals.icu all reflow into multi-column dashboards.

---

## 3. Competitor benchmark

### 3.1 Garmin Connect (2024 redesign + 2025 "Connect+")

- Home is **sectioned, not stacked**: *Latest Activity / Planned Workouts*
  pinned at top → **In Focus** (up to 6 large, user-reorderable tiles) →
  **At a Glance** (up to 8 of ~20 small stat cards) → Events / Training
  Plans / Challenges. Layout is user-customisable and syncs across devices.
- **Morning Report** and **Training Readiness**: one score, colour band,
  contributing factors, 30-day trend — the canonical "insight over data"
  surface.
- Take-aways for us: *pin today's workout + readiness at top; make the rest
  glanceable small tiles; let the user reorder/hide sections; show planned
  items on the calendar.*

### 3.2 Strava (2025 redesign wave)

- Bottom nav consolidated around **Home / Maps / Record / Groups / You** —
  profile-and-settings behind "You", not a Settings tab.
- Feed cards lead with **route map + 3 hero stats**; Athlete Intelligence
  (AI summaries) attach to activities; map + stats now viewable together;
  real-time splits during recording.
- Take-aways: *richer activity cards; identity/settings behind an avatar;
  AI summary attached to the activity, not hidden below it.*

### 3.3 Runna

- **Today tab = the workout of the day**, full stop. Plan tab = week
  checklist with ticks, paces, and swap/move actions; workouts render as
  coloured interval bars with per-step targets; **Pace Insights** chart
  compares your last five interval sessions rep-by-rep; post-workout **Pace
  Status** verdicts; motivating pre-workout briefings (we already have
  these!).
- Onboarding is a detailed, conversational quiz (we already match this
  pattern in plan-setup).
- Take-aways: *hero the day's session; week-checklist plan view with
  completion ticks; draw interval structure as bars; celebrate execution.*

### 3.4 Oura / WHOOP (design north star)

- Oura's late-2025 redesign surfaces **one key metric contextually** — the
  thing your body most needs you to know now — over dashboards. WHOOP Coach
  narrates recovery/strain conversationally. "Insight over information" is
  the stated strategy of both.
- Take-away: *the Today hero should be a synthesised statement ("Ready for
  quality — 12k tempo today"), not six parallel widgets.*

### 3.5 What "good" looks like in 2026 (synthesis)

| Dimension | Market baseline | Us today |
|---|---|---|
| Home hierarchy | Hero (today's session × readiness) + glanceable tiles, customisable | Flat 10-card stack |
| Plan view | Week checklist, ticks, compliance colour, interval bars | Day cards, no completion state, text steps |
| Activity cards | Map/sport-led rich cards, PB flags | One-line text rows |
| Activity detail | Sticky header, splits bars, AI summary up top | Long scroll, table splits, insight at bottom |
| Nav | 4–5 tabs + "You"/avatar | 6 tabs incl. Settings |
| Feedback | Skeletons, toasts, celebration moments | Spinners, inline strings, none |
| A11y | Buttons, focus rings, reduced motion | Minimal |
| Design tokens | Full scale + brand type | Partial, with defects |

---

## 4. Gap analysis & design principles

Five principles for every phase below:

1. **One hero per screen.** Every screen answers one question first (Today:
   "what should I do and am I ready?"; Plan: "am I on track this week?";
   Activity: "how did it go?"). Everything else is subordinate.
2. **Insight over information.** Lead with the synthesised statement (score,
   verdict, briefing line); expose the numbers one tap deeper. The AI already
   generates the sentences — surface them higher.
3. **One design system.** All colour, spacing, type, chart palettes and
   interactive primitives come from tokens/shared components. No hex in TSX,
   no cross-file CSS dependencies.
4. **Every state designed.** Loading = skeleton, empty = explanation + CTA,
   error = retry, success = toast/celebration. No dead ends (orphaned
   routes, unreachable views).
5. **Accessible and calm by default.** Keyboard/focus/ARIA on everything
   interactive; motion behind `prefers-reduced-motion`; AA contrast.

---

## 5. Redesign direction per surface

### 5.1 Navigation (target)

```
┌──────────────────────────────────────────────┐
│ Today ▾  Week 28          [sync ✓] [☀] [👤] │  ← TopBar: title, sync pill,
├──────────────────────────────────────────────┤    theme, avatar → Settings
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun           │  ← WeekStrip: planned ◦ + done ●
│   7    8    9̲   10   11   12   13           │    dots, races flagged 🏁
├──────────────────────────────────────────────┤
│                 (content)                    │
├──────────────────────────────────────────────┤
│  Today   Plan   Coach   Activities  Progress │  ← 5 tabs, Settings removed
└──────────────────────────────────────────────┘
```

- **5 tabs**: Today `/`, Plan `/plan`, Coach `/chat`, Activities
  `/activities`, Progress `/trends` (renamed from "Wellness").
- **Settings** moves behind a TopBar avatar button (route unchanged:
  `/settings`, now a detail-style page with back button).
- **Daily summaries** become reachable: Today's snapshot card links to
  `/daily/:id`; Progress → Wellness tab gets a "Daily history" link to
  `/daily`.
- TopBar gains a **sync status pill** (from existing `useSettings`/
  SyncStatus + `needs_reauth` data): `✓ synced 12:04` / `⟳ syncing` /
  `⚠ reconnect Garmin` (links to Settings).

### 5.2 Today (target)

```
┌ HERO ────────────────────────────────────────┐
│  ◐ 78 Ready        TODAY'S SESSION           │
│  "Good sleep, HRV   Tempo 10k @ 4:45         │
│   stable — green    ▁▂▆▆▆▂▁  [structure bar] │
│   light for quality" [Details] [Send to ⌚]  │
└──────────────────────────────────────────────┘
[⚠ 2 sessions missed — Adapt plan?  ]  ← compact inline alert (if any)
[😊 Check in]                           ← one-line collapsed chip once done
┌ At a glance ─────────────────────────────────┐
│  RHR 46   Sleep 82   Body Bat 71   Steps 8.4k│  ← tappable → /daily/:id
└──────────────────────────────────────────────┘
Race: Berlin M — 73 days  🏁               (compact strip, expandable)
Training load ▓▓▓░ · Week 28 overview ▂▄▆▂ · Insights…
```

- New `TodayHero` merges ReadinessCard ring (compact) + planned session +
  first line of the briefing. Completed-workout state swaps the session side
  for the completed activity with adherence verdict.
- Check-in collapses to a chip after submission; alert banners become
  compact single-liners; races become one compact strip.

### 5.3 Activities (target)

```
┌──────────────────────────────────────────────┐
│ 🏃 Tempo Run                     Tue 7:12 AM │
│    12.4 km · 58:12 · 4:41 /km · ♥152    🏆PB │
│    [Z1▁Z2▃Z3▆Z4▂Z5▁]  ← zone distribution bar│
└──────────────────────────────────────────────┘
```
- Sport icon (lucide `Footprints`/`Bike`/`Waves`/`PersonStanding`), workout
  tag, PB trophy, and a 4px zone-distribution micro-bar (data already in
  list payload? if not, omit — see phase notes). Weekly group headers with
  totals ("Week 28 · 4 runs · 52 km").
- Detail: sticky condensed header on scroll; splits as pace bars; AI insight
  summary sentence chip directly under hero stats (full card stays below).

### 5.4 Plan (target)

```
Week tabs:  [W1 42k ✓✓✓✓✗✓·] [W2 46k ✓✓▶····] [W3] [W4]
┌ Mon ✓ Easy 8k        done · 96% adherence → activity ┐
┌ Tue ✗ Intervals 6×800 missed                        ┐
┌ Wed ▶ Tempo 10k @4:45  TODAY   [▁▂▆▆▆▂▁] [⌚ Send]   ┐
```
- Day rows (not cards) with a completion state machine:
  `done | missed | today | upcoming | rest`; done rows link to the matched
  activity (via existing adherence/workout_tag matching).
- `WorkoutStructureBar` — a new shared component rendering workout steps as
  proportional coloured segments; reused in Plan, WorkoutDetail,
  ActivityDetail description and Today hero.

### 5.5 Progress (target)

- Rename; horizontal scrollable chip tabs; shared `RangeSelector`
  (30/90/180/365 d) persisted per tab in state; all charts consume a shared
  `chartTheme.ts`. Records tab gets celebration styling (gold accents), and
  new PBs raise a toast + badge on arrival.

---

## 6. Phased implementation plan

### 6.0 Global rules for the implementing agent

These rules apply to **every** phase:

1. **Branch/commits**: work on the current feature branch; one commit per
   phase minimum, message `UI/UX Phase N: <summary>`.
2. **Verify before done** (CLAUDE.md): `cd frontend && npm run build` (tsc +
   vite must pass) and `npm test`. Backend untouched → backend tests only if
   you change `app/` (Phases 1–5 do not; flagged where optional).
3. **No new runtime dependencies** unless the phase explicitly lists one.
   No CSS frameworks, no component libraries. Hand-roll small primitives.
4. **CSS conventions**: per-component `.css` files stay; new shared
   primitives go in `styles/` ; class names keep the existing
   kebab/component-prefix style (`.today-hero`, `.nav-item`). Never
   introduce a hex colour in TSX — use tokens or the palettes exported from
   `utils/`.
5. **Do not change API contracts or backend behaviour** except where a phase
   explicitly marks an optional backend task.
6. **Preserve existing tests**; update snapshots/assertions that
   intentionally change (e.g. nav labels). Add the tests each phase lists.
7. **Feature-parity rule**: every existing capability must remain reachable
   after each phase (e.g. removing the Settings tab requires the avatar
   entry point in the same phase).
8. When a phase says "screenshot-verify", use the pre-installed Chromium +
   Playwright against `npm run dev` (or `vite preview`) with mocked API
   (see §8) — best-effort, non-blocking if the environment lacks a display.

Phases are ordered by dependency; within a phase, tasks are ordered. Effort
estimates assume one focused agent session per phase.

---

### Phase 0 — Design-system foundation & defect fixes

**Goal:** one source of truth for colour/space/type; kill the known CSS
defects; add the shared primitives later phases build on. Zero intended
visual change except where defects are fixed.
**Effort:** S–M. **Risk:** low (mechanical).

**Tasks**

0.1 **Fix `--surface`**: add to `:root` and `[data-theme="light"]` in
    `styles/globals.css` as an alias of the card colour
    (`--surface: var(--bg-card);` is acceptable). Audit the 14 files using
    it (`grep -rn 'var(--surface)' frontend/src`) and confirm intended
    rendering (tab bars/backgrounds must not be transparent over content).

0.2 **Token expansion** in `styles/globals.css` (`:root`):
    ```css
    /* spacing */
    --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
    --space-5: 20px; --space-6: 24px; --space-8: 32px;
    /* type scale */
    --text-xs: 0.7rem; --text-sm: 0.8rem; --text-base: 0.9rem;
    --text-md: 1rem; --text-lg: 1.15rem; --text-xl: 1.4rem; --text-2xl: 1.75rem;
    /* misc */
    --focus-ring: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
    --transition-fast: 120ms ease; --transition-base: 200ms ease;
    --z-nav: 200; --z-sheet: 300; --z-toast: 400;
    ```
    Do **not** mass-migrate every px value now; use tokens in all *new/edited*
    CSS from here on. (A full migration is churn without user value.)

0.3 **Readable muted text**: change dark-theme `--text-muted` from `#888` to
    `#98a0b3` and light-theme from `#6b7280` to `#5b6472`; verify ≥4.5:1
    against both `--bg` and `--bg-card` (use a contrast script or manual
    check; record the ratios in the commit message).

0.4 **Shared button primitives** in `globals.css`: move `.btn-primary` out of
    `PlanView.css` into globals; add `.btn-secondary` (bordered, bg-input) and
    `.btn-ghost` (text-only) with disabled/hover/focus-visible states.
    Replace ad-hoc button styling in `PlanView.css` (`.plan-regen-btn`),
    Today realignment buttons, and Settings sync/export buttons **only where
    identical behaviour results** — visual parity screenshots not required,
    but keep changes conservative.

0.5 **Unified activity/sport palette**: extend `utils/colors.ts` to export a
    single `SPORT_COLORS` map (`run/bike/swim/walk/strength/other`) and a
    `WORKOUT_TYPE_COLORS` re-export of the CSS palette. Refactor
    `WeekOverview.tsx` (its local `ACTIVITY_COLORS`) and `PlanView.tsx`
    (`WORKOUT_COLORS`) to consume it. Pick the `colors.ts` values as
    canonical.

0.6 **Chart theme module** `utils/chartTheme.ts`: export
    `getTooltipProps(theme)` (bg, border, text, borderRadius), `AXIS_TICK`
    styling helper, `METRIC_COLORS` (merge of `ChartTabs.chartColors`), and
    grid/stroke defaults. Refactor `ChartTabs.tsx`, `WeekOverview.tsx`,
    `TrainingLoadChart.tsx` to use it (trends views migrate in Phase 5).
    Note `utils/theme.ts` already has `getChartTooltipStyle` — fold it in
    (keep a deprecated re-export or update imports).

0.7 **Numeric alignment**: add `font-variant-numeric: tabular-nums;` to
    `.stat-value`, `.stat-value-lg`, laps table cells, and chart tick CSS.

0.8 **Focus visibility**: global
    `:where(button, a, [role="button"], input, select, textarea):focus-visible { box-shadow: var(--focus-ring); outline: none; border-radius: var(--radius-xs); }`
    (keep specificity low with `:where`).

0.9 **Remove dead CSS**: delete the unused `.page-enter*` block from
    `globals.css` (verified unused: `grep -rn 'page-enter' frontend/src
    --include='*.tsx'` → no hits).

0.10 **`prefers-reduced-motion`**: add a global media block disabling
     `.spinner`/`.spin` animation iteration and any `transition` longer than
     0; in `RouteMap.tsx`, when
     `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, draw
     the full path statically instead of the 7s trace loop.

0.11 **Toast primitive**: `components/ui/Toast.tsx` + `Toast.css` — a
     module-level `toast(message, {kind: 'success'|'error'|'info'})` helper
     with a `<ToastHost/>` mounted once in `App.tsx`; fixed bottom-centre
     above the nav (`--z-toast`), auto-dismiss 4s, `role="status"`
     `aria-live="polite"`, max 2 stacked, respects reduced motion.
     ~80 lines; no dependency.

0.12 **Skeleton primitive**: `components/ui/Skeleton.tsx` + CSS — `<Skeleton
     height width radius/>` with a subtle shimmer (`background:
     var(--bg-hover)`, animated gradient; static under reduced motion).

**Acceptance criteria**
- `grep -rn 'var(--surface)' frontend/src` → all uses resolve (token
  defined); `grep -rn '#[0-9a-fA-F]\{6\}' frontend/src/components/today/WeekOverview.tsx frontend/src/components/plan/PlanView.tsx` → no sport/workout hexes remain in those files.
- `.btn-primary` defined exactly once (globals).
- `npm run build` + `npm test` green; new unit tests: `Toast` renders/expires,
  `chartTheme.getTooltipProps` returns theme-correct values.

---

### Phase 1 — Navigation & information architecture

**Goal:** 5-tab nav, Settings behind avatar, orphaned routes reconnected,
TopBar upgraded with title + sync status.
**Effort:** M. **Risk:** medium (routing edge cases).
**Depends on:** Phase 0 (buttons, toast).

**Tasks**

1.1 **BottomNav** (`components/layout/BottomNav.tsx`): tabs become
    `Today /`, `Plan /plan`, `Coach /chat`, `Activities /activities`,
    `Progress /trends`. Remove Settings. Icons: keep current; use
    `TrendingUp` for Progress. Bump `.nav-label` to `--text-xs` and item
    padding using tokens.

1.2 **TopBar** (`components/layout/TopBar.tsx` + CSS):
    - Left: **contextual page title** (route→title map: `/`→"Today",
      `/plan`→"Plan", `/chat`→"Coach", `/activities`→"Activities",
      `/trends`→"Progress") with the week label ("Week 28") as a smaller
      suffix only on `/` and `/plan`.
    - Right: sync pill + theme toggle + calendar toggle + avatar.
    - **Sync pill**: new `components/layout/SyncStatusPill.tsx`. Data: add a
      lightweight `useSyncStatus()` hook (the endpoint already exists —
      check `api/hooks.ts` for the settings/system-health query used by
      `SystemHealthSection`; reuse, do not add backend routes). States:
      `ok` (hidden by default, shows "✓ 12:04" on tap), `syncing` (spinner
      glyph), `needs_reauth` (warning colour, navigates to `/settings`).
      Poll interval ≥60s; no layout shift between states (fixed min-width).
    - **Avatar button**: circle with user initial (from `useMe()` email),
      navigates to `/settings`. `aria-label="Settings"`.

1.3 **Settings becomes a detail page**: add `/settings` to the
    `isDetailPage` logic in `App.tsx` so calendar strip/bottom nav hide, and
    give `SettingsView` a back-arrow header consistent with
    ActivityDetailView's header pattern.

1.4 **Route metadata refactor** (`App.tsx`): replace the `startsWith` chain
    with a small `ROUTES` table `{path, title, chrome: 'main'|'detail'}` and
    a `useRouteMeta()` helper consumed by App/TopBar. Behaviour must match
    the current matrix exactly (onboarding + plan/setup + detail routes are
    `detail`).

1.5 **Reconnect daily summaries**:
    - Today's Daily-Summary snapshot card becomes a link/button navigating
      to that day's `/daily/:id` (the Today API payload contains the
      summary; confirm it includes `id` — it does via `daily_summary.id`,
      verify in `api/types.ts`, otherwise navigate to `/daily` list).
    - `WellnessTrendsView` gets a "Daily history →" ghost button routing to
      `/daily`.

1.6 **Calendar planned-dots**: WeekStrip/MonthCalendar currently mark only
    days with completed activities. Extend to planned items: the calendar
    week/month API (`useCalendarWeek/Month`) — check payload in
    `api/types.ts`; if it already includes scheduled events/plan days,
    render a hollow dot for planned and the existing filled dot for done;
    races get a distinct marker (e.g. small flag glyph or accent ring).
    **If the payload lacks planned data, skip rendering and file the gap in
    the PR description as an optional backend follow-up — do not change the
    backend in this phase.**

**Acceptance criteria**
- All previous destinations reachable: Settings via avatar; `/daily` via
  Progress→Wellness and via Today snapshot.
- Deep-linking each route directly renders correct chrome (manually test
  `/settings`, `/daily/3`, `/plan/setup`).
- ChatView, plan setup, onboarding unaffected.
- Tests: update any nav-label assertions; add a `SyncStatusPill` test for
  the three states (mock hook); add `useRouteMeta` unit test covering the
  chrome matrix.

---

### Phase 2 — Today screen hierarchy

**Goal:** a hero that fuses readiness + today's session + briefing; compact
alerts; glanceable tiles; skeleton loading.
**Effort:** M–L. **Risk:** medium (most-viewed screen).
**Depends on:** Phases 0–1.

**Tasks**

2.1 **`TodayHero` component** (`components/today/TodayHero.tsx` + CSS):
    - Left: compact readiness ring (reuse ring markup from `ReadinessCard`;
      extract the ring into `components/ui/ScoreRing.tsx` shared by both).
    - Right: today's **planned session** headline (type badge, distance,
      target pace) from `scheduled_events`/plan day already in the Today
      payload; if an activity has been completed and matches (workout_tag /
      adherence present), show the completed state: "✓ Done — 96%
      adherence" linking to the activity; if rest day: "Rest day" +
      recovery-focused briefing line.
    - Below both: the **first sentence** of the briefing (strip markdown;
      `briefing.split(/(?<=[.!?])\s/)[0]`), with "More →" expanding the full
      `BriefingCard` inline (BriefingCard remains the generator/regenerate
      surface).
    - Tapping the ring expands the existing readiness component bars
      (accordion inside the hero, reusing `ReadinessCard`'s `ComponentBar`).
    - When there is no plan and no scheduled workout, the hero shows
      readiness + "No session planned — ask your coach" (link to `/chat`)
      or "Set up a plan" (link `/plan`) when no plan exists.
2.2 **Section reorder** in `TodayView.tsx` (top→bottom):
    1. compact alert banners (realignment; reuse style as a one-line
       `AlertBanner` shared component with the Plan view's banner),
    2. `TodayHero`,
    3. check-in (see 2.3),
    4. plan-adaptation card,
    5. at-a-glance grid (see 2.4),
    6. race strip (see 2.5),
    7. training load,
    8. week overview,
    9. insights.
    Remove the standalone ReadinessCard/BriefingCard/ScheduledWorkoutCard
    sections that the hero replaces (`WorkoutCard` list for *extra*
    unplanned activities stays, under a "Also today" title).
2.3 **Check-in collapse**: after submission (`data.daily_checkin` non-null),
    `DailyCheckinCard` renders as a single-line chip row ("😊 Feeling good ·
    edit") that expands on tap. Keep the full form for the empty state.
2.4 **At-a-glance grid**: restyle the daily snapshot as a 4-tile grid
    (`RHR / Sleep score / Body battery / Steps`) using `.stat-*` classes and
    make it a link → `/daily/:id` (from 1.5). Add HRV tile when present.
2.5 **Race strip**: replace full race cards with one compact row per race:
    `🏁 Berlin Marathon · 73 d · goal 3:15` (priority-coloured left border);
    tap expands to the existing `RacePacingCard`. Cap visible races at 2 +
    "show all".
2.6 **Skeletons**: while `useToday` loads, render hero/tiles/chart
    skeletons (from Phase 0.12) instead of the bare spinner.
2.7 **Tests**: hero states (planned / completed / rest / no-plan),
    check-in collapsed vs form, reorder smoke (section order via
    `screen.getAllByRole('heading')`). Update existing today tests
    (BriefingCard/DailyCheckin/PlanAdaptation/RacePacing tests exist).

**Acceptance criteria**
- With a plan + readiness data, the viewport-height fold on a 390×844
  viewport contains: alert (if any), hero (ring + session + briefing line),
  and the check-in chip. Nothing above the hero except alerts.
- All previously shown data remains reachable (expanded hero, expanded
  races, snapshot link).
- Build + tests green.

---

### Phase 3 — Activity list & activity detail

**Goal:** activity rows worth scanning; a detail page with wayfinding and a
visual splits story.
**Effort:** M–L. **Risk:** medium.
**Depends on:** Phase 0.

**Tasks**

3.1 **ActivityListItem redesign**: semantic `<button>`/`<a>` (fix a11y);
    sport icon via a new `utils/sportIcon.tsx` map (lucide: `Footprints`
    run/trail, `Bike`, `Waves`, `PersonStanding` walk, `Dumbbell` strength,
    `Activity` fallback) tinted with the sport colour; two-line layout:
    name + workout tag/PB trophy badge (list payload has
    `personal_records`? check `ActivitySummary` in `api/types.ts` — if
    absent, show PB only in detail and note the optional backend
    enrichment); meta line: relative date ("Tue · 7:12") + distance/time/
    pace; right chevron stays.
3.2 **Group headers with totals**: switch grouping from month to ISO week
    for the first 8 weeks then month beyond ("Week 28 · 3 runs · 42.5 km",
    computed client-side from loaded rows), sticky (`position: sticky; top: 0`)
    within the scroll container.
3.3 **Filter chips**: derive the chip set from the loaded data's distinct
    `activity_type`s (union with the current fixed list), horizontal
    scroll, `aria-pressed`.
3.4 **Detail wayfinding**:
    - Sticky condensed header: after scrolling past the hero (IntersectionObserver
      on the header), show a slim fixed bar (back button + name + distance/
      pace) — reuse `--top-bar-height`.
    - Move the **AI insight summary** up: render a one-line verdict chip
      (first sentence of `insight` markdown) directly under the primary
      StatGrid, linking/scrolling to the full `AiInsightCard` below.
    - Wrap Secondary/Dynamics/Power/Performance/Conditions StatGrids in a
      collapsible "All stats" group (first grid visible, rest behind
      "Show all stats"), preserving deep data for power users.
3.5 **SplitsBars** (`components/activity-detail/SplitsBars.tsx`): above the
    existing `LapsTable`, horizontal bars per split — width ∝ pace (faster =
    longer), coloured by pace zone when `metric_zones.pace` exists (reuse
    `getDotColor` logic → move it into `chartTheme.ts`), HR value labelled at
    bar end. Toggle "Bars / Table" (default bars for ≥3 splits); reuses the
    `splits` payload — no API change.
3.6 **Feedback → toast**: mutations on this page (re-analyze, feedback
    submit) fire toasts (Phase 0.11) instead of silent state flips where no
    inline confirmation exists.
3.7 **Tests**: SplitsBars renders n bars with zone colours; list item is a
    focusable button with accessible name; sticky header appears after
    scroll (jsdom: assert the observer wiring, not pixels).

**Acceptance criteria**
- Keyboard: tab through list rows and activate with Enter.
- Splits render as bars with a table fallback toggle.
- No regression in ChartTabs/RouteMap/zones (visual smoke via dev server).

---

### Phase 4 — Plan & calendar experience

**Goal:** Runna-grade week execution view: completion states, interval
structure bars, informative week tabs.
**Effort:** M–L. **Risk:** medium.
**Depends on:** Phases 0–1 (banner primitive, tokens).

**Tasks**

4.1 **Completion state machine**: extend `DayCard` (or replace with
    `DayRow`) computing state
    `rest | done | missed | today | upcoming`:
    - `done`: `day_date < today` **and** a matched activity exists. Matching
      source: check the plan API payload (`TrainingPlanDay` in
      `api/types.ts`) for a completed/activity link (adherence work in
      `app/adherence.py` matches activities to plan days — if the payload
      already carries `completed`/`activity_id`/adherence, use it; **if
      not**, this phase's only allowed backend change is additive: include
      `matched_activity_id: int | null` and `adherence_score: float | null`
      on plan-day responses in `app/schemas.py`/`app/api.py`, with a test.
      Keep it read-only and optional.)
    - Visuals: leading state glyph (✓ success / ✗ danger-muted / ▶ accent /
      ○ upcoming / — rest), left border in workout colour, done rows show
      "adherence 96% → view run" linking to `/activities/:id`.
4.2 **`WorkoutStructureBar`** (`components/ui/WorkoutStructureBar.tsx`):
    renders `workout_steps` (existing type used by `WorkoutSteps.tsx`) as a
    single horizontal bar of proportional segments (duration/distance-based
    widths; colour by step intensity/type: warmup/cooldown = muted,
    work = workout colour, recover = bg-hover). Tap/click opens the textual
    `WorkoutSteps` breakdown (existing component) in a collapsible. Reuse in:
    Plan day rows (when steps exist), `WorkoutDetailView`,
    `ActivityDetailView` description card, and TodayHero (Phase 2 marks a
    TODO for it — wire it now).
4.3 **Week tabs upgrade**: each tab shows `W<n>`, total km, and a 7-dot
    mini-row of day states (from 4.1). Current week auto-selected on load
    (find week containing today; currently defaults to index 0 — fix).
4.4 **Week header**: replace "Workouts: 3/5 · Distance: 46.0 km" text with a
    compact progress bar (completed/planned distance) + theme line.
4.5 **Send-to-watch toast**: `SendToWatchButton` success/error switch to
    toast + button state (keeps inline state, drops bespoke
    dismiss-on-click error button).
4.6 **Tests**: state machine unit tests (all five states, boundary: today,
    yesterday-with/without-activity); WorkoutStructureBar segment widths sum
    to 100% and handle missing durations; week auto-select.

**Acceptance criteria**
- A week at a glance answers: what's done, what was missed, what's today,
  weekly volume progress — without expanding anything.
- Plan day → completed activity navigation works when data allows.
- If the backend addition was needed: `pytest` green, additive-only schema.

---

### Phase 5 — Trends → Progress

**Goal:** coherent analytics hub with shared chrome and celebrated records.
**Effort:** M. **Risk:** low–medium.
**Depends on:** Phase 0 (chartTheme), Phase 1 (rename).

**Tasks**

5.1 **Tab chrome**: replace the inline-styled tab bar in `TrendsView.tsx`
    with a proper CSS module (`TrendsView.css`), horizontally scrollable
    chips (reuse `.chip` pattern from Activities), `role="tablist"` ARIA.
    Order: Wellness · Performance · Intensity · Aerobic · Records · Custom.
5.2 **Shared `RangeSelector`** (`components/ui/RangeSelector.tsx`): 30/90/
    180/365-day segmented control; adopt in Wellness/Intensity/Aerobic views
    (wire to their existing query params — inspect each view's current
    range handling and standardise; keep per-view state, no global store).
5.3 **chartTheme adoption**: migrate all `components/trends/*` charts to
    `utils/chartTheme.ts` (tooltips, tick colours, palettes). Remove local
    hex maps.
5.4 **Records celebration**: in `PeakPerformancesView`, style new-in-last-7-
    days records with an accent/gold treatment + "New!" badge; when the
    Today payload or activity detail carries fresh PRs (existing
    `personal_records`), fire a one-time toast ("🏆 New 5k best — 19:42")
    keyed by record id in `localStorage` to avoid repeats.
5.5 **Skeletons + empty states**: each tab gets skeleton charts and an empty
    state with a sentence of guidance ("Records appear after your first
    synced runs with detail streams").
5.6 **Tests**: RangeSelector behaviour; a trends view renders with mocked
    query and themed tooltip; records "New!" logic date-boundary test.

**Acceptance criteria**
- No inline style blocks remain in `TrendsView.tsx`; no local hex palettes
  in `components/trends/*`.
- All six tabs reachable on a 360px viewport without label truncation.

---

### Phase 6 — Accessibility, responsive & polish

**Goal:** AA-level interaction quality; the desktop column earns its space;
the app feels finished.
**Effort:** M–L. **Risk:** low (additive).
**Depends on:** all previous phases (audits their output).

**Tasks**

6.1 **Interactive semantics sweep**: every `onClick` on a non-interactive
    element becomes `<button>`/`<a>` or gets `role="button"` + `tabIndex` +
    key handling. Known offenders: daily cards, plan-setup pickers
    (CardPicker/SliderPicker/DayChips/sheets), MonthCalendar day buttons are
    fine, BottomSheet backdrop. Add `aria-label`s to icon-only buttons.
6.2 **Charts a11y**: each Recharts block gets an
    `aria-label` summarising the data ("Weekly volume, last 8 weeks, peak 52
    km") and `role="img"`; zone charts get visible text labels not just
    colour (Z1–Z5 already labelled — verify).
6.3 **Reduced-motion audit**: verify Phase 0.10 covers route trace, calendar
    drag transition, skeleton shimmer, toast slide.
6.4 **Desktop layout (≥1024px)**: in `App.tsx`/CSS, allow `main` content
    `max-width: 1080px`; TodayView becomes a two-column grid (hero + alerts
    + check-in + races left; at-a-glance, training load, week overview
    right; insights full-width). ActivityDetail: charts/laps left, stats
    rail right. Everything else keeps the 640px column centred. Use CSS grid
    with `@media (min-width: 1024px)` only — no JS layout.
6.5 **Bottom nav on desktop**: ≥1024px, convert bottom nav to a left rail
    (icons + labels stacked), `position: sticky`. Same component, CSS only.
6.6 **Empty-state upgrades**: Activities (not connected → "Connect Garmin in
    Settings" button using `useGarminStatus`), Chat (hint prompts reappear
    whenever input is empty and history is short), Today rest-day copy.
6.7 **Onboarding final step**: add a closing step ("You're set — first sync
    is running; your plan generates Sunday or on demand") with buttons
    "Go to Today" / "Generate plan now", so first-run doesn't land on an
    empty screen unexplained.
6.8 **Contrast + tap-target audit**: minimum 44×44 tap targets on nav
    items, chips, week-strip days (pad, don't grow glyphs); re-check
    `--text-muted`/`--text-secondary` on all surfaces.
6.9 **Tests**: axe-style smoke if feasible without new deps (else targeted
    assertions: nav has 5 links with names; all icon buttons have
    accessible names; TodayView grid renders both columns at 1024px via
    matchMedia mock).

**Acceptance criteria**
- Keyboard-only walkthrough: reach and activate nav, open an activity, tab
  through detail, open settings, submit check-in.
- 1280px viewport shows the two-column Today and nav rail; 390px unchanged.
- Lighthouse (if runnable) a11y ≥ 90 on Today; otherwise the manual audit
  checklist in the PR description.

---

## 7. Out of scope / future ideas

- **Real map tiles** (Leaflet/MapLibre + OSM): rejected for now — external
  tile dependency conflicts with the self-hosted, privacy-first posture; the
  canvas silhouette with metric colouring is distinctive. Revisit with
  self-hosted tiles if demand appears.
- **Home-screen customisation** (Garmin-style reorder/hide of Today
  sections): valuable but requires per-user layout persistence; design the
  Today sections as a list now (Phase 2 does) so a later phase can add
  drag-ordering.
- **Unit preference (mi/km)** — `utils/formatting.ts` is metric-only;
  imperial support is a formatting-layer refactor + profile field.
- **Social/feed features** (Strava's core): explicitly not this product.
- **Native haptics / app-store packaging**: PWA vibration API is spotty;
  skip.
- **Full px→token CSS migration**: do opportunistically per file touched.

## 8. Verification playbook

For every phase:

```bash
cd frontend
npm run build        # tsc -b && vite build — must pass
npm test             # vitest — must pass
```

Backend (only if `app/` touched — Phase 4 optional task):

```bash
pytest               # coverage gate 80%
```

Visual smoke (best-effort, non-blocking): run `npm run dev` and drive
Chromium via Playwright (`PLAYWRIGHT_BROWSERS_PATH` preconfigured;
`executablePath: '/opt/pw-browsers/chromium'`) against mocked API responses
(vite dev proxies `/api` — either run the backend with `AUTH_ENABLED=false`
and seeded SQLite, or intercept `/api/v1/*` in Playwright with fixture JSON
mirroring `api/types.ts`). Capture 390×844 and 1280×800 screenshots of
Today, Activities, an activity detail, Plan, and Progress; attach to the PR.

Manual regression checklist (append to each PR):
- [ ] All 13 routes reachable and render
- [ ] Dark and light theme on every changed surface
- [ ] Calendar expand/drag still works
- [ ] Onboarding flow completes
- [ ] No console errors on any changed route
