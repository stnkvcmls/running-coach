import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useTrainingLoad } from '../../api/hooks'
import type { TrainingLoadPoint } from '../../api/types'
import { useTheme } from '../../App'
import { getChartTickColor } from '../../utils/theme'
import './TrainingLoadChart.css'

interface Props {
  current: TrainingLoadPoint
}

const CTL_COLOR = '#6c5ce7' // Fitness — purple
const ATL_COLOR = '#e17055' // Fatigue — orange
const TSB_COLOR = '#00b894' // Form — green

function formTone(tsb: number): string {
  if (tsb > 5) return 'fresh'
  if (tsb >= -10) return 'neutral'
  if (tsb >= -30) return 'building'
  return 'fatigued'
}

function formLabel(tsb: number): string {
  if (tsb > 5) return 'Fresh'
  if (tsb >= -10) return 'Neutral'
  if (tsb >= -30) return 'Building'
  return 'High fatigue'
}

export default function TrainingLoadChart({ current }: Props) {
  const { data } = useTrainingLoad(90)
  const { theme } = useTheme()
  const tickColor = getChartTickColor(theme)
  const tooltipBg = theme === 'light' ? '#ffffff' : '#1a1a2e'
  const tooltipBorder = theme === 'light' ? '#e0e4ec' : '#2d2d44'
  const tooltipText = theme === 'light' ? '#1a1a2e' : '#e0e0e0'
  const refLineColor = theme === 'light' ? '#e0e4ec' : '#2d2d44'

  function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
    if (!active || !payload || !payload.length) return null
    const byKey: Record<string, number> = {}
    payload.forEach(p => { byKey[p.dataKey] = p.value })
    return (
      <div style={{
        background: tooltipBg,
        border: `1px solid ${tooltipBorder}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        color: tooltipText,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        <div style={{ color: CTL_COLOR }}>Fitness: {byKey.ctl?.toFixed(0)}</div>
        <div style={{ color: ATL_COLOR }}>Fatigue: {byKey.atl?.toFixed(0)}</div>
        <div style={{ color: TSB_COLOR }}>Form: {byKey.tsb >= 0 ? '+' : ''}{byKey.tsb?.toFixed(0)}</div>
      </div>
    )
  }
  const points = data?.points ?? []

  const chartData = points.map(p => ({
    label: p.date.slice(5), // MM-DD
    ctl: p.ctl,
    atl: p.atl,
    tsb: p.tsb,
  }))

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
          <span className={`tl-form-badge tl-form-${formTone(current.tsb)}`}>{formLabel(current.tsb)}</span>
        </div>
      </div>

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
                tick={{ fontSize: 10, fill: tickColor }}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis yAxisId="load" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} width={28} />
              <YAxis yAxisId="form" orientation="right" hide />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine yAxisId="form" y={0} stroke={refLineColor} strokeDasharray="3 3" />
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
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="tl-legend">
        <div className="tl-legend-item"><span className="tl-dot" style={{ background: CTL_COLOR }} />Fitness (CTL)</div>
        <div className="tl-legend-item"><span className="tl-dot" style={{ background: ATL_COLOR }} />Fatigue (ATL)</div>
        <div className="tl-legend-item"><span className="tl-dot" style={{ background: TSB_COLOR }} />Form (TSB)</div>
      </div>
    </div>
  )
}
