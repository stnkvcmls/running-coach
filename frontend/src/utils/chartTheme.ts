import { useEffect, useState, type CSSProperties } from 'react'
import type { MetricZone } from '../api/types'

export type Theme = 'dark' | 'light'

/** Mirrors `Skin` from `App.tsx` — kept independent to avoid a utils→component
 * import cycle. `useSkin()`'s value is structurally identical and passes
 * straight through. */
export type ChartSkin = 'default' | 'nothing-signal' | 'nothing-app'

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

/** Recharts `<Tooltip>` props (contentStyle/labelStyle/itemStyle), theme-correct. */
export function getTooltipProps(theme: Theme, skin: ChartSkin = 'default'): ChartTooltipProps {
  if (skin !== 'default') {
    const contentStyle: CSSProperties = theme === 'light'
      ? { background: '#f4f4f4', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 12, color: '#000000' }
      : { background: '#0b0b0b', border: '1px solid #232323', borderRadius: 8, fontSize: 12, color: '#ffffff' }
    const textStyle: CSSProperties = { color: theme === 'light' ? '#000000' : '#ffffff' }
    return { contentStyle, labelStyle: textStyle, itemStyle: textStyle }
  }
  const contentStyle: CSSProperties = theme === 'light'
    ? { background: '#ffffff', border: '1px solid #e0e4ec', borderRadius: 8, fontSize: 12, color: '#1a1a2e' }
    : { background: '#1a1a2e', border: '1px solid #2d2d44', borderRadius: 8, fontSize: 12, color: '#e0e0e0' }
  const textStyle: CSSProperties = { color: theme === 'light' ? '#1a1a2e' : '#e0e0e0' }
  return { contentStyle, labelStyle: textStyle, itemStyle: textStyle }
}

export function getChartTickColor(theme: Theme, skin: ChartSkin = 'default'): string {
  if (skin !== 'default') return theme === 'light' ? '#8b8b8b' : '#6e6e6e'
  return theme === 'light' ? '#6b7280' : '#888'
}

/** Style object for a Recharts axis `tick` prop. */
export function getAxisTick(theme: Theme, fontSize = 10, skin: ChartSkin = 'default'): { fontSize: number; fill: string } {
  return { fontSize, fill: getChartTickColor(theme, skin) }
}

/** Stroke colour for gridlines/reference lines — matches the `--border` token. */
export function getGridStroke(theme: Theme, skin: ChartSkin = 'default'): string {
  if (skin !== 'default') return theme === 'light' ? '#e0e0e0' : '#232323'
  return theme === 'light' ? '#e0e4ec' : '#2d2d44'
}

/** Bar-hover cursor fill — themed purple by default, neutral under Nothing. */
export function getHoverFill(theme: Theme, skin: ChartSkin = 'default'): string {
  if (skin !== 'default') return theme === 'light' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)'
  return 'rgba(108, 92, 231, 0.1)'
}

/** Canonical per-metric colours for activity detail charts (HR, pace, power, dynamics...). */
export const METRIC_COLORS: Record<string, string> = {
  heart_rate: '#e74c3c',
  elevation: '#2ecc71',
  pace: '#f39c12',
  gap_pace: '#fd9644',
  cadence: '#0984e3',
  power: '#e84393',
  gct: '#6c5ce7',
  vert_osc: '#00cec9',
  vert_ratio: '#fd79a8',
  stride: '#00b894',
  perf_cond: '#fdcb6e',
  stamina: '#a29bfe',
}

/** Wellness metric line/area colours — WellnessTrendsView. */
export const WELLNESS_METRIC_COLORS = {
  sleep: '#6c5ce7',
  restingHr: '#e17055',
  stress: '#fd79a8',
  bodyBattery: '#00b894',
  hrv: '#0984e3',
} as const

/** Fixed HR/power zone 1–5 bar colours — IntensityTrendsView (no per-zone
 * colour in the API response, unlike metric_zones/getZoneColor below). */
export const INTENSITY_ZONE_COLORS: Record<string, string> = {
  '1': '#2ecc71',
  '2': '#27ae60',
  '3': '#f39c12',
  '4': '#e67e22',
  '5': '#e74c3c',
}

/** Easy/moderate/hard polarization-bucket colours — IntensityTrendsView. */
export const INTENSITY_BUCKET_COLORS = {
  easy: '#27ae60',
  moderate: '#f39c12',
  hard: '#e74c3c',
} as const

/** Decoupling/efficiency-factor chart colours — AerobicTrendsView. */
export const AEROBIC_COLORS = {
  decoupling: '#6c5ce7',
  efficiency: '#00b894',
  good: '#00b894',
  high: '#e17055',
} as const

/** Actual/model-fit/comparison line colours — PerformanceCurveView. */
export const PERFORMANCE_CURVE_COLORS = {
  actual: '#6c5ce7',
  model: '#00b894',
  compare: '#e17055',
} as const

/** Ordered categorical palette for arbitrary multi-series charts — CustomChartsView. */
export const CHART_SERIES_COLORS = ['#6c5ce7', '#00b894', '#e17055', '#0984e3']

/** Monochrome + one-accent palette every `nothing-signal` series maps onto,
 * ordinally, regardless of how many named colours the default palette has.
 * Reuses `nothing.css`'s own --text/--text-secondary/--text-muted/--accent
 * hex values per theme (Recharts needs literal hex, not var()) — the same
 * label-hierarchy grays already used everywhere else in the skin, chosen to
 * stay legible and mutually distinct against a pure black/white surface,
 * rather than a made-up gray pair that reads flat on either background. */
const NOTHING_SIGNAL_SERIES: Record<Theme, string[]> = {
  dark: ['#ffffff', '#d71921', '#b4b4b4', '#6e6e6e'],
  light: ['#000000', '#d71921', '#4a4a4a', '#8b8b8b'],
}

function grayHex(lightness: number): string {
  const h = Math.round(lightness).toString(16).padStart(2, '0')
  return `#${h}${h}${h}`
}

/** Builds an N-colour ramp for `theme`: index 0/1 are always the primary text
 * colour and the red accent, and the remaining N-2 slots are grayscale steps
 * evenly spaced between the curated text-secondary/text-muted anchors — so
 * every series gets a mutually-distinct colour no matter how many keys the
 * caller's palette has, instead of wrapping a fixed 4-entry array with `%`.
 * At N=4 this reproduces `NOTHING_SIGNAL_SERIES` exactly. */
function buildSignalRamp(theme: Theme, count: number): string[] {
  const [primary, accent, grayFrom, grayTo] = NOTHING_SIGNAL_SERIES[theme]
  if (count <= 2) return [primary, accent].slice(0, count)
  const from = parseInt(grayFrom.slice(1, 3), 16)
  const to = parseInt(grayTo.slice(1, 3), 16)
  const grayCount = count - 2
  const grays = Array.from({ length: grayCount }, (_, i) =>
    grayHex(grayCount === 1 ? from : from + (to - from) * (i / (grayCount - 1)))
  )
  return [primary, accent, ...grays]
}

/** Resolves a palette to its `nothing-signal` monochrome equivalent, ordinally
 * by key/index — `default` and `nothing-app` return `fallback` unchanged, so
 * those two skins need no palette maintenance beyond this call. */
export function getSeriesColors(theme: Theme, skin: ChartSkin, fallback: string[]): string[]
export function getSeriesColors<T extends Record<string, string>>(theme: Theme, skin: ChartSkin, fallback: T): T
export function getSeriesColors(theme: Theme, skin: ChartSkin, fallback: string[] | Record<string, string>): string[] | Record<string, string> {
  if (skin !== 'nothing-signal') return fallback
  if (Array.isArray(fallback)) {
    const ramp = buildSignalRamp(theme, fallback.length)
    return fallback.map((_, i) => ramp[i])
  }
  const keys = Object.keys(fallback)
  const ramp = buildSignalRamp(theme, keys.length)
  return Object.fromEntries(keys.map((k, i) => [k, ramp[i]]))
}

/** Dash pattern for the 3rd+ series in a `nothing-signal` chart where more
 * than two lines overlay with no dash of their own — `NOTHING_SIGNAL_SERIES`
 * only reads as distinct colour for the first two entries. */
export function getSeriesDash(skin: ChartSkin, index: number): string | undefined {
  if (skin !== 'nothing-signal' || index < 2) return undefined
  return index % 2 === 0 ? '5 3' : '2 2'
}

/** Ordinal grayscale ramp `nothing-signal` zone bars/dots map onto, replacing
 * the API-supplied `zone_color` rainbow — index is the zone's position in its
 * `zones` array (ordinal data → a monochrome ramp is the correct encoding).
 * Keyed by theme: the dark ramp runs dark→white for a black card surface: the
 * light ramp runs light→black for the `#f4f4f4` light card surface — reusing
 * the dark ramp in light mode put white-on-#f4f4f4 at ~1:1 contrast. */
export const SIGNAL_ZONE_RAMP: Record<Theme, string[]> = {
  dark: ['#3a3a3a', '#5c5c5c', '#8a8a8a', '#c4c4c4', '#ffffff'],
  light: ['#c9c9c9', '#a0a0a0', '#767676', '#454545', '#000000'],
}

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

/** Continuous version of `SIGNAL_ZONE_RAMP`, for canvas-drawn gradients (e.g.
 * RouteMap) that can't index a discrete array — interpolates linearly between
 * the ramp's own low/high endpoints so it stays theme-correct and consistent
 * with the discrete zone ramp. */
export function signalRampColor(theme: Theme, t: number): string {
  const clamped = Math.max(0, Math.min(1, t))
  const ramp = SIGNAL_ZONE_RAMP[theme]
  const from = hexToRgb(ramp[0])
  const to = hexToRgb(ramp[ramp.length - 1])
  const rgb = from.map((c, i) => c + (to[i] - c) * clamped)
  return `#${rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`
}

/** Which zone a value falls into. */
export function findZone(value: number, zones: MetricZone[]): MetricZone | undefined {
  for (const zone of zones) {
    const aboveMin = zone.min_value === null || value >= zone.min_value
    const belowMax = zone.max_value === null || value < zone.max_value
    if (aboveMin && belowMax) return zone
  }
  // Check the last zone (unbounded max) separately with inclusive check
  for (const zone of zones) {
    if (zone.max_value === null) {
      const aboveMin = zone.min_value === null || value >= zone.min_value
      if (aboveMin) return zone
    }
  }
  return undefined
}

/** Which zone a value falls into, by colour — shared by scatter-chart dots and SplitsBars. */
export function getZoneColor(value: number, zones: MetricZone[], theme: Theme = 'dark', skin: ChartSkin = 'default'): string {
  const zone = findZone(value, zones)
  if (!zone) return skin === 'nothing-signal' ? NOTHING_SIGNAL_SERIES[theme][0] : '#6c5ce7'
  return getZoneSwatchColor(zone, zones, theme, skin)
}

/** Display colour for a zone the caller already has (e.g. a legend entry) —
 * same ramp mapping as `getZoneColor`, keyed off the zone itself rather than
 * a value, so callers that need zone *identity* (not just colour) can use
 * `findZone`/`indexOf` themselves and still land on the same swatch. */
export function getZoneSwatchColor(zone: MetricZone, zones: MetricZone[], theme: Theme = 'dark', skin: ChartSkin = 'default'): string {
  if (skin !== 'nothing-signal') return zone.zone_color
  const idx = zones.indexOf(zone)
  const ramp = SIGNAL_ZONE_RAMP[theme]
  return ramp[idx % ramp.length]
}
