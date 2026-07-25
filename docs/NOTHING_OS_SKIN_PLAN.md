# Nothing OS Skin — Implementation Plan

_Last updated: 2026-07-25_

This document specifies a **selectable visual skin** for the Running Coach PWA,
inspired by Nothing OS, alongside the existing appearance. It is written so a
capable coding agent (Sonnet) can execute each phase unattended.

It is a **plan only** — no product code has been changed in this commit. The
only files added are this document and the mockup it references.

**Visual reference:** [`docs/mockups/nothing-os-skin-mockup.html`](mockups/nothing-os-skin-mockup.html).
Open it in a browser. It has two toggles in the top-right that combine into the
four Nothing variants this plan delivers:

- **Black / White** → maps to `data-theme="dark" | "light"`
- **Signal red / App inks** → maps to `data-skin="nothing-signal" | "nothing-app"`

Where this document and the mockup disagree, **this document is authoritative** —
the mockup illustrates hierarchy, colour and state, not final pixels or copy.

---

## Table of contents

1. [Goal](#1-goal)
2. [Architecture decision](#2-architecture-decision)
3. [Global rules for the implementing agent](#3-global-rules-for-the-implementing-agent)
4. [Phase 0 — Skin plumbing & settings UI](#phase-0--skin-plumbing--settings-ui)
5. [Phase 1 — Nothing token layer](#phase-1--nothing-token-layer)
6. [Phase 2 — Semantic ink tokens](#phase-2--semantic-ink-tokens)
7. [Phase 3 — Structural restyle](#phase-3--structural-restyle)
8. [Phase 4 — Dot-matrix numerals & ring](#phase-4--dot-matrix-numerals--ring)
9. [Phase 5 — Charts](#phase-5--charts)
10. [Phase 6 — QA, accessibility & docs](#phase-6--qa-accessibility--docs)
11. [File-by-file change index](#11-file-by-file-change-index)
12. [Risks & non-goals](#12-risks--non-goals)

---

## 1. Goal

The user can pick **appearance mode** and **visual style** independently in
Settings, giving six combinations:

| | Dark | Light |
|---|---|---|
| **Default** | today's app, unchanged | today's app, unchanged |
| **Nothing — signal red** | black surfaces, one red accent | white surfaces, one red accent |
| **Nothing — app inks** | black surfaces, existing palette | white surfaces, existing palette |

The two Nothing skins share **all** geometry, typography and layout. They differ
only in which semantic ink tokens resolve to. This is the single most important
structural fact in this plan: **Phase 3 and Phase 4 are written once and apply to
both Nothing skins**; only Phase 2's token map differs.

### What defines the Nothing look (all of it is skin-scoped CSS)

- Pure black (`#000`) or pure white (`#fff`) surfaces; no navy, no grey-blue.
- 1px hairline borders instead of shadows. Zero `box-shadow`.
- Larger, squarer radii: 26px tiles, 20px cards, 12px icons, pill controls.
- Monospace, uppercase, wide-tracked micro-labels; plain sans for prose only.
- Perforated dot-grid fills replacing gradients and shimmer.
- 5×7 dot-matrix rendering for headline numerals only.
- Colour never fills a surface — only strokes, dots, type labels, chart series.

---

## 2. Architecture decision

### 2.1 Two orthogonal attributes, not one enum

`data-theme` stays exactly as it is (`dark | light`). A **new** `data-skin`
attribute (`default | nothing-signal | nothing-app`) is added to
`document.documentElement`.

**Do not add a third value to the `Theme` union.** `Theme = 'dark' | 'light'` is
exported from `utils/chartTheme.ts` and threaded through 12 components. Widening
it forces every consumer to handle a third case and breaks the light/dark
distinction Nothing itself needs (Nothing OS has both a black and a white mode).

### 2.2 CSS specificity — read this before writing any selector

`globals.css` already defines light-theme tokens as:

```css
[data-theme="light"] { ... }   /* specificity (0,1,0) */
```

A skin override written as `html[data-skin="nothing-signal"]` has specificity
(0,1,1) and therefore beats `[data-theme="light"]`. That is wrong: in light
mode the light values must still win for anything the skin does not explicitly
set.

**Rule:** every skin token block must be written for an explicit
theme + skin pair, at (0,2,1):

```css
html[data-skin="nothing-signal"][data-theme="dark"]  { ... }
html[data-skin="nothing-signal"][data-theme="light"] { ... }
```

Shared values that are identical in both modes may use a grouped selector, but
must still carry both attributes:

```css
html[data-skin="nothing-signal"][data-theme="dark"],
html[data-skin="nothing-signal"][data-theme="light"] { --radius: 26px; }
```

Structural (non-token) rules may use the looser
`html[data-skin^="nothing"] .selector` form, because they add properties rather
than compete with theme tokens.

Since `data-theme` is always set by `App.tsx` on mount, no `:root`-only fallback
is needed.

### 2.3 Import order

`main.tsx` imports `./styles/globals.css` only. Skin sheets must be imported
**after** it so equal-specificity ties resolve to the skin:

```ts
import './styles/globals.css'
import './styles/skins/nothing.css'   // Phase 1
```

Component CSS files are imported by their components (i.e. after both), so any
rule that must beat a component rule needs the `html[data-skin^="nothing"]`
prefix, which outranks a bare class selector.

---

## 3. Global rules for the implementing agent

1. **Default skin is sacred.** After every phase, `data-skin="default"` must
   render byte-identically to `main`. If a change alters the default skin, it is
   in the wrong file — move it under a skin selector.
2. **Never edit a component's existing CSS rule to change its appearance.** Add
   a skin-scoped override instead. The only exception is Phase 1's shadow
   neutralisation, which is done via a token.
3. **No new colour literals in TSX.** Colour belongs in CSS tokens. The one
   allowed exception is `utils/chartTheme.ts` (Recharts takes hex props, not
   `var()`), handled in Phase 5.
4. **Run `npx tsc --noEmit` and `npx vitest run` in `frontend/` after each
   phase.** Both must pass before moving on.
5. **Commit per phase**, message prefix `skin:`. Example:
   `skin: phase 1 — Nothing token layer`.
6. Do not install dependencies. Everything here is achievable with the current
   stack (React, Recharts, lucide-react, vitest).
7. Do not touch backend code except where Phase 5 explicitly allows a
   client-side override map. **No Alembic migration, no schema change.**

---

## Phase 0 — Skin plumbing & settings UI

**Outcome:** the setting exists, persists and applies an attribute. No visual
change yet in any skin.

### 0.1 Extend the appearance context — `frontend/src/App.tsx`

Currently (lines ~38–50 and ~92–103):

```ts
interface ThemeContextType {
  theme: 'dark' | 'light'
  toggleTheme: () => void
}
```

Add a skin alongside it. **Keep `useTheme()`'s existing shape** so the 12
existing consumers compile untouched.

```ts
export type Skin = 'default' | 'nothing-signal' | 'nothing-app'

export const SKIN_LABELS: Record<Skin, string> = {
  'default': 'Default',
  'nothing-signal': 'Nothing — signal red',
  'nothing-app': 'Nothing — app inks',
}

interface ThemeContextType {
  theme: 'dark' | 'light'
  toggleTheme: () => void
  skin: Skin
  setSkin: (s: Skin) => void
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  skin: 'default',
  setSkin: () => {},
})
```

In the `App()` body, mirror the existing theme pattern exactly:

```ts
const [skin, setSkin] = useState<Skin>(() => {
  const stored = localStorage.getItem('skin')
  return stored === 'nothing-signal' || stored === 'nothing-app' ? stored : 'default'
})

useEffect(() => {
  document.documentElement.setAttribute('data-skin', skin)
  localStorage.setItem('skin', skin)
}, [skin])
```

Note the validated read — an unknown `localStorage` value must fall back to
`'default'`, not be cast blindly (the existing `theme` read casts; do not copy
that part).

Pass `skin` and `setSkin` into the existing `ThemeContext.Provider` value.

Add a `useSkin()` convenience hook next to `useTheme()`:

```ts
export function useSkin() {
  const { skin, setSkin } = useContext(ThemeContext)
  return { skin, setSkin }
}
```

### 0.2 Prevent a flash of default skin — `frontend/index.html`

The attribute is only applied after React mounts, so a Nothing user sees a
flash of the default theme on every load. Add a blocking inline script in
`<head>`, before any stylesheet:

```html
<script>
  (function () {
    var t = localStorage.getItem('theme');
    var s = localStorage.getItem('skin');
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
    document.documentElement.setAttribute(
      'data-skin',
      s === 'nothing-signal' || s === 'nothing-app' ? s : 'default'
    );
  })();
</script>
```

This also fixes the pre-existing light-theme flash. The `useEffect`s in `App.tsx`
remain — they are the source of truth after mount.

### 0.3 Appearance section — new file `frontend/src/components/settings/AppearanceSection.tsx`

Follow the existing section pattern (`<section className="settings-section">` +
`<h2 className="section-title">` + a `.card`), matching
`NotificationsSection.tsx`.

Two controls:

- **Mode** — segmented Dark / Light, driven by `theme` + `toggleTheme`.
- **Style** — three radio rows, one per `Skin`, each with a short description
  and a live swatch preview (three dots: surface, ink, accent).

Requirements:

- Use a `<fieldset>`/`<legend>` with `role="radiogroup"` semantics, or native
  `<input type="radio" name="skin">`. Native radios are preferred — free
  keyboard and screen-reader behaviour.
- Each row's hit target is ≥44px tall (matches the `.chip` convention in
  `globals.css`).
- Selecting a style applies instantly; no save button, consistent with the
  existing theme toggle.
- Descriptions:
  - Default — "The current look."
  - Nothing — signal red — "Monochrome, dot-matrix. One red accent."
  - Nothing — app inks — "Monochrome layout, keeps the current workout colours."

Create `AppearanceSection.css` for the swatch/radio layout. Register the section
in `SettingsView.tsx` as the **first** section, above `<AccountSection />`
(around line 273).

### 0.4 TopBar

Leave `TopBar.tsx`'s sun/moon button as-is — it toggles *mode* only. Do not add
a skin control to the top bar.

### 0.5 Tests — new file `frontend/src/components/settings/AppearanceSection.test.tsx`

- Renders three style options; the stored one is checked.
- Clicking "Nothing — app inks" sets `document.documentElement`'s `data-skin` to
  `nothing-app` and writes `localStorage.skin`.
- An invalid stored value falls back to `default`.

### Phase 0 acceptance

- [ ] Settings shows Appearance with Mode and Style; selection persists across reload.
- [ ] `data-skin` is present on `<html>` before first paint (verify: hard-reload with a Nothing skin stored, no flash).
- [ ] All three skins currently look identical (no CSS yet).
- [ ] `tsc --noEmit` and `vitest run` pass.

---

## Phase 1 — Nothing token layer

**Outcome:** both Nothing skins already look ~70% right, from token overrides
alone. No component file is touched.

### 1.1 New file `frontend/src/styles/skins/nothing.css`

Imported from `main.tsx` after `globals.css`. Contains only token blocks in this
phase.

```css
/* ---- shared by both Nothing skins, both modes ---- */
html[data-skin="nothing-signal"][data-theme="dark"],
html[data-skin="nothing-signal"][data-theme="light"],
html[data-skin="nothing-app"][data-theme="dark"],
html[data-skin="nothing-app"][data-theme="light"] {
  --radius: 26px;
  --radius-sm: 20px;
  --radius-xs: 12px;

  --shadow-sm: none;
  --shadow-md: none;

  --font-ui: "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif;
  --font-mono: ui-monospace, "SF Mono", "Roboto Mono", Menlo, Consolas, monospace;
}

/* ---- dark (black) ---- */
html[data-skin="nothing-signal"][data-theme="dark"],
html[data-skin="nothing-app"][data-theme="dark"] {
  --bg: #000000;
  --bg-card: #0b0b0b;
  --bg-input: #141414;
  --bg-hover: #1a1a1a;
  --surface: var(--bg-card);
  --text: #ffffff;
  --text-muted: #6e6e6e;
  --text-secondary: #b4b4b4;
  --border: #232323;
  --border-strong: #3a3a3a;
  --dot-off: rgba(255, 255, 255, 0.10);
}

/* ---- light (white) ---- */
html[data-skin="nothing-signal"][data-theme="light"],
html[data-skin="nothing-app"][data-theme="light"] {
  --bg: #ffffff;
  --bg-card: #f4f4f4;
  --bg-input: #ebebeb;
  --bg-hover: #e4e4e4;
  --surface: var(--bg-card);
  --text: #000000;
  --text-muted: #8b8b8b;
  --text-secondary: #4a4a4a;
  --border: #e0e0e0;
  --border-strong: #c8c8c8;
  --dot-off: rgba(0, 0, 0, 0.10);
}
```

`--border-strong` and `--dot-off` are new tokens. Also add them to `:root` in
`globals.css` with default-skin-appropriate values (`--border-strong: #3d3d5c`
dark / `#c9cfda` light, `--dot-off: transparent`) so no component can reference
an undefined variable in the default skin.

### 1.2 Accent per skin

```css
html[data-skin="nothing-signal"][data-theme="dark"],
html[data-skin="nothing-signal"][data-theme="light"] {
  --accent: #d71921;
  --accent-light: #d71921;
}

/* app inks keeps the existing accent, unchanged from globals.css */
html[data-skin="nothing-app"][data-theme="light"] {
  --accent-light: #5a4bd1;
}
```

### 1.3 Font wiring — `frontend/src/styles/globals.css`

Add `--font-ui` / `--font-mono` to `:root` with the current stack as
`--font-ui`, then change `body { font-family: ... }` to `var(--font-ui)`. This is
the one edit to a shared rule; it is a no-op for the default skin.

> **Licensing note:** the real Nothing typefaces (Ndot 55, Nothing Font 5x7) are
> not redistributable. Do not download or bundle them. The monospace stack above
> is the approved substitute; the dot-matrix component in Phase 4 supplies the
> distinctive numerals.

### Phase 1 acceptance

- [ ] Both Nothing skins render black/white surfaces, hairline borders, no shadows, larger radii.
- [ ] Default skin unchanged (diff screenshots of Today, Plan, Activities).
- [ ] Light + Nothing renders white, not the old grey-blue.

---

## Phase 2 — Semantic ink tokens

**Outcome:** the two Nothing skins diverge. This is the only phase where they
differ.

### 2.1 Token definitions — append to `nothing.css`

Both skins define the same **names**; only the values differ. Component CSS in
Phase 3 references these names and never a raw hex.

```css
/* signal red — colour is spent once per screen */
html[data-skin="nothing-signal"][data-theme="dark"],
html[data-skin="nothing-signal"][data-theme="light"] {
  --c-easy:     var(--text);
  --c-tempo:    var(--accent);
  --c-interval: var(--accent);
  --c-long:     var(--text);
  --c-race:     var(--accent);
  --c-cross:    var(--text);
  --c-strength: var(--text);
  --c-pb:       var(--accent);
  --c-alert:    var(--accent);
  --c-warn:     var(--accent);
  --c-ring:     var(--text);
  --c-series-1: var(--text);
  --c-series-2: var(--accent);
}

/* app inks — the existing globals.css palette, demoted to strokes and labels */
html[data-skin="nothing-app"][data-theme="dark"],
html[data-skin="nothing-app"][data-theme="light"] {
  --c-easy:     var(--color-easy);
  --c-tempo:    var(--color-tempo);
  --c-interval: var(--color-interval);
  --c-long:     var(--color-long);
  --c-race:     var(--color-race);
  --c-cross:    var(--color-cross);
  --c-strength: var(--color-strength);
  --c-pb:       #f0a500;
  --c-alert:    var(--danger);
  --c-warn:     var(--warning);
  --c-ring:     var(--success);
  --c-series-1: var(--color-long);
  --c-series-2: #e17055;
}

/* Light-mode contrast corrections. #f39c12 (2.2:1) and #2ecc71 (2.0:1) fall
   below the 3:1 floor for non-text UI on white. These four are the only places
   the "keep the original palette" rule bends. */
html[data-skin="nothing-app"][data-theme="light"] {
  --c-easy:     #1a8f4c;
  --c-tempo:    #a86a06;
  --c-cross:    #00908d;
  --c-strength: #6c5ce7;
}
```

Add `--c-*` defaults to `:root` in `globals.css` mapping to the existing
`--color-*` values, so the default skin is unaffected if a component starts
using them.

### 2.2 Where the inks are applied

Applied in Phase 3 as skin-scoped overrides. The mapping:

| Element | Token |
|---|---|
| Plan row workout label (`.plan-*` in `PlanView.css`) | per workout type |
| Hero workout badge (`TodayHero.tsx` `WORKOUT_TYPE_BADGE_COLORS`) | per workout type |
| Activity list icon (`ActivityListItem.tsx`, `getActivityAccent`) | per workout type |
| `.pr-badge` | `--c-pb` |
| `AlertBanner` | `--c-alert` |
| Readiness ring | `--c-ring` |
| Week-strip race dot | `--c-race` |
| Splits over-target bar | `--c-interval` |

`TodayHero.tsx` and `PlanView.tsx` already map workout type → `var(--color-*)`
through `WORKOUT_TYPE_COLORS` in `utils/colors.ts`. **Do not change that file.**
Instead, redefine `--color-easy` … `--color-strength` under the signal skin:

```css
html[data-skin="nothing-signal"][data-theme="dark"],
html[data-skin="nothing-signal"][data-theme="light"] {
  --color-easy: var(--text);
  --color-tempo: var(--accent);
  --color-interval: var(--accent);
  --color-long: var(--text);
  --color-race: var(--accent);
  --color-cross: var(--text);
  --color-strength: var(--text);
  --color-default: var(--text);
}
```

This single block monochromes every `var(--color-*)` consumer in the app for
free, and app-inks needs no rule at all because it keeps the originals. It is
the highest-leverage change in this plan.

### Phase 2 acceptance

- [ ] `nothing-signal`: the only non-ink colour on Today, Plan and Activities is the red accent.
- [ ] `nothing-app`: all six workout colours are visible on the Plan rows and activity icons.
- [ ] Light + app inks: no UI colour below 3:1 against `#fff` (spot-check with DevTools).

---

## Phase 3 — Structural restyle

**Outcome:** the Nothing geometry and typography. All rules live in
`nothing.css` (or a sibling `nothing-components.css` if it exceeds ~400 lines),
scoped `html[data-skin^="nothing"]`.

Implement in this order, verifying each against the mockup:

### 3.1 Micro-label typography

Restyle the existing shared primitives from `globals.css`:

```css
html[data-skin^="nothing"] .stat-label,
html[data-skin^="nothing"] .section-title {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--text-muted);
}
```

This alone restyles most screens, because `.stat-label` and `.section-title` are
used app-wide.

### 3.2 Buttons and chips

`.btn-primary` becomes an ink fill (`background: var(--text); color: var(--bg)`),
pill radius, mono uppercase 10px/0.18em. `.btn-secondary` becomes a hairline
outline. `.chip.active` becomes an ink fill, not accent. See the mockup's
component sheet.

### 3.3 Cards and tiles

`.card` gets `border: 1px solid var(--border); box-shadow: none;` — the radius
comes from the Phase 1 token.

### 3.4 Bottom nav glyph — `BottomNav.css`

Active tab: `color: var(--text)` plus a red/accent glyph bar above the icon.

```css
html[data-skin^="nothing"] .nav-item.active { color: var(--text); }
html[data-skin^="nothing"] .nav-item.active::after {
  content: "";
  position: absolute;
  top: 2px;
  width: 22px;
  height: 3px;
  border-radius: 2px;
  background: var(--accent);
}
```

`.nav-item` needs `position: relative` — add it under the skin selector, not to
the base rule. On desktop (≥1024px) the nav is a left rail; place the bar on the
leading edge instead (`left: 0; top: 50%; width: 3px; height: 22px`).

### 3.5 Week strip, top bar, sheets, splits, alert banner

Per the mockup: `WeekStrip.css` (selected day = ink fill, today = accent
border), `TopBar.css` (mono uppercase title with wide tracking, squircle icon
buttons), `BottomSheet.css` (grab handle, 30px top radius),
`AlertBanner.css` (hairline + `--c-alert` dot).

### 3.6 Perforated fills

Add a reusable utility in `nothing.css`:

```css
html[data-skin^="nothing"] .perf {
  background-image: radial-gradient(var(--dot-off) 1px, transparent 1px);
  background-size: 10px 10px;
}
```

Apply to the hero tile and training-load tile via `className="card perf"` in
TSX (harmless in the default skin, where `--dot-off` is `transparent`).

### 3.7 Skeleton — `Skeleton.css`

Replace the shimmer with a static perforated block under the skin selector.
Keep the existing reduced-motion behaviour intact.

### Phase 3 acceptance

- [ ] Today, Plan, Coach, Activities, Progress, Activity detail and the plan-setup sheet match the mockup's structure in all four Nothing variants.
- [ ] Default skin still pixel-identical.
- [ ] No `box-shadow` renders in any Nothing variant (check computed styles).

---

## Phase 4 — Dot-matrix numerals & ring

### 4.1 New component `frontend/src/components/ui/DotMatrix.tsx`

Renders a string as a 5×7 perforated grid. Reference implementation: the
`GLYPHS` map and `renderDotMatrix()` at the bottom of the mockup file — port it
to React.

```ts
interface Props {
  /** Digits, ':', '.', '-', '/', '%' and space are supported. */
  value: string
  /** Dot diameter in px. Default 3. */
  dot?: number
  /** Gap between dots in px. Default 2. */
  gap?: number
  /** Accessible text. Defaults to `value`. */
  label?: string
}
```

Requirements:

- **Accessibility is mandatory.** The dot grid is decorative markup; the value
  must reach assistive tech. Wrap output in
  `<span role="img" aria-label={label ?? value}>` and mark the grid
  `aria-hidden="true"`.
- Unlit dots render at `var(--dot-off)`, lit dots at `currentColor`, so callers
  control colour by setting `color` on a parent.
- Unknown characters render as blank cells; never throw.
- Pure CSS grid, no canvas, no SVG.
- Ship `DotMatrix.css` alongside.

Unit test `DotMatrix.test.tsx`: renders the right number of lit dots for `"7"`,
exposes `aria-label`, and does not crash on `"?"`.

### 4.2 Skin-aware numeral rendering

Add `frontend/src/components/ui/Numeral.tsx` — a thin wrapper that renders
`<DotMatrix>` when the skin starts with `nothing`, and a plain
`<span className="stat-value">` otherwise. **Only this wrapper is used in
screens**, so no screen contains a skin conditional.

Apply `Numeral` to headline metrics only, per the mockup:

- `TodayHero` — readiness score, distance, target pace
- `StatGrid` (`components/activity-detail/StatGrid.tsx`) — all cells
- `PlanView` — week mileage
- `ActivitiesView` — month total
- `AdherenceCard` — adherence score
- `TrendsView` children — headline values only, not axis ticks

Do **not** apply it to body copy, axis labels, table cells or chat text.

### 4.3 ScoreRing — `components/ui/ScoreRing.tsx` + `.css`

Under the Nothing skins the ring becomes a perforated dotted arc with a
dot-matrix score. The current implementation is a CSS `border` circle, which
cannot express an arc — replace the internals with an SVG that both skins use:

- Two `<circle>` elements, `stroke-dasharray="1.5 6"`, `stroke-linecap="round"`,
  `pathLength="100"` so the progress arc is simply `stroke-dasharray: {score} 100`.
- Track stroke `var(--border)`, progress stroke `var(--ring-color)`.
- In the default skin keep the existing solid-border look by giving the arc no
  dash pattern — gate with `html[data-skin^="nothing"] .score-ring-arc { stroke-dasharray: 1.5 6 }`.
- The number goes through `Numeral`.

### 4.4 `scoreColor` returns raw hex — fix it here

`ReadinessCard.tsx:10-15` returns four literals (`#00b894`, `#fdcb6e`, `#e17055`,
`#d63031`) and is used by both `TodayHero`'s ring and `ComponentBar`. Phase 2's
token overrides cannot reach it.

Add four band tokens to `:root` in `globals.css` with those exact values
(`--score-high`, `--score-mid`, `--score-low`, `--score-poor`), return
`var(--score-*)` from `scoreColor`, then override them under the signal skin:

```css
html[data-skin="nothing-signal"][data-theme="dark"],
html[data-skin="nothing-signal"][data-theme="light"] {
  --score-high: var(--text);
  --score-mid:  var(--text-secondary);
  --score-low:  var(--accent);
  --score-poor: var(--accent);
}
```

`nothing-app` inherits the originals and needs no rule. This keeps the default
skin byte-identical (same four colours, now via tokens) and makes readiness
monochrome under signal red without a conditional in TSX.

Note: `ScoreRing`'s SVG can consume `var()` directly, but any *canvas* consumer
cannot — see Phase 5.4 for `RouteMap.tsx`, which draws to a canvas and must read
computed tokens instead.

### Phase 4 acceptance

- [ ] Headline metrics render as dot-matrix in both Nothing skins, normal numerals in default.
- [ ] Screen reader announces the numeric value, not "dots".
- [ ] Ring arc length matches the score in all skins; default skin visually unchanged.

---

## Phase 5 — Charts

**This phase is much smaller for `nothing-app` than for `nothing-signal`.**
`nothing-app` deliberately keeps every palette in `utils/chartTheme.ts` as-is —
that is the main engineering argument for offering it.

### 5.1 Make chart theming skin-aware — `utils/chartTheme.ts`

The 4 existing `theme === 'light'` ternaries (lines ~37–55) set tooltip, tick and
grid colours. Extend each function to take the skin:

```ts
export type ChartSkin = 'default' | 'nothing-signal' | 'nothing-app'

export function getGridStroke(theme: Theme, skin: ChartSkin = 'default'): string {
  if (skin !== 'default') return theme === 'light' ? '#e0e0e0' : '#232323'
  return theme === 'light' ? '#e0e4ec' : '#2d2d44'
}
```

Same shape for `getTooltipProps`, `getChartTickColor`, `getAxisTick`. **Keep the
skin parameter optional and defaulted** so no existing call site breaks; update
the 12 `useTheme` consumers to pass it.

### 5.2 Series palettes

Add a resolver rather than mutating the exported constants (they are imported
directly in several views):

```ts
const NOTHING_SIGNAL_SERIES = ['#ffffff', '#d71921', '#8a8a8a', '#4a4a4a']

export function getSeriesColors(skin: ChartSkin, fallback: string[]): string[] {
  return skin === 'nothing-signal' ? NOTHING_SIGNAL_SERIES : fallback
}
```

Call sites pass their existing constant as `fallback`:
`getSeriesColors(skin, CHART_SERIES_COLORS)`. For `nothing-app` and `default` the
fallback is returned unchanged, so those two skins need no further work.

Apply to: `WellnessTrendsView`, `AerobicTrendsView`, `IntensityTrendsView`,
`PerformanceCurveView`, `CustomChartsView`, `TrainingLoadChart`, `HrZonesChart`,
`PaceZonesChart`, `ChartTabs`, `WeekOverview`.

For signal-red monochrome, series beyond the second must differentiate by dash
pattern, not hue — set `strokeDasharray` on index ≥2. Four white lines are
unreadable otherwise.

### 5.3 API-supplied zone colours

`getZoneColor()` returns `zone.zone_color` straight from the API (seeded in
`app/database.py`). Under `nothing-signal` these render as the old rainbow.

Add a **client-side** override — do not migrate the database:

```ts
const SIGNAL_ZONE_RAMP = ['#3a3a3a', '#5c5c5c', '#8a8a8a', '#c4c4c4', '#ffffff']

export function getZoneColor(value: number, zones: MetricZone[], skin: ChartSkin = 'default'): string
```

When `skin === 'nothing-signal'`, map the matched zone's **index** onto
`SIGNAL_ZONE_RAMP` (ordinal data → a monochrome ramp, which is the correct
encoding). Otherwise return `zone.zone_color` exactly as today.

`SplitsBars.test.tsx` passes zone fixtures — extend it with a signal-skin case
rather than changing the existing assertions.

### 5.4 Inline hex in chart components

`TrainingLoadChart.tsx` (9), `InsightsList.tsx` (6), `SeasonTimeline.tsx` (5),
`ReadinessCard.tsx` (4), `AdherenceCard.tsx` (3), `HrZonesChart.tsx` (2),
`RouteMap.tsx` (1), `ChartTabs.tsx` (1). Replace each with a `var(--…)` token
where the value lands in CSS, or route it through the Phase 5.1/5.2 helpers
where Recharts needs a literal.

`RouteMap.tsx` draws to canvas and cannot use `var()` — read the computed token
with `getComputedStyle(document.documentElement).getPropertyValue('--accent')`
inside the existing draw effect, and add `skin` to that effect's dependency array
so the route redraws on skin change.

### Phase 5 acceptance

- [ ] `nothing-app` charts are visually identical to the default skin's charts except for background, gridlines and tooltip chrome.
- [ ] `nothing-signal` charts are monochrome + accent, with dash-differentiated series.
- [ ] Zone-coloured bars follow the monochrome ramp under signal red only.
- [ ] No component imports a colour literal except `chartTheme.ts`.

---

## Phase 6 — QA, accessibility & docs

- [ ] **Contrast sweep.** Every text/UI colour ≥4.5:1 (text) and ≥3:1 (UI) in all six combinations. Light + app inks is the risky one; Phase 2.1's corrections should cover it.
- [ ] **Focus rings.** `--focus-ring` in `globals.css` is built from `--bg` and `--accent`; verify visibility on black and on white for all skins.
- [ ] **Reduced motion.** The `prefers-reduced-motion` block in `globals.css` must still neutralise the glyph-bar pulse — do not add un-neutralised animation.
- [ ] **Regression pass.** Walk Today, Plan, Coach, Activities, Activity detail, Progress, Plan setup, Settings and Onboarding in all six combinations.
- [ ] **Default-skin diff.** Screenshot Today/Plan/Activities on `main` vs the branch with `data-skin="default"`; they must be identical.
- [ ] `npx tsc --noEmit`, `npx vitest run`, and `npm run build` all clean.
- [ ] Update `docs/CURRENT_STATE.md` with the skin system; add a review section to `tasks/todo.md` and any corrections to `tasks/lessons.md`.

---

## 11. File-by-file change index

**New**

| File | Phase |
|---|---|
| `frontend/src/styles/skins/nothing.css` | 1–3 |
| `frontend/src/components/settings/AppearanceSection.tsx` + `.css` + `.test.tsx` | 0 |
| `frontend/src/components/ui/DotMatrix.tsx` + `.css` + `.test.tsx` | 4 |
| `frontend/src/components/ui/Numeral.tsx` | 4 |

**Modified**

| File | Change | Phase |
|---|---|---|
| `frontend/index.html` | pre-paint theme/skin script | 0 |
| `frontend/src/App.tsx` | `Skin` type, state, effect, context, `useSkin` | 0 |
| `frontend/src/main.tsx` | import skin sheet | 1 |
| `frontend/src/styles/globals.css` | `--font-*`, `--border-strong`, `--dot-off`, `--c-*` defaults | 1–2 |
| `frontend/src/components/settings/SettingsView.tsx` | mount `AppearanceSection` first | 0 |
| `frontend/src/components/ui/ScoreRing.tsx` + `.css` | SVG arc | 4 |
| `frontend/src/components/ui/Skeleton.css` | perforated variant | 3 |
| `frontend/src/components/layout/BottomNav.css` | glyph bar | 3 |
| `frontend/src/components/layout/{TopBar,WeekStrip}.css` | mono title, day cells | 3 |
| `frontend/src/components/plan-setup/BottomSheet.css` | grab handle, radii | 3 |
| `frontend/src/components/ui/AlertBanner.css` | hairline + alert dot | 3 |
| `frontend/src/utils/chartTheme.ts` | skin-aware helpers, series resolver, zone ramp | 5 |
| `frontend/src/components/today/ReadinessCard.tsx` | `scoreColor` returns `var(--score-*)` | 4 |
| 10 chart components | pass `skin`, drop inline hex | 5 |
| `frontend/src/components/today/{TodayHero,StatGrid,…}.tsx` | use `Numeral` | 4 |

**Explicitly unchanged:** `utils/colors.ts`, every backend file, all API types,
`app/database.py` zone seeds.

---

## 12. Risks & non-goals

**Risks**

1. **Skin drift.** Every new component must work in six combinations. Mitigation:
   build with tokens (`var(--text)`, `var(--c-*)`), never literals — enforced by
   global rule 3.
2. **Signal red hides information.** Collapsing six workout colours to one ink
   removes a scanning cue from the Plan screen. This is why `nothing-app` exists
   and why the default skin stays. If users complain, the answer is a skin
   switch, not a redesign.
3. **Dot-matrix legibility below ~2.4px dots.** Do not use `Numeral` for
   secondary metrics; the mockup's sizes are the floor.
4. **`prefers-color-scheme` is not honoured today** (theme defaults to dark,
   ignoring the OS). Out of scope here, but Phase 0's pre-paint script is the
   natural place to add it later.

**Non-goals**

- No Nothing-branded fonts, logos or Glyph-interface imitation beyond the
  generic dot-matrix idiom.
- No change to information architecture, navigation or copy.
- No backend, schema or API change.
- No new dependency.

---

## Estimated effort

| Phase | Scope | Estimate |
|---|---|---|
| 0 | plumbing + settings | 0.5 day |
| 1 | token layer | 0.25 day |
| 2 | semantic inks | 0.25 day |
| 3 | structural restyle | 0.75 day |
| 4 | dot-matrix + ring | 0.5 day |
| 5 | charts | 0.5 day (mostly signal-red only) |
| 6 | QA | 0.25 day |

**Total ≈ 3 days.** Phases 0–3 alone (~1.75 days) deliver a coherent, shippable
Nothing skin; Phases 4–5 add the signature elements.
