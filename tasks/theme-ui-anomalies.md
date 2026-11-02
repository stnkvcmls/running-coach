# Nothing OS skin — UI anomaly report

**Branch reviewed:** `claude/nothing-os-skin-phase-6-bugz1b` (commit `b17002d`), the cumulative
tip of the Nothing OS skin phase series (phases 0–6 stack on each other; phase 6 contains all
of them). There is no branch literally named `feature/theme` — this is the theme work.

**Baseline:** `origin/main` (`1abe8ce`).

**State of the branch:** `tsc --noEmit` clean, 235/235 vitest tests pass. Every anomaly below is
visual or behavioural and is invisible to the current test suite.

Findings are ordered by severity. Each one names the file, the line, what breaks, and how to
reproduce it.

---

## HIGH

### H1. `DotMatrix` silently deletes every character outside its 16-glyph table

**Where:** `frontend/src/components/ui/DotMatrix.tsx:5-24` (the `GLYPHS` table) and
`:48` (`const rows = GLYPHS[ch] ?? BLANK`).

`GLYPHS` covers exactly `0123456789 : . - / %` and space. Any other character falls back to
`BLANK` — a fully transparent 5×7 cell. It is not dropped, not substituted, not warned about: it
renders as a 23px-wide hole, so the value silently reads as a *different number*.

Confirmed by rendering the real glyph table (screenshot evidence in the session):

| Source string | What the user sees under a Nothing skin |
|---|---|
| `7h 32m` | `7   32 ` — reads as "7 32" |
| `12,345` | `12 345` — reads as two separate numbers |
| `+14` | ` 14` — the **sign is gone** |

Affected call sites (all reach `StatGrid` → `Numeral` → `DotMatrix`):

- `frontend/src/components/daily/DailyDetailView.tsx:26` — `formatSleepHours()` returns
  `` `${h}h ${m}m` `` (`frontend/src/utils/formatting.ts:84-88`). The "Sleep" stat loses both
  unit letters.
- `frontend/src/components/daily/DailyDetailView.tsx:23,24,25` — `toLocaleString()` on Steps,
  Calories, Active Cal. Group separator is dropped. Note this is locale-dependent: `en-US` gives
  `,`, `de-DE` gives `.` (which *is* in the table, so it renders as a decimal point — arguably
  worse), `fr-FR` gives a narrow no-break space.
- `frontend/src/components/today/TodayView.tsx:77` — same `toLocaleString()` for Steps in the
  "At a Glance" grid.
- `frontend/src/components/activity-detail/ActivityDetailView.tsx:129` — Heat Penalty is built as
  `` `+${Math.round(...)}` ``. The `+` vanishes, so a heat penalty of +14 s/km displays as 14.

**Fix direction:** two independent changes, both needed.
1. Add the missing glyphs to `GLYPHS` — at minimum `+`, `,`, and a fallback. `h`/`m`/`k` etc.
   would mean building an alphabet, so prefer (2) for those.
2. Make `Numeral` (`frontend/src/components/ui/Numeral.tsx:22-28`) not silently lie: either
   pass unsupported strings through as plain text instead of routing to `DotMatrix`, or have
   `DotMatrix` render a visible `?`-style tofu glyph. Silently rendering a blank is the actual
   defect — a value the user cannot read is better than a value they misread.

Also worth fixing at the source: `StatGrid` already has a `unit` field, so `formatSleepHours`
callers should pass `{ value: '7:32', unit: 'h' }`-shaped data rather than baking letters into
the numeric string.

---

### H2. `SIGNAL_ZONE_RAMP` is a dark-mode-only ramp, applied in light mode too

**Where:** `frontend/src/utils/chartTheme.ts:176`

```ts
export const SIGNAL_ZONE_RAMP = ['#3a3a3a', '#5c5c5c', '#8a8a8a', '#c4c4c4', '#ffffff']
```

Every other helper in this file is keyed by `theme` (`getTooltipProps`, `getChartTickColor`,
`getGridStroke`, `getHoverFill`, `NOTHING_SIGNAL_SERIES`). This one is not. The ramp runs dark →
white, which only works on a black background.

In `nothing-signal` **light** mode the card surface is `#f4f4f4` (`skins/nothing.css:43`), so:
- Zone 5 `#ffffff` on `#f4f4f4` ≈ **1.04:1** — effectively invisible.
- Zone 4 `#c4c4c4` on `#f4f4f4` ≈ 1.5:1 — barely visible.

Verified by screenshot: in the light-mode render the Z5 bar disappears into the card.

**Consumers:**
- `frontend/src/components/activity-detail/HrZonesChart.tsx:18` (`zoneFillColors`)
- `frontend/src/components/activity-detail/PaceZonesChart.tsx:72`
- `frontend/src/components/activity-detail/SplitsBars.tsx:47,108` (via `getZoneColor` /
  `getZoneSwatchColor`, `chartTheme.ts:196-210`)
- `frontend/src/components/activity-detail/ChartTabs.tsx:118` (scatter dot colour)

**Fix direction:** make it `Record<Theme, string[]>` like `NOTHING_SIGNAL_SERIES` — light mode
should ramp light → black (e.g. `['#c9c9c9','#a0a0a0','#767676','#454545','#000000']`) — and
thread `theme` through `getZoneColor` / `getZoneSwatchColor` and the two direct importers.

---

### H3. The 4-colour signal ramp is modulo-mapped onto 5- and 6-entry palettes, so series collide

**Where:** `frontend/src/utils/chartTheme.ts:145-163`

```ts
const NOTHING_SIGNAL_SERIES: Record<Theme, string[]> = {
  dark:  ['#ffffff', '#d71921', '#b4b4b4', '#6e6e6e'],
  light: ['#000000', '#d71921', '#4a4a4a', '#8b8b8b'],
}
...
return Object.fromEntries(keys.map((k, i) => [k, ramp[i % ramp.length]]))
```

The ramp has 4 entries. `i % 4` means the 5th key silently gets the 1st key's colour, the 6th
gets the 2nd's. Where those series appear **in the same chart**, they become indistinguishable:

- `frontend/src/components/today/WeekOverview.tsx:40` — `SPORT_COLORS` from
  `utils/colors.ts:34-41` has 6 keys in order `run, bike, swim, walk, strength, other`.
  `getActivityTypes` (`WeekOverview.tsx:27`) stacks `run, bike, swim, walk, other` into **one
  stacked bar** → `other` gets `ramp[5%4]` = `#d71921` = exactly `bike`'s colour. Two stacked
  segments in the same bar, same colour, and the tooltip is the only way to tell them apart.
- `frontend/src/components/today/TrainingLoadChart.tsx:73` — `SPORT_COLORS_DEFAULT` (same file,
  `:29-36`) is `run, ride, swim, walk, strength, other` → `strength` collides with `run`,
  `other` collides with `ride`, in the sport-share breakdown.
- `frontend/src/components/trends/IntensityTrendsView.tsx:95` — `INTENSITY_ZONE_COLORS` is
  zones `'1'`–`'5'` → **zone 5 gets zone 1's colour** in a stacked bar chart *with a `<Legend>`*.
  Easy and max-intensity zones become the same swatch.

`WELLNESS_METRIC_COLORS` (5 keys) also collides (`hrv` = `sleep`), but those render in five
separate cards, so it's cosmetic rather than ambiguous.

**Fix direction:** either extend the ramp to at least 6 mutually-distinct steps per theme, or —
better for stacked bars — make `getSeriesColors` generate an evenly-spaced monochrome ramp sized
to `keys.length` rather than indexing a fixed array. Where the count exceeds what grayscale can
separate, lean on `getSeriesDash` (`chartTheme.ts:168-171`), which already exists for exactly
this problem but is currently only wired into `CustomChartsView`.

---

### H4. Dot-matrix numerals wreck the line box in every context except `.stat-value`

**Where:** `frontend/src/styles/skins/nothing.css:463-476`

Section 4.4 correctly diagnoses the problem — `DotMatrix` is an `inline-block` with
`line-height: 0` and no real text baseline, so inline baseline alignment against sibling text is
font-metric guesswork — and then fixes it for **only two selectors**:

```css
html[data-skin^="nothing"] .stat-value,
html[data-skin^="nothing"] .stat-value-lg { display: inline-flex; align-items: center; gap: 2px }
```

Every other place a `Numeral` sits inline next to text is left broken. Measured in headless
Chromium at the default `dot=3 / gap=2`: **one glyph is 23×33px**, and a 13px/1.4 line-height row
containing a numeral plus sibling text grows from ~18px to **45px** — 2.5× — with the text
bottom-aligned against the dot grid.

Unfixed contexts:

| File | Line | Class |
|---|---|---|
| `today/TodayHero.tsx` | 77, 105, 112 | `.hero-session-meta` (also mixes dot-matrix distance with plain-text duration on the same line) |
| `activities/ActivitiesView.tsx` | 154 | `.group-head b` |
| `plan/PlanView.tsx` | 254 | `.plan-week-progress-value` |
| `activity-detail/AdherenceCard.tsx` | 46-48 | `.adherence-score-value` |
| `trends/WellnessTrendsView.tsx` | 140, 186, 222, 265, 320 | `.wellness-metric-value` (each has a `.wellness-metric-unit` sibling — the exact drift case 4.4 describes) |
| `trends/PerformanceCurveView.tsx` | 285, 293, 304, 311, 320 | `.perf-param-value` (with `.perf-param-unit` sibling) |

**Fix direction:** extend the 4.4 rule to all of these selectors. Better: move the
`display: inline-flex; align-items: center` onto `.dot-matrix` itself — or have `Numeral` emit a
wrapper that owns the alignment — so the fix travels with the component instead of needing a
skin-CSS entry per consumer. Consider also giving `DotMatrix` a size prop scaled to the context;
right now **every** call site uses the default `dot=3 / gap=2`, so a hero score and an inline
group-header summary render at exactly the same 33px height.

---

## MEDIUM

### M1. A score of 100 overflows the `ScoreRing` and crosses the arc

**Where:** `frontend/src/components/ui/ScoreRing.tsx:13,50`;
`today/TodayHero.tsx:182`; `today/ReadinessCard.tsx:42` (both `ringSize = 100` under Nothing).

Commit `5fc73c9` sized the ring to "the smallest size that comfortably contains a **2-digit**
score". Readiness is 0–100 and 100 is reachable. Measured: `"100"` renders **81px wide**; the
ring is 100px with its stroke at r≈43.75px. At the numeral's vertical offset the inner chord is
only ~69px, so the leading `1` and trailing `0` cut through the progress arc. Verified by
screenshot.

`.score-ring` has `overflow: hidden` (`ScoreRing.css:9`) as a "defensive backstop", which means
the failure mode is a *clipped* numeral rather than a visibly overflowing one — harder to notice,
same broken result.

**Fix direction:** size the numeral to the digit count (drop to `dot=2` at 3 digits), or widen
the ring when `score >= 100`, or special-case 100 as a full-ring state with no numeral. Add a
test at score = 100 — the existing tests only cover 2-digit scores.

### M2. `RouteMap` monochromes `nothing-app`, and only skins one of its five modes

**Where:** `frontend/src/components/activity-detail/RouteMap.tsx:154-159`

```ts
const strokeColor = skin.startsWith('nothing') ? ...'--accent'... : activityColor
```

Two problems:

1. **`startsWith('nothing')` catches `nothing-app`**, whose entire stated purpose is "keeps the
   current workout colours" (`settings/AppearanceSection.tsx:9`). Every other chart honours this
   — `getSeriesColors` (`chartTheme.ts:156`) returns the fallback unchanged unless the skin is
   exactly `nothing-signal`. `RouteMap` is the only component that monochromes `nothing-app`, and
   it does so on the largest colour surface of the Activity Detail screen. The in-code comment
   ("like every other chart series") states the opposite of what the code does.
2. **Only `mode === 'solid'` is skinned.** `segColor` (`:160-169`) falls through to `rampColor`
   (`:34-38`), a raw `hsl(210 → 0)` blue→red rainbow, for the `hr` / `pace` / `power` /
   `elevation` modes. Under `nothing-signal` — a skin whose rule is "the only non-ink colour is
   the red accent" — switching the route to HR colouring paints a full rainbow.

**Fix direction:** gate on `skin === 'nothing-signal'`, and give `rampColor` a monochrome
(or ink→accent) variant for that skin. Also note `drawMarker` hardcodes `ctx.strokeStyle = '#fff'`
(`:180`), which is wrong on a light background regardless of skin.

### M3. `ChartTabs` misses the `skin` argument on one axis

**Where:** `frontend/src/components/activity-detail/ChartTabs.tsx:169`

```tsx
tick={getAxisTick(theme)}      // line 169 — area chart Y axis
```

Line 94 in the same file correctly passes `getAxisTick(theme, undefined, skin)`. Line 169 was
missed, so the area chart's Y-axis ticks keep the default-skin grey (`#888` / `#6b7280`) instead
of the Nothing grey (`#6e6e6e` / `#8b8b8b`). Subtle, but it's a one-word fix and it's the only
remaining unthreaded `skin` in the chart layer.

### M4. `METRIC_COLORS` is never remapped, so the activity-detail chart keeps its rainbow

**Where:** `frontend/src/utils/chartTheme.ts:79-92`, used at
`frontend/src/components/activity-detail/ChartTabs.tsx:30`

```ts
const color = METRIC_COLORS[activeKey] || '#6c5ce7'
```

Phase 5 routed every other palette through `getSeriesColors`, but `METRIC_COLORS` (12 literal
hexes — red HR, green elevation, amber pace, purple GCT…) is read directly. Under
`nothing-signal` the main activity-detail area chart, its gradient fill, and its stroke all keep
the default palette. This is the most-viewed chart in the app.

Same file, same class of leak: the `|| '#6c5ce7'` purple fallbacks at `chartTheme.ts:198` and
`HrZonesChart.tsx:64` fire whenever a value has no matching zone.

---

## LOW

### L1. The `nothing-app` swatch in Settings previews a colour that skin never uses

**Where:** `frontend/src/components/settings/AppearanceSection.css:115`

```css
[data-skin-preview="nothing-app"] .swatch-accent { background: #0984e3; }
```

`nothing-app` deliberately inherits the app accent from `globals.css` — `#6c5ce7`
(`globals.css:10`); `skins/nothing.css:62-65` only overrides `--accent-light` in light mode.
`#0984e3` is `--color-long` / `--sport-swim`, not the accent. The picker row advertises a blue
the skin never renders. Should be `#6c5ce7`.

### L2. The Mode segmented control declares `role="radiogroup"` but its children aren't radios

**Where:** `frontend/src/components/settings/AppearanceSection.tsx:22-38`

The wrapper is `role="radiogroup"`, but the two buttons use `aria-pressed` (toggle-button
semantics) rather than `role="radio"` + `aria-checked`. A radiogroup with no radios inside is
invalid ARIA; screen readers announce the group then find nothing to report state on. Either add
`role="radio"` / `aria-checked` to the buttons, or drop the `radiogroup` role and keep plain
toggle buttons. (The Style picker below it uses real `<input type="radio">` and is fine.)

### L3. `hero-session-meta` renders distance three ways in one component

**Where:** `frontend/src/components/today/TodayHero.tsx:77, 106, 148`

Lines 77 and 106 wrap `formatDistance(...)` in `<Numeral>`; line 148 — the scheduled-event branch
of the same component, same `.hero-session-meta` class — leaves it as plain text. Which
typography the user sees for "today's distance" depends on which hero branch renders. Line 148
should be wrapped too (or all three unwrapped — see H4, this row is a poor fit for a 33px glyph).

### L4. `frontend/tsconfig.tsbuildinfo` is tracked in git

It's a TypeScript incremental build artifact and it churns in this branch's diff. Pre-existing on
`main`, not introduced here, but worth adding to `.gitignore` and `git rm --cached`-ing while
someone is in this area.

---

## Suggested fix order

1. **H1** — it makes the app display wrong numbers. Everything else is cosmetic by comparison.
2. **H2**, **H3** — light mode and stacked charts are unreadable/ambiguous today.
3. **H4** — one CSS change (ideally on `.dot-matrix` itself) fixes six components.
4. **M1**–**M4**, then the LOW items.

## Test coverage gap

`tsc` is clean and all 235 tests pass with every one of these present. Worth adding alongside
the fixes:

- `DotMatrix` — assert unsupported characters are handled visibly, not blanked
  (`DotMatrix.test.tsx` currently only covers supported input).
- `chartTheme` — assert `getSeriesColors` returns **distinct** values for a 6-key palette, and
  that the zone ramp differs between light and dark.
- `ScoreRing` — render at `score = 100`.
