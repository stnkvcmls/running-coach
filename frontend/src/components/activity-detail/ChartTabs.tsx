import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { ChartSeries } from '../../api/types'
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

interface Props {
  chartData: Record<string, ChartSeries>
}

export default function ChartTabs({ chartData }: Props) {
  const keys = Object.keys(chartData)
  const [activeKey, setActiveKey] = useState(keys[0] || '')

  if (keys.length === 0) return null

  const series = chartData[activeKey]
  if (!series) return null

  const color = chartColors[activeKey] || '#6c5ce7'
  const data = series.data.map((v, i) => ({ i, v }))

  // Reverse Y for pace (lower pace = faster = better)
  const reversed = activeKey === 'pace'

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
              contentStyle={{
                background: '#1a1a2e',
                border: '1px solid #2d2d44',
                borderRadius: 8,
                fontSize: 12,
                color: '#e0e0e0',
              }}
              formatter={(value: any) => {
                if (value === null || value === undefined) return ['-', series.label]
                const num = Number(value)
                if (activeKey === 'pace') {
                  const m = Math.floor(num)
                  const s = Math.round((num - m) * 60)
                  return [`${m}:${s.toString().padStart(2, '0')}`, series.label]
                }
                return [`${num.toFixed(1)} ${series.unit}`, series.label]
              }}
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
