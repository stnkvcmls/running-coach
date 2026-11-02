import { useCallback, useEffect, useState } from 'react'

/** What the athlete picked in Settings → Appearance. */
export type ThemePreference = 'system' | 'light' | 'dark'
/** What is actually painted — `preference` with 'system' resolved. */
export type ResolvedTheme = 'dark' | 'light'

/** localStorage key, shared with the pre-paint script in index.html. Values
 * are 'system' | 'light' | 'dark'; the pre-2.3 app stored only 'dark' or
 * 'light' (an explicit toggle), which read back unchanged as explicit picks. */
export const THEME_STORAGE_KEY = 'theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemePreference(stored)) return stored
  } catch {
    // Storage blocked (private mode, sandboxed iframe) — fall back to System.
  }
  return 'system'
}

function writeThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Not persisted; the choice still applies for this session.
  }
}

function darkQuery(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_QUERY)
    : null
}

/** Whether the OS asks for dark. Without matchMedia (old browsers, jsdom)
 * this keeps the app's historical dark default. */
export function systemPrefersDark(): boolean {
  return darkQuery()?.matches ?? true
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): ResolvedTheme {
  if (preference === 'system') return systemDark ? 'dark' : 'light'
  return preference
}

/** Theme preference persisted in localStorage, resolved against
 * `prefers-color-scheme` and kept live when the OS setting changes. */
export function useThemePreference() {
  const [preference, setPreferenceState] = useState<ThemePreference>(readThemePreference)
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark)

  useEffect(() => {
    const mql = darkQuery()
    if (!mql) return
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    // Re-sync in case the OS flipped between the initial render and this effect.
    setSystemDark(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    writeThemePreference(next)
  }, [])

  return { preference, setPreference, theme: resolveTheme(preference, systemDark) }
}
