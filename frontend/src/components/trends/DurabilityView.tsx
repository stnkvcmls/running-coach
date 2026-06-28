import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { useDurability } from '../../api/hooks'
import { useTheme } from '../../App'
import { getChartTickColor } from '../../utils/theme'

type Days = 30 | 60 | 90

const DAY_OPTIONS: { label: string; value: Days }[] = [
  { label: '30d', value: 30 },
  { label: '60d', value: 60 },
  { label: '90d', value: 90 },
]

const RATING_COLOR: Record<string, string> = {
  excellent: '#00b894',
  good: '#6c5ce7',
  moderate: '#fdcb6e',
  'needs improvement': '#e17055',
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function DurabilityView() {
  const [days, setDays] = useState<Days>(90)
  const { data, isLoading } = useDurability(days)
  const { theme } = useTheme()
  const tickColor = getChartTickColor(theme)
  const tooltipBg = theme === 'light' ? '#ffffff' : '#1a1a2e'
  const tooltipBorder = theme === 'light' ? '#e0e4ec' : '#2d2d44'
  const tooltipText = theme === 'light' ? '#1a1a2e' : '#e0e0e0'

  if (isLoading) {
    return <div className="perf-curve-loading">Loading durability data…</div>
  }

  const hasData = (data?.trend_points?.length ?? 0) > 0

  if (!hasData) {
    return (
      <div className="perf-curve-view">
        <div className="perf-curve-header">
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Durability</span>
          <div className="perf-curve-tab-strip">
            {DAY_OPTIONS.map(o => (
              <button
                key={o.value}
                className={`perf-curve-tab ${days === o.value ? 'active' : ''}`}
                onClick={() => setDays(o.value)}
              >{o.label}</button>
            ))}
          </div>
        </div>
        <div className="perf-curve-empty">
          No durability data yet. Long runs (&gt;35 min) with stream data will appear here.
        </div>
      </div>
    )
  }

  const ratingColor = RATING_COLOR[data!.durability_rating ?? ''] ?? 'var(--accent)'
  const chartData = data!.trend_points.map(p => ({
    date: p.date.slice(5),   // MM-DD
    index: p.durability_index,
    name: p.activity_name,
    dur: p.duration_sec,
    metric: p.metric,
  }))

  function DurTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div style={{
        background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8,
        padding: '6px 10px', fontSize: 12, color: tooltipText,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{d.date}</div>
        <div>{d.name}</div>
        <div style={{ color: ratingColor, fontWeight: 700 }}>{d.index.toFixed(1)}%</div>
        <div style={{ color: tooltipText, opacity: 0.7 }}>{formatDuration(d.dur)} · {d.metric}</div>
      </div>
    )
  }

  return (
    <div className="perf-curve-view">
      <div className="perf-curve-header">
        <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Durability</span>
        <div className="perf-curve-tab-strip">
          {DAY_OPTIONS.map(o => (
            <button
              key={o.value}
              className={`perf-curve-tab ${days === o.value ? 'active' : ''}`}
              onClick={() => setDays(o.value)}
            >{o.label}</button>
          ))}
        </div>
      </div>

      {/* Summary stat */}
      <div className="perf-curve-model-params">
        <div className="perf-param">
          <span className="perf-param-label">Mean Durability</span>
          <span className="perf-param-value" style={{ color: ratingColor }}>
            {data!.mean_durability?.toFixed(1)}<span className="perf-param-unit">%</span>
          </span>
        </div>
        <div className="perf-param">
          <span className="perf-param-label">Rating</span>
          <span className="perf-param-value" style={{ color: ratingColor, textTransform: 'capitalize' }}>
            {data!.durability_rating}
          </span>
        </div>
        <div className="perf-param">
          <span className="perf-param-label">Long Runs</span>
          <span className="perf-param-value">{data!.activities_analyzed}</span>
        </div>
      </div>

      {/* Trend chart */}
      <div className="perf-curve-chart-card" style={{
        background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)',
        padding: '12px 16px',
      }}>
        <div className="perf-curve-chart-title">Durability Index Over Time</div>
        <div className="perf-curve-chart">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e0e4ec' : '#2d2d44'} />
              <XAxis
                dataKey="date"
                tick={{ fill: tickColor, fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: tickColor, fontSize: 10 }}
                domain={[60, 105]}
                tickFormatter={(v: number) => `${v}%`}
                width={44}
              />
              <Tooltip content={<DurTooltip />} />
              <ReferenceLine y={92} stroke="#6c5ce7" strokeDasharray="4 2" strokeWidth={1} />
              <ReferenceLine y={85} stroke="#fdcb6e" strokeDasharray="4 2" strokeWidth={1} />
              <Line
                type="monotone"
                dataKey="index"
                stroke={ratingColor}
                strokeWidth={2}
                dot={{ r: 3, fill: ratingColor }}
                name="Durability Index"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="perf-curve-legend" style={{ justifyContent: 'flex-end', gap: 16 }}>
          <div style={{ fontSize: '0.7rem', color: '#6c5ce7', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 1, background: '#6c5ce7', borderTop: '1px dashed #6c5ce7' }} />
            Good (92%)
          </div>
          <div style={{ fontSize: '0.7rem', color: '#fdcb6e', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 1, background: '#fdcb6e', borderTop: '1px dashed #fdcb6e' }} />
            Moderate (85%)
          </div>
        </div>
      </div>

      <div className="perf-curve-note">
        Index = late-run 5-min best ÷ fresh 5-min best · measured after {Math.round((data?.fatigue_offset_sec ?? 1800) / 60)} min into each run
      </div>
    </div>
  )
}
