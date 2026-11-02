import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { MetricZone } from '../api/types'
import {
  getTooltipProps, getChartTickColor, getAxisTick, getGridStroke, getZoneColor, effortZoneColor,
  usePrefersReducedMotion,
} from './chartTheme'

// Chart colours are var() references into globals.css, so they follow the
// active theme in the browser without depending on the `theme` argument.
describe('getTooltipProps', () => {
  it('is a surface panel with a rule border and ink text in either theme', () => {
    for (const theme of ['dark', 'light'] as const) {
      const { contentStyle, labelStyle, itemStyle } = getTooltipProps(theme)
      expect(contentStyle.background).toBe('var(--bg-card)')
      expect(contentStyle.border).toBe('1px solid var(--border)')
      expect(contentStyle.color).toBe('var(--text)')
      expect(labelStyle.color).toBe('var(--text)')
      expect(itemStyle.color).toBe('var(--text)')
    }
  })
})

describe('getChartTickColor / getAxisTick', () => {
  it('uses ink-2 and defaults to fontSize 10', () => {
    expect(getChartTickColor('dark')).toBe('var(--text-muted)')
    expect(getChartTickColor('light')).toBe('var(--text-muted)')
    expect(getAxisTick('dark')).toEqual({ fontSize: 10, fill: 'var(--text-muted)' })
  })

  it('accepts a custom font size', () => {
    expect(getAxisTick('light', 11)).toEqual({ fontSize: 11, fill: 'var(--text-muted)' })
  })
})

describe('getGridStroke', () => {
  it('is the --border (rule) token', () => {
    expect(getGridStroke('dark')).toBe('var(--border)')
  })
})

describe('effortZoneColor', () => {
  it('maps zone numbers onto the Z1–Z5 effort scale, clamped', () => {
    expect(effortZoneColor(1)).toBe('var(--z1)')
    expect(effortZoneColor(5)).toBe('var(--z5)')
    expect(effortZoneColor(0)).toBe('var(--z1)')
    expect(effortZoneColor(7)).toBe('var(--z5)')
  })
})

describe('getZoneColor', () => {
  const zones: MetricZone[] = [
    { metric_key: 'cadence', zone_name: 'a', zone_color: '#ff69b4', percentile_label: '', min_value: 185, max_value: null },
    { metric_key: 'cadence', zone_name: 'b', zone_color: '#3498db', percentile_label: '', min_value: 170, max_value: 185 },
    { metric_key: 'cadence', zone_name: 'c', zone_color: '#2ecc71', percentile_label: '', min_value: null, max_value: 170 },
  ]

  it('colours by zone position on the effort scale, ignoring the API colour', () => {
    expect(getZoneColor(190, zones)).toBe('var(--z1)')
    expect(getZoneColor(175, zones)).toBe('var(--z2)')
    expect(getZoneColor(150, zones)).toBe('var(--z3)')
  })

  it('falls back to the default token when no zone matches', () => {
    expect(getZoneColor(150, zones.slice(0, 2))).toBe('var(--color-default)')
  })
})

function mockMatchMedia(initialMatches: boolean) {
  const listeners: ((e: MediaQueryListEvent) => void)[] = []
  const mql = {
    matches: initialMatches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_type: string, cb: (e: MediaQueryListEvent) => void) => listeners.push(cb),
    removeEventListener: (_type: string, cb: (e: MediaQueryListEvent) => void) => {
      const i = listeners.indexOf(cb)
      if (i >= 0) listeners.splice(i, 1)
    },
  }
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))
  return {
    trigger(matches: boolean) {
      mql.matches = matches
      listeners.forEach(cb => cb({ matches } as MediaQueryListEvent))
    },
  }
}

describe('usePrefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns false when the user has not requested reduced motion', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  it('returns true when the user has requested reduced motion', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('reacts to the media query changing after mount', () => {
    const { trigger } = mockMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)

    act(() => trigger(true))
    expect(result.current).toBe(true)
  })
})
