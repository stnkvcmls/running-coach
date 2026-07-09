import { describe, it, expect } from 'vitest'
import { getTooltipProps, getChartTickColor, getAxisTick, getGridStroke } from './chartTheme'

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
