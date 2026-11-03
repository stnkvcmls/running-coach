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

/** Plain-language limiting factor per readiness component. */
const LIMITING_COPY: Record<ComponentKey, string> = {
  sleep_component: 'Short sleep is holding it back.',
  recovery_component: 'Incomplete recovery is holding it back.',
  fatigue_component: 'Recent training load is holding it back.',
  rhr_component: 'A raised resting heart rate is holding it back.',
  hrv_component: 'Low HRV is holding it back.',
  subjective_component: 'How you said you feel is holding it back.',
}

const COMPONENT_LABELS: [ComponentKey, string][] = [
  ['sleep_component', 'Sleep'],
  ['recovery_component', 'Recovery'],
  ['fatigue_component', 'Freshness'],
  ['rhr_component', 'Resting HR'],
  ['hrv_component', 'HRV'],
  ['subjective_component', 'How you feel'],
]

/** Above this, the lowest component isn't really "holding it back". */
const NO_LIMIT_ABOVE = 75

/** The sentence naming the lowest readiness component, or a neutral line
 * when every component is comfortably high (or none are known). */
export function limitingFactor(r: TrainingReadiness): string {
  let lowest: { key: ComponentKey; value: number } | null = null
  for (const [key] of COMPONENT_LABELS) {
    const value = r[key]
    if (value != null && (lowest == null || value < lowest.value)) lowest = { key, value }
  }
  if (!lowest) return 'No breakdown yet.'
  if (lowest.value >= NO_LIMIT_ABOVE) return 'Nothing is holding it back.'
  return LIMITING_COPY[lowest.key]
}

interface Props {
  readiness: TrainingReadiness
}

/** Readiness as one line: score, a neutral ink meter, the word, and the
 * limiting factor. Tapping opens the component breakdown in place. */
export default function ReadinessLine({ readiness }: Props) {
  const [expanded, setExpanded] = useState(false)
  const score = Math.max(0, Math.min(100, Math.round(readiness.score)))

  return (
    <div className="readiness-line-wrap">
      <button
        type="button"
        className="readiness-line"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        aria-label={`Readiness ${score} out of 100, ${readiness.label}. ${limitingFactor(readiness)} ${expanded ? 'Hide' : 'Show'} the breakdown.`}
      >
        <span className="readiness-line-top">
          <span className="readiness-line-label">Readiness</span>
          <span className="readiness-line-score num">{score}</span>
        </span>
        <span className="readiness-line-meter" style={{ '--v': `${score}%` } as CSSProperties}>
          <i />
        </span>
        <span className="readiness-line-word">{readiness.label}</span>
        <span className="readiness-line-why">
          {limitingFactor(readiness)} {expanded ? 'Tap to close.' : 'Tap for the breakdown.'}
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
