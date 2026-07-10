import { useState } from 'react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { usePerformanceCurve, type PerformanceCurveCompareParams } from '../../api/hooks'
import { useTheme } from '../../App'
import { getChartTickColor, getTooltipProps, getGridStroke, PERFORMANCE_CURVE_COLORS } from '../../utils/chartTheme'
import Skeleton from '../ui/Skeleton'
import type { PerformanceCurveCompareMode, PerformanceCurvePoint } from '../../api/types'
import StatHelpButton from '../info/StatHelpButton'
import './PerformanceCurveView.css'

type Days = 30 | 60 | 90

const DAY_OPTIONS: { label: string; value: Days }[] = [
  { label: '30d', value: 30 },
  { label: '60d', value: 60 },
  { label: '90d', value: 90 },
]

type CurveMode = 'pace' | 'power'
type CompareChoice = 'none' | PerformanceCurveCompareMode

const COMPARE_OPTIONS: { label: string; value: CompareChoice }[] = [
  { label: 'No comparison', value: 'none' },
  { label: 'Vs. previous period', value: 'previous_period' },
  { label: 'Vs. year ago', value: 'year_ago' },
  { label: 'Vs. custom range', value: 'custom' },
]

const { actual: ACTUAL_COLOR, model: MODEL_COLOR, compare: COMPARE_COLOR } = PERFORMANCE_CURVE_COLORS

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function defaultCustomRange(): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 90)
  return { start: isoDate(start), end: isoDate(end) }
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`
  if (sec < 3600) return `${Math.round(sec / 60)}m`
  return `${(sec / 3600).toFixed(1)}h`
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.round(sec % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatPaceDisplay(minPerKm: number): string {
  const m = Math.floor(minPerKm)
  const s = Math.round((minPerKm - m) * 60)
  return `${m}:${String(s).padStart(2, '0')}/km`
}

function speedToPaceMinKm(mps: number): number {
  return (1000 / mps) / 60
}

function valueForMode(v: number | null | undefined, mode: CurveMode): number | null {
  if (v == null) return null
  if (mode === 'power') return v
  return v > 0 ? +speedToPaceMinKm(v).toFixed(2) : null
}

function buildChartData(
  points: PerformanceCurvePoint[], mode: CurveMode, comparisonPoints?: PerformanceCurvePoint[]
) {
  const rows = new Map<number, { dur: number; label: string; actual: number | null; model: number | null; actualPrev?: number | null }>()
  for (const p of points) {
    rows.set(p.duration_sec, {
      dur: p.duration_sec,
      label: formatDuration(p.duration_sec),
      actual: valueForMode(p.actual_value, mode),
      model: valueForMode(p.model_value, mode),
    })
  }
  for (const p of comparisonPoints ?? []) {
    const row = rows.get(p.duration_sec) ?? {
      dur: p.duration_sec, label: formatDuration(p.duration_sec), actual: null, model: null,
    }
    row.actualPrev = valueForMode(p.actual_value, mode)
    rows.set(p.duration_sec, row)
  }
  return Array.from(rows.values()).sort((a, b) => a.dur - b.dur)
}

export default function PerformanceCurveView() {
  const [days, setDays] = useState<Days>(90)
  const [mode, setMode] = useState<CurveMode>('pace')
  const [compareChoice, setCompareChoice] = useState<CompareChoice>('none')
  const [customRange, setCustomRange] = useState(defaultCustomRange)

  const compareParams: PerformanceCurveCompareParams | undefined = compareChoice === 'none'
    ? undefined
    : compareChoice === 'custom'
      ? { mode: 'custom', customStart: customRange.start, customEnd: customRange.end }
      : { mode: compareChoice }

  const { data, isLoading } = usePerformanceCurve(days, compareParams)
  const { theme } = useTheme()
  const tickColor = getChartTickColor(theme)
  const { contentStyle } = getTooltipProps(theme)

  if (isLoading) {
    return (
      <div className="perf-curve-view">
        <div className="perf-curve-header">
          <Skeleton height={18} width={150} />
          <Skeleton height={30} width={180} radius="var(--radius-sm)" />
        </div>
        <div className="perf-curve-chart-card" style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <Skeleton height={200} radius="var(--radius-xs)" />
        </div>
      </div>
    )
  }

  const hasPace = (data?.pace_points?.length ?? 0) > 0
  const hasPower = (data?.power_points?.length ?? 0) > 0
  const hasAnyData = hasPace || hasPower

  if (!hasAnyData) {
    return (
      <div className="perf-curve-view">
        <div className="perf-curve-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Performance Curve</span>
            <StatHelpButton topic="performance-curve" label="Performance Curve" />
          </div>
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
          No mean-maximal curve data yet. Sync activities with stream data to build your performance curve.
        </div>
      </div>
    )
  }

  const activePoints = mode === 'pace' ? (data?.pace_points ?? []) : (data?.power_points ?? [])
  const comparisonPoints = data?.comparison
    ? (mode === 'pace' ? data.comparison.pace_points : data.comparison.power_points)
    : undefined
  const chartData = buildChartData(activePoints, mode, comparisonPoints)
  const hasComparison = !!data?.comparison

  function CurveTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    const isPace = mode === 'pace'
    return (
      <div style={{ ...contentStyle, padding: '6px 10px' }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
        {payload.map((p: any) => {
          if (p.value == null) return null
          const display = isPace ? formatPaceDisplay(p.value) : `${p.value.toFixed(0)} W`
          return (
            <div key={p.dataKey} style={{ color: p.color }}>
              {p.name}: {display}
            </div>
          )
        })}
      </div>
    )
  }

  const yLabel = mode === 'pace' ? 'Pace (min/km)' : 'Power (W)'
  const isPace = mode === 'pace'

  // For pace, invert Y-axis domain so faster (lower value) appears at top
  const yDomain: [any, any] = isPace ? ['auto', 'auto'] : ['auto', 'auto']
  const yReversed = isPace // faster pace = lower number, so reversed looks right

  return (
    <div className="perf-curve-view">
      <div className="perf-curve-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Performance Curve</span>
          <StatHelpButton topic="performance-curve" label="Performance Curve" />
        </div>
        <div className="perf-curve-controls">
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
      </div>

      {/* Metric toggle */}
      <div style={{ display: 'flex', gap: 6 }}>
        {hasPace && (
          <button
            className={`perf-curve-tab ${mode === 'pace' ? 'active' : ''}`}
            onClick={() => setMode('pace')}
          >Pace</button>
        )}
        {hasPower && (
          <button
            className={`perf-curve-tab ${mode === 'power' ? 'active' : ''}`}
            onClick={() => setMode('power')}
          >Power</button>
        )}
      </div>

      {/* Comparison controls */}
      <div className="perf-curve-compare-row">
        <select
          className="perf-curve-compare-select"
          value={compareChoice}
          onChange={e => setCompareChoice(e.target.value as CompareChoice)}
        >
          {COMPARE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {compareChoice === 'custom' && (
          <div className="perf-curve-compare-dates">
            <input
              type="date"
              value={customRange.start}
              max={customRange.end}
              onChange={e => setCustomRange(r => ({ ...r, start: e.target.value }))}
            />
            <span>to</span>
            <input
              type="date"
              value={customRange.end}
              min={customRange.start}
              onChange={e => setCustomRange(r => ({ ...r, end: e.target.value }))}
            />
          </div>
        )}
      </div>

      {/* Delta callouts */}
      {(data?.deltas?.length ?? 0) > 0 && (
        <div className="perf-curve-deltas">
          {data!.deltas.map(d => {
            const positive = (d.delta ?? 0) > 0
            const sign = positive ? '+' : ''
            return (
              <div key={d.metric} className={`perf-delta ${positive ? 'positive' : 'negative'}`}>
                {d.label} {sign}{d.delta}{d.unit} vs {data!.comparison?.label.toLowerCase()}
              </div>
            )
          })}
        </div>
      )}

      {/* Model parameters */}
      {(data?.critical_velocity || data?.critical_power) && (
        <div className="perf-curve-model-params">
          {isPace && data?.critical_velocity && (
            <>
              <div className="perf-param">
                <span className="perf-param-label">Threshold Pace (CV)</span>
                <span className="perf-param-value">
                  {formatPaceDisplay(speedToPaceMinKm(data.critical_velocity))}
                </span>
              </div>
              {data?.d_prime != null && (
                <div className="perf-param">
                  <span className="perf-param-label">D′</span>
                  <span className="perf-param-value">
                    {data.d_prime.toFixed(0)}<span className="perf-param-unit"> m</span>
                  </span>
                </div>
              )}
            </>
          )}
          {!isPace && data?.critical_power && (
            <>
              <div className="perf-param">
                <span className="perf-param-label">Critical Power</span>
                <span className="perf-param-value">
                  {data.critical_power.toFixed(0)}<span className="perf-param-unit"> W</span>
                </span>
              </div>
              {data?.w_prime != null && (
                <div className="perf-param">
                  <span className="perf-param-label">W′</span>
                  <span className="perf-param-value">
                    {(data.w_prime / 1000).toFixed(1)}<span className="perf-param-unit"> kJ</span>
                  </span>
                </div>
              )}
            </>
          )}
          <div className="perf-param">
            <span className="perf-param-label">Activities</span>
            <span className="perf-param-value">{data?.activities_analyzed ?? 0}</span>
          </div>
        </div>
      )}

      {/* Curve chart */}
      {chartData.length > 0 && (
        <div className="perf-curve-chart-card" style={{
          background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)',
        }}>
          <div className="perf-curve-chart-title">{yLabel} vs Duration</div>
          <div className="perf-curve-chart">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={getGridStroke(theme)} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: tickColor, fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: tickColor, fontSize: 10 }}
                  domain={yDomain}
                  reversed={yReversed}
                  tickFormatter={(v: number) => isPace ? formatPaceDisplay(v).replace('/km', '') : v.toFixed(0)}
                  width={42}
                />
                <Tooltip content={<CurveTooltip />} />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke={ACTUAL_COLOR}
                  strokeWidth={2}
                  dot={false}
                  name="Best effort"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="model"
                  stroke={MODEL_COLOR}
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={false}
                  name="Model fit"
                  connectNulls
                />
                {hasComparison && (
                  <Line
                    type="monotone"
                    dataKey="actualPrev"
                    stroke={COMPARE_COLOR}
                    strokeWidth={2}
                    strokeDasharray="2 3"
                    dot={false}
                    name={data!.comparison!.label}
                    connectNulls
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="perf-curve-legend">
            <div className="perf-legend-item">
              <div className="perf-legend-dot" style={{ background: ACTUAL_COLOR }} />
              Best effort
            </div>
            <div className="perf-legend-item">
              <div className="perf-legend-dot" style={{ background: MODEL_COLOR, opacity: 0.7 }} />
              CV model fit
            </div>
            {hasComparison && (
              <div className="perf-legend-item">
                <div className="perf-legend-dot" style={{ background: COMPARE_COLOR }} />
                {data!.comparison!.label}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Race predictions */}
      {(data?.race_predictions?.length ?? 0) > 0 && (
        <div className="perf-curve-race-card" style={{
          background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)',
        }}>
          <div className="perf-race-title">Race Predictions (CV Model)</div>
          <table className="perf-race-table">
            <thead>
              <tr>
                <th>Distance</th>
                <th>Time</th>
                <th>Pace</th>
              </tr>
            </thead>
            <tbody>
              {data!.race_predictions.map(r => (
                <tr key={r.distance_label}>
                  <td className="perf-race-label">{r.distance_label}</td>
                  <td className="perf-race-time">{formatTime(r.predicted_time_sec)}</td>
                  <td className="perf-race-pace">{formatPaceDisplay(r.predicted_pace_min_km)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="perf-curve-note" style={{ marginTop: 8 }}>
            Predicted from Critical Velocity model · {days}-day window
          </div>
        </div>
      )}
    </div>
  )
}
