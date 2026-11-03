import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ComposedChart, Area, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { useTrainingLoad } from '../../api/hooks'
import type { TrainingLoadPoint } from '../../api/types'
import { useTheme } from '../../App'
import { getAxisTick, SERIES_COLORS, SERIES_DASHES, usePrefersReducedMotion } from '../../utils/chartTheme'
import './FormPanel.css'

const WINDOW_DAYS = 42

function signed(n: number): string {
  const r = Math.round(n)
  return r > 0 ? `+${r}` : String(r)
}

/** "Fresh", "Neutral", "Productive training fatigue"… — the head of the
 * server's form-zone label (classify_tsb), so Today, the info page and the AI
 * context use the same bands and words. */
export function formWord(point: Pick<TrainingLoadPoint, 'form_zone_label' | 'tsb'>): string {
  const label = point.form_zone_label?.split(/\s+—\s+|,/)[0]?.trim()
  if (label) return label
  return point.tsb > 5 ? 'Fresh' : point.tsb >= -10 ? 'Neutral' : 'Fatigued'
}

function trend(now: number, before: number | undefined, words: [string, string, string], threshold: number): string {
  if (before == null) return `${words[1]} ${Math.round(now)}`
  const d = now - before
  if (d > threshold) return `${words[0]} ${Math.round(now)}`
  if (d < -threshold) return `${words[2]} ${Math.round(now)}`
  return `${words[1]} ${Math.round(now)}`
}

/** One plain sentence: the form band and how fitness and fatigue moved over
 * the last week, e.g. "Fresh, +17. Fitness is holding at 62 and fatigue has
 * dropped to 44." */
export function formSentence(current: TrainingLoadPoint, weekAgo: TrainingLoadPoint | undefined): { lead: string; rest: string } {
  const fitness = trend(current.ctl, weekAgo?.ctl, ['is rising to', 'is holding at', 'is slipping to'], 2)
  const fatigue = trend(current.atl, weekAgo?.atl, ['has risen to', 'is steady at', 'has dropped to'], 3)
  return {
    lead: `${formWord(current)}, ${signed(current.tsb)}.`,
    rest: `Fitness ${fitness} and fatigue ${fatigue}.`,
  }
}

interface Props {
  current: TrainingLoadPoint
  dateKey: string
}

/** Today's Form panel: one sentence plus fitness (solid ink, faint area) and
 * fatigue (dashed ink-2) over six weeks. ACWR lives on Progress. */
export default function FormPanel({ current, dateKey }: Props) {
  const { data } = useTrainingLoad(90)
  const { theme } = useTheme()
  const reduceMotion = usePrefersReducedMotion()
  const points = (data?.points ?? []).filter(p => p.date <= dateKey).slice(-WINDOW_DAYS)
  const weekAgo = points.length > 7 ? points[points.length - 8] : undefined
  const { lead, rest } = formSentence(current, weekAgo)
  const chartData = points.map(p => ({ label: p.date.slice(5), ctl: p.ctl, atl: p.atl }))

  return (
    <section className="card today-panel form-panel" aria-labelledby="form-panel-title">
      <div className="panel-head">
        <h2 id="form-panel-title" className="section-title">Form</h2>
        <Link to="/trends" className="text-link panel-head-link">Progress</Link>
      </div>
      <p className="form-line"><b>{lead}</b> {rest}</p>
      {chartData.length > 1 && (
        <>
          <div
            className="form-chart"
            role="img"
            aria-label={`Fitness and fatigue over the last six weeks: fitness ${Math.round(points[0].ctl)} to ${Math.round(current.ctl)}, fatigue ${Math.round(points[0].atl)} to ${Math.round(current.atl)}.`}
          >
            <ResponsiveContainer width="100%" height={110}>
              <ComposedChart data={chartData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="formCtlFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SERIES_COLORS[0]} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={SERIES_COLORS[0]} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={getAxisTick(theme, 11)} axisLine={false} tickLine={false} minTickGap={40} />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Area
                  type="monotone"
                  dataKey="ctl"
                  stroke={SERIES_COLORS[0]}
                  strokeWidth={2}
                  fill="url(#formCtlFill)"
                  isAnimationActive={!reduceMotion}
                />
                <Line
                  type="monotone"
                  dataKey="atl"
                  stroke={SERIES_COLORS[1]}
                  strokeWidth={2}
                  strokeDasharray={SERIES_DASHES[1]}
                  dot={false}
                  isAnimationActive={!reduceMotion}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="form-legend" aria-hidden="true">
            <span><i className="legend-swatch" style={{ '--swatch': SERIES_COLORS[0] } as CSSProperties} />Fitness</span>
            <span><i className="legend-swatch legend-swatch--dashed" style={{ '--swatch': SERIES_COLORS[1] } as CSSProperties} />Fatigue</span>
          </div>
        </>
      )}
    </section>
  )
}
