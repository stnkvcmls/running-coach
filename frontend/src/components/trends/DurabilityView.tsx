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
import type { DurabilityMode, DurabilityPoint, DurabilityResponse } from '../../api/types'

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

const EARLY_COLOR = '#00b894'
const LATE_COLOR = '#e17055'
const FRESH_COLOR = '#00b894'

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.round(sec % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── Segment timeline chart ───────────────────────────────────────────────────

interface TimelineBarProps {
  totalSec: number
  segments: { startSec: number; endSec: number; color: string; label: string }[]
  splitSec?: number
  height?: number
}

function TimelineBar({ totalSec, segments, splitSec, height = 28 }: TimelineBarProps) {
  const pct = (s: number) => `${Math.min(100, (s / totalSec) * 100).toFixed(2)}%`

  return (
    <div style={{ position: 'relative', height, borderRadius: 4, overflow: 'hidden', background: 'var(--border)' }}>
      {/* Split divider (fatigue offset) */}
      {splitSec != null && (
        <div style={{
          position: 'absolute', left: pct(splitSec), top: 0, bottom: 0,
          width: 2, background: 'var(--text-muted)', zIndex: 2,
        }} />
      )}
      {/* Coloured windows */}
      {segments.map((seg, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: pct(seg.startSec),
          width: pct(seg.endSec - seg.startSec),
          top: '15%', height: '70%',
          background: seg.color, borderRadius: 3, zIndex: 1, opacity: 0.85,
        }} />
      ))}
    </div>
  )
}

interface SegmentChartProps {
  point: DurabilityPoint
  data: DurabilityResponse
}

function SegmentChart({ point, data }: SegmentChartProps) {
  const refDur = data.reference_duration_sec
  const offset = data.fatigue_offset_sec
  const isIntra = data.mode === 'intra'

  if (isIntra) {
    // Single bar: full run with early and late windows
    const hasEarly = point.early_window_start_sec != null
    const hasLate = point.late_window_start_sec != null

    return (
      <div style={{ padding: '12px 0 4px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
          {point.activity_name} &mdash; {formatDuration(point.duration_sec)}
        </div>
        <TimelineBar
          totalSec={point.duration_sec}
          splitSec={offset}
          segments={[
            ...(hasEarly ? [{
              startSec: point.early_window_start_sec!,
              endSec: point.early_window_end_sec!,
              color: EARLY_COLOR,
              label: 'early',
            }] : []),
            ...(hasLate ? [{
              startSec: point.late_window_start_sec!,
              endSec: point.late_window_end_sec!,
              color: LATE_COLOR,
              label: 'late',
            }] : []),
          ]}
        />
        {/* Axis labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 3 }}>
          <span>0:00</span>
          <span>{formatTime(offset)} ← split</span>
          <span>{formatDuration(point.duration_sec)}</span>
        </div>
        {/* Window labels */}
        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          {hasEarly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: EARLY_COLOR, flexShrink: 0 }} />
              <span style={{ color: 'var(--text-muted)' }}>Early best:&nbsp;</span>
              <span style={{ color: EARLY_COLOR, fontWeight: 600 }}>
                {formatTime(point.early_window_start_sec!)}–{formatTime(point.early_window_end_sec!)}
              </span>
            </div>
          )}
          {hasLate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: LATE_COLOR, flexShrink: 0 }} />
              <span style={{ color: 'var(--text-muted)' }}>Late best:&nbsp;</span>
              <span style={{ color: LATE_COLOR, fontWeight: 600 }}>
                {formatTime(point.late_window_start_sec!)}–{formatTime(point.late_window_end_sec!)}
              </span>
            </div>
          )}
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Index: <span style={{ fontWeight: 700, color: 'var(--text)' }}>{point.durability_index.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    )
  }

  // easy_baseline mode — two rows
  const hasLate = point.late_window_start_sec != null
  const hasFreshPos = data.fresh_window_start_sec != null && data.fresh_activity_duration_sec

  return (
    <div style={{ padding: '12px 0 4px' }}>
      {/* Current run — late window */}
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{point.activity_name}</span>
        &nbsp;({point.date}) &mdash; late {refDur / 60}-min best
      </div>
      <TimelineBar
        totalSec={point.duration_sec}
        splitSec={offset}
        segments={hasLate ? [{
          startSec: point.late_window_start_sec!,
          endSec: point.late_window_end_sec!,
          color: LATE_COLOR,
          label: 'late',
        }] : []}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 3, marginBottom: 12 }}>
        <span>0:00</span>
        <span>{formatTime(offset)} ← fatigue split</span>
        <span>{formatDuration(point.duration_sec)}</span>
      </div>
      {hasLate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', marginBottom: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: LATE_COLOR, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-muted)' }}>Late window:&nbsp;</span>
          <span style={{ color: LATE_COLOR, fontWeight: 600 }}>
            {formatTime(point.late_window_start_sec!)}–{formatTime(point.late_window_end_sec!)}
          </span>
        </div>
      )}

      {/* Fresh reference */}
      {data.fresh_activity_name && (
        <>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>
              Fresh reference: {data.fresh_activity_name}
            </span>
            {data.fresh_activity_date && <>&nbsp;({data.fresh_activity_date})</>}
            &nbsp;&mdash; best easy-run {refDur / 60}-min in window
          </div>
          {hasFreshPos ? (
            <>
              <TimelineBar
                totalSec={data.fresh_activity_duration_sec!}
                segments={[{
                  startSec: data.fresh_window_start_sec!,
                  endSec: data.fresh_window_end_sec!,
                  color: FRESH_COLOR,
                  label: 'fresh',
                }]}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 3, marginBottom: 8 }}>
                <span>0:00</span>
                <span>{formatDuration(data.fresh_activity_duration_sec!)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: FRESH_COLOR, flexShrink: 0 }} />
                <span style={{ color: 'var(--text-muted)' }}>Fresh window:&nbsp;</span>
                <span style={{ color: FRESH_COLOR, fontWeight: 600 }}>
                  {formatTime(data.fresh_window_start_sec!)}–{formatTime(data.fresh_window_end_sec!)}
                </span>
              </div>
            </>
          ) : (
            data.fresh_window_start_sec != null && (
              <div style={{ fontSize: '0.72rem', color: FRESH_COLOR }}>
                Fresh window starts at {formatTime(data.fresh_window_start_sec)}
              </div>
            )
          )}
        </>
      )}

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 10 }}>
        Index: <span style={{ fontWeight: 700, color: 'var(--text)' }}>{point.durability_index.toFixed(1)}%</span>
        &nbsp;= late ÷ fresh-easy × 100
      </div>
    </div>
  )
}

// ── Main view ────────────────────────────────────────────────────────────────

export default function DurabilityView() {
  const [days, setDays] = useState<Days>(90)
  const [mode, setMode] = useState<DurabilityMode>('intra')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const { data, isLoading } = useDurability(days, mode)
  const { theme } = useTheme()
  const tickColor = getChartTickColor(theme)
  const tooltipBg = theme === 'light' ? '#ffffff' : '#1a1a2e'
  const tooltipBorder = theme === 'light' ? '#e0e4ec' : '#2d2d44'
  const tooltipText = theme === 'light' ? '#1a1a2e' : '#e0e0e0'

  if (isLoading) {
    return <div className="perf-curve-loading">Loading durability data…</div>
  }

  const hasData = (data?.trend_points?.length ?? 0) > 0
  const ratingColor = RATING_COLOR[data?.durability_rating ?? ''] ?? 'var(--accent)'

  const selectedPoint: DurabilityPoint | null = hasData
    ? data!.trend_points[selectedIdx ?? data!.trend_points.length - 1]
    : null

  const chartData = hasData
    ? data!.trend_points.map((p, i) => ({
        date: p.date.slice(5),
        index: p.durability_index,
        name: p.activity_name,
        dur: p.duration_sec,
        _i: i,
      }))
    : []

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
        <div style={{ opacity: 0.7 }}>{formatDuration(d.dur)}</div>
      </div>
    )
  }

  return (
    <div className="perf-curve-view">
      {/* Header */}
      <div className="perf-curve-header">
        <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Durability</span>
        <div className="perf-curve-tab-strip">
          {DAY_OPTIONS.map(o => (
            <button key={o.value} className={`perf-curve-tab ${days === o.value ? 'active' : ''}`}
              onClick={() => setDays(o.value)}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className={`perf-curve-tab ${mode === 'intra' ? 'active' : ''}`}
          onClick={() => { setMode('intra'); setSelectedIdx(null) }}
        >Intra-Run</button>
        <button
          className={`perf-curve-tab ${mode === 'easy_baseline' ? 'active' : ''}`}
          onClick={() => { setMode('easy_baseline'); setSelectedIdx(null) }}
        >Easy Baseline</button>
      </div>

      {/* Mode description */}
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
        {mode === 'intra'
          ? 'Each run\'s early 5-min best (0–30 min) vs late 5-min best (30 min+) — same run, same effort.'
          : 'Late 5-min best (30 min+) vs the best 5-min from any easy run in this window.'}
      </div>

      {!hasData ? (
        <div className="perf-curve-empty">
          {mode === 'intra'
            ? 'No durability data yet. Long runs (>35 min) with stream data will appear here.'
            : 'No easy-run baseline found. Sync easy runs (aerobic TE < 3) with stream data.'}
        </div>
      ) : (
        <>
          {/* Summary stats */}
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
              <span className="perf-param-label">Runs</span>
              <span className="perf-param-value">{data!.activities_analyzed}</span>
            </div>
          </div>

          {/* Trend chart */}
          <div className="perf-curve-chart-card" style={{
            background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: '12px 16px',
          }}>
            <div className="perf-curve-chart-title">Durability Index Over Time — click a point to inspect</div>
            <div className="perf-curve-chart">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={chartData}
                  margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
                  onClick={(e) => {
                    if (e?.activeTooltipIndex != null) setSelectedIdx(e.activeTooltipIndex)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e0e4ec' : '#2d2d44'} />
                  <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 10 }} interval="preserveStartEnd" />
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
                    dot={(props: any) => {
                      const isSelected = props.index === (selectedIdx ?? chartData.length - 1)
                      return (
                        <circle
                          key={props.index}
                          cx={props.cx} cy={props.cy}
                          r={isSelected ? 6 : 4}
                          fill={isSelected ? ratingColor : 'var(--surface)'}
                          stroke={ratingColor}
                          strokeWidth={isSelected ? 3 : 2}
                        />
                      )
                    }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Band legend */}
            <div style={{ display: 'flex', gap: 14, marginTop: 4, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.68rem', color: '#6c5ce7' }}>— Good (92%)</span>
              <span style={{ fontSize: '0.68rem', color: '#fdcb6e' }}>— Moderate (85%)</span>
            </div>
          </div>

          {/* Segment detail chart */}
          {selectedPoint && (
            <div style={{
              background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: '12px 16px',
            }}>
              <div className="perf-curve-chart-title">Segment Detail</div>
              <SegmentChart point={selectedPoint} data={data!} />

              {/* Legend */}
              <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
                {data!.mode === 'intra' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: EARLY_COLOR }} />
                      Early 5-min best (0–30 min)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: LATE_COLOR }} />
                      Late 5-min best (30 min+)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <div style={{ width: 2, height: 10, background: 'var(--text-muted)' }} />
                      30-min fatigue split
                    </div>
                  </>
                )}
                {data!.mode === 'easy_baseline' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: LATE_COLOR }} />
                      Late 5-min best
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: FRESH_COLOR }} />
                      Fresh easy-run 5-min best
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <div style={{ width: 2, height: 10, background: 'var(--text-muted)' }} />
                      30-min fatigue split
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="perf-curve-note">
            Index = late 5-min best ÷ {mode === 'intra' ? 'early 5-min best (same run)' : 'fresh easy-run 5-min best'} · 30-min fatigue offset
          </div>
        </>
      )}
    </div>
  )
}
