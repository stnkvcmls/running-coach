import type { TrainingReadiness } from '../../api/types'
import StatHelpButton from '../info/StatHelpButton'
import ScoreRing from '../ui/ScoreRing'
import './ReadinessCard.css'

interface Props {
  readiness: TrainingReadiness
}

/**
 * Colour for a readiness score (ring stroke, component bars). Readiness is
 * status, not effort, so every band is ink (docs/UI_UX_CRITIQUE.md §5.1):
 * the number and the label word carry the band. Kept as a function so
 * callers stay band-aware if a non-colour treatment ever needs the score.
 */
export function scoreColor(_score: number): string {
  return 'var(--text)'
}

export function ComponentBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null
  const color = scoreColor(value)
  return (
    <div className="readiness-component">
      <div className="rc-row">
        <span className="rc-label">{label}</span>
        <span className="rc-value">{value}</span>
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
          <span className="readiness-label">{readiness.label}</span>
          <span className="readiness-sub">Training readiness</span>
        </div>
        <div className="readiness-help">
          <StatHelpButton topic="training-readiness" label="Training readiness" />
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
