import { useState, useEffect, type CSSProperties, type ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, RefreshCw, Settings2, Watch, Check, ChevronDown, ChevronUp, Dumbbell, Droplet, PlayCircle, MoreHorizontal, ChevronRight } from 'lucide-react'
import { useTrainingPlan, useGenerateTrainingPlan, useRealignmentStatus, useRealignPlan, usePushWorkoutToGarmin, useJobStatus } from '../../api/hooks'
import { apiGet } from '../../api/client'
import type { ActivityDetail, StrengthRoutine, FuellingGuidance, TrainingPlanDay, TrainingPlanWeek } from '../../api/types'
import { WORKOUT_TYPE_COLORS } from '../../utils/colors'
import { dayState, todayStr } from '../../utils/planDayState'
import { describeSession } from '../../utils/sessionNotation'
import { toast } from '../ui/Toast'
import AlertBanner from '../ui/AlertBanner'
import WorkoutStructureBar from '../ui/WorkoutStructureBar'
import BottomSheet from '../plan-setup/BottomSheet'
import SeasonTimeline, { phaseLabel } from './SeasonTimeline'
import './PlanView.css'

const WORKOUT_LABELS: Record<string, string> = {
  easy: 'Easy',
  tempo: 'Tempo',
  long: 'Long run',
  interval: 'Intervals',
  cross: 'Cross',
  strength: 'Strength',
  rest: 'Rest',
}

/** How the session reads in a sentence ("Send Wednesday's easy run to watch"). */
const WORKOUT_NOUNS: Record<string, string> = {
  easy: 'easy run',
  tempo: 'tempo run',
  long: 'long run',
  interval: 'intervals',
  strength: 'strength session',
}

/** Kilometres with at most `digits` decimals and no trailing zeros: 24, 9.5, 9.22. */
function km(m: number, digits = 1): string {
  return String(Number((m / 1000).toFixed(digits)))
}

function shortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** A note repeated on two or more days of the week is block boilerplate; only
 * notes that differ from it are worth a line (§4.3 P3). */
function boilerplateNote(days: TrainingPlanDay[]): string | null {
  const counts = new Map<string, number>()
  for (const d of days) {
    const n = d.notes?.trim()
    if (n) counts.set(n, (counts.get(n) ?? 0) + 1)
  }
  let best: string | null = null
  let bestCount = 1
  for (const [note, count] of counts) {
    if (count > bestCount) {
      best = note
      bestCount = count
    }
  }
  return best
}

function isPushable(day: TrainingPlanDay): boolean {
  const state = dayState(day)
  return (state === 'today' || state === 'upcoming') && day.workout_type !== 'cross'
}

/** The next session still ahead — the only one that gets Send to watch. */
function nextPushableDayId(weeks: TrainingPlanWeek[]): number | null {
  const next = weeks
    .flatMap(w => w.days)
    .filter(isPushable)
    .sort((a, b) => a.day_date.localeCompare(b.day_date))[0]
  return next?.id ?? null
}

function SendToWatchButton({ day, label }: { day: TrainingPlanDay; label: string }) {
  const { mutate: push, isPending, isSuccess, isError, reset } = usePushWorkoutToGarmin()

  useEffect(() => {
    if (!isSuccess && !isError) return
    const t = setTimeout(() => reset(), 2500)
    return () => clearTimeout(t)
  }, [isSuccess, isError, reset])

  const noun = WORKOUT_NOUNS[day.workout_type] ?? label.toLowerCase()
  const toastLabel = `${label}${day.target_distance_m != null ? ` ${km(day.target_distance_m)} km` : ''}`

  return (
    <button
      type="button"
      className={`plan-watch ${isError ? 'plan-watch--error' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        push(day.id, {
          onSuccess: () => toast(`Sent "${toastLabel}" to watch`, { kind: 'success' }),
          onError: (err: any) => toast(err?.message || 'Failed to send to watch', { kind: 'error' }),
        })
      }}
      disabled={isPending}
      aria-label={`Send ${day.day_of_week}'s ${noun} to watch`}
      title="Send structured workout to Garmin watch"
    >
      {isPending ? <RefreshCw size={18} className="spin" /> : isSuccess ? <Check size={18} /> : <Watch size={19} />}
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

interface DayRowProps {
  day: TrainingPlanDay
  /** The week's repeated note, hidden on rows that carry it. */
  defaultNote: string | null
  showWatch: boolean
  /** Distance actually run, when the matched activity is loaded. */
  actualM: number | null
}

function DayRow({ day, defaultNote, showWatch, actualM }: DayRowProps) {
  const state = dayState(day)
  const isRest = state === 'rest'
  const label = WORKOUT_LABELS[day.workout_type] ?? day.workout_type
  const color = WORKOUT_TYPE_COLORS[day.workout_type] ?? 'var(--color-default)'
  const session = isRest
    ? null
    : describeSession({
        label,
        texts: [day.description, day.notes],
        distanceM: day.target_distance_m,
        paceMinKm: day.target_pace_min_km,
        paceDisplay: day.target_pace_display,
      })
  // "6 × 800 m at 4:00 /km" for a structured session, "9.5 km at 5:42 /km"
  // for a steady one.
  const line = session
    ? session.structure
      ? [session.notation, session.subline].filter(Boolean).join(' ')
      : [day.target_distance_m ? `${km(day.target_distance_m)} km` : null, session.subline].filter(Boolean).join(' ')
    : null
  const note = day.notes?.trim()
  const showNote = !!note && note !== defaultNote

  let side: ReactNode = null
  if (state === 'done') {
    const doneM = actualM ?? day.target_distance_m
    const pct = day.adherence_score != null ? `, ${Math.round(day.adherence_score)}%` : ''
    const content = (
      <>
        {doneM != null && <span className="num plan-day-km">{km(doneM, 2)}<small>km</small></span>}
        <span className="plan-day-status plan-day-status--done">
          <Check size={14} strokeWidth={2.6} aria-hidden="true" />Done{pct}
        </span>
      </>
    )
    side = day.matched_activity_id != null ? (
      <Link
        to={`/activities/${day.matched_activity_id}`}
        className="plan-day-side-link"
        aria-label={`View run: ${doneM != null ? `${km(doneM, 2)} km, ` : ''}done${pct}`}
      >
        {content}
      </Link>
    ) : content
  } else if (state === 'missed') {
    side = (
      <span className="plan-day-status plan-day-status--missed">
        <i className="plan-day-hollow" aria-hidden="true" />Missed
      </span>
    )
  } else if (showWatch) {
    side = <SendToWatchButton day={day} label={label} />
  } else if (!isRest && day.target_distance_m != null) {
    side = <span className="num plan-day-km">{km(day.target_distance_m)}<small>km</small></span>
  }

  const isToday = state === 'today'

  return (
    <li className={`plan-day plan-day--${state}${isToday ? ' plan-day--current' : ''}`}>
      <span className="plan-day-when">
        <b>{day.day_of_week.slice(0, 3)}</b>
        {shortDate(day.day_date)}
      </span>
      <div className="plan-day-what">
        {isRest ? (
          <p className="plan-day-kind">Rest</p>
        ) : (
          <p className="plan-day-kind" style={{ '--plan-day-color': color } as CSSProperties}>
            <i className="plan-day-dot" aria-hidden="true" />{label}
          </p>
        )}
        {line && <p className="plan-day-line">{line}</p>}
        {session?.structure && session.steps && session.steps.length > 0 && (
          <div className="plan-day-strip">
            <WorkoutStructureBar steps={session.steps} color={color} />
          </div>
        )}
        {day.description && <p className="plan-day-desc">{day.description}</p>}
        {showNote && <p className="plan-day-notes">{note}</p>}
        {day.routine && <RoutinePanel routine={day.routine} />}
        {day.fuelling_guidance && <FuellingPanel guidance={day.fuelling_guidance} />}
      </div>
      <div className="plan-day-side">{side}</div>
    </li>
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

function plannedM(week: TrainingPlanWeek): number {
  return week.days.reduce((s, d) => s + (d.target_distance_m ?? 0), 0)
}

function WeekProgress({ week, actual }: { week: TrainingPlanWeek; actual: Map<number, number> }) {
  const totalM = plannedM(week)
  // Done days count what was actually run (falling back to the plan while
  // the activity loads), so today's completed run shows up at once (P6).
  const doneM = week.days
    .filter(d => dayState(d) === 'done')
    .reduce((s, d) => s + (actual.get(d.id) ?? d.target_distance_m ?? 0), 0)
  const pct = totalM > 0 ? Math.min(100, (doneM / totalM) * 100) : 0

  if (!week.theme && totalM === 0) return null

  return (
    <div className="plan-progress">
      <div className="plan-progress-row">
        <b className="plan-progress-theme">{week.theme ?? `Week ${week.week_number}`}</b>
        {totalM > 0 && (
          <span className="plan-progress-value">
            <b className="num">{km(doneM)}</b> of {Math.round(totalM / 1000)} km
          </span>
        )}
      </div>
      {totalM > 0 && (
        <div className="plan-progress-track">
          <div className="plan-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

/** Actual run distance per done plan day, from the matched activities
 * (shared cache with the activity page). */
function useActualDistances(week: TrainingPlanWeek | undefined): Map<number, number> {
  const done = (week?.days ?? []).filter(d => dayState(d) === 'done' && d.matched_activity_id != null)
  const results = useQueries({
    queries: done.map(d => ({
      queryKey: ['activity', d.matched_activity_id!],
      queryFn: () => apiGet<ActivityDetail>(`/activities/${d.matched_activity_id}`),
    })),
  })
  const map = new Map<number, number>()
  done.forEach((d, i) => {
    const m = results[i]?.data?.distance_m
    if (m != null) map.set(d.id, m)
  })
  return map
}

function WeekView({ week, nextPushId }: { week: TrainingPlanWeek; nextPushId: number | null }) {
  const actual = useActualDistances(week)
  const defaultNote = boilerplateNote(week.days)
  return (
    <div className="plan-week">
      <WeekProgress week={week} actual={actual} />
      <ol className="plan-days">
        {week.days.map(day => (
          <DayRow
            key={day.id}
            day={day}
            defaultNote={defaultNote}
            showWatch={day.id === nextPushId}
            actualM={actual.get(day.id) ?? null}
          />
        ))}
      </ol>
    </div>
  )
}

function WeekTile({ week, maxDayM, active, onClick }: { week: TrainingPlanWeek; maxDayM: number; active: boolean; onClick: () => void }) {
  const totalKm = Math.round(plannedM(week) / 1000)
  const days = [...week.days].sort((a, b) => a.day_date.localeCompare(b.day_date))

  return (
    <button
      type="button"
      className="plan-week-tile"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Week ${week.week_number}, ${totalKm} km`}
    >
      <b>Week {week.week_number}</b>
      <span className="num">{totalKm}<small>km</small></span>
      <span className="plan-week-mini" aria-hidden="true">
        {days.map(d => (
          <i
            key={d.id}
            style={{ '--h': `${maxDayM > 0 ? ((d.target_distance_m ?? 0) / maxDayM) * 100 : 0}%` } as CSSProperties}
          />
        ))}
      </span>
    </button>
  )
}

function PlanMenu({ open, onClose, phase, generatedAt, isGenerating, onRegenerate }: {
  open: boolean
  onClose: () => void
  phase: string | null
  generatedAt: string
  isGenerating: boolean
  onRegenerate: () => void
}) {
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  useEffect(() => { if (!open) setConfirming(false) }, [open])

  const info = [
    phase ? `${phaseLabel(phase)} phase` : null,
    `generated ${shortDate(generatedAt.slice(0, 10))}`,
  ].filter(Boolean).join(', ')

  return (
    <BottomSheet open={open} onClose={onClose} title="Plan options">
      <p className="plan-menu-info">{info.charAt(0).toUpperCase() + info.slice(1)}</p>
      {confirming ? (
        <div className="plan-menu-confirm">
          <p>Replace this plan with a newly generated one? Completed runs are kept.</p>
          <div className="plan-menu-confirm-actions">
            <button type="button" className="btn-secondary" onClick={() => setConfirming(false)}>Cancel</button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => { onRegenerate(); onClose() }}
            >
              Regenerate
            </button>
          </div>
        </div>
      ) : (
        <ul className="plan-menu-list">
          <li>
            <button type="button" className="plan-menu-item" onClick={() => { onClose(); navigate('/plan/setup') }}>
              <Settings2 size={18} />
              <span>Training preferences</span>
              <ChevronRight size={16} className="plan-menu-chevron" />
            </button>
          </li>
          <li>
            <button
              type="button"
              className="plan-menu-item"
              onClick={() => setConfirming(true)}
              disabled={isGenerating}
            >
              <RefreshCw size={18} className={isGenerating ? 'spin' : ''} />
              <span>{isGenerating ? 'Generating…' : 'Regenerate plan'}</span>
            </button>
          </li>
        </ul>
      )}
    </BottomSheet>
  )
}

export default function PlanView() {
  const qc = useQueryClient()
  const { data: plan, isLoading } = useTrainingPlan()
  const { mutate: generate } = useGenerateTrainingPlan()
  const [weekIndex, setWeekIndex] = useState(0)
  const [weekIndexInitialized, setWeekIndexInitialized] = useState(false)
  const [planJobId, setPlanJobId] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: jobStatus } = useJobStatus(planJobId)

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
              'Generate plan'
            )}
          </button>
        </div>
      </div>
    )
  }

  const weeks = plan.weeks
  const currentWeek = weeks[weekIndex]
  const maxDayM = Math.max(0, ...weeks.flatMap(w => w.days.map(d => d.target_distance_m ?? 0)))
  const nextPushId = nextPushableDayId(weeks)

  // The goal-race countdown already sits in the TopBar subtitle; the page
  // heading names the current phase instead of repeating it.
  const heading = plan.phase
      ? `${phaseLabel(plan.phase)} phase`
      : 'Training plan'

  return (
    <div className="plan-view">
      <RealignmentBanner onJobEnqueued={setPlanJobId} />

      <div className="plan-head">
        <p className="plan-head-title">
          {heading}
          {isGenerating && <span className="plan-head-busy"><RefreshCw size={13} className="spin" /> Generating…</span>}
        </p>
        <button
          type="button"
          className="plan-more"
          onClick={() => setMenuOpen(true)}
          aria-label="Plan options: preferences, regenerate"
          aria-haspopup="dialog"
        >
          <MoreHorizontal size={22} />
        </button>
      </div>

      <SeasonTimeline summary={plan.overview} />

      <div
        className="plan-weeks"
        role="group"
        aria-label="Weeks in this block"
        style={{ '--plan-week-cols': Math.min(Math.max(weeks.length, 1), 4) } as CSSProperties}
      >
        {weeks.map((w, i) => (
          <WeekTile key={w.week_number} week={w} maxDayM={maxDayM} active={i === weekIndex} onClick={() => setWeekIndex(i)} />
        ))}
      </div>

      {currentWeek && <WeekView week={currentWeek} nextPushId={nextPushId} />}

      <PlanMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        phase={plan.phase}
        generatedAt={plan.generated_at}
        isGenerating={isGenerating}
        onRegenerate={handleGenerate}
      />
    </div>
  )
}
