import { useState, type CSSProperties } from 'react'
import type { TrainingReadiness } from '../../api/types'
import { ComponentBar } from './ReadinessCard'
import './ReadinessCard.css'
import './ReadinessLine.css'

type ComponentKey =
  | 'sleep_component'
  | 'recovery_component'
  | 'fatigue_component'
  | 'rhr_component'
  | 'hrv_component'
  | 'subjective_component'

const COMPONENT_LABELS: [ComponentKey, string][] = [
  ['sleep_component', 'Sleep'],
  ['recovery_component', 'Recovery'],
  ['fatigue_component', 'Freshness'],
  ['rhr_component', 'Resting HR'],
  ['hrv_component', 'HRV'],
  ['subjective_component', 'How you feel'],
]

interface Props {
  readiness: TrainingReadiness
}

/** Readiness as one verdict with score, meter, and server-supplied reasons.
 * Tapping opens the component breakdown in place. */
export default function ReadinessLine({ readiness }: Props) {
  const [expanded, setExpanded] = useState(false)
  const score = Math.max(0, Math.min(100, Math.round(readiness.score)))
  const verdict = readiness.verdict ?? 'train'
  const verdictLabel = readiness.verdict_label || readiness.label
  const reasons = readiness.reasons?.length ? readiness.reasons : ['Nothing is holding you back.']

  return (
    <div className="readiness-line-wrap">
      <button
        type="button"
        className={`readiness-line readiness-line--${verdict}`}
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        aria-label={`${verdictLabel}. Readiness ${score} out of 100. ${reasons.join(' ')} ${expanded ? 'Hide' : 'Show'} the breakdown.`}
      >
        <span className="readiness-line-verdict">{verdictLabel}</span>
        <span className="readiness-line-meta">
          <span className="readiness-line-label">
            Readiness <span className="readiness-line-score num">{score}</span>
          </span>
          <span className="readiness-line-meter" style={{ '--v': `${score}%` } as CSSProperties}>
            <i />
          </span>
        </span>
        <span className="readiness-line-reasons">
          {reasons.map((reason, i) => (
            <span key={i} className="readiness-line-reason">{reason}</span>
          ))}
        </span>
      </button>
      {expanded && (
        <div className="readiness-line-breakdown">
          {COMPONENT_LABELS.map(([key, label]) => (
            <ComponentBar key={key} label={label} value={readiness[key]} />
          ))}
        </div>
      )}
    </div>
  )
}
