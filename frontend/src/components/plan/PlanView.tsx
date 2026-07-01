import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ClipboardList, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, Settings2, Watch, CheckCircle, ChevronDown, ChevronUp, Dumbbell, Droplet, PlayCircle } from 'lucide-react'
import { useTrainingPlan, useGenerateTrainingPlan, useRealignmentStatus, useRealignPlan, usePushWorkoutToGarmin, useJobStatus } from '../../api/hooks'
import type { StrengthRoutine, FuellingGuidance, TrainingPlanDay, TrainingPlanWeek } from '../../api/types'
import './PlanView.css'

const WORKOUT_COLORS: Record<string, string> = {
  easy: 'var(--color-easy)',
  tempo: 'var(--color-tempo)',
  long: 'var(--color-long)',
  interval: 'var(--color-interval)',
  cross: 'var(--color-cross)',
  strength: 'var(--color-strength)',
  rest: 'var(--text-muted)',
}

const WORKOUT_LABELS: Record<string, string> = {
  easy: 'Easy',
  tempo: 'Tempo',
  long: 'Long',
  interval: 'Intervals',
  cross: 'Cross',
  strength: 'Strength',
  rest: 'Rest',
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDistance(m: number | null): string {
  if (m == null) return ''
  return `${(m / 1000).toFixed(1)} km`
}

function SendToWatchButton({ dayId }: { dayId: number }) {
  const { mutate: push, isPending, isSuccess, isError, error } = usePushWorkoutToGarmin()
  const [dismissed, setDismissed] = useState(false)

  if (isSuccess && !dismissed) {
    return (
      <button
        className="plan-send-watch plan-send-watch--success"
        onClick={() => setDismissed(true)}
        title="Sent to Garmin — tap to dismiss"
      >
        <CheckCircle size={13} />
        Sent to watch
      </button>
    )
  }

  if (isError && !dismissed) {
    const msg = (error as any)?.message || 'Failed'
    return (
      <button
        className="plan-send-watch plan-send-watch--error"
        onClick={() => setDismissed(true)}
        title={msg}
      >
        {msg.length > 40 ? msg.slice(0, 40) + '…' : msg}
      </button>
    )
  }

  if (dismissed || isSuccess) return null

  return (
    <button
      className="plan-send-watch"
      onClick={(e) => { e.stopPropagation(); push(dayId) }}
      disabled={isPending}
      title="Send structured workout to Garmin watch"
    >
      {isPending ? <RefreshCw size={12} className="spin" /> : <Watch size={12} />}
      {isPending ? 'Sending…' : 'Send to watch'}
    </button>
  )
}

function RoutinePanel({ routine }: { routine: StrengthRoutine }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="plan-routine">
      <button className="plan-routine-toggle" onClick={() => setOpen(o => !o)}>
        <Dumbbell size={13} />
        <span>{routine.name}</span>
        <span className="plan-routine-duration">~{routine.duration_min} min</span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <div className="plan-routine-body">
          <p className="plan-routine-focus">{routine.focus}</p>
          <ol className="plan-routine-exercises">
            {routine.exercises.map((ex, i) => (
              <li key={i} className="plan-routine-exercise">
                <span className="plan-routine-ex-name">
                  {ex.name}
                  {ex.demo_url && (
                    <a
                      className="plan-routine-ex-demo"
                      href={ex.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Watch a form demo"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <PlayCircle size={12} />
                    </a>
                  )}
                </span>
                <span className="plan-routine-ex-sets">{ex.sets}×{ex.reps}</span>
                {ex.note && <span className="plan-routine-ex-note">{ex.note}</span>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function FuellingPanel({ guidance }: { guidance: FuellingGuidance }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="plan-fuelling">
      <button className="plan-fuelling-toggle" onClick={() => setOpen(o => !o)}>
        <Droplet size={13} />
        <span>Fuelling</span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <div className="plan-fuelling-body">
          <p className="plan-fuelling-note">{guidance.note}</p>
          <div className="plan-fuelling-stats">
            <span>{guidance.total_carbs_g} g carbs total</span>
            <span>{guidance.total_fluid_ml} ml fluid total</span>
          </div>
        </div>
      )}
    </div>
  )
}

function DayCard({ day }: { day: TrainingPlanDay }) {
  const isToday = day.day_date === today()
  const isPast = day.day_date < today()
  const color = WORKOUT_COLORS[day.workout_type] ?? 'var(--color-default)'
  const label = WORKOUT_LABELS[day.workout_type] ?? day.workout_type
  const pushable = day.workout_type !== 'rest' && day.workout_type !== 'cross'

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
      {day.routine && <RoutinePanel routine={day.routine} />}
      {day.fuelling_guidance && <FuellingPanel guidance={day.fuelling_guidance} />}
      {day.notes && (
        <p className="plan-day-notes">{day.notes}</p>
      )}
      {pushable && (
        <div className="plan-day-actions">
          <SendToWatchButton dayId={day.id} />
        </div>
      )}
    </div>
  )
}

function RealignmentBanner({ onJobEnqueued }: { onJobEnqueued: (jobId: number) => void }) {
  const { data: status } = useRealignmentStatus()
  const { mutate: realign, isPending } = useRealignPlan()

  if (!status?.should_prompt) return null

  function handleRegenerate() {
    realign('regenerate', {
      onSuccess: (data) => {
        if (data && 'job_id' in data) onJobEnqueued(data.job_id)
      },
    })
  }

  return (
    <div className="realignment-banner">
      <AlertTriangle size={16} className="realignment-icon" />
      <div className="realignment-body">
        <span className="realignment-msg">
          {status.race_note ?? (
            <>
              {status.missed_count} planned session{status.missed_count !== 1 ? 's' : ''} missed.
              Regenerate to adapt your plan?
            </>
          )}
        </span>
        <div className="realignment-actions">
          <button
            className="btn-primary realignment-btn"
            onClick={handleRegenerate}
            disabled={isPending}
          >
            {isPending ? <RefreshCw size={13} className="spin" /> : null}
            Regenerate Plan
          </button>
          <button
            className="realignment-dismiss"
            onClick={() => realign('dismiss')}
            disabled={isPending}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

function WeekView({ week }: { week: TrainingPlanWeek }) {
  const t = today()
  const workoutDays = week.days.filter(d => d.workout_type !== 'rest')
  const completedDays = workoutDays.filter(d => d.day_date < t)
  const totalDistM = week.days.reduce((s, d) => s + (d.target_distance_m ?? 0), 0)

  return (
    <div className="plan-week">
      <div className="plan-week-header">
        <div className="plan-week-label">Week {week.week_number}</div>
        {week.theme && <div className="plan-week-theme">{week.theme}</div>}
      </div>
      <div className="plan-week-stats">
        <span>Workouts: {completedDays.length}/{workoutDays.length}</span>
        {totalDistM > 0 && <span>Distance: {(totalDistM / 1000).toFixed(1)} km</span>}
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
  const qc = useQueryClient()
  const { data: plan, isLoading } = useTrainingPlan()
  const { mutate: generate } = useGenerateTrainingPlan()
  const [weekIndex, setWeekIndex] = useState(0)
  const [planJobId, setPlanJobId] = useState<number | null>(null)
  const { data: jobStatus } = useJobStatus(planJobId)
  const navigate = useNavigate()

  const isGenerating = planJobId != null && jobStatus?.status !== 'done' && jobStatus?.status !== 'failed'

  useEffect(() => {
    if (jobStatus?.status === 'done' || jobStatus?.status === 'failed') {
      qc.invalidateQueries({ queryKey: ['training-plan'] })
      qc.invalidateQueries({ queryKey: ['realignment-status'] })
      setPlanJobId(null)
    }
  }, [jobStatus?.status, qc])

  function handleGenerate() {
    generate(undefined, {
      onSuccess: (data) => { if (data?.job_id) setPlanJobId(data.job_id) },
    })
  }

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
            onClick={handleGenerate}
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
      <RealignmentBanner onJobEnqueued={setPlanJobId} />

      <div className="plan-header">
        <div className="plan-meta">
          {plan.phase && (
            <span className="plan-phase-badge">{plan.phase.charAt(0).toUpperCase() + plan.phase.slice(1)} Phase</span>
          )}
          <span className="plan-generated">
            Generated {new Date(plan.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="plan-regen-btn"
            onClick={() => navigate('/plan/setup')}
            title="Training preferences"
          >
            <Settings2 size={16} />
            Preferences
          </button>
          <button
            className="plan-regen-btn"
            onClick={handleGenerate}
            disabled={isGenerating}
            title="Regenerate plan"
          >
            <RefreshCw size={16} className={isGenerating ? 'spin' : ''} />
            {isGenerating ? 'Generating…' : 'Regenerate'}
          </button>
        </div>
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
