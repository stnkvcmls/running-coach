import { useState } from 'react'
import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { useAerobicTrends } from '../../api/hooks'
import { useTheme } from '../../App'
import { getChartTickColor, getChartTooltipStyle } from '../../utils/theme'
import type { AerobicTrendPoint } from '../../api/types'

type Days = 30 | 60 | 90

const DAY_OPTIONS: { label: string; value: Days }[] = [
  { label: '30d', value: 30 },
  { label: '60d', value: 60 },
  { label: '90d', value: 90 },
]

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function rollingMean(points: AerobicTrendPoint[], key: 'decoupling_pct' | 'efficiency_factor', window = 7) {
  return points.map((_, i) => {
    const slice = points.slice(Math.max(0, i - window + 1), i + 1)
    const vals = slice.map(p => p[key]).filter((v): v is number => v != null)
    if (!vals.length) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  })
}

export default function AerobicTrendsView() {
  const [days, setDays] = useState<Days>(90)
  const { data, isLoading } = useAerobicTrends(days)
  const { theme } = useTheme()
  const tickColor = getChartTickColor(theme)
  const tooltipStyle = getChartTooltipStyle(theme)

  if (isLoading) {
    return <div style={{ padding: 32, color: 'var(--text-muted)', textAlign: 'center' }}>Loading aerobic trends…</div>
  }
  if (!data?.points.length) {
    return <div style={{ padding: 32, color: 'var(--text-muted)', textAlign: 'center' }}>No aerobic data available. Sync some runs to see trends.</div>
  }

  const pts = data.points
  const decMeans = rollingMean(pts, 'decoupling_pct')
  const efMeans = rollingMean(pts, 'efficiency_factor')

  const decData = pts.map((p, i) => ({
    label: formatDate(p.date),
    value: p.decoupling_pct != null ? +p.decoupling_pct.toFixed(1) : null,
    mean: decMeans[i] != null ? +decMeans[i]!.toFixed(2) : null,
    name: p.activity_name,
    duration: formatDuration(p.duration_sec),
  }))

  const efData = pts.map((p, i) => ({
    label: formatDate(p.date),
    value: p.efficiency_factor != null ? +p.efficiency_factor.toFixed(2) : null,
    mean: efMeans[i] != null ? +efMeans[i]!.toFixed(3) : null,
    name: p.activity_name,
    duration: formatDuration(p.duration_sec),
  }))

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 16,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    marginBottom: 12,
    textTransform: 'uppercase' as const,
  }

  function ChartTooltip({ active, payload, unit }: { active?: boolean; payload?: any[]; unit: string }) {
    if (!active || !payload?.length) return null
    const p = payload[0]?.payload
    if (!p) return null
    return (
      <div style={{ ...tooltipStyle, padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.label} — {p.name}</div>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{p.duration}</div>
        {payload.map((e: any) => e.value != null && (
          <div key={e.dataKey} style={{ color: e.color }}>
            {e.name}: {e.value}{unit}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Aerobic Efficiency</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {DAY_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setDays(o.value)}
              style={{
                padding: '4px 12px',
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: days === o.value ? 'var(--accent)' : 'transparent',
                color: days === o.value ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontFamily: 'inherit',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Decoupling chart */}
      <div style={cardStyle}>
        <div style={labelStyle}>Aerobic Decoupling (%) — lower is better</div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>
          How much pace/HR efficiency drifts between the first and second half of a run. Under 5% = well coupled.
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={decData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip content={<ChartTooltip unit="%" />} />
            <ReferenceLine y={5} stroke="#00b894" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Good (5%)', position: 'right', fontSize: 10, fill: '#00b894' }} />
            <ReferenceLine y={10} stroke="#e17055" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'High (10%)', position: 'right', fontSize: 10, fill: '#e17055' }} />
            <Scatter dataKey="value" fill="#6c5ce7" opacity={0.7} name="Decoupling" r={4} />
            <Line dataKey="mean" stroke="#6c5ce7" strokeWidth={2} dot={false} name="7-run avg" connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* EF chart */}
      <div style={cardStyle}>
        <div style={labelStyle}>Efficiency Factor (mm/s·bpm) — higher is better</div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>
          Average GAP speed per heart rate beat. Rising EF over time indicates improving aerobic fitness.
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={efData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(1)} />
            <Tooltip content={<ChartTooltip unit=" mm/s·bpm" />} />
            <Scatter dataKey="value" fill="#00b894" opacity={0.7} name="EF" r={4} />
            <Line dataKey="mean" stroke="#00b894" strokeWidth={2} dot={false} name="7-run avg" connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
