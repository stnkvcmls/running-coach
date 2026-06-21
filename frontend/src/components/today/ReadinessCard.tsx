import type { TrainingReadiness } from '../../api/types'
import './ReadinessCard.css'

interface Props {
  readiness: TrainingReadiness
}

function scoreColor(score: number): string {
  if (score >= 71) return '#00b894'   // green
  if (score >= 51) return '#fdcb6e'   // yellow
  if (score >= 31) return '#e17055'   // orange
  return '#d63031'                    // red
}

function ComponentBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null
  const color = scoreColor(value)
  return (
    <div className="readiness-component">
      <div className="rc-row">
        <span className="rc-label">{label}</span>
        <span className="rc-value" style={{ color }}>{value}</span>
      </div>
      <div className="rc-bar-track">
        <div
          className="rc-bar-fill"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function ReadinessCard({ readiness }: Props) {
  const color = scoreColor(readiness.score)

  return (
    <div className="card readiness-card">
      <div className="readiness-header">
        <div className="readiness-score-ring" style={{ '--ring-color': color } as React.CSSProperties}>
          <span className="readiness-score-number" style={{ color }}>{readiness.score}</span>
          <span className="readiness-score-max">/100</span>
        </div>
        <div className="readiness-label-block">
          <span className="readiness-label" style={{ color }}>{readiness.label}</span>
          <span className="readiness-sub">Training Readiness</span>
        </div>
      </div>

      <div className="readiness-components">
        <ComponentBar label="Sleep" value={readiness.sleep_component} />
        <ComponentBar label="Recovery" value={readiness.recovery_component} />
        <ComponentBar label="Freshness" value={readiness.fatigue_component} />
        <ComponentBar label="Resting HR" value={readiness.rhr_component} />
        <ComponentBar label="HRV" value={readiness.hrv_component} />
      </div>
    </div>
  )
}
