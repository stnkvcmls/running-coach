import { useMemo, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useDateContext } from '../../App'
import { useCalendarWeek, useTrainingPlan } from '../../api/hooks'
import type { ActivitySummary, CalendarDay, TrainingPlanDay } from '../../api/types'
import { addWeeks, format, formatDateKey, getWeekDays, isSameDay, isToday, subWeeks } from '../../utils/date'
import { WORKOUT_TYPE_COLORS, getActivityAccent } from '../../utils/colors'
import { todayStr } from '../../utils/planDayState'
import './WeekRail.css'

export type RailState = 'done' | 'planned' | 'missed' | 'rest'

export interface RailDay {
  date: Date
  key: string
  state: RailState
  /** Planned km (or run km for an unplanned run); null for rest. */
  km: number | null
  color: string
  workoutType: string | null
}

const TYPE_WORDS: Record<string, string> = {
  easy: 'easy',
  long: 'long run',
  tempo: 'tempo',
  interval: 'intervals',
  cross: 'cross-training',
  strength: 'strength',
  race: 'race',
}

function isRun(a: ActivitySummary): boolean {
  return (a.activity_type ?? '').toLowerCase().includes('run')
}

function runKm(activities: ActivitySummary[]): number {
  return activities.filter(isRun).reduce((s, a) => s + (a.distance_m ?? 0), 0) / 1000
}

/** One rail column per day: planned session from the training plan; done
 * when the plan day was matched or anything was recorded that day. */
export function buildRailDays(
  days: Date[],
  planDays: TrainingPlanDay[],
  calendar: CalendarDay[],
  today: string = todayStr(),
): RailDay[] {
  return days.map(date => {
    const key = formatDateKey(date)
    const plan = planDays.find(d => d.day_date === key) ?? null
    const activities = calendar.find(c => c.date === key)?.activities ?? []
    const done = plan?.matched_activity_id != null || activities.length > 0

    if (plan && plan.workout_type !== 'rest') {
      return {
        date,
        key,
        state: done ? 'done' : key < today ? 'missed' : 'planned',
        km: plan.target_distance_m != null ? plan.target_distance_m / 1000 : null,
        color: WORKOUT_TYPE_COLORS[plan.workout_type] ?? WORKOUT_TYPE_COLORS.default,
        workoutType: plan.workout_type,
      }
    }
    if (activities.length > 0) {
      const main = activities.find(isRun) ?? activities[0]
      return {
        date,
        key,
        state: 'done',
        km: runKm(activities) || (main.distance_m ?? 0) / 1000 || null,
        color: getActivityAccent(main.workout_tag ?? main.name, main.activity_type),
        workoutType: null,
      }
    }
    return { date, key, state: 'rest', km: null, color: 'var(--text-faint)', workoutType: plan ? 'rest' : null }
  })
}

function dayLabel(d: RailDay): string {
  const date = format(d.date, 'EEEE d')
  if (d.state === 'rest') return `${date}, rest`
  const what = [d.workoutType ? TYPE_WORDS[d.workoutType] ?? d.workoutType : 'run', d.km ? `${d.km.toFixed(1)} km` : null]
    .filter(Boolean)
    .join(' ')
  return `${date}, ${what}, ${d.state}`
}

function oneDecimal(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}

/** Today's week at a glance: a bar per day (height = distance, colour =
 * effort; filled = done, outlined = planned, dashed = missed, a line = rest)
 * and the week's running total against the plan. Replaces the global week
 * strip on Today. */
export default function WeekRail() {
  const { selectedDate, setSelectedDate } = useDateContext()
  const days = useMemo(() => getWeekDays(selectedDate), [selectedDate])
  const mondayKey = formatDateKey(days[0])
  const sundayKey = formatDateKey(days[6])
  const { data: plan } = useTrainingPlan()
  const { data: calendar } = useCalendarWeek(mondayKey)

  const rail = useMemo(() => {
    const planDays = (plan?.weeks ?? [])
      .flatMap(w => w.days)
      .filter(d => d.day_date >= mondayKey && d.day_date <= sundayKey)
    return buildRailDays(days, planDays, Array.isArray(calendar) ? calendar : [])
  }, [plan, calendar, days, mondayKey, sundayKey])

  const maxKm = Math.max(...rail.map(d => d.km ?? 0), 1)
  const plannedKm = (plan?.weeks ?? [])
    .flatMap(w => w.days)
    .filter(d => d.day_date >= mondayKey && d.day_date <= sundayKey && d.workout_type !== 'rest')
    .reduce((s, d) => s + (d.target_distance_m ?? 0) / 1000, 0)
  const doneKm = (Array.isArray(calendar) ? calendar : []).reduce((s, c) => s + runKm(c.activities), 0)
  const thisWeek = days.some(d => isToday(d))

  return (
    <nav className="card week-rail" aria-label={thisWeek ? 'This week' : `Week of ${format(days[0], 'd MMMM')}`}>
      <ol className="week-rail-days">
        {rail.map(d => {
          const selected = isSameDay(d.date, selectedDate)
          const today = isToday(d.date)
          const height = d.km ? Math.max(12, (d.km / maxKm) * 100) : 0
          return (
            <li key={d.key}>
              <button
                type="button"
                className={`week-rail-day is-${d.state}${today ? ' is-today' : ''}${selected ? ' is-selected' : ''}`}
                onClick={() => setSelectedDate(d.date)}
                aria-pressed={selected}
                aria-current={today ? 'date' : undefined}
                aria-label={dayLabel(d)}
              >
                <span className="week-rail-dl" aria-hidden="true">{format(d.date, 'EEE')}</span>
                <span className="week-rail-dn" aria-hidden="true">{format(d.date, 'd')}</span>
                <span className="week-rail-col" aria-hidden="true">
                  <span
                    className="week-rail-bar"
                    style={{ '--h': `${height}%`, '--c': d.color } as CSSProperties}
                  />
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      <div className="week-rail-sum">
        <button
          type="button"
          className="week-rail-nav"
          onClick={() => setSelectedDate(subWeeks(selectedDate, 1))}
          aria-label="Previous week"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="week-rail-total">
          <b className="num">{oneDecimal(doneKm)}</b>
          {plannedKm > 0 ? ` of ${oneDecimal(plannedKm)} km` : ' km'} {thisWeek ? 'this week' : 'that week'}
        </span>
        <Link to="/plan" className="text-link week-rail-plan">Plan</Link>
        <button
          type="button"
          className="week-rail-nav"
          onClick={() => setSelectedDate(addWeeks(selectedDate, 1))}
          aria-label="Next week"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  )
}
