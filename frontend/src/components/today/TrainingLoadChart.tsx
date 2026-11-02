import type { CSSProperties } from 'react'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts'
import { useTrainingLoad } from '../../api/hooks'
import type { TrainingLoadPoint } from '../../api/types'
import { useTheme } from '../../App'
import { getAxisTick, getGridStroke, getTooltipProps, SERIES_COLORS, SERIES_DASHES, Y_AXIS_WIDTH, usePrefersReducedMotion } from '../../utils/chartTheme'
import './TrainingLoadChart.css'

interface Props {
  current: TrainingLoadPoint
}

// Fitness, fatigue, form and ACWR are load metrics, not effort zones, so they
// are drawn in ink and told apart by line style (see the legend): fitness
// solid ink, fatigue solid ink-2, form dashed ink-2, ACWR dotted ink-3.
const CTL_COLOR = SERIES_COLORS[0]
const ATL_COLOR = SERIES_COLORS[1]
const TSB_COLOR = SERIES_COLORS[1]
const ACWR_COLOR = SERIES_COLORS[2]
const TSB_DASH = SERIES_DASHES[1]
const ACWR_DASH = SERIES_DASHES[2]

// Sport is a category, not an effort: running in ink, cross-training in the
// lighter inks (same scheme as SPORT_COLORS in utils/colors).
const SPORT_COLORS: Record<string, string> = {
  run: 'var(--text)',
  ride: 'var(--text-muted)',
  swim: 'var(--text-faint)',
  strength: 'var(--text-muted)',
  other: 'var(--text-faint)',
}

const SPORT_LABELS: Record<string, string> = {
  run: 'Run',
  ride: 'Ride',
  swim: 'Swim',
  strength: 'Strength',
  other: 'Other',
}

function sportColor(sport: string): string {
  return SPORT_COLORS[sport] ?? SPORT_COLORS.other
}

function sportLabel(sport: string): string {
  return SPORT_LABELS[sport] ?? sport
}

// Form (TSB) and RSB (ACWR) zones/labels are computed server-side (see
// classify_tsb/classify_acwr in app/schemas.py) so this badge and the AI
// context never drift out of sync with each other.
function formTone(zone: string | null): string {
  if (zone === 'very_fresh' || zone === 'fresh') return 'fresh'
  if (zone === 'neutral') return 'neutral'
  if (zone === 'productive_fatigue') return 'building'
  return 'fatigued'
}

function rsbTone(zone: string | null): string {
  if (zone === 'overreaching') return 'high'
  if (zone === 'detraining') return 'moderate'
  return 'low'
}

export default function TrainingLoadChart({ current }: Props) {
  const { data } = useTrainingLoad(90)
  const { theme } = useTheme()
  const { contentStyle } = getTooltipProps(theme)
  const refLineColor = getGridStroke(theme)
  const reduceMotion = usePrefersReducedMotion()

  function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
    if (!active || !payload || !payload.length) return null
    const byKey: Record<string, number> = {}
    payload.forEach(p => { byKey[p.dataKey] = p.value })
    return (
      <div style={{
        background: contentStyle.background,
        border: contentStyle.border,
        borderRadius: contentStyle.borderRadius,
        padding: '8px 12px',
        fontSize: 12,
        color: contentStyle.color,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        <div>Fitness: {byKey.ctl?.toFixed(0)}</div>
        <div>Fatigue: {byKey.atl?.toFixed(0)}</div>
        <div>Form: {byKey.tsb >= 0 ? '+' : ''}{byKey.tsb?.toFixed(0)}</div>
        {byKey.acwr != null && (
          <div>ACWR: {byKey.acwr?.toFixed(2)}</div>
        )}
      </div>
    )
  }
  const points = data?.points ?? []

  const chartData = points.map(p => ({
    label: p.date.slice(5), // MM-DD
    ctl: p.ctl,
    atl: p.atl,
    tsb: p.tsb,
    acwr: p.acwr,
  }))

  const hasAcwr = current.acwr != null

  // Aggregate each day's sport_breakdown into a window total so the athlete
  // sees at a glance how much of their load is running vs cross-training.
  const sportTotals: Record<string, number> = {}
  for (const p of points) {
    if (!p.sport_breakdown) continue
    for (const [sport, tss] of Object.entries(p.sport_breakdown)) {
      sportTotals[sport] = (sportTotals[sport] ?? 0) + tss
    }
  }
  const sportTotalSum = Object.values(sportTotals).reduce((sum, v) => sum + v, 0)
  const sportShares = Object.entries(sportTotals)
    .map(([sport, tss]) => ({ sport, tss, pct: sportTotalSum > 0 ? (tss / sportTotalSum) * 100 : 0 }))
    .sort((a, b) => b.tss - a.tss)
  const hasCrossTraining = sportShares.length > 1

  return (
    <div className="card training-load">
      <div className="tl-stats">
        <div className="tl-stat">
          <span className="tl-stat-label">Fitness</span>
          <span className="tl-stat-value num">{current.ctl.toFixed(0)}</span>
          <span className="tl-stat-sub">CTL</span>
        </div>
        <div className="tl-stat">
          <span className="tl-stat-label">Fatigue</span>
          <span className="tl-stat-value num">{current.atl.toFixed(0)}</span>
          <span className="tl-stat-sub">ATL</span>
        </div>
        <div className="tl-stat">
          <span className="tl-stat-label">Form</span>
          <span className="tl-stat-value num">
            {current.tsb >= 0 ? '+' : ''}{current.tsb.toFixed(0)}
          </span>
          <span className={`tl-form-badge tl-form-${formTone(current.form_zone)}`}>
            {current.form_zone_label ?? ''}
          </span>
        </div>
        {hasAcwr && (
          <div className="tl-stat">
            <span className="tl-stat-label">ACWR</span>
            <span className="tl-stat-value num">{current.acwr!.toFixed(2)}</span>
            <span className={`tl-form-badge tl-risk-${rsbTone(current.rsb_zone)}`}>
              {current.rsb_zone_label ?? ''}
            </span>
          </div>
        )}
      </div>

      {hasAcwr && current.rsb_recommendation && (
        <p className="tl-rsb-recommendation">{current.rsb_recommendation}</p>
      )}

      {chartData.length > 1 && (
        <div
          className="tl-chart"
          role="img"
          aria-label={`Training load trend, last 90 days. Fitness ${current.ctl.toFixed(0)}, fatigue ${current.atl.toFixed(0)}, form ${current.tsb >= 0 ? '+' : ''}${current.tsb.toFixed(0)}${current.form_zone_label ? ` (${current.form_zone_label})` : ''}.`}
        >
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="ctlFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CTL_COLOR} stopOpacity={0.16} />
                  <stop offset="100%" stopColor={CTL_COLOR} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={getAxisTick(theme)}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis yAxisId="load" tick={getAxisTick(theme)} axisLine={false} tickLine={false} width={Y_AXIS_WIDTH} />
              <YAxis yAxisId="form" orientation="right" hide />
              {hasAcwr && (
                <YAxis yAxisId="acwr" orientation="right" domain={[0, 2.5]} hide />
              )}
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine yAxisId="form" y={0} stroke={refLineColor} strokeDasharray="3 3" />
              {hasAcwr && (
                <>
                  <ReferenceArea yAxisId="acwr" y1={0.8} y2={1.3} fill="var(--text)" fillOpacity={0.05} />
                  <ReferenceLine yAxisId="acwr" y={0.8} stroke={refLineColor} strokeDasharray="3 3" />
                  <ReferenceLine yAxisId="acwr" y={1.3} stroke={refLineColor} strokeDasharray="3 3" />
                </>
              )}
              <Area
                yAxisId="load"
                type="monotone"
                dataKey="ctl"
                stroke={CTL_COLOR}
                strokeWidth={2}
                fill="url(#ctlFill)"
                dot={false}
                name="Fitness"
                isAnimationActive={!reduceMotion}
              />
              <Line
                yAxisId="load"
                type="monotone"
                dataKey="atl"
                stroke={ATL_COLOR}
                strokeWidth={1.5}
                dot={false}
                name="Fatigue"
                isAnimationActive={!reduceMotion}
              />
              <Line
                yAxisId="form"
                type="monotone"
                dataKey="tsb"
                stroke={TSB_COLOR}
                strokeWidth={1.5}
                strokeDasharray={TSB_DASH}
                dot={false}
                name="Form"
                isAnimationActive={!reduceMotion}
              />
              {hasAcwr && (
                <Line
                  yAxisId="acwr"
                  type="monotone"
                  dataKey="acwr"
                  stroke={ACWR_COLOR}
                  strokeWidth={1.5}
                  strokeDasharray={ACWR_DASH}
                  dot={false}
                  name="ACWR"
                  isAnimationActive={!reduceMotion}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="tl-legend">
        <div className="tl-legend-item"><span className="legend-swatch" style={{ '--swatch': CTL_COLOR } as CSSProperties} />Fitness (CTL)</div>
        <div className="tl-legend-item"><span className="legend-swatch" style={{ '--swatch': ATL_COLOR } as CSSProperties} />Fatigue (ATL)</div>
        <div className="tl-legend-item"><span className="legend-swatch legend-swatch--dashed" style={{ '--swatch': TSB_COLOR } as CSSProperties} />Form (TSB)</div>
        {hasAcwr && (
          <div className="tl-legend-item"><span className="legend-swatch legend-swatch--dotted" style={{ '--swatch': ACWR_COLOR } as CSSProperties} />ACWR</div>
        )}
      </div>

      {hasCrossTraining && (
        <div className="tl-sport-split">
          <span className="tl-sport-split-label">Load by sport ({points.length}d)</span>
          <div className="tl-sport-bar">
            {sportShares.map(({ sport, pct }) => (
              <div
                key={sport}
                className="tl-sport-bar-seg"
                style={{ width: `${pct}%`, background: sportColor(sport) }}
                title={`${sportLabel(sport)}: ${pct.toFixed(0)}%`}
              />
            ))}
          </div>
          <div className="tl-legend">
            {sportShares.map(({ sport, pct }) => (
              <div className="tl-legend-item" key={sport}>
                <span className="tl-dot" style={{ background: sportColor(sport) }} />
                {sportLabel(sport)} {pct.toFixed(0)}%
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
