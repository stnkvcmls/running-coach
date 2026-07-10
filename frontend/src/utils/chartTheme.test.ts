import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { getTooltipProps, getChartTickColor, getAxisTick, getGridStroke, usePrefersReducedMotion } from './chartTheme'

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
