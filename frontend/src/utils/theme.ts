import type { CSSProperties } from 'react'
import { getTooltipProps, getChartTickColor as _getChartTickColor } from './chartTheme'
import type { Theme } from './chartTheme'

export type { Theme }

/** @deprecated use getTooltipProps from utils/chartTheme */
export function getChartTooltipStyle(theme: Theme): CSSProperties {
  return getTooltipProps(theme).contentStyle
}

/** @deprecated use utils/chartTheme */
export function getChartTickColor(theme: Theme): string {
  return _getChartTickColor(theme)
}

/** @deprecated use getTooltipProps from utils/chartTheme */
export function getChartTooltipTextStyle(theme: Theme): CSSProperties {
  return getTooltipProps(theme).labelStyle
}
