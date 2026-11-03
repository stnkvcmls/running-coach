import { Link } from 'react-router-dom'
import type { DailySummaryResponse } from '../../api/types'
import { hrvVerdict, usePersonalRange, type RangeVerdict } from '../../hooks/usePersonalRange'
import './BodyPanel.css'

interface MetricProps {
  label: string
  value: number | null
  unit?: string
  verdict: RangeVerdict | null
}

function Metric({ label, value, unit, verdict }: MetricProps) {
  if (value == null) return null
  return (
    <div className="body-metric">
      <dt>{label}</dt>
      <dd className="num">
        {Math.round(value)}
        {unit && <small>{unit}</small>}
      </dd>
      <dd className={`body-metric-verdict${verdict?.flag ? ' is-flag' : ''}`}>
        {verdict?.text ?? 'Building your range'}
      </dd>
    </div>
  )
}

interface Props {
  summary: DailySummaryResponse
}

/** Four body metrics, each against a reference (§8 Q3): HRV against Garmin's
 * status/baseline, the rest against the athlete's own 90-day range. */
export default function BodyPanel({ summary }: Props) {
  const { verdict } = usePersonalRange(summary.date)
  const metrics = [
    { label: 'Resting HR', value: summary.resting_hr, unit: 'bpm', verdict: verdict('resting_hr', summary.date, summary.resting_hr) },
    { label: 'HRV overnight', value: summary.hrv_avg, unit: 'ms', verdict: hrvVerdict(summary) },
    { label: 'Sleep score', value: summary.sleep_score, verdict: verdict('sleep_score', summary.date, summary.sleep_score) },
    { label: 'Body battery', value: summary.body_battery_high, verdict: verdict('body_battery_high', summary.date, summary.body_battery_high) },
  ]
  if (metrics.every(m => m.value == null)) return null

  return (
    <section className="card today-panel body-panel" aria-labelledby="body-panel-title">
      <div className="panel-head">
        <h2 id="body-panel-title" className="section-title">Body</h2>
        <Link to={`/daily/${summary.id}`} className="text-link panel-head-link">Daily history</Link>
      </div>
      <dl className="body-metrics">
        {metrics.map(m => <Metric key={m.label} {...m} />)}
      </dl>
    </section>
  )
}
