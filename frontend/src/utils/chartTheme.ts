import { useEffect, useState, type CSSProperties } from 'react'
import type { MetricZone } from '../api/types'

export type Theme = 'dark' | 'light'

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
export function getTooltipProps(theme: Theme): ChartTooltipProps {
  const contentStyle: CSSProperties = theme === 'light'
    ? { background: '#ffffff', border: '1px solid #e0e4ec', borderRadius: 8, fontSize: 12, color: '#1a1a2e' }
    : { background: '#1a1a2e', border: '1px solid #2d2d44', borderRadius: 8, fontSize: 12, color: '#e0e0e0' }
  const textStyle: CSSProperties = { color: theme === 'light' ? '#1a1a2e' : '#e0e0e0' }
  return { contentStyle, labelStyle: textStyle, itemStyle: textStyle }
}

export function getChartTickColor(theme: Theme): string {
  return theme === 'light' ? '#6b7280' : '#888'
}

/** Style object for a Recharts axis `tick` prop. */
export function getAxisTick(theme: Theme, fontSize = 10): { fontSize: number; fill: string } {
  return { fontSize, fill: getChartTickColor(theme) }
}

/** Stroke colour for gridlines/reference lines — matches the `--border` token. */
export function getGridStroke(theme: Theme): string {
  return theme === 'light' ? '#e0e4ec' : '#2d2d44'
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

/** Which zone a value falls into, by colour — shared by scatter-chart dots and SplitsBars. */
export function getZoneColor(value: number, zones: MetricZone[]): string {
  for (const zone of zones) {
    const aboveMin = zone.min_value === null || value >= zone.min_value
    const belowMax = zone.max_value === null || value < zone.max_value
    if (aboveMin && belowMax) return zone.zone_color
  }
  // Check the last zone (unbounded max) separately with inclusive check
  for (const zone of zones) {
    if (zone.max_value === null) {
      const aboveMin = zone.min_value === null || value >= zone.min_value
      if (aboveMin) return zone.zone_color
    }
  }
  return '#6c5ce7'
}
