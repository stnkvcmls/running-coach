import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  getTooltipProps, getChartTickColor, getAxisTick, getGridStroke, getHoverFill,
  getSeriesColors, getSeriesDash, getZoneColor, getZoneSwatchColor, findZone,
  usePrefersReducedMotion,
} from './chartTheme'
import type { MetricZone } from '../api/types'

describe('getTooltipProps', () => {
  it('returns dark-theme colors', () => {
    const { contentStyle, labelStyle, itemStyle } = getTooltipProps('dark')
    expect(contentStyle.background).toBe('#1a1a2e')
    expect(contentStyle.border).toBe('1px solid #2d2d44')
    expect(contentStyle.color).toBe('#e0e0e0')
    expect(labelStyle.color).toBe('#e0e0e0')
    expect(itemStyle.color).toBe('#e0e0e0')
  })

  it('returns light-theme colors', () => {
    const { contentStyle, labelStyle } = getTooltipProps('light')
    expect(contentStyle.background).toBe('#ffffff')
    expect(contentStyle.border).toBe('1px solid #e0e4ec')
    expect(contentStyle.color).toBe('#1a1a2e')
    expect(labelStyle.color).toBe('#1a1a2e')
  })
})

describe('getChartTickColor / getAxisTick', () => {
  it('is theme-correct and defaults to fontSize 10', () => {
    expect(getChartTickColor('dark')).toBe('#888')
    expect(getChartTickColor('light')).toBe('#6b7280')
    expect(getAxisTick('dark')).toEqual({ fontSize: 10, fill: '#888' })
  })

  it('accepts a custom font size', () => {
    expect(getAxisTick('light', 11)).toEqual({ fontSize: 11, fill: '#6b7280' })
  })
})

describe('getGridStroke', () => {
  it('matches the --border token per theme', () => {
    expect(getGridStroke('dark')).toBe('#2d2d44')
    expect(getGridStroke('light')).toBe('#e0e4ec')
  })
})

describe('skin-aware chartTheme helpers', () => {
  it('getTooltipProps/getChartTickColor/getAxisTick/getGridStroke fall back to default-skin colors when skin is omitted', () => {
    expect(getTooltipProps('dark').contentStyle.background).toBe('#1a1a2e')
    expect(getChartTickColor('dark')).toBe('#888')
    expect(getAxisTick('dark')).toEqual({ fontSize: 10, fill: '#888' })
    expect(getGridStroke('dark')).toBe('#2d2d44')
  })

  it('getTooltipProps matches the Nothing skins\' --bg-card/--border/--text tokens', () => {
    expect(getTooltipProps('dark', 'nothing-signal').contentStyle).toMatchObject({ background: '#0b0b0b', border: '1px solid #232323', color: '#ffffff' })
    expect(getTooltipProps('light', 'nothing-app').contentStyle).toMatchObject({ background: '#f4f4f4', border: '1px solid #e0e0e0', color: '#000000' })
  })

  it('getChartTickColor/getAxisTick/getGridStroke match the Nothing skins\' --text-muted/--border tokens', () => {
    expect(getChartTickColor('dark', 'nothing-signal')).toBe('#6e6e6e')
    expect(getChartTickColor('light', 'nothing-app')).toBe('#8b8b8b')
    expect(getAxisTick('light', 11, 'nothing-signal')).toEqual({ fontSize: 11, fill: '#8b8b8b' })
    expect(getGridStroke('dark', 'nothing-app')).toBe('#232323')
    expect(getGridStroke('light', 'nothing-signal')).toBe('#e0e0e0')
  })

  it('getHoverFill is neutral under Nothing, purple by default', () => {
    expect(getHoverFill('dark')).toBe('rgba(108, 92, 231, 0.1)')
    expect(getHoverFill('dark', 'nothing-signal')).toBe('rgba(255, 255, 255, 0.08)')
    expect(getHoverFill('light', 'nothing-app')).toBe('rgba(0, 0, 0, 0.06)')
  })
})

describe('getSeriesColors', () => {
  const fallbackArray = ['#6c5ce7', '#00b894', '#e17055', '#0984e3']
  const fallbackRecord = { sleep: '#6c5ce7', hrv: '#0984e3' }

  it('returns the fallback unchanged for default and nothing-app', () => {
    expect(getSeriesColors('default', fallbackArray)).toBe(fallbackArray)
    expect(getSeriesColors('nothing-app', fallbackRecord)).toBe(fallbackRecord)
  })

  it('maps an array onto the monochrome ramp, ordinally, for nothing-signal', () => {
    expect(getSeriesColors('nothing-signal', fallbackArray)).toEqual(['#ffffff', '#d71921', '#8a8a8a', '#4a4a4a'])
  })

  it('maps a record onto the monochrome ramp, preserving keys, for nothing-signal', () => {
    expect(getSeriesColors('nothing-signal', fallbackRecord)).toEqual({ sleep: '#ffffff', hrv: '#d71921' })
  })
})

describe('getSeriesDash', () => {
  it('is undefined below index 2 and for non-signal skins', () => {
    expect(getSeriesDash('nothing-signal', 0)).toBeUndefined()
    expect(getSeriesDash('nothing-signal', 1)).toBeUndefined()
    expect(getSeriesDash('default', 3)).toBeUndefined()
  })

  it('returns a dash pattern for index >= 2 under nothing-signal', () => {
    expect(getSeriesDash('nothing-signal', 2)).toBe('5 3')
    expect(getSeriesDash('nothing-signal', 3)).toBe('2 2')
  })
})

describe('getZoneColor / getZoneSwatchColor / findZone', () => {
  const zones: MetricZone[] = [
    { metric_key: 'pace', zone_name: 'Fast', zone_color: '#fab1a0', percentile_label: '', min_value: null, max_value: 4.5 },
    { metric_key: 'pace', zone_name: 'Easy', zone_color: '#55efc4', percentile_label: '', min_value: 4.5, max_value: null },
  ]

  it('returns the matched zone\'s own color by default', () => {
    expect(getZoneColor(4, zones)).toBe('#fab1a0')
    expect(getZoneColor(5, zones)).toBe('#55efc4')
  })

  it('maps the matched zone\'s index onto SIGNAL_ZONE_RAMP under nothing-signal', () => {
    expect(getZoneColor(4, zones, 'nothing-signal')).toBe('#3a3a3a')
    expect(getZoneColor(5, zones, 'nothing-signal')).toBe('#5c5c5c')
  })

  it('findZone returns the zone object so callers can compare by identity', () => {
    const zone = findZone(4, zones)
    expect(zone).toBe(zones[0])
    expect(getZoneSwatchColor(zone!, zones, 'nothing-signal')).toBe('#3a3a3a')
    expect(getZoneSwatchColor(zone!, zones)).toBe('#fab1a0')
  })

  it('falls back to a default purple when no zone matches', () => {
    expect(getZoneColor(4, [])).toBe('#6c5ce7')
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
