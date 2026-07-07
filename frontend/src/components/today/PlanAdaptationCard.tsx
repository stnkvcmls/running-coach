import { useAdaptPlanDay } from '../../api/hooks'
import type { PlanAdaptationSuggestion } from '../../api/types'
import { TrendingDown, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react'
import './PlanAdaptationCard.css'

interface Props {
  suggestion: PlanAdaptationSuggestion
}

function formatDistance(m: number | null): string | null {
  if (m == null) return null
  return `${(m / 1000).toFixed(1)} km`
}

export default function PlanAdaptationCard({ suggestion }: Props) {
  const { mutate: adapt, isPending } = useAdaptPlanDay()
  const isDowngrade = suggestion.direction === 'downgrade'
  const isRisk = suggestion.trigger === 'risk'

  const currentDist = formatDistance(suggestion.current_target_distance_m)
  const suggestedDist = formatDistance(suggestion.suggested_target_distance_m)

  return (
    <div
      className={`card plan-adaptation-card plan-adaptation-${suggestion.direction}${isRisk ? ' plan-adaptation-risk' : ''}`}
    >
      <div className="plan-adaptation-header">
        {isRisk ? <AlertTriangle size={16} /> : isDowngrade ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
        <span className="plan-adaptation-title">
          {isRisk ? 'Load caution: consider easing off' : isDowngrade ? 'Suggested: ease off today' : 'Suggested: you\'re primed'}
        </span>
      </div>
      <p className="plan-adaptation-reason">{suggestion.reason}</p>
      <div className="plan-adaptation-swap">
        <span className="plan-adaptation-from">
          {suggestion.current_workout_type}{currentDist ? ` · ${currentDist}` : ''}
        </span>
        <span className="plan-adaptation-arrow">&rarr;</span>
        <span className="plan-adaptation-to">
          {suggestion.suggested_workout_type}{suggestedDist ? ` · ${suggestedDist}` : ''}
        </span>
      </div>
      <div className="plan-adaptation-actions">
        <button
          className="btn-primary plan-adaptation-accept"
          onClick={() => adapt({ planDayId: suggestion.plan_day_id, action: 'accept' })}
          disabled={isPending}
        >
          {isPending ? <RefreshCw size={13} className="spin" /> : null}
          Accept
        </button>
        <button
          className="plan-adaptation-dismiss"
          onClick={() => adapt({ planDayId: suggestion.plan_day_id, action: 'dismiss' })}
          disabled={isPending}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
