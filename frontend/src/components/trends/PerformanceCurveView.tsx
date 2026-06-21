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
import { usePerformanceCurve } from '../../api/hooks'
import { useTheme } from '../../App'
import { getChartTickColor } from '../../utils/theme'
import type { PerformanceCurvePoint } from '../../api/types'
import './PerformanceCurveView.css'

type Days = 30 | 60 | 90

const DAY_OPTIONS: { label: string; value: Days }[] = [
  { label: '30d', value: 30 },
  { label: '60d', value: 60 },
  { label: '90d', value: 90 },
]

type CurveMode = 'pace' | 'power'

const ACTUAL_COLOR = '#6c5ce7'
const MODEL_COLOR = '#00b894'

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

function buildChartData(points: PerformanceCurvePoint[], mode: CurveMode) {
  return points.map(p => {
    if (mode === 'power') {
      return {
        dur: p.duration_sec,
        label: formatDuration(p.duration_sec),
        actual: p.actual_value,
        model: p.model_value,
      }
    }
    // Convert m/s → min/km; invert so lower (faster) is higher on chart
    return {
      dur: p.duration_sec,
      label: formatDuration(p.duration_sec),
      actual: p.actual_value > 0 ? +speedToPaceMinKm(p.actual_value).toFixed(2) : null,
      model: p.model_value && p.model_value > 0 ? +speedToPaceMinKm(p.model_value).toFixed(2) : null,
    }
  })
}

export default function PerformanceCurveView() {
  const [days, setDays] = useState<Days>(90)
  const [mode, setMode] = useState<CurveMode>('pace')
  const { data, isLoading } = usePerformanceCurve(days)
  const { theme } = useTheme()
  const tickColor = getChartTickColor(theme)
  const tooltipBg = theme === 'light' ? '#ffffff' : '#1a1a2e'
  const tooltipBorder = theme === 'light' ? '#e0e4ec' : '#2d2d44'
  const tooltipText = theme === 'light' ? '#1a1a2e' : '#e0e0e0'

  if (isLoading) return <div className="perf-curve-loading">Loading performance data…</div>

  const hasPace = (data?.pace_points?.length ?? 0) > 0
  const hasPower = (data?.power_points?.length ?? 0) > 0
  const hasAnyData = hasPace || hasPower

  if (!hasAnyData) {
    return (
      <div className="perf-curve-view">
        <div className="perf-curve-header">
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Performance Curve</span>
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
  const chartData = buildChartData(activePoints, mode)

  function CurveTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    const isPace = mode === 'pace'
    return (
      <div style={{
        background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8,
        padding: '6px 10px', fontSize: 12, color: tooltipText,
      }}>
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
        <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Performance Curve</span>
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
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e0e4ec' : '#2d2d44'} />
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
