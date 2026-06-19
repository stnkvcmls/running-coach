import { useState } from 'react'
import { ClipboardList, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTrainingPlan, useGenerateTrainingPlan } from '../../api/hooks'
import type { TrainingPlanDay, TrainingPlanWeek } from '../../api/types'
import './PlanView.css'

const WORKOUT_COLORS: Record<string, string> = {
  easy: 'var(--color-easy)',
  tempo: 'var(--color-tempo)',
  long: 'var(--color-long)',
  interval: 'var(--color-interval)',
  cross: 'var(--color-default)',
  rest: 'var(--text-muted)',
}

const WORKOUT_LABELS: Record<string, string> = {
  easy: 'Easy',
  tempo: 'Tempo',
  long: 'Long',
  interval: 'Intervals',
  cross: 'Cross',
  rest: 'Rest',
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDistance(m: number | null): string {
  if (m == null) return ''
  return `${(m / 1000).toFixed(1)} km`
}

function DayCard({ day }: { day: TrainingPlanDay }) {
  const isToday = day.day_date === today()
  const isPast = day.day_date < today()
  const color = WORKOUT_COLORS[day.workout_type] ?? 'var(--color-default)'
  const label = WORKOUT_LABELS[day.workout_type] ?? day.workout_type

  return (
    <div className={`plan-day-card ${isToday ? 'plan-day-today' : ''} ${isPast ? 'plan-day-past' : ''}`}>
      <div className="plan-day-header">
        <span className="plan-day-name">{day.day_of_week.slice(0, 3)}</span>
        <span className="plan-day-date">
          {new Date(day.day_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      <div className="plan-day-badge" style={{ backgroundColor: color }}>
        {label}
      </div>
      {(day.target_distance_m != null || day.target_pace_display) && (
        <div className="plan-day-targets">
          {day.target_distance_m != null && (
            <span className="plan-day-distance">{formatDistance(day.target_distance_m)}</span>
          )}
          {day.target_pace_display && (
            <span className="plan-day-pace">{day.target_pace_display}</span>
          )}
        </div>
      )}
      {day.description && (
        <p className="plan-day-desc">{day.description}</p>
      )}
      {day.notes && (
        <p className="plan-day-notes">{day.notes}</p>
      )}
    </div>
  )
}

function WeekView({ week }: { week: TrainingPlanWeek }) {
  return (
    <div className="plan-week">
      <div className="plan-week-header">
        <div className="plan-week-label">Week {week.week_number}</div>
        {week.theme && <div className="plan-week-theme">{week.theme}</div>}
      </div>
      <div className="plan-week-grid">
        {week.days.map(day => (
          <DayCard key={day.id} day={day} />
        ))}
      </div>
    </div>
  )
}

export default function PlanView() {
  const { data: plan, isLoading } = useTrainingPlan()
  const { mutate: generate, isPending: isGenerating } = useGenerateTrainingPlan()
  const [weekIndex, setWeekIndex] = useState(0)

  if (isLoading) return <div className="spinner" />

  if (!plan) {
    return (
      <div className="plan-view">
        <div className="plan-empty">
          <ClipboardList size={48} className="plan-empty-icon" />
          <h2>No training plan yet</h2>
          <p>Generate a personalised 4-week plan based on your fitness, readiness, and upcoming races.</p>
          <button
            className="btn-primary"
            onClick={() => generate()}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="spin" />
                Generating…
              </>
            ) : (
              'Generate Plan'
            )}
          </button>
        </div>
      </div>
    )
  }

  const weeks = plan.weeks
  const currentWeek = weeks[weekIndex]

  return (
    <div className="plan-view">
      <div className="plan-header">
        <div className="plan-meta">
          {plan.phase && (
            <span className="plan-phase-badge">{plan.phase.charAt(0).toUpperCase() + plan.phase.slice(1)} Phase</span>
          )}
          <span className="plan-generated">
            Generated {new Date(plan.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        <button
          className="plan-regen-btn"
          onClick={() => generate()}
          disabled={isGenerating}
          title="Regenerate plan"
        >
          <RefreshCw size={16} className={isGenerating ? 'spin' : ''} />
          {isGenerating ? 'Generating…' : 'Regenerate'}
        </button>
      </div>

      {plan.overview && (
        <div className="plan-overview card">
          <p>{plan.overview}</p>
        </div>
      )}

      {/* Week navigation tabs */}
      <div className="plan-week-tabs">
        <button
          className="plan-week-nav"
          onClick={() => setWeekIndex(i => Math.max(0, i - 1))}
          disabled={weekIndex === 0}
        >
          <ChevronLeft size={18} />
        </button>
        {weeks.map((w, i) => (
          <button
            key={w.week_number}
            className={`plan-week-tab ${i === weekIndex ? 'active' : ''}`}
            onClick={() => setWeekIndex(i)}
          >
            W{w.week_number}
          </button>
        ))}
        <button
          className="plan-week-nav"
          onClick={() => setWeekIndex(i => Math.min(weeks.length - 1, i + 1))}
          disabled={weekIndex === weeks.length - 1}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {currentWeek && <WeekView week={currentWeek} />}
    </div>
  )
}
