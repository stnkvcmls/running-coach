import { useState } from 'react'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useWellnessTrends } from '../../api/hooks'
import { useTheme } from '../../App'
import { getChartTickColor } from '../../utils/theme'
import './WellnessTrendsView.css'

type Range = 30 | 60 | 90

const RANGES: { label: string; value: Range }[] = [
  { label: '30d', value: 30 },
  { label: '60d', value: 60 },
  { label: '90d', value: 90 },
]

const SLEEP_COLOR = '#6c5ce7'
const RHR_COLOR = '#e17055'
const STRESS_COLOR = '#fd79a8'
const BATTERY_COLOR = '#00b894'

function avg7(data: any[], key: string): number | null {
  const vals = data.slice(-7).map(d => d[key]).filter((v: any) => v != null) as number[]
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export default function WellnessTrendsView() {
  const [days, setDays] = useState<Range>(30)
  const { data, isLoading } = useWellnessTrends(days)
  const { theme } = useTheme()
  const tickColor = getChartTickColor(theme)
  const tooltipBg = theme === 'light' ? '#ffffff' : '#1a1a2e'
  const tooltipBorder = theme === 'light' ? '#e0e4ec' : '#2d2d44'
  const tooltipText = theme === 'light' ? '#1a1a2e' : '#e0e0e0'

  function MetricTooltip({ active, payload, label, unit }: { active?: boolean; payload?: any[]; label?: string; unit: string }) {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: tooltipBg,
        border: `1px solid ${tooltipBorder}`,
        borderRadius: 8,
        padding: '6px 10px',
        fontSize: 12,
        color: tooltipText,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
        {payload.map((p: any) => (
          p.value != null && (
            <div key={p.dataKey} style={{ color: p.color }}>
              {p.name}: {typeof p.value === 'number' ? p.value.toFixed(p.dataKey === 'sleep_hours' ? 1 : 0) : p.value}{unit}
            </div>
          )
        ))}
      </div>
    )
  }

  if (isLoading) {
    return <div className="trends-loading">Loading wellness data…</div>
  }
  if (!data?.length) {
    return <div className="trends-empty">No wellness data available.</div>
  }

  const chartData = data.map(s => ({
    label: s.date.slice(5),
    sleep_score: s.sleep_score ?? null,
    sleep_hours: s.sleep_seconds != null ? +(s.sleep_seconds / 3600).toFixed(1) : null,
    resting_hr: s.resting_hr ?? null,
    stress: s.stress_avg ?? null,
    battery_high: s.body_battery_high ?? null,
    battery_low: s.body_battery_low ?? null,
  }))

  const avgSleepScore = avg7(chartData, 'sleep_score')
  const avgSleepHours = avg7(chartData, 'sleep_hours')
  const avgRhr = avg7(chartData, 'resting_hr')
  const avgStress = avg7(chartData, 'stress')
  const avgBatteryHigh = avg7(chartData, 'battery_high')

  const minTickGap = days === 30 ? 14 : days === 60 ? 20 : 28

  const xAxisProps = {
    dataKey: 'label',
    tick: { fontSize: 10, fill: tickColor } as any,
    axisLine: false,
    tickLine: false,
    minTickGap,
  }

  const yAxisProps = {
    tick: { fontSize: 10, fill: tickColor } as any,
    axisLine: false,
    tickLine: false,
    width: 28,
  }

  return (
    <div className="trends-view">
      <div className="trends-header">
        <h2 className="section-title">Wellness Trends</h2>
        <div className="trends-range-tabs">
          {RANGES.map(r => (
            <button
              key={r.value}
              className={`range-tab ${days === r.value ? 'active' : ''}`}
              onClick={() => setDays(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sleep Score */}
      <div className="card wellness-card">
        <div className="wellness-card-header">
          <div className="wellness-metric-title">Sleep Score</div>
          {avgSleepScore != null && (
            <div className="wellness-metric-value" style={{ color: SLEEP_COLOR }}>
              {avgSleepScore.toFixed(0)}
              <span className="wellness-metric-unit"> / 100</span>
            </div>
          )}
          {avgSleepHours != null && (
            <div className="wellness-metric-sub">{avgSleepHours.toFixed(1)}h avg · 7-day</div>
          )}
        </div>
        <div className="wellness-chart">
          <ResponsiveContainer width="100%" height={120}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="wt-sleepFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SLEEP_COLOR} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={SLEEP_COLOR} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} domain={[0, 100]} />
              <Tooltip content={<MetricTooltip unit="" />} />
              <Area
                type="monotone"
                dataKey="sleep_score"
                stroke={SLEEP_COLOR}
                strokeWidth={2}
                fill="url(#wt-sleepFill)"
                dot={false}
                name="Score"
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resting HR */}
      <div className="card wellness-card">
        <div className="wellness-card-header">
          <div className="wellness-metric-title">Resting Heart Rate</div>
          {avgRhr != null && (
            <div className="wellness-metric-value" style={{ color: RHR_COLOR }}>
              {avgRhr.toFixed(0)}
              <span className="wellness-metric-unit"> bpm avg · 7-day</span>
            </div>
          )}
        </div>
        <div className="wellness-chart">
          <ResponsiveContainer width="100%" height={120}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<MetricTooltip unit=" bpm" />} />
              <Line
                type="monotone"
                dataKey="resting_hr"
                stroke={RHR_COLOR}
                strokeWidth={2}
                dot={false}
                name="RHR"
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stress */}
      <div className="card wellness-card">
        <div className="wellness-card-header">
          <div className="wellness-metric-title">Avg Stress</div>
          {avgStress != null && (
            <div className="wellness-metric-value" style={{ color: STRESS_COLOR }}>
              {avgStress.toFixed(0)}
              <span className="wellness-metric-unit"> / 100 avg · 7-day</span>
            </div>
          )}
        </div>
        <div className="wellness-chart">
          <ResponsiveContainer width="100%" height={120}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="wt-stressFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={STRESS_COLOR} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={STRESS_COLOR} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} domain={[0, 100]} />
              <Tooltip content={<MetricTooltip unit="" />} />
              <Area
                type="monotone"
                dataKey="stress"
                stroke={STRESS_COLOR}
                strokeWidth={2}
                fill="url(#wt-stressFill)"
                dot={false}
                name="Stress"
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Body Battery */}
      <div className="card wellness-card">
        <div className="wellness-card-header">
          <div className="wellness-metric-title">Body Battery</div>
          {avgBatteryHigh != null && (
            <div className="wellness-metric-value" style={{ color: BATTERY_COLOR }}>
              {avgBatteryHigh.toFixed(0)}
              <span className="wellness-metric-unit"> high avg · 7-day</span>
            </div>
          )}
        </div>
        <div className="wellness-chart">
          <ResponsiveContainer width="100%" height={120}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="wt-batteryFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BATTERY_COLOR} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={BATTERY_COLOR} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} domain={[0, 100]} />
              <Tooltip content={<MetricTooltip unit="" />} />
              <Area
                type="monotone"
                dataKey="battery_high"
                stroke={BATTERY_COLOR}
                strokeWidth={2}
                fill="url(#wt-batteryFill)"
                dot={false}
                name="High"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="battery_low"
                stroke={BATTERY_COLOR}
                strokeWidth={1.5}
                strokeDasharray="3 2"
                dot={false}
                name="Low"
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
