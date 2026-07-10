import type { TrainingPlanDay } from '../api/types'
import { formatDateKey } from './date'

export type PlanDayState = 'rest' | 'done' | 'missed' | 'today' | 'upcoming'

export function todayStr(): string {
  return formatDateKey(new Date())
}

/** Completion state for a plan day: rest days are always 'rest'; a day
 * strictly before today is 'done' when a matching activity was found
 * server-side (matched_activity_id) or 'missed' otherwise; today is always
 * 'today' regardless of any match; anything later is 'upcoming'.
 * `today` is injectable for deterministic testing. */
export function dayState(day: TrainingPlanDay, today: string = todayStr()): PlanDayState {
  if (day.workout_type === 'rest') return 'rest'
  if (day.day_date === today) return 'today'
  if (day.day_date < today) return day.matched_activity_id != null ? 'done' : 'missed'
  return 'upcoming'
}
