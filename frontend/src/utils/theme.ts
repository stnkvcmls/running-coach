import type { CSSProperties } from 'react'

export type Theme = 'dark' | 'light'

export function getChartTooltipStyle(theme: Theme): CSSProperties {
  return theme === 'light'
    ? { background: '#ffffff', border: '1px solid #e0e4ec', borderRadius: 8, fontSize: 12, color: '#1a1a2e' }
    : { background: '#1a1a2e', border: '1px solid #2d2d44', borderRadius: 8, fontSize: 12, color: '#e0e0e0' }
}

export function getChartTickColor(theme: Theme): string {
  return theme === 'light' ? '#6b7280' : '#888'
}

export function getChartTooltipTextStyle(theme: Theme): CSSProperties {
  return { color: theme === 'light' ? '#1a1a2e' : '#e0e0e0' }
}
