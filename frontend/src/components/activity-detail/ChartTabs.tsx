import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ReferenceLine, ReferenceArea,
} from 'recharts'
import type { ChartSeries, MetricZone } from '../../api/types'
import { useTheme } from '../../App'
import { getAxisTick, getTooltipProps, getZoneColor, SERIES_COLORS, usePrefersReducedMotion } from '../../utils/chartTheme'
import './ChartTabs.css'

const SCATTER_METRICS = new Set(['cadence', 'stride', 'gct', 'vert_osc', 'vert_ratio'])

interface Props {
  chartData: Record<string, ChartSeries>
  metricZones?: Record<string, MetricZone[]> | null
  /** Distance from the start (km) per sample; the x-axis is in km when given. */
  distanceKm?: number[] | null
  /** Work-rep stretches (km) to shade, for a structured session. */
  repWindows?: { startKm: number; endKm: number }[] | null
}

/** Whole-km ticks, at most ~6 of them. */
export function kmTicks(maxKm: number): number[] {
  const step = maxKm <= 6 ? 1 : maxKm <= 12 ? 2 : maxKm <= 30 ? 5 : 10
  const ticks: number[] = []
  for (let k = 0; k <= maxKm; k += step) ticks.push(k)
  return ticks
}

/** Heart rate starts from a floor ~10 bpm under the lowest beat (rounded to
 * 10) instead of zooming to the data, so a 9 bpm drift doesn't read as a
 * cliff (D4). */
export function heartRateDomain(values: number[]): [number, number] {
  return [Math.floor((Math.min(...values) - 10) / 10) * 10, Math.ceil((Math.max(...values) + 5) / 10) * 10]
}

function formatPaceTick(v: number): string {
  const m = Math.floor(v)
  const s = Math.round((v - m) * 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ChartTabs({ chartData, metricZones, distanceKm, repWindows }: Props) {
  const keys = Object.keys(chartData).filter(k => k !== 'distance')
  const [activeKey, setActiveKey] = useState(keys[0] || '')
  const { theme } = useTheme()
  const reduceMotion = usePrefersReducedMotion()

  if (keys.length === 0) return null

  const series = chartData[activeKey]
  if (!series) return null

  // One metric at a time, so it is drawn in ink; only zone-coloured scatter
  // dots (metric zones) and the rep shading carry effort colour.
  const color = SERIES_COLORS[0]
  const isScatter = SCATTER_METRICS.has(activeKey)
  const zones = metricZones?.[activeKey]
  const isPace = activeKey === 'pace' || activeKey === 'gap_pace'

  const byDistance = !!distanceKm && distanceKm.length === series.data.length
  const maxKm = byDistance ? distanceKm![distanceKm!.length - 1] : 0
  const ticks = byDistance ? kmTicks(maxKm) : []
  const lastTick = ticks[ticks.length - 1]

  const { contentStyle: tooltipStyle, labelStyle: tooltipTextStyle } = getTooltipProps(theme)

  const yTickFormatter = (v: number) => (isPace ? formatPaceTick(v) : Math.round(v).toString())

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return ['-', series.label]
    const num = Number(value)
    if (isPace) return [formatPaceTick(num), series.label]
    return [`${num.toFixed(1)} ${series.unit}`, series.label]
  }

  const points = series.data.map((v, i) => ({ x: byDistance ? distanceKm![i] : i, v }))
  const values = points.map(p => p.v).filter((v): v is number => v !== null && v !== undefined)
  const isHr = activeKey === 'heart_rate' && values.length > 0
  const yDomain: [number | string, number | string] = isHr ? heartRateDomain(values) : ['auto', 'auto']

  const xAxis = byDistance ? (
    <XAxis
      dataKey="x"
      type="number"
      domain={[0, maxKm]}
      ticks={ticks}
      tickFormatter={(k: number) => (k === lastTick ? `${k} km` : String(k))}
      tick={getAxisTick(theme)}
      axisLine={false}
      tickLine={false}
      height={20}
    />
  ) : (
    <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} hide />
  )

  const yAxis = (
    <YAxis
      dataKey={isScatter ? 'v' : undefined}
      reversed={isPace}
      domain={yDomain}
      allowDataOverflow={isHr}
      tickCount={5}
      tickFormatter={yTickFormatter}
      tick={getAxisTick(theme)}
      axisLine={false}
      tickLine={false}
      width={38}
    />
  )

  const shading = byDistance && repWindows && repWindows.length > 0
    ? repWindows.map((w, i) => (
        <ReferenceArea
          key={`rep-${i}`}
          x1={w.startKm}
          x2={w.endKm}
          fill="var(--z5)"
          fillOpacity={0.1}
          stroke="none"
          ifOverflow="hidden"
        />
      ))
    : null

  const tooltip = (
    <Tooltip
      contentStyle={tooltipStyle}
      labelStyle={tooltipTextStyle}
      itemStyle={tooltipTextStyle}
      formatter={formatValue}
      labelFormatter={(x: any) => (byDistance && typeof x === 'number' ? `${x.toFixed(2)} km` : '')}
    />
  )

  const where = byDistance ? `over ${maxKm.toFixed(1)} km` : 'over the course of the activity'
  const unit = series.unit ? ` ${series.unit}` : ''
  let chart
  let ariaLabel: string
  if (isScatter) {
    const scatterData = points.filter((d): d is { x: number; v: number } => d.v !== null && d.v !== undefined)
    const average = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0
    ariaLabel = `${series.label} ${where}, ${scatterData.length} samples, average ${yTickFormatter(average)}${unit}.`
    chart = (
      <ScatterChart margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        {shading}
        {xAxis}
        {yAxis}
        {tooltip}
        <ReferenceLine y={average} stroke={SERIES_COLORS[2]} strokeDasharray="6 4" strokeWidth={1.5} />
        <Scatter
          data={scatterData}
          fill={color}
          isAnimationActive={!reduceMotion}
          shape={(props: any) => {
            const dotColor = zones && zones.length > 0 ? getZoneColor(props.payload.v, zones) : color
            return <circle cx={props.cx} cy={props.cy} r={2.5} fill={dotColor} />
          }}
        />
      </ScatterChart>
    )
  } else {
    const range = values.length > 0
      ? `ranging from ${yTickFormatter(Math.min(...values))} to ${yTickFormatter(Math.max(...values))}${unit}`
      : 'no data'
    ariaLabel = `${series.label} ${where}, ${range}${shading ? `, ${repWindows!.length} reps shaded` : ''}.`
    chart = (
      <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${activeKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.14} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {shading}
        {xAxis}
        {yAxis}
        {tooltip}
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.6}
          fill={`url(#grad-${activeKey})`}
          connectNulls
          dot={false}
          activeDot={{ r: 3, fill: color }}
          isAnimationActive={!reduceMotion}
        />
      </AreaChart>
    )
  }

  return (
    <section className="detail-panel chart-tabs">
      <div className="tabs-line" role="tablist" aria-label="Activity charts">
        {keys.map(k => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={k === activeKey}
            className="tabs-line-tab"
            onClick={() => setActiveKey(k)}
          >
            {chartData[k].label}
          </button>
        ))}
      </div>
      <div className="chart-card" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height={180}>
          {chart}
        </ResponsiveContainer>
      </div>
    </section>
  )
}
