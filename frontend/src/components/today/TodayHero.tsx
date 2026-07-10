import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useTrainingPlan } from '../../api/hooks'
import type { ActivitySummary, TodayResponse, TrainingPlanDay } from '../../api/types'
import { formatDistance, formatDuration } from '../../utils/formatting'
import { scoreColor, ComponentBar } from './ReadinessCard'
import ScoreRing from '../ui/ScoreRing'
import WorkoutStructureBar from '../ui/WorkoutStructureBar'
import BriefingCard from './BriefingCard'
import './ReadinessCard.css'
import './TodayHero.css'

const WORKOUT_TYPE_LABELS: Record<string, string> = {
  easy: 'Easy',
  tempo: 'Tempo',
  long: 'Long',
  interval: 'Intervals',
  cross: 'Cross',
  strength: 'Strength',
  rest: 'Rest',
}

const WORKOUT_TYPE_BADGE_COLORS: Record<string, string> = {
  easy: 'var(--color-easy)',
  tempo: 'var(--color-tempo)',
  long: 'var(--color-long)',
  interval: 'var(--color-interval)',
  cross: 'var(--color-cross)',
  strength: 'var(--color-strength)',
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .trim()
}

function firstSentence(text: string): string {
  const stripped = stripMarkdown(text)
  return stripped.split(/(?<=[.!?])\s/)[0] || stripped
}

interface HeroSessionProps {
  data: TodayResponse
  planDay: TrainingPlanDay | null
  planLoading: boolean
  hasPlan: boolean
  matchedActivity: ActivitySummary | null
}

function HeroSession({ data, planDay, planLoading, hasPlan, matchedActivity }: HeroSessionProps) {
  if (matchedActivity) {
    return (
      <Link to={`/activities/${matchedActivity.id}`} className="hero-session hero-session-link">
        <span className="hero-session-label">Today's session</span>
        <div className="hero-session-name">
          <CheckCircle2 size={16} className="hero-session-done-icon" />
          Done — {matchedActivity.name || matchedActivity.workout_tag}
        </div>
        <div className="hero-session-meta">
          {formatDistance(matchedActivity.distance_m)} km · {formatDuration(matchedActivity.duration_sec)}
        </div>
      </Link>
    )
  }

  if (planDay?.workout_type === 'rest') {
    return (
      <div className="hero-session">
        <span className="hero-session-label">Today's session</span>
        <div className="hero-session-name">Rest day</div>
      </div>
    )
  }

  if (planDay) {
    const label = WORKOUT_TYPE_LABELS[planDay.workout_type] ?? planDay.workout_type
    const badgeColor = WORKOUT_TYPE_BADGE_COLORS[planDay.workout_type] ?? 'var(--color-default)'
    return (
      <div className="hero-session">
        <span className="hero-session-label">Today's session</span>
        <span className="hero-session-badge" style={{ background: badgeColor }}>{label}</span>
        {(planDay.target_distance_m != null || planDay.target_pace_display) && (
          <div className="hero-session-meta">
            {planDay.target_distance_m != null && `${formatDistance(planDay.target_distance_m)} km`}
            {planDay.target_distance_m != null && planDay.target_pace_display && ' · '}
            {planDay.target_pace_display}
          </div>
        )}
      </div>
    )
  }

  if (data.scheduled_events.length > 0) {
    const event = data.scheduled_events[0]
    return (
      <Link to={`/workouts/${event.id}`} state={{ event }} className="hero-session hero-session-link">
        <span className="hero-session-label">Today's session</span>
        <span className="hero-session-badge hero-session-badge-neutral">{event.workout_type || 'Workout'}</span>
        {event.distance_m != null && (
          <div className="hero-session-meta">{formatDistance(event.distance_m)} km</div>
        )}
      </Link>
    )
  }

  if (!hasPlan && !planLoading) {
    return (
      <div className="hero-session">
        <span className="hero-session-label">Today's session</span>
        <Link to="/plan" className="hero-session-cta">Set up a plan →</Link>
      </div>
    )
  }

  return (
    <div className="hero-session">
      <span className="hero-session-label">Today's session</span>
      <Link to="/chat" className="hero-session-cta">No session planned — ask your coach →</Link>
    </div>
  )
}

interface Props {
  data: TodayResponse
}

export default function TodayHero({ data }: Props) {
  const [readinessExpanded, setReadinessExpanded] = useState(false)
  const [briefingExpanded, setBriefingExpanded] = useState(false)
  const { data: plan, isLoading: planLoading } = useTrainingPlan()

  const readiness = data.readiness
  const ringColor = readiness ? scoreColor(readiness.score) : 'var(--accent)'

  const planDay = data.plan_day_id != null
    ? plan?.weeks.flatMap(w => w.days).find(d => d.id === data.plan_day_id) ?? null
    : null

  const matchedActivity = data.activities.find(a => a.workout_tag != null) ?? null
  const briefing = data.briefing

  // Only the "scheduled Garmin event, no AI plan day" state carries real
  // workout_steps today — TrainingPlanDay has no structured-step data yet.
  const scheduledEvent = !matchedActivity && !planDay && data.scheduled_events.length > 0
    ? data.scheduled_events[0]
    : null

  return (
    <div className="card hero">
      <div className="hero-top">
        {readiness && (
          <button
            className="hero-ring-btn"
            onClick={() => setReadinessExpanded(v => !v)}
            aria-expanded={readinessExpanded}
            aria-label={`Training readiness ${readiness.score} out of 100 — tap for details`}
          >
            <ScoreRing score={readiness.score} color={ringColor} size={64} />
          </button>
        )}
        <HeroSession
          data={data}
          planDay={planDay}
          planLoading={planLoading}
          hasPlan={plan != null}
          matchedActivity={matchedActivity}
        />
      </div>

      {readinessExpanded && readiness && (
        <div className="hero-readiness-accordion">
          <ComponentBar label="Sleep" value={readiness.sleep_component} />
          <ComponentBar label="Recovery" value={readiness.recovery_component} />
          <ComponentBar label="Freshness" value={readiness.fatigue_component} />
          <ComponentBar label="Resting HR" value={readiness.rhr_component} />
          <ComponentBar label="HRV" value={readiness.hrv_component} />
          <ComponentBar label="How you feel" value={readiness.subjective_component} />
        </div>
      )}

      {scheduledEvent?.workout_steps && scheduledEvent.workout_steps.length > 0 && (
        <WorkoutStructureBar steps={scheduledEvent.workout_steps} />
      )}

      {data.plan_day_id != null && (
        briefing && !briefingExpanded ? (
          <p className="hero-brief">
            <b>{firstSentence(briefing.content || briefing.summary || '')}</b>{' '}
            <button className="hero-brief-more" onClick={() => setBriefingExpanded(true)}>More →</button>
          </p>
        ) : (
          <BriefingCard dateKey={data.selected_date} planDayId={data.plan_day_id} briefing={briefing} />
        )
      )}
    </div>
  )
}
