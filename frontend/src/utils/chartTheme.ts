import { useEffect, useState, type CSSProperties } from 'react'
import type { MetricZone } from '../api/types'

export type Theme = 'dark' | 'light'

/*
 * Chart colours are CSS custom-property references (`var(--…)`) into the
 * tokens in styles/globals.css, not literal hex. Recharts writes them into
 * SVG presentation attributes / inline styles, where the browser resolves
 * them against the active [data-theme], so a theme switch repaints every
 * chart without re-rendering and the palette lives in one place. (Canvas
 * drawing can't resolve var() — RouteMap reads tokens via getComputedStyle.)
 * The `theme` parameters below are kept for call-site compatibility; the
 * values no longer depend on them.
 *
 * Colour means effort (docs/UI_UX_CRITIQUE.md §5.1): a series that IS an
 * effort or zone uses the --z1…--z5 scale; every other series is ink,
 * distinguished by line style rather than hue.
 */

/**
 * Tracks `prefers-reduced-motion`. Recharts animates via its own rAF loop
 * (react-smooth), independent of CSS — the global reduced-motion media query
 * in globals.css can't reach it, so chart components pass the result to each
 * series' `isAnimationActive` prop (mirrors the matchMedia check RouteMap.tsx
 * uses for its canvas trace animation).
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )
  useEffect(() => {
    if (!window.matchMedia) return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return reduced
}

export interface ChartTooltipProps {
  contentStyle: CSSProperties
  labelStyle: CSSProperties
  itemStyle: CSSProperties
}

/** Recharts `<Tooltip>` props (contentStyle/labelStyle/itemStyle): a surface
 * panel with a rule border and ink text. */
export function getTooltipProps(_theme?: Theme): ChartTooltipProps {
  const contentStyle: CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--text)',
  }
  const textStyle: CSSProperties = { color: 'var(--text)' }
  return { contentStyle, labelStyle: textStyle, itemStyle: textStyle }
}

/** Axis tick text: ink-2, which clears 4.5:1 on every surface in both themes. */
export function getChartTickColor(_theme?: Theme): string {
  return 'var(--text-muted)'
}

/**
 * Width for a visible left `<YAxis>` with 10px ticks. Recharts right-aligns
 * tick text 8px (tickSize 6 + tickMargin 2) inside this width, and several
 * charts also pull the plot left with a -8 margin — at the old 28px that left
 * ~12px for the label, so "100" rendered as "00". 36px fits three digits.
 */
export const Y_AXIS_WIDTH = 36

/** Style object for a Recharts axis `tick` prop. */
export function getAxisTick(theme?: Theme, fontSize = 10): { fontSize: number; fill: string } {
  return { fontSize, fill: getChartTickColor(theme) }
}

/** Stroke colour for gridlines/reference lines — the `--border` (rule) token. */
export function getGridStroke(_theme?: Theme): string {
  return 'var(--border)'
}

/** Neutral series inks, by emphasis: ink, ink-2, ink-3. Any series that is
 * not an effort/zone is drawn in these, paired by index with SERIES_DASHES so
 * series differ by line style (solid, dashed, dotted), not by hue. ink-3
 * clears 3:1 against a panel, enough for a line but never for text. */
export const SERIES_COLORS = ['var(--text)', 'var(--text-muted)', 'var(--text-faint)'] as const

/** strokeDasharray paired with SERIES_COLORS by index. */
export const SERIES_DASHES = [undefined, '6 4', '2 3'] as const

/** The effort-scale colour for a 1-based zone number (Z1…Z5), clamped. */
export function effortZoneColor(zoneNumber: number): string {
  const n = Math.min(Math.max(Math.round(zoneNumber) || 1, 1), 5)
  return `var(--z${n})`
}

/** HR/power zone 1–5 bar colours — IntensityTrendsView. */
export const INTENSITY_ZONE_COLORS: Record<string, string> = {
  '1': effortZoneColor(1),
  '2': effortZoneColor(2),
  '3': effortZoneColor(3),
  '4': effortZoneColor(4),
  '5': effortZoneColor(5),
}

/** Easy/moderate/hard polarization buckets on the effort scale (easy Z2,
 * moderate Z3, hard Z5) — IntensityTrendsView. Marks only; labels stay ink. */
export const INTENSITY_BUCKET_COLORS = {
  easy: effortZoneColor(2),
  moderate: effortZoneColor(3),
  hard: effortZoneColor(5),
} as const

/** Decoupling/efficiency-factor charts — AerobicTrendsView: individual runs
 * in ink-2, the rolling average in ink, reference thresholds in ink-3. */
export const AEROBIC_COLORS = {
  points: SERIES_COLORS[1],
  average: SERIES_COLORS[0],
  reference: SERIES_COLORS[2],
} as const

/** Actual (solid) / model fit (dashed) / comparison (dotted) — PerformanceCurveView. */
export const PERFORMANCE_CURVE_COLORS = {
  actual: SERIES_COLORS[0],
  model: SERIES_COLORS[1],
  compare: SERIES_COLORS[2],
} as const

/**
 * Which zone a value falls into, as an effort-scale colour — shared by
 * scatter-chart dots and SplitsBars. Zones are coloured by their position in
 * the list the API returns (first = Z1), never by the API's own `zone_color`,
 * so every zone display in the app uses the same five colours.
 */
export function getZoneColor(value: number, zones: MetricZone[]): string {
  const index = zoneIndexFor(value, zones)
  return index < 0 ? 'var(--color-default)' : effortZoneColor(index + 1)
}

/** Index of the zone containing `value` (half-open [min, max)), falling back
 * to an unbounded-max zone with an inclusive check; -1 when none matches. */
export function zoneIndexFor(value: number, zones: MetricZone[]): number {
  const bounded = zones.findIndex(zone =>
    (zone.min_value === null || value >= zone.min_value) &&
    (zone.max_value === null || value < zone.max_value)
  )
  if (bounded >= 0) return bounded
  return zones.findIndex(zone =>
    zone.max_value === null && (zone.min_value === null || value >= zone.min_value)
  )
}
