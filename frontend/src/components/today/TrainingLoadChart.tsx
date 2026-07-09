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
import { getAxisTick, getGridStroke, getTooltipProps } from '../../utils/chartTheme'
import './TrainingLoadChart.css'

interface Props {
  current: TrainingLoadPoint
}

const CTL_COLOR = '#6c5ce7' // Fitness — purple
const ATL_COLOR = '#e17055' // Fatigue — orange
const TSB_COLOR = '#00b894' // Form — green
const ACWR_COLOR = '#fdcb6e' // ACWR — amber

const SPORT_COLORS: Record<string, string> = {
  run: '#6c5ce7',
  ride: '#0984e3',
  swim: '#00cec9',
  strength: '#e17055',
  other: '#b2bec3',
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
        <div style={{ color: CTL_COLOR }}>Fitness: {byKey.ctl?.toFixed(0)}</div>
        <div style={{ color: ATL_COLOR }}>Fatigue: {byKey.atl?.toFixed(0)}</div>
        <div style={{ color: TSB_COLOR }}>Form: {byKey.tsb >= 0 ? '+' : ''}{byKey.tsb?.toFixed(0)}</div>
        {byKey.acwr != null && (
          <div style={{ color: ACWR_COLOR }}>ACWR: {byKey.acwr?.toFixed(2)}</div>
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
          <span className="tl-stat-value" style={{ color: CTL_COLOR }}>{current.ctl.toFixed(0)}</span>
          <span className="tl-stat-sub">CTL</span>
        </div>
        <div className="tl-stat">
          <span className="tl-stat-label">Fatigue</span>
          <span className="tl-stat-value" style={{ color: ATL_COLOR }}>{current.atl.toFixed(0)}</span>
          <span className="tl-stat-sub">ATL</span>
        </div>
        <div className="tl-stat">
          <span className="tl-stat-label">Form</span>
          <span className="tl-stat-value" style={{ color: TSB_COLOR }}>
            {current.tsb >= 0 ? '+' : ''}{current.tsb.toFixed(0)}
          </span>
          <span className={`tl-form-badge tl-form-${formTone(current.form_zone)}`}>
            {current.form_zone_label ?? ''}
          </span>
        </div>
        {hasAcwr && (
          <div className="tl-stat">
            <span className="tl-stat-label">ACWR</span>
            <span className="tl-stat-value" style={{ color: ACWR_COLOR }}>{current.acwr!.toFixed(2)}</span>
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
        <div className="tl-chart">
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="ctlFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CTL_COLOR} stopOpacity={0.35} />
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
              <YAxis yAxisId="load" tick={getAxisTick(theme)} axisLine={false} tickLine={false} width={28} />
              <YAxis yAxisId="form" orientation="right" hide />
              {hasAcwr && (
                <YAxis yAxisId="acwr" orientation="right" domain={[0, 2.5]} hide />
              )}
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine yAxisId="form" y={0} stroke={refLineColor} strokeDasharray="3 3" />
              {hasAcwr && (
                <>
                  <ReferenceArea yAxisId="acwr" y1={0.8} y2={1.3} fill="rgba(0, 184, 148, 0.07)" />
                  <ReferenceLine yAxisId="acwr" y={0.8} stroke={ACWR_COLOR} strokeDasharray="3 3" strokeOpacity={0.45} />
                  <ReferenceLine yAxisId="acwr" y={1.3} stroke={ATL_COLOR} strokeDasharray="3 3" strokeOpacity={0.45} />
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
              />
              <Line
                yAxisId="load"
                type="monotone"
                dataKey="atl"
                stroke={ATL_COLOR}
                strokeWidth={1.5}
                dot={false}
                name="Fatigue"
              />
              <Line
                yAxisId="form"
                type="monotone"
                dataKey="tsb"
                stroke={TSB_COLOR}
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                name="Form"
              />
              {hasAcwr && (
                <Line
                  yAxisId="acwr"
                  type="monotone"
                  dataKey="acwr"
                  stroke={ACWR_COLOR}
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                  name="ACWR"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="tl-legend">
        <div className="tl-legend-item"><span className="tl-dot" style={{ background: CTL_COLOR }} />Fitness (CTL)</div>
        <div className="tl-legend-item"><span className="tl-dot" style={{ background: ATL_COLOR }} />Fatigue (ATL)</div>
        <div className="tl-legend-item"><span className="tl-dot" style={{ background: TSB_COLOR }} />Form (TSB)</div>
        {hasAcwr && (
          <div className="tl-legend-item"><span className="tl-dot" style={{ background: ACWR_COLOR }} />ACWR</div>
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
