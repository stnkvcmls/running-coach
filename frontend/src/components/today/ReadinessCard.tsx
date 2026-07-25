import type { TrainingReadiness } from '../../api/types'
import StatHelpButton from '../info/StatHelpButton'
import ScoreRing from '../ui/ScoreRing'
import './ReadinessCard.css'

interface Props {
  readiness: TrainingReadiness
}

export function scoreColor(score: number): string {
  if (score >= 71) return 'var(--score-high)'
  if (score >= 51) return 'var(--score-mid)'
  if (score >= 31) return 'var(--score-low)'
  return 'var(--score-poor)'
}

export function ComponentBar({ label, value }: { label: string; value: number | null }) {
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
        <ScoreRing score={readiness.score} color={color} size={72} />
        <div className="readiness-label-block">
          <span className="readiness-label" style={{ color }}>{readiness.label}</span>
          <span className="readiness-sub">Training Readiness</span>
        </div>
        <div className="readiness-help">
          <StatHelpButton topic="training-readiness" label="Training Readiness" />
        </div>
      </div>

      <div className="readiness-components">
        <ComponentBar label="Sleep" value={readiness.sleep_component} />
        <ComponentBar label="Recovery" value={readiness.recovery_component} />
        <ComponentBar label="Freshness" value={readiness.fatigue_component} />
        <ComponentBar label="Resting HR" value={readiness.rhr_component} />
        <ComponentBar label="HRV" value={readiness.hrv_component} />
        <ComponentBar label="How you feel" value={readiness.subjective_component} />
      </div>
    </div>
  )
}
