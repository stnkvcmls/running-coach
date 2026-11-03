import { useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check, RefreshCw, Watch } from 'lucide-react'
import { useTrainingPlan, useActivity, usePushWorkoutToGarmin, useSubmitFeedback } from '../../api/hooks'
import type { ActivityDetail, ActivitySummary, CalendarEvent, TodayResponse, TrainingPlanDay } from '../../api/types'
import { formatDistance, formatDuration } from '../../utils/formatting'
import { format, parseISO } from '../../utils/date'
import { WORKOUT_TYPE_COLORS, getActivityColor } from '../../utils/colors'
import { firstSentence } from '../../utils/text'
import { describeSession, formatPaceSec, type SessionDescription } from '../../utils/sessionNotation'
import WorkoutStructureBar from '../ui/WorkoutStructureBar'
import RepChart, { repsFromAdherence, type RepPoint } from '../ui/RepChart'
import ReadinessLine from './ReadinessLine'
import BriefingCard from './BriefingCard'
import { toast } from '../ui/Toast'
import './TodayHero.css'

const WORKOUT_TYPE_LABELS: Record<string, string> = {
  easy: 'Easy',
  tempo: 'Tempo',
  long: 'Long',
  interval: 'Intervals',
  cross: 'Cross',
  strength: 'Strength',
  rest: 'Rest',
  race: 'Race',
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

/** Workout type → effort colour (var(--color-*)) and its label. */
function kindOf(type: string | null | undefined, fallbackLabel?: string | null): { label: string; color: string } {
  const t = (type ?? '').toLowerCase()
  if (t === 'default') return { label: fallbackLabel ?? 'Run', color: WORKOUT_TYPE_COLORS.default }
  return {
    label: WORKOUT_TYPE_LABELS[t] ?? fallbackLabel ?? (t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Workout'),
    color: WORKOUT_TYPE_COLORS[t] ?? WORKOUT_TYPE_COLORS.default,
  }
}

/** The session the hero describes, from whichever source is richest. */
function sessionFor(
  label: string,
  planDay: TrainingPlanDay | null,
  event: CalendarEvent | null,
): SessionDescription {
  return describeSession({
    label,
    steps: event?.workout_steps,
    texts: [planDay?.description, planDay?.notes, event?.workout_description, event?.title],
    distanceM: planDay?.target_distance_m ?? event?.distance_m ?? null,
    paceMinKm: planDay?.target_pace_min_km ?? null,
    paceDisplay: planDay?.target_pace_display ?? null,
  })
}

function KindLine({ label, color }: { label: string; color: string }) {
  return (
    <p className="session-kind" style={{ '--c': color } as CSSProperties}>
      <i aria-hidden="true" />
      {label}
    </p>
  )
}

function Figure({ label, value, unit }: { label: string; value: ReactNode; unit?: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className="num">
        {value}
        {unit && <small>{unit}</small>}
      </dd>
    </div>
  )
}

function stripEnds(session: SessionDescription): { start: string | null; end: string | null } {
  const steps = session.steps ?? []
  const label = (m: number | null | undefined, name: string) =>
    m ? `${m < 1000 ? `${Math.round(m)} m` : `${Math.round(m / 100) / 10} km`} ${name}` : null
  const first = steps[0]
  const last = steps[steps.length - 1]
  return {
    start: first?.step_type === 'warmup' && first.end_condition === 'distance' ? label(first.end_condition_value, 'warm-up') : null,
    end: last?.step_type === 'cooldown' && last.end_condition === 'distance' ? label(last.end_condition_value, 'cool-down') : null,
  }
}

function estimatedTime(planDay: TrainingPlanDay | null): { value: string; unit: string } | null {
  if (!planDay?.target_distance_m || !planDay.target_pace_min_km) return null
  const min = (planDay.target_distance_m / 1000) * planDay.target_pace_min_km
  if (min < 90) return { value: `≈${Math.round(min)}`, unit: 'min' }
  const h = Math.floor(min / 60)
  return { value: `≈${h}:${String(Math.round(min - h * 60)).padStart(2, '0')}`, unit: 'h' }
}

interface BriefingLineProps {
  data: TodayResponse
}

/** One inline sentence; "Full briefing" expands the BriefingCard content in
 * place (no nested card); with no briefing yet, the generate action. */
function BriefingLine({ data }: BriefingLineProps) {
  const [expanded, setExpanded] = useState(false)
  if (data.plan_day_id == null) return null
  const briefing = data.briefing
  if (briefing && !expanded) {
    return (
      <p className="briefing-inline">
        <b>Coach:</b> {firstSentence(briefing.content || briefing.summary || '')}{' '}
        <button type="button" className="briefing-inline-action" onClick={() => setExpanded(true)}>
          Full briefing
        </button>
      </p>
    )
  }
  return <BriefingCard variant="inline" dateKey={data.selected_date} planDayId={data.plan_day_id} briefing={briefing} />
}

interface PlannedProps {
  data: TodayResponse
  planDay: TrainingPlanDay | null
  event: CalendarEvent | null
}

function PlannedSession({ data, planDay, event }: PlannedProps) {
  const pushWorkout = usePushWorkoutToGarmin()
  const kind = kindOf(planDay?.workout_type ?? event?.workout_type, event?.title)
  const session = sessionFor(kind.label, planDay, event)
  const ends = stripEnds(session)
  const distanceM = planDay?.target_distance_m ?? event?.distance_m ?? null
  const est = estimatedTime(planDay)
  const pushable = planDay != null && planDay.workout_type !== 'rest' && planDay.workout_type !== 'cross'

  return (
    <>
      <KindLine {...kind} />
      <h2 className="session-notation num">{session.notation}</h2>
      {session.subline && <p className="session-sub">{session.subline}</p>}
      {session.steps && session.steps.length > 0 && (
        <div className="session-strip">
          <WorkoutStructureBar steps={session.steps} color={kind.color} size="large" />
          {(ends.start || ends.end) && (
            <div className="session-strip-ends">
              <span>{ends.start}</span>
              <span>{ends.end}</span>
            </div>
          )}
        </div>
      )}
      <dl className="session-figs">
        <Figure label="Distance" value={distanceM ? formatDistance(distanceM) : '—'} unit={distanceM ? 'km' : undefined} />
        <Figure label="Time" value={est?.value ?? '—'} unit={est?.unit} />
        <Figure
          label={session.structure ? 'Rep pace' : 'Pace'}
          value={session.keyPaceSec != null ? formatPaceSec(session.keyPaceSec) : '—'}
          unit={session.keyPaceSec != null ? '/km' : undefined}
        />
      </dl>
      <BriefingLine data={data} />
      <div className="session-actions">
        {pushable ? (
          <button
            type="button"
            className="btn-primary"
            disabled={pushWorkout.isPending}
            onClick={() => {
              pushWorkout.mutate(planDay.id, {
                onSuccess: () => toast(`Sent "${kind.label}" to watch`, { kind: 'success' }),
                onError: (err: unknown) =>
                  toast(err instanceof Error ? err.message : 'Failed to send to watch', { kind: 'error' }),
              })
            }}
          >
            {pushWorkout.isPending ? <RefreshCw size={18} className="spin" /> : <Watch size={18} />}
            Send to watch
          </button>
        ) : event && !planDay ? (
          <Link to={`/workouts/${event.id}`} state={{ event }} className="btn-primary">Open workout</Link>
        ) : <span />}
        {planDay && <Link to="/plan" className="btn-secondary session-change">Change</Link>}
      </div>
    </>
  )
}

function repVerdict(reps: RepPoint[]): string | null {
  if (reps.length < 2) return null
  const targets = reps.map(r => r.targetSec).filter((t): t is number => t != null)
  const n = reps.length
  const count = n <= 10 ? NUMBER_WORDS[n] : String(n)
  const slowestIndex = reps.reduce((iMax, r, i) => (r.paceSec > reps[iMax].paceSec ? i : iMax), 0)
  const tail = n >= 3 && slowestIndex === n - 1 ? ' The last one was the slowest.' : ''
  if (targets.length === 0) return `${count.charAt(0).toUpperCase()}${count.slice(1)} reps.${tail}`
  const target = targets.reduce((a, b) => a + b, 0) / targets.length
  const within = reps.filter(r => Math.abs(r.paceSec - (r.targetSec ?? target)) <= 5).length
  const head = within === n
    ? `All ${count} reps within 5 s of ${formatPaceSec(target)}.`
    : `${within} of ${n} reps within 5 s of ${formatPaceSec(target)}.`
  return head + tail
}

/** Inline RPE (§8 Q2): written through the same feedback mutation as the run
 * page, so there's one source of truth. Hidden once rated. */
function EffortPrompt({ detail }: { detail: ActivityDetail }) {
  const submit = useSubmitFeedback()
  const [picked, setPicked] = useState<number | null>(null)
  const rated = detail.rpe ?? (submit.isSuccess ? picked : null)

  if (rated != null) return <p className="session-felt">Felt <span className="num">{rated}</span>/10</p>

  return (
    <div className="session-rpe">
      <p className="session-rpe-q" id="session-rpe-q">How hard did it feel?</p>
      <div className="seg-control seg-control--10" role="group" aria-labelledby="session-rpe-q">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(v => (
          <button
            key={v}
            type="button"
            aria-pressed={picked === v}
            aria-label={`${v} of 10`}
            disabled={submit.isPending}
            onClick={() => {
              setPicked(v)
              // The endpoint requires a rating; keep the athlete's existing
              // one (and tags/text) so rating effort here changes only the RPE.
              submit.mutate({
                id: detail.id,
                feedback: {
                  rating: detail.feedback_rating === 'bad' ? 'bad' : 'good',
                  tags: detail.feedback_tags ?? undefined,
                  text: detail.feedback_text ?? undefined,
                  rpe: v,
                },
              })
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="seg-control-ends"><span>Easy</span><span>All out</span></div>
    </div>
  )
}

interface DoneProps {
  activity: ActivitySummary
  planDay: TrainingPlanDay | null
  event: CalendarEvent | null
}

function DoneSession({ activity, planDay, event }: DoneProps) {
  const { data: detail } = useActivity(activity.id)
  const type = planDay?.workout_type ?? event?.workout_type ?? getActivityColor(activity.workout_tag ?? activity.name, activity.activity_type)
  const kind = kindOf(type, activity.workout_tag)
  const session = sessionFor(kind.label, planDay, event ?? detail?.scheduled_workout ?? null)
  const reps = repsFromAdherence(detail?.adherence)
  // Adherence comes from the plan day (as on Plan), so the two screens agree.
  const adherence = planDay?.adherence_score
  const verdict = [
    repVerdict(reps),
    adherence != null ? `${Math.round(adherence)}% adherence to the plan.` : null,
  ].filter(Boolean).join(' ')
  const doneAt = activity.started_at ? format(parseISO(activity.started_at), 'HH:mm') : null

  return (
    <>
      <p className="session-done">
        <span className="session-done-tick" aria-hidden="true"><Check size={14} strokeWidth={2.6} /></span>
        {doneAt ? `Done at ${doneAt}` : 'Done'}
      </p>
      <KindLine {...kind} />
      <h2 className="session-notation num">{session.notation}</h2>
      {verdict && <p className="session-sub">{verdict}</p>}
      <RepChart reps={reps} color={kind.color} />
      <dl className="session-figs">
        <Figure label="Distance" value={formatDistance(activity.distance_m)} unit="km" />
        <Figure label="Time" value={formatDuration(activity.duration_sec)} />
        <Figure label="Avg HR" value={activity.avg_hr ?? '—'} unit={activity.avg_hr ? 'bpm' : undefined} />
      </dl>
      {detail && <EffortPrompt detail={detail} />}
      <div className="session-actions session-actions--single">
        <Link to={`/activities/${activity.id}`} className="btn-primary">Open run analysis</Link>
      </div>
    </>
  )
}

interface Props {
  data: TodayResponse
}

/** The activity that completed the day's session: the plan-day match first,
 * then a Garmin calendar-event match (workout_tag). */
export function findMatchedActivity(activities: ActivitySummary[]): ActivitySummary | null {
  return (
    activities.find(a => a.matched_plan_day_id != null) ??
    activities.find(a => a.workout_tag != null) ??
    null
  )
}

export default function TodayHero({ data }: Props) {
  const { data: plan, isLoading: planLoading } = useTrainingPlan()
  const planDays = plan?.weeks.flatMap(w => w.days) ?? []

  const matchedActivity = findMatchedActivity(data.activities)
  const planDayId = matchedActivity?.matched_plan_day_id ?? data.plan_day_id
  const planDay = planDayId != null ? planDays.find(d => d.id === planDayId) ?? null : null
  const event = data.scheduled_events.find(e => e.event_type !== 'race') ?? null

  let body: ReactNode
  if (matchedActivity) {
    body = <DoneSession activity={matchedActivity} planDay={planDay} event={event} />
  } else if (planDay?.workout_type === 'rest') {
    body = (
      <>
        <KindLine label="Rest" color="var(--text-faint)" />
        <h2 className="session-notation session-notation--word">Rest day</h2>
        <p className="session-sub">Let the week's training absorb.</p>
      </>
    )
  } else if (planDay || event) {
    body = <PlannedSession data={data} planDay={planDay} event={event} />
  } else if (!plan && !planLoading) {
    body = <Link to="/plan" className="session-cta">Set up a plan</Link>
  } else {
    body = <Link to="/chat" className="session-cta">No session planned — ask your coach</Link>
  }

  return (
    <section className="card hero session-hero" aria-label="Today's session">
      {data.readiness && <ReadinessLine readiness={data.readiness} />}
      <div className="session-body">{body}</div>
    </section>
  )
}
