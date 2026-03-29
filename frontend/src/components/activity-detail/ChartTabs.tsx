import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ReferenceLine,
} from 'recharts'
import type { ChartSeries, MetricZone } from '../../api/types'
import './ChartTabs.css'

const chartColors: Record<string, string> = {
  heart_rate: '#e74c3c',
  elevation: '#2ecc71',
  pace: '#f39c12',
  cadence: '#0984e3',
  power: '#e84393',
  gct: '#6c5ce7',
  vert_osc: '#00cec9',
  vert_ratio: '#fd79a8',
  stride: '#00b894',
  perf_cond: '#fdcb6e',
  stamina: '#a29bfe',
}

const SCATTER_METRICS = new Set(['cadence', 'stride', 'gct', 'vert_osc', 'vert_ratio'])

function getDotColor(value: number, zones: MetricZone[]): string {
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

interface Props {
  chartData: Record<string, ChartSeries>
  metricZones?: Record<string, MetricZone[]> | null
}

export default function ChartTabs({ chartData, metricZones }: Props) {
  const keys = Object.keys(chartData)
  const [activeKey, setActiveKey] = useState(keys[0] || '')

  if (keys.length === 0) return null

  const series = chartData[activeKey]
  if (!series) return null

  const color = chartColors[activeKey] || '#6c5ce7'
  const isScatter = SCATTER_METRICS.has(activeKey)
  const zones = metricZones?.[activeKey]

  // Reverse Y for pace (lower pace = faster = better)
  const reversed = activeKey === 'pace'

  const tooltipStyle = {
    background: '#1a1a2e',
    border: '1px solid #2d2d44',
    borderRadius: 8,
    fontSize: 12,
    color: '#e0e0e0',
  }

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return ['-', series.label]
    const num = Number(value)
    if (activeKey === 'pace') {
      const m = Math.floor(num)
      const s = Math.round((num - m) * 60)
      return [`${m}:${s.toString().padStart(2, '0')}`, series.label]
    }
    return [`${num.toFixed(1)} ${series.unit}`, series.label]
  }

  if (isScatter) {
    const scatterData = series.data
      .map((v, i) => ({ x: i, y: v }))
      .filter((d): d is { x: number; y: number } => d.y !== null)

    const average = scatterData.length > 0
      ? scatterData.reduce((sum, d) => sum + d.y, 0) / scatterData.length
      : 0

    return (
      <div>
        <div className="chart-tabs">
          {keys.map(k => (
            <button
              key={k}
              className={`chart-tab ${k === activeKey ? 'active' : ''}`}
              onClick={() => setActiveKey(k)}
            >
              {chartData[k].label}
            </button>
          ))}
        </div>
        <div className="card chart-card">
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <XAxis dataKey="x" hide type="number" domain={['dataMin', 'dataMax']} />
              <YAxis dataKey="y" hide domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: any) => formatValue(value)}
                labelFormatter={() => ''}
              />
              <ReferenceLine
                y={average}
                stroke="#888"
                strokeDasharray="6 4"
                strokeWidth={1.5}
              />
              <Scatter
                data={scatterData}
                fill={color}
                shape={(props: any) => {
                  const dotColor = zones && zones.length > 0
                    ? getDotColor(props.payload.y, zones)
                    : color
                  return <circle cx={props.cx} cy={props.cy} r={2.5} fill={dotColor} />
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  // Area chart for non-scatter metrics
  const data = series.data.map((v, i) => ({ i, v }))

  return (
    <div>
      <div className="chart-tabs">
        {keys.map(k => (
          <button
            key={k}
            className={`chart-tab ${k === activeKey ? 'active' : ''}`}
            onClick={() => setActiveKey(k)}
          >
            {chartData[k].label}
          </button>
        ))}
      </div>
      <div className="card chart-card">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id={`grad-${activeKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="i" hide />
            <YAxis
              hide
              reversed={reversed}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={formatValue}
              labelFormatter={() => ''}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#grad-${activeKey})`}
              connectNulls
              dot={false}
              activeDot={{ r: 3, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
