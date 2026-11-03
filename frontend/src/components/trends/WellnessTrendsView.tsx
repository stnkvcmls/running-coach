import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWellnessTrends } from '../../api/hooks'
import type { DailySummaryResponse } from '../../api/types'
import { usePersonalRange, hrvBand, hrvVerdict, type PersonalRange, type RangeMetric, type RangeVerdict } from '../../hooks/usePersonalRange'
import { formatDateKey } from '../../utils/date'
import RangeSelector, { type RangeOption } from '../ui/RangeSelector'
import Skeleton from '../ui/Skeleton'
import './WellnessTrendsView.css'

type BodyRange = 30 | 90 | 365

const RANGE_OPTIONS: RangeOption<BodyRange>[] = [
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '1 year', value: 365 },
]

type MetricKey = RangeMetric | 'hrv_avg'

interface MetricDef {
  key: MetricKey
  name: string
  unit: string
}

/** Small multiples, one per body metric (G2): ink over the athlete's own
 * usual range, each with its verdict in words. */
const METRICS: MetricDef[] = [
  { key: 'resting_hr', name: 'Resting HR', unit: 'bpm' },
  { key: 'hrv_avg', name: 'HRV overnight', unit: 'ms' },
  { key: 'sleep_score', name: 'Sleep score', unit: '' },
  { key: 'body_battery_high', name: 'Body battery, daily high', unit: '' },
  { key: 'stress_avg', name: 'Stress, daily average', unit: '' },
]

const W = 320
const H = 56

interface SparklineProps {
  values: (number | null)[]
  band: PersonalRange | null
  flag: boolean
  label: string
}

/** Ink line over a shaded band; no axes — the band and the value say enough.
 * The last point is drawn as an HTML dot so it stays round however the
 * (non-uniformly scaled) SVG stretches. */
function Sparkline({ values, band, flag, label }: SparklineProps) {
  const points = values
    .map((v, i) => (v != null ? { i, v } : null))
    .filter((p): p is { i: number; v: number } => p != null)
  if (points.length === 0) return null

  const nums = points.map(p => p.v).concat(band ? [band.low, band.high] : [])
  const lo = Math.min(...nums)
  const hi = Math.max(...nums)
  const pad = Math.max((band ? band.high - band.low : hi - lo) * 0.3, 1)
  const min = lo - pad
  const max = hi + pad
  const x = (i: number) => (values.length > 1 ? (i / (values.length - 1)) * W : W / 2)
  const y = (v: number) => H - 4 - ((v - min) / (max - min)) * (H - 8)
  const d = points.map((p, k) => `${k === 0 ? 'M' : 'L'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]

  return (
    <div className="trend-spark" role="img" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        {band && (
          <rect
            className="trend-band"
            x={0}
            y={y(band.high)}
            width={W}
            height={Math.max(y(band.low) - y(band.high), 1)}
            rx={3}
          />
        )}
        <path className="trend-line" d={d} vectorEffect="non-scaling-stroke" />
      </svg>
      <span
        className={`trend-dot${flag ? ' trend-dot-flag' : ''}`}
        style={{ left: `${(x(last.i) / W) * 100}%`, top: `${(y(last.v) / H) * 100}%` }}
        aria-hidden="true"
      />
    </div>
  )
}

function lastWhere(data: DailySummaryResponse[], test: (s: DailySummaryResponse) => boolean): DailySummaryResponse | null {
  for (let i = data.length - 1; i >= 0; i--) if (test(data[i])) return data[i]
  return null
}

function WellnessSkeleton() {
  return (
    <div className="trends-view">
      <div className="trends-header">
        <Skeleton height={30} width={200} radius="var(--radius-sm)" />
        <Skeleton height={18} width={100} />
      </div>
      <div className="card body-trends">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="trend">
            <Skeleton height={14} width={120} />
            <Skeleton height={56} radius="var(--radius-xs)" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function WellnessTrendsView() {
  const [days, setDays] = useState<BodyRange>(30)
  const { data, isLoading } = useWellnessTrends(days)
  const summaries = Array.isArray(data) ? data : []
  const latestDate = summaries.length > 0 ? summaries[summaries.length - 1].date : formatDateKey(new Date())
  // Bands always come from the last 90 days, whichever range is on screen.
  const personal = usePersonalRange(latestDate)

  if (isLoading) {
    return <WellnessSkeleton />
  }
  if (summaries.length === 0) {
    return (
      <div className="trends-empty">
        No wellness data yet. Wellness trends appear once your Garmin sync captures sleep, HRV, or stress data.
      </div>
    )
  }

  const rangeLabel = RANGE_OPTIONS.find(o => o.value === days)?.label ?? `${days} days`

  const rows = METRICS.map(m => {
    const values = summaries.map(s => s[m.key] ?? null)
    const latest = lastWhere(summaries, s => s[m.key] != null)
    if (!latest) return null
    const value = latest[m.key] as number

    let band: PersonalRange | null
    let verdict: RangeVerdict | null
    if (m.key === 'hrv_avg') {
      band = hrvBand(lastWhere(summaries, s => s.hrv_baseline_low != null && s.hrv_baseline_high != null) ?? latest)
      verdict = hrvVerdict(latest)
    } else {
      band = personal.ranges[m.key]
      verdict = personal.verdict(m.key, latest.date, value)
    }
    const status = verdict?.text ?? (band ? null : 'No usual range yet')
    return { m, values, value, band, verdict, status }
  }).filter(r => r != null)

  return (
    <div className="trends-view">
      {/* No heading: the "Body" tab already names this panel (G3). */}
      <div className="trends-header">
        <RangeSelector options={RANGE_OPTIONS} value={days} onChange={setDays} />
        <Link to="/daily" className="btn-ghost">Daily history</Link>
      </div>

      <ul className="card body-trends">
        {rows.map(({ m, values, value, band, verdict, status }) => {
          const flag = !!verdict?.flag
          const shown = Math.round(value)
          return (
            <li key={m.key} className="trend">
              <div className="trend-head">
                <p className="trend-name">{m.name}</p>
                {status && <p className={`trend-status${flag ? ' trend-status-flag' : ''}`}>{status}</p>}
              </div>
              <div className="trend-val num">
                {shown}
                {m.unit && <small>{m.unit}</small>}
              </div>
              <Sparkline
                values={values}
                band={band}
                flag={flag}
                label={`${m.name} over the last ${rangeLabel}; latest ${shown}${m.unit ? ` ${m.unit}` : ''}${status ? `; ${status.toLowerCase()}` : ''}.`}
              />
            </li>
          )
        })}
      </ul>

      <p className="trends-footnote">
        Bands: Garmin's baseline for HRV; your middle 80% of the last 90 days for the rest.
      </p>
    </div>
  )
}
