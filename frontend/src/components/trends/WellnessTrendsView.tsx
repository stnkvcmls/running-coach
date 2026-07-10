import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { getChartTickColor, getTooltipProps, WELLNESS_METRIC_COLORS } from '../../utils/chartTheme'
import RangeSelector, { DEFAULT_RANGE_OPTIONS, type RangeDays } from '../ui/RangeSelector'
import Skeleton from '../ui/Skeleton'
import './WellnessTrendsView.css'

const {
  sleep: SLEEP_COLOR,
  restingHr: RHR_COLOR,
  stress: STRESS_COLOR,
  bodyBattery: BATTERY_COLOR,
  hrv: HRV_COLOR,
} = WELLNESS_METRIC_COLORS

function avg7(data: any[], key: string): number | null {
  const vals = data.slice(-7).map(d => d[key]).filter((v: any) => v != null) as number[]
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function WellnessSkeleton() {
  return (
    <div className="trends-view">
      <div className="trends-header">
        <Skeleton height={18} width={140} />
        <Skeleton height={30} width={160} radius="var(--radius-sm)" />
      </div>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="card wellness-card">
          <Skeleton height={10} width={100} />
          <Skeleton height={24} width={90} />
          <Skeleton height={120} radius="var(--radius-xs)" />
        </div>
      ))}
    </div>
  )
}

export default function WellnessTrendsView() {
  const [days, setDays] = useState<RangeDays>(30)
  const { data, isLoading } = useWellnessTrends(days)
  const { theme } = useTheme()
  const tickColor = getChartTickColor(theme)
  const { contentStyle } = getTooltipProps(theme)

  function MetricTooltip({ active, payload, label, unit }: { active?: boolean; payload?: any[]; label?: string; unit: string }) {
    if (!active || !payload?.length) return null
    return (
      <div style={{ ...contentStyle, padding: '6px 10px' }}>
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
    return <WellnessSkeleton />
  }
  if (!data?.length) {
    return (
      <div className="trends-empty">
        No wellness data yet. Wellness trends appear once your Garmin sync captures sleep, HRV, or stress data.
      </div>
    )
  }

  const chartData = data.map(s => ({
    label: s.date.slice(5),
    sleep_score: s.sleep_score ?? null,
    sleep_hours: s.sleep_seconds != null ? +(s.sleep_seconds / 3600).toFixed(1) : null,
    resting_hr: s.resting_hr ?? null,
    stress: s.stress_avg ?? null,
    battery_high: s.body_battery_high ?? null,
    battery_low: s.body_battery_low ?? null,
    hrv: s.hrv_avg ?? null,
  }))

  const avgSleepScore = avg7(chartData, 'sleep_score')
  const avgSleepHours = avg7(chartData, 'sleep_hours')
  const avgRhr = avg7(chartData, 'resting_hr')
  const avgStress = avg7(chartData, 'stress')
  const avgBatteryHigh = avg7(chartData, 'battery_high')
  const avgHrv = avg7(chartData, 'hrv')
  const latestHrvStatus = [...data].reverse().find(s => s.hrv_status != null)?.hrv_status ?? null
  const hasHrv = chartData.some(d => d.hrv != null)

  const minTickGap = days === 30 ? 6 : days === 90 ? 14 : days === 180 ? 28 : 50

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
        <RangeSelector options={DEFAULT_RANGE_OPTIONS} value={days} onChange={setDays} />
      </div>

      <div className="trends-daily-history-row">
        <Link to="/daily" className="btn-ghost">Daily history →</Link>
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

      {/* HRV (overnight) */}
      {hasHrv && (
        <div className="card wellness-card">
          <div className="wellness-card-header">
            <div className="wellness-metric-title">HRV (overnight)</div>
            {avgHrv != null && (
              <div className="wellness-metric-value" style={{ color: HRV_COLOR }}>
                {avgHrv.toFixed(0)}
                <span className="wellness-metric-unit"> ms avg · 7-day</span>
              </div>
            )}
            {latestHrvStatus != null && (
              <div className="wellness-metric-sub">Status: {latestHrvStatus.toLowerCase()}</div>
            )}
          </div>
          <div className="wellness-chart">
            <ResponsiveContainer width="100%" height={120}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="wt-hrvFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={HRV_COLOR} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={HRV_COLOR} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis {...xAxisProps} />
                <YAxis {...yAxisProps} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip content={<MetricTooltip unit=" ms" />} />
                <Area
                  type="monotone"
                  dataKey="hrv"
                  stroke={HRV_COLOR}
                  strokeWidth={2}
                  fill="url(#wt-hrvFill)"
                  dot={false}
                  name="HRV"
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
