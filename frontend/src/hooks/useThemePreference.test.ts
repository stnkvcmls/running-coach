import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  THEME_STORAGE_KEY,
  readThemePreference,
  resolveTheme,
  useThemePreference,
} from './useThemePreference'

/** Controllable stand-in for matchMedia('(prefers-color-scheme: dark)') —
 * jsdom has no matchMedia at all. */
function stubSystemTheme(initiallyDark: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>()
  const mql = {
    matches: initiallyDark,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
  }
  vi.stubGlobal('matchMedia', vi.fn(() => mql))
  return {
    setDark(dark: boolean) {
      mql.matches = dark
      listeners.forEach(cb => cb({ matches: dark } as MediaQueryListEvent))
    },
    listenerCount: () => listeners.size,
  }
}

describe('resolveTheme', () => {
  it('follows the OS for "system" and honours explicit picks regardless of it', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

describe('readThemePreference', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('defaults to "system" when nothing (or junk) is stored', () => {
    expect(readThemePreference()).toBe('system')
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    expect(readThemePreference()).toBe('system')
  })

  it('reads legacy toggle values ("dark"/"light") as explicit choices', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    expect(readThemePreference()).toBe('light')
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    expect(readThemePreference()).toBe('dark')
  })

  it('falls back to "system" when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(readThemePreference()).toBe('system')
  })
})

describe('useThemePreference', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('defaults to System and resolves against prefers-color-scheme, live', () => {
    const system = stubSystemTheme(false)
    const { result } = renderHook(() => useThemePreference())

    expect(result.current.preference).toBe('system')
    expect(result.current.theme).toBe('light')

    act(() => system.setDark(true))
    expect(result.current.theme).toBe('dark')
  })

  it('persists an explicit choice and stops following the OS', () => {
    const system = stubSystemTheme(true)
    const { result } = renderHook(() => useThemePreference())

    act(() => result.current.setPreference('light'))
    expect(result.current.preference).toBe('light')
    expect(result.current.theme).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')

    act(() => system.setDark(false))
    act(() => system.setDark(true))
    expect(result.current.theme).toBe('light')

    act(() => result.current.setPreference('system'))
    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
  })

  it('still switches theme when storage writes throw', () => {
    stubSystemTheme(true)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    const { result } = renderHook(() => useThemePreference())

    act(() => result.current.setPreference('light'))
    expect(result.current.theme).toBe('light')
  })

  it('removes its OS-change listener on unmount', () => {
    const system = stubSystemTheme(true)
    const { unmount } = renderHook(() => useThemePreference())
    expect(system.listenerCount()).toBe(1)

    unmount()
    expect(system.listenerCount()).toBe(0)
  })

  it('keeps the historical dark default where matchMedia is unavailable', () => {
    const { result } = renderHook(() => useThemePreference())
    expect(result.current.preference).toBe('system')
    expect(result.current.theme).toBe('dark')
  })
})
