import { useState, useEffect, type CSSProperties } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ClipboardList, RefreshCw, ChevronLeft, ChevronRight, Settings2, Watch, CheckCircle, ChevronDown, ChevronUp, Dumbbell, Droplet, PlayCircle } from 'lucide-react'
import { useTrainingPlan, useGenerateTrainingPlan, useRealignmentStatus, useRealignPlan, usePushWorkoutToGarmin, useJobStatus } from '../../api/hooks'
import type { StrengthRoutine, FuellingGuidance, TrainingPlanDay, TrainingPlanWeek } from '../../api/types'
import { WORKOUT_TYPE_COLORS } from '../../utils/colors'
import { dayState, todayStr, type PlanDayState } from '../../utils/planDayState'
import { toast } from '../ui/Toast'
import AlertBanner from '../ui/AlertBanner'
import SeasonTimeline from './SeasonTimeline'
import './PlanView.css'

// `rest` has no --color-* token (it renders muted, not a workout colour) so it
// stays a local override on top of the shared palette.
const WORKOUT_COLORS: Record<string, string> = {
  ...WORKOUT_TYPE_COLORS,
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

const STATE_GLYPH: Record<PlanDayState, string> = {
  done: '✓',
  missed: '✗',
  today: '▶',
  upcoming: '○',
  rest: '—',
}

function formatDistance(m: number | null): string {
  if (m == null) return ''
  return `${(m / 1000).toFixed(1)} km`
}

function SendToWatchButton({ dayId, workoutLabel }: { dayId: number; workoutLabel: string }) {
  const { mutate: push, isPending, isSuccess, isError, reset } = usePushWorkoutToGarmin()

  useEffect(() => {
    if (!isSuccess && !isError) return
    const t = setTimeout(() => reset(), 2500)
    return () => clearTimeout(t)
  }, [isSuccess, isError, reset])

  return (
    <button
      className={`plan-send-watch ${isSuccess ? 'plan-send-watch--success' : ''} ${isError ? 'plan-send-watch--error' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        push(dayId, {
          onSuccess: () => toast(`Sent "${workoutLabel}" to watch`, { kind: 'success' }),
          onError: (err: any) => toast(err?.message || 'Failed to send to watch', { kind: 'error' }),
        })
      }}
      disabled={isPending}
      title="Send structured workout to Garmin watch"
    >
      {isPending ? <RefreshCw size={12} className="spin" /> : isSuccess ? <CheckCircle size={12} /> : <Watch size={12} />}
      {isPending ? 'Sending…' : isSuccess ? 'Sent' : isError ? 'Retry' : 'Send to watch'}
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

function DayStateLine({ day, state }: { day: TrainingPlanDay; state: PlanDayState }) {
  if (state === 'done') {
    return (
      <p className="plan-day-state-line plan-day-state-line--done">
        Done{day.adherence_score != null ? ` · ${Math.round(day.adherence_score)}% adherence` : ''}
        {day.matched_activity_id != null && (
          <>
            {' · '}
            <Link to={`/activities/${day.matched_activity_id}`} className="plan-day-view-run">View run →</Link>
          </>
        )}
      </p>
    )
  }
  if (state === 'missed') {
    return <p className="plan-day-state-line plan-day-state-line--missed">Missed</p>
  }
  return null
}

function DayRow({ day }: { day: TrainingPlanDay }) {
  const state = dayState(day)
  const color = WORKOUT_COLORS[day.workout_type] ?? 'var(--color-default)'
  const label = WORKOUT_LABELS[day.workout_type] ?? day.workout_type
  const pushable = day.workout_type !== 'rest' && day.workout_type !== 'cross'

  return (
    <div
      className={`plan-day-row plan-day-row-${state}`}
      style={{ '--plan-day-accent': color } as CSSProperties}
    >
      <div className="plan-day-leading">
        <span className="plan-day-glyph" aria-hidden="true">{STATE_GLYPH[state]}</span>
        <span className="plan-day-name">{day.day_of_week.slice(0, 3)}</span>
        <span className="plan-day-date">
          {new Date(day.day_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      <div className="plan-day-body">
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
        <DayStateLine day={day} state={state} />
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
            <SendToWatchButton
              dayId={day.id}
              workoutLabel={`${label}${day.target_distance_m != null ? ' ' + formatDistance(day.target_distance_m) : ''}`}
            />
          </div>
        )}
      </div>
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
    <AlertBanner
      message={status.race_note ?? `${status.missed_count} session${status.missed_count !== 1 ? 's' : ''} missed`}
      actionLabel="Regenerate"
      onAction={handleRegenerate}
      onDismiss={() => realign('dismiss')}
      pending={isPending}
    />
  )
}

function WeekProgress({ week }: { week: TrainingPlanWeek }) {
  const totalDistM = week.days.reduce((s, d) => s + (d.target_distance_m ?? 0), 0)
  const doneDistM = week.days
    .filter(d => dayState(d) === 'done')
    .reduce((s, d) => s + (d.target_distance_m ?? 0), 0)
  const pct = totalDistM > 0 ? Math.min(100, (doneDistM / totalDistM) * 100) : 0

  if (!week.theme && totalDistM === 0) return null

  return (
    <div className="plan-week-progress card">
      <div className="plan-week-progress-row">
        {week.theme && <span className="plan-week-progress-theme">{week.theme}</span>}
        {totalDistM > 0 && (
          <b className="plan-week-progress-value">
            {(doneDistM / 1000).toFixed(1)} / {(totalDistM / 1000).toFixed(1)} km
          </b>
        )}
      </div>
      {totalDistM > 0 && (
        <div className="plan-week-progress-track">
          <div className="plan-week-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

function WeekView({ week }: { week: TrainingPlanWeek }) {
  return (
    <div className="plan-week">
      <WeekProgress week={week} />
      <div className="plan-week-grid">
        {week.days.map(day => (
          <DayRow key={day.id} day={day} />
        ))}
      </div>
    </div>
  )
}

function WeekTab({ week, active, onClick }: { week: TrainingPlanWeek; active: boolean; onClick: () => void }) {
  const totalKm = week.days.reduce((s, d) => s + (d.target_distance_m ?? 0), 0) / 1000

  return (
    <button
      className={`plan-week-tab ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className="plan-week-tab-label">W{week.week_number}</span>
      {totalKm > 0 && <span className="plan-week-tab-km">{totalKm.toFixed(0)} km</span>}
      <span className="plan-week-tab-dots">
        {week.days.map(d => (
          <i key={d.id} className={`plan-week-tab-dot plan-week-tab-dot-${dayState(d)}`} />
        ))}
      </span>
    </button>
  )
}

export default function PlanView() {
  const qc = useQueryClient()
  const { data: plan, isLoading } = useTrainingPlan()
  const { mutate: generate } = useGenerateTrainingPlan()
  const [weekIndex, setWeekIndex] = useState(0)
  const [weekIndexInitialized, setWeekIndexInitialized] = useState(false)
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

  // Auto-select the week containing today on first load only — once the
  // athlete navigates manually, refetches (e.g. after a regenerate) must not
  // snap them back.
  useEffect(() => {
    if (weekIndexInitialized || !plan) return
    const t = todayStr()
    const idx = plan.weeks.findIndex(w => w.week_start <= t && t <= w.week_end)
    setWeekIndex(idx >= 0 ? idx : 0)
    setWeekIndexInitialized(true)
  }, [plan, weekIndexInitialized])

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

      <SeasonTimeline />

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
          <WeekTab key={w.week_number} week={w} active={i === weekIndex} onClick={() => setWeekIndex(i)} />
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
